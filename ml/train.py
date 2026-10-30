"""Fine-tune MiniLM on curriculum quiz -> lesson retrieval, with grouped splits."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import random
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
os.environ.setdefault("HF_HOME", str(ROOT / ".cache" / "huggingface"))
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")

import numpy as np
import torch
from huggingface_hub import model_info
from sentence_transformers import SentenceTransformer
from sentence_transformers.sentence_transformer import losses

BASE_MODEL = "sentence-transformers/all-MiniLM-L6-v2"


def document_text(resource: dict) -> str:
    return resource["title"] + ". " + resource["description"]


def evaluate(model: SentenceTransformer, pairs: list[dict], resources: list[dict]) -> dict:
    model.eval()
    corpus = model.encode([document_text(r) for r in resources], batch_size=32, normalize_embeddings=True, show_progress_bar=False)
    queries = model.encode([p["query"] for p in pairs], batch_size=32, normalize_embeddings=True, show_progress_bar=False)
    positions = {r["id"]: i for i, r in enumerate(resources)}
    ranks = []
    for pair, scores in zip(pairs, queries @ corpus.T):
        rank = int(np.where(np.argsort(-scores, kind="stable") == positions[pair["resource_id"]])[0][0]) + 1
        ranks.append(rank)
    return {"queries": len(ranks), "recall_at_1": round(sum(r <= 1 for r in ranks) / len(ranks), 6), "recall_at_5": round(sum(r <= 5 for r in ranks) / len(ranks), 6), "mrr": round(float(np.mean([1 / r for r in ranks])), 6)}


def unique_document_batches(rows: list[dict], size: int, rng: random.Random):
    pending = list(rows)
    rng.shuffle(pending)
    while pending:
        batch, remaining, seen = [], [], set()
        for row in pending:
            if row["resource_id"] not in seen and len(batch) < size:
                batch.append(row)
                seen.add(row["resource_id"])
            else:
                remaining.append(row)
        if len(batch) >= 2:
            yield batch
        pending = remaining


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--epochs", type=int, default=8)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--learning-rate", type=float, default=2e-5)
    args = parser.parse_args()
    seed = 42
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.set_num_threads(min(4, os.cpu_count() or 1))
    resources = json.loads((ROOT / "data/resources.json").read_text(encoding="utf-8"))
    pairs_path = ROOT / "data/training_pairs.json"
    pairs = json.loads(pairs_path.read_text(encoding="utf-8"))
    groups = sorted({p["group"] for p in pairs})
    if len(groups) < 15:
        raise RuntimeError("Not enough independent lessons for a train/validation/test split")
    random.Random(seed).shuffle(groups)
    n_test = max(2, round(len(groups) * .15))
    n_val = max(2, round(len(groups) * .15))
    test_groups = set(groups[:n_test])
    val_groups = set(groups[n_test:n_test + n_val])
    splits = {"train": [], "validation": [], "test": []}
    for pair in pairs:
        part = "test" if pair["group"] in test_groups else "validation" if pair["group"] in val_groups else "train"
        splits[part].append(pair)
    artifacts = ROOT / "artifacts"
    artifacts.mkdir(exist_ok=True)
    (ROOT / "data/splits.json").write_text(json.dumps({k: sorted({p["group"] for p in v}) for k, v in splits.items()}, indent=2) + "\n", encoding="utf-8")
    base_lock = ROOT / "data/base_model.lock.json"
    if not base_lock.exists():
        base_lock.write_text(json.dumps({"id": BASE_MODEL, "revision": model_info(BASE_MODEL).sha}, indent=2) + "\n", encoding="utf-8")
    base = json.loads(base_lock.read_text(encoding="utf-8"))
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Loading {BASE_MODEL} on {device}", flush=True)
    model = SentenceTransformer(BASE_MODEL, revision=base["revision"], device=device, trust_remote_code=False)
    model.max_seq_length = 256
    baseline = {part: evaluate(model, splits[part], resources) for part in ["validation", "test"]}
    print("Baseline: " + json.dumps(baseline), flush=True)
    initial = next(model.parameters()).detach().cpu().clone()
    objective = losses.MultipleNegativesRankingLoss(model)
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.learning_rate, weight_decay=.01)
    resources_by_id = {r["id"]: r for r in resources}
    history, best = [], -1.0
    start = time.time()
    for epoch in range(args.epochs):
        model.train()
        epoch_losses = []
        for batch in unique_document_batches(splits["train"], args.batch_size, random.Random(seed + epoch)):
            queries = model.preprocess([p["query"] for p in batch])
            docs = model.preprocess([document_text(resources_by_id[p["resource_id"]]) for p in batch])
            features = [{key: value.to(device) if isinstance(value, torch.Tensor) else value for key, value in item.items()} for item in [queries, docs]]
            optimizer.zero_grad(set_to_none=True)
            loss = objective(features, None)
            if not torch.isfinite(loss):
                raise RuntimeError("Non-finite training loss")
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            epoch_losses.append(float(loss.detach()))
        metrics = evaluate(model, splits["validation"], resources)
        row = {"epoch": epoch + 1, "loss": round(float(np.mean(epoch_losses)), 6), "validation": metrics}
        history.append(row)
        print(json.dumps(row), flush=True)
        if metrics["mrr"] > best:
            best = metrics["mrr"]
            model.save_pretrained(str(artifacts / "retriever"), create_model_card=False, safe_serialization=True)
    model = SentenceTransformer(str(artifacts / "retriever"), device=device, local_files_only=True)
    delta = float((initial - next(model.parameters()).detach().cpu()).abs().max())
    if delta == 0:
        raise RuntimeError("Weights did not change: training did not occur")
    final = {part: evaluate(model, splits[part], resources) for part in ["validation", "test"]}
    report = {"model": "voidfill-curriculum-minilm-v1", "base_model": base, "device": device, "gpu": torch.cuda.get_device_name(0) if device == "cuda" else None, "seed": seed, "epochs": args.epochs, "batch_size": args.batch_size, "learning_rate": args.learning_rate, "objective": "MultipleNegativesRankingLoss; no duplicate positive lesson within a batch", "split": "70/15/15 by lesson ID; all quizzes for a held-out lesson stay outside training. Candidate lesson descriptions remain in the retrieval corpus.", "split_counts": {k: {"queries": len(v), "lessons": len({p['group'] for p in v})} for k, v in splits.items()}, "selection": "Best validation MRR; no test-based model selection", "baseline": baseline, "fine_tuned": final, "max_abs_parameter_change": delta, "training_seconds": round(time.time() - start, 1), "training_data_sha256": hashlib.sha256(pairs_path.read_bytes()).hexdigest(), "history": history, "limitations": "Measures exact linked-lesson retrieval, not learner improvement or question correctness. Small historical English beginner corpus; related lessons can both be useful. Supplementary questions are excluded from these metrics."}
    (artifacts / "metrics.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    (ROOT / "evaluation.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print("Finished: " + json.dumps(final), flush=True)


if __name__ == "__main__":
    main()
