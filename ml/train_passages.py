"""Task-specific continuation after expanded technical-pair training.

Headings and source paragraphs provide additional self-supervision. Only
training lessons supply examples; held-out lessons are retrieval candidates.
"""
import hashlib
import json
import random
import re
import shutil
import time
import numpy as np
import torch
from sentence_transformers import SentenceTransformer
from sentence_transformers.sentence_transformer import losses
from ml.train import ROOT, evaluate as legacy_evaluate
from ml.prepare_data import clean
from ml.retrieval import passages


def evaluate(model, pairs, resources):
    chunks, owners = [], []
    for i, resource in enumerate(resources):
        window = passages(resource)
        chunks.extend(window); owners.extend([i] * len(window))
    vectors = model.encode(chunks, batch_size=64, normalize_embeddings=True, show_progress_bar=False)
    queries = model.encode([p["query"] for p in pairs], batch_size=64, normalize_embeddings=True, show_progress_bar=False)
    scores = queries @ vectors.T
    grouped = np.stack([scores[:, np.array(owners) == i].max(axis=1) for i in range(len(resources))], axis=1)
    lookup = {r["id"]: i for i, r in enumerate(resources)}
    ranks = [int(np.where(np.argsort(-row, kind="stable") == lookup[pair["resource_id"]])[0][0]) + 1 for pair, row in zip(pairs, grouped)]
    return {"queries": len(ranks), "recall_at_1": round(float(np.mean(np.array(ranks) <= 1)), 6), "recall_at_5": round(float(np.mean(np.array(ranks) <= 5)), 6), "mrr": round(float(np.mean(1 / np.array(ranks))), 6)}


def main():
    random.seed(43); np.random.seed(43); torch.manual_seed(43); torch.set_num_threads(4)
    resources = json.loads((ROOT / "data/resources.json").read_text(encoding="utf8"))
    pairs = json.loads((ROOT / "data/training_pairs.json").read_text(encoding="utf8"))
    groups = json.loads((ROOT / "data/splits.json").read_text(encoding="utf8"))
    splits = {k: [p for p in pairs if p["group"] in v] for k, v in groups.items()}
    artifacts = ROOT / "artifacts"
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = SentenceTransformer(str(artifacts / "retriever-v1"), device=device, local_files_only=True)
    incumbent = evaluate(model, splits["validation"], resources)
    old_val = legacy_evaluate(model, splits["validation"], resources)
    print("Validation baselines: " + json.dumps({"v1_passages": incumbent, "v1_intro_only": old_val}), flush=True)
    # Start with the actual expanded-data weights, not a renamed v1 checkpoint.
    expanded = artifacts / "expanded-last"
    if not expanded.exists():
        raise RuntimeError("Run train_expanded first with expanded-last preservation")
    model = SentenceTransformer(str(expanded), device=device, local_files_only=True)
    by_id = {r["id"]: r for r in resources}
    examples = []
    for rid in groups["train"]:
        resource = by_id[rid]
        path = ROOT / "data/raw" / resource["source"] / resource["source_path"]
        markdown = path.read_text(encoding="utf8")
        # Source-authored headings paired with their source passage. Exclude
        # generic navigation/assignment headings and all evaluation lessons.
        for heading, content in re.findall(r"(?m)^#{1,4}\s+([^\n]+)\n([\s\S]*?)(?=^#{1,4}\s|\Z)", markdown):
            heading, content = clean(heading), clean(content)
            if len(heading) < 8 or len(content) < 80 or re.search(r"quiz|challenge|assignment|review|self.study|contribut|license|sketchnote", heading, re.I):
                continue
            examples.append({"query": heading, "positive": resource["title"] + ". " + content[:800], "group": rid, "source": "curriculum heading"})
        for window in passages(resource):
            # Source excerpt -> another window from the same lesson is weak
            # supervision. Kept separate from author quiz relevance labels.
            content = window[len(resource["title"]) + 2:]
            if len(content) > 100:
                examples.append({"query": content[:300], "positive": resource["title"] + ". " + resource["description"], "group": rid, "source": "curriculum excerpt"})
    # Quiz-linked lessons are stronger supervision; choose a source passage
    # using the frozen v1 encoder, and repeat these labels during adaptation.
    teacher = SentenceTransformer(str(artifacts / "retriever-v1"), device=device, local_files_only=True)
    for pair in splits["train"]:
        windows = passages(by_id[pair["resource_id"]])
        vectors = teacher.encode(windows + [pair["query"]], normalize_embeddings=True, show_progress_bar=False)
        positive = windows[int(np.argmax(vectors[:-1] @ vectors[-1]))]
        examples.extend([{ "query": pair["query"], "positive": positive, "group": pair["group"], "source": "author quiz link; v1 passage choice"}] * 4)
    del teacher
    objective = losses.MultipleNegativesRankingLoss(model)
    optimizer = torch.optim.AdamW(model.parameters(), lr=8e-6, weight_decay=.01)
    best = incumbent["mrr"]
    candidate = artifacts / "retriever-v2-passages"
    shutil.copytree(artifacts / "retriever-v1", candidate, dirs_exist_ok=True)
    history = []; start = time.time(); selected_epoch = 0
    for epoch in range(8):
        rng = random.Random(43 + epoch)
        pending = examples.copy(); rng.shuffle(pending)
        losses_epoch = []
        while pending:
            batch, rest, seen = [], [], set()
            for item in pending:
                if len(batch) < 24 and item["group"] not in seen:
                    batch.append(item); seen.add(item["group"])
                else: rest.append(item)
            pending = rest
            if len(batch) < 2: continue
            model.train()
            features = [{k: v.to(device) if isinstance(v, torch.Tensor) else v for k, v in model.preprocess([item[field] for item in batch]).items()} for field in ("query", "positive")]
            optimizer.zero_grad(set_to_none=True)
            loss = objective(features, None); loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1); optimizer.step()
            losses_epoch.append(float(loss.detach()))
        val = evaluate(model, splits["validation"], resources)
        history.append({"epoch": epoch + 1, "loss": round(float(np.mean(losses_epoch)), 6), "validation": val})
        print(json.dumps(history[-1]), flush=True)
        if val["mrr"] > best:
            best = val["mrr"]; selected_epoch = epoch + 1
            model.save_pretrained(str(candidate), create_model_card=False)
    selected = SentenceTransformer(str(candidate), device=device, local_files_only=True)
    previous = SentenceTransformer(str(artifacts / "retriever-v1"), device=device, local_files_only=True)
    report = {"model": "voidfill-curriculum-minilm-v2" if selected_epoch else "voidfill-curriculum-minilm-v1", "retrieval": "passages-v1", "previous_intro_only": {p: legacy_evaluate(previous, splits[p], resources) for p in ("validation", "test")}, "previous_passages": {p: evaluate(previous, splits[p], resources) for p in ("validation", "test")}, "fine_tuned": {p: evaluate(selected, splits[p], resources) for p in ("validation", "test")}, "expanded_dataset": json.loads((ROOT / "data/expanded_manifest.json").read_text()), "task_training_examples": len(examples), "task_training_groups": len(groups["train"]), "selected_epoch": selected_epoch, "selection": "8 predefined adaptation epochs; best validation MRR vs frozen v1 passage incumbent. Test read after selection. Legacy previously reported test remains a small regression benchmark.", "self_supervision": "Source headings/excerpts from training lessons only; author quiz-to-lesson links with v1-selected source passages. Not new independently labelled questions.", "training_seconds": round(time.time()-start, 1), "history": history, "limitations": "Measures lesson retrieval on 87 historical English questions, not learner improvement, difficulty calibration or resume parser accuracy. Duplicate dataset attribution must be resolved before redistribution. Source passages are indexed at inference, including held-out candidate lessons, but held-out questions and training passages do not enter fitting."}
    report.update({"seed": 43, "adaptation_epochs": 8, "adaptation_batch_size": 24, "adaptation_learning_rate": 8e-6, "passage_words": 140, "passage_stride": 110, "max_abs_parameter_change_from_v1": float((next(selected.parameters()).detach().cpu() - next(previous.parameters()).detach().cpu()).abs().max())})
    (ROOT / "evaluation-v2-passages.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf8")
    # Passage retrieval is adopted only if it wins on validation. Selection of
    # the weights and architecture never reads test performance.
    if best > old_val["mrr"]:
        shutil.copytree(candidate, artifacts / "retriever", dirs_exist_ok=True)
        (artifacts / "metrics.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf8")
    print(json.dumps({k: v for k, v in report.items() if k != "history"}), flush=True)


if __name__ == "__main__": main()
