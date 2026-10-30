"""Fine-tune a 109M-parameter BGE retriever on technical QA and curricula.

The active v2 checkpoint is backed up, never changed by this trainer. Selection
uses validation only; test metrics are computed after the candidate is fixed.
"""
from __future__ import annotations
import gc
import hashlib
import json
import random
import shutil
import time
from collections import Counter
from contextlib import nullcontext
from pathlib import Path
import numpy as np
import torch
from huggingface_hub import snapshot_download
from sentence_transformers import SentenceTransformer
from sentence_transformers.sentence_transformer import losses
from ml.train import ROOT
from ml.retrieval import passages

MODEL = "BAAI/bge-base-en-v1.5"
REVISION = "a5beb1e3e68b9ab74eb54cfd186867f64f240e1a"
PREFIX = "Represent this sentence for searching relevant passages: "
SEED = 47


def evaluate(model, pairs, resources, prefix=""):
    model.eval()
    chunks, owners = [], []
    for i, resource in enumerate(resources):
        windows = passages(resource)
        chunks.extend(windows); owners.extend([i] * len(windows))
    vectors = model.encode(chunks, batch_size=48, normalize_embeddings=True, show_progress_bar=False)
    queries = model.encode([prefix + p["query"] for p in pairs], batch_size=48, normalize_embeddings=True, show_progress_bar=False)
    scores = queries @ vectors.T
    owners = np.array(owners)
    grouped = np.stack([scores[:, owners == i].max(axis=1) for i in range(len(resources))], axis=1)
    lookup = {r["id"]: i for i, r in enumerate(resources)}
    ranks = np.array([int(np.where(np.argsort(-row, kind="stable") == lookup[pair["resource_id"]])[0][0]) + 1 for pair, row in zip(pairs, grouped)])
    return {"queries": len(ranks), "recall_at_1": round(float(np.mean(ranks <= 1)), 6), "recall_at_5": round(float(np.mean(ranks <= 5)), 6), "mrr": round(float(np.mean(1 / ranks)), 6)}


def evaluate_external(model, rows, prefix="", count=1000):
    # Fixed deterministic pool; measures answer retrieval, not lesson retrieval.
    rows = sorted(rows, key=lambda r: r["group"])[:count]
    model.eval()
    q = model.encode([prefix + r["query"] for r in rows], normalize_embeddings=True, batch_size=48, show_progress_bar=False)
    d = model.encode([r["positive"] for r in rows], normalize_embeddings=True, batch_size=48, show_progress_bar=False)
    scores = q @ d.T
    ranks = [int(np.where(np.argsort(-s, kind="stable") == i)[0][0]) + 1 for i, s in enumerate(scores)]
    return {"queries": len(rows), "candidate_answers": len(rows), "recall_at_1": round(float(np.mean(np.array(ranks) <= 1)), 6), "recall_at_5": round(float(np.mean(np.array(ranks) <= 5)), 6), "mrr": round(float(np.mean(1 / np.array(ranks))), 6)}


def unique_batches(rows, size, seed):
    pending = list(rows); random.Random(seed).shuffle(pending)
    while pending:
        batch, rest, seen = [], [], set()
        for row in pending:
            if len(batch) < size and row["group"] not in seen:
                seen.add(row["group"]); batch.append(row)
            else: rest.append(row)
        pending = rest
        if len(batch) >= 2: yield batch


def prepare_curriculum(model, rows, resources, train_groups):
    by_id = {r["id"]: r for r in resources}
    windows, owners = [], []
    for group in sorted(train_groups):
        w = passages(by_id[group]); windows.extend(w); owners.extend([group] * len(w))
    vectors = model.encode(windows, normalize_embeddings=True, batch_size=48, show_progress_bar=False)
    queries = model.encode([PREFIX + row["query"] for row in rows], normalize_embeddings=True, batch_size=48, show_progress_bar=False)
    scores = queries @ vectors.T
    prepared = []
    for row, similarities in zip(rows, scores):
        group = row["group"]
        if row["kind"] == "author quiz link":
            positive_indices = [i for i, owner in enumerate(owners) if owner == group]
            chosen = max(positive_indices, key=lambda i: similarities[i])
            positive = windows[chosen]
        else: positive = row["positive"]
        # Mine negatives strictly from training lessons, never held-out lessons.
        negative_indices = [int(i) for i in np.argsort(-similarities) if owners[int(i)] != group]
        negative = windows[negative_indices[0]]
        prepared.extend([{**row, "positive": positive, "negative": negative}] * (3 if row["kind"] == "author quiz link" else 1))
    return prepared


def main():
    random.seed(SEED); np.random.seed(SEED); torch.manual_seed(SEED); torch.set_num_threads(4)
    device = "cuda" if torch.cuda.is_available() else "cpu"
    artifacts = ROOT / "artifacts"
    snapshot_download(MODEL, revision=REVISION, local_dir=artifacts / "bge-base-source", allow_patterns=["*.json", "*.txt", "*.safetensors", "1_Pooling/*", "LICENSE", "README.md"], ignore_patterns=["onnx/*", "openvino/*"])
    previous_dir = artifacts / "retriever-v2"
    if not previous_dir.exists():
        previous_report = json.loads((artifacts / "metrics.json").read_text(encoding="utf8"))
        if previous_report["model"] != "voidfill-curriculum-minilm-v2":
            raise RuntimeError("Expected active v2 for the initial backup")
        shutil.copytree(artifacts / "retriever", previous_dir)
        shutil.copy2(artifacts / "metrics.json", artifacts / "metrics-v2.json")
    resources = json.loads((ROOT / "data/resources.json").read_text(encoding="utf8"))
    pairs = json.loads((ROOT / "data/training_pairs.json").read_text(encoding="utf8"))
    groups = json.loads((ROOT / "data/splits.json").read_text(encoding="utf8"))
    splits = {k: [p for p in pairs if p["group"] in v] for k, v in groups.items()}
    data_dir = ROOT / "data/raw/technical-qa"
    external = {k: json.loads((data_dir / f"{k}.json").read_text(encoding="utf8")) for k in ("train", "validation", "test")}
    task_rows = json.loads((data_dir / "curriculum.json").read_text(encoding="utf8"))
    manifest = json.loads((ROOT / "data/large_manifest.json").read_text(encoding="utf8"))
    model = SentenceTransformer(str(artifacts / "bge-base-source"), device=device, local_files_only=True)
    model.max_seq_length = 256
    parameters = sum(p.numel() for p in model.parameters())
    initial = next(model.parameters()).detach().cpu().clone()
    base_validation = evaluate(model, splits["validation"], resources, PREFIX)
    print("BGE initial validation: " + json.dumps(base_validation), flush=True)
    task = prepare_curriculum(model, task_rows, resources, {r["group"] for r in task_rows})
    excluded = set(groups["validation"]) | set(groups["test"])
    if {r["group"] for r in task} & excluded:
        raise RuntimeError("Held-out lesson entered training")
    task_path = data_dir / "mined-curriculum.json"
    task_path.write_text(json.dumps(task, ensure_ascii=False), encoding="utf8")
    candidate = artifacts / "retriever-v3-candidate"
    model.save_pretrained(str(candidate), create_model_card=False)
    best = base_validation["mrr"]
    selected_stage = "pretrained base"
    history = []
    started = time.time()
    objective = losses.MultipleNegativesRankingLoss(model)
    scaler = torch.amp.GradScaler("cuda", enabled=device == "cuda")
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-6, weight_decay=.01)
    if device == "cuda": torch.cuda.reset_peak_memory_stats()
    def step(batch, hard=False):
        model.train()
        fields = [[PREFIX + r["query"] for r in batch], [r["positive"] for r in batch]]
        if hard: fields.append([r["negative"] for r in batch])
        features = [{k: v.to(device) if isinstance(v, torch.Tensor) else v for k, v in model.preprocess(texts).items()} for texts in fields]
        optimizer.zero_grad(set_to_none=True)
        with torch.autocast("cuda", dtype=torch.float16) if device == "cuda" else nullcontext():
            loss = objective(features, None)
        if not torch.isfinite(loss): raise RuntimeError("Non-finite loss")
        scaler.scale(loss).backward()
        scaler.unscale_(optimizer)
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1)
        scaler.step(optimizer); scaler.update()
        return float(loss.detach())
    def checkpoint(stage, mean_loss):
        nonlocal best, selected_stage
        val = evaluate(model, splits["validation"], resources, PREFIX)
        row = {"stage": stage, "loss": round(mean_loss, 6), "validation": val}
        history.append(row); print(json.dumps(row), flush=True)
        if val["mrr"] > best:
            best = val["mrr"]; selected_stage = stage
            model.save_pretrained(str(candidate), create_model_card=False)
        (ROOT / "runtime").mkdir(exist_ok=True)
        (ROOT / "runtime/large-training-progress.json").write_text(json.dumps({"history": history, "best_validation_mrr": best, "selected_stage": selected_stage}), encoding="utf8")
    rehearsal = list(unique_batches(task, 16, SEED))
    running = []
    for index, batch in enumerate(unique_batches(external["train"], 24, SEED), 1):
        running.append(step(batch))
        if index % 4 == 0: running.append(step(rehearsal[(index // 4) % len(rehearsal)], hard=True))
        if index % 200 == 0:
            print(f"technical QA step={index} loss={np.mean(running):.4f}", flush=True)
        if index % 600 == 0: checkpoint(f"technical-qa-step-{index}", float(np.mean(running)))
    checkpoint("technical-qa-complete", float(np.mean(running)))
    for param_group in optimizer.param_groups: param_group["lr"] = 5e-6
    for epoch in range(6):
        epoch_losses = [step(batch, hard=True) for batch in unique_batches(task, 16, SEED + epoch + 1)]
        checkpoint(f"curriculum-epoch-{epoch+1}", float(np.mean(epoch_losses)))
    peak_memory = torch.cuda.max_memory_allocated() if device == "cuda" else None
    del optimizer, objective, model
    gc.collect()
    if device == "cuda": torch.cuda.empty_cache()
    selected = SentenceTransformer(str(candidate), device=device, local_files_only=True)
    final = {part: evaluate(selected, splits[part], resources, PREFIX) for part in ("validation", "test")}
    external_final = evaluate_external(selected, external["test"], PREFIX)
    delta = float((initial - next(selected.parameters()).detach().cpu()).abs().max())
    del selected; gc.collect()
    if device == "cuda": torch.cuda.empty_cache()
    previous = SentenceTransformer(str(previous_dir), device=device, local_files_only=True)
    previous_params = sum(p.numel() for p in previous.parameters())
    previous_results = {part: evaluate(previous, splits[part], resources) for part in ("validation", "test")}
    previous_external = evaluate_external(previous, external["test"])
    # The raw larger base is compared after all checkpoint selection is fixed.
    del previous; gc.collect()
    if device == "cuda": torch.cuda.empty_cache()
    base = SentenceTransformer(str(artifacts / "bge-base-source"), device=device, local_files_only=True)
    base.max_seq_length = 256
    base_results = {part: evaluate(base, splits[part], resources, PREFIX) for part in ("validation", "test")}
    base_external = evaluate_external(base, external["test"], PREFIX)
    report = {"model": "voidfill-bge-base-v3", "architecture": MODEL, "base_model_revision": REVISION, "parameters": parameters, "previous_parameters": previous_params, "parameter_ratio": round(parameters / previous_params, 3), "embedding_dimensions": 768, "max_seq_length": 256, "query_prefix": PREFIX, "topic_min_similarity": .72, "topic_min_margin": .04, "retrieval": "passages-v1", "passage_words": 140, "passage_stride": 110, "dataset": manifest, "task_training_examples": len(task), "task_training_groups": len({r['group'] for r in task}), "task_examples_sha256": hashlib.sha256(task_path.read_bytes()).hexdigest(), "previous": previous_results, "larger_base": base_results, "selected": final, "external_answer_retrieval": {"previous": previous_external, "larger_base": base_external, "selected": external_final}, "selected_stage": selected_stage, "fine_tuned_weights_selected": delta > 0, "max_abs_parameter_change_from_base": delta, "selection": "Best validation MRR among pretrained BGE base, QA stage and six predefined curriculum epochs; no test-based selection. Promotion eligibility uses validation only versus incumbent v2.", "eligible_for_promotion": final['validation']['mrr'] > previous_results['validation']['mrr'], "history": history, "seed": SEED, "learning_rates": {"qa": 1e-6, "curriculum": 5e-6}, "qa_epochs": 1, "curriculum_epochs": 6, "batch_sizes": {"qa": 24, "curriculum": 16}, "precision": "CUDA fp16 autocast, fp32 parameters and AdamW states", "device": device, "gpu": torch.cuda.get_device_name(0) if device == "cuda" else None, "peak_training_gpu_bytes": peak_memory, "training_seconds": round(time.time()-started, 1), "limitations": "The 87-query lesson benchmark is a previously reported regression set, not a new blind test. External QA test is disjoint from this run's fine-tuning but overlap with original model pretraining cannot be excluded. Headings/excerpts and mined passages are weak supervision. Metrics measure retrieval, not learner competence, question-bank correctness, resume extraction or career suitability. Dataset card restricts new QA data to CC-BY-NC-SA-4.0; resolve rights/attribution before commercial use or redistribution."}
    (ROOT / "evaluation-v3.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf8")
    (candidate / "training-report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf8")
    print(json.dumps({k: v for k, v in report.items() if k not in ("history", "dataset")}), flush=True)


if __name__ == "__main__": main()
