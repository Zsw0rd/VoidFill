"""Continue v1 with technical duplicate questions and curriculum rehearsal.

The frozen lesson split remains unchanged. Only validation selects checkpoints.
Raw third-party text stays in ignored data/raw, not the distributable question bank.
"""
import hashlib
import html
import json
import random
import re
import shutil
import time
from pathlib import Path

import numpy as np
import pyarrow.parquet as pq
import torch
from huggingface_hub import hf_hub_download
from sentence_transformers import SentenceTransformer
from sentence_transformers.sentence_transformer import losses
from ml.train import ROOT, document_text, evaluate, unique_document_batches

DATASET = "sentence-transformers/stackexchange-duplicates"
REVISION = "1c9657aec12d9e101667bb9593efcc623c4a68ff"
TECH = re.compile(r"\b(python|pandas|numpy|sql|mysql|postgresql|javascript|html|css|git|github|algorithm|data structure|machine learning|neural network|regression|classification|matplotlib|seaborn|reactjs|react.js|django|flask)\b", re.I)


def main():
    torch.set_num_threads(4)
    random.seed(42)
    np.random.seed(42)
    torch.manual_seed(42)
    artifacts = ROOT / "artifacts"
    backup = artifacts / "retriever-v1"
    if not backup.exists():
        shutil.copytree(artifacts / "retriever", backup)
        shutil.copy2(artifacts / "metrics.json", artifacts / "metrics-v1.json")
    resources = json.loads((ROOT / "data/resources.json").read_text(encoding="utf-8"))
    pairs = json.loads((ROOT / "data/training_pairs.json").read_text(encoding="utf-8"))
    groups = json.loads((ROOT / "data/splits.json").read_text(encoding="utf-8"))
    splits = {k: [p for p in pairs if p["group"] in v] for k, v in groups.items()}
    filename = hf_hub_download(DATASET, "title-title-pair/train-00000-of-00001.parquet", repo_type="dataset", revision=REVISION, local_dir=ROOT / "data/raw/stackexchange")
    raw = pq.read_table(filename).to_pylist()
    # Globally unique endpoints avoid false negatives and duplicate leakage.
    seen = {re.sub(r"\W+", " ", p["query"].lower()).strip() for p in pairs}
    auxiliary = []
    random.Random(42).shuffle(raw)
    for row in raw:
        a, b = (html.unescape(row[k]).strip() for k in ("title1", "title2"))
        keys = [re.sub(r"\W+", " ", t.lower()).strip() for t in (a, b)]
        if not TECH.search(a + " " + b) or any(k in seen for k in keys) or keys[0] == keys[1] or min(len(a), len(b)) < 15 or max(len(a), len(b)) > 450:
            continue
        seen.update(keys)
        auxiliary.append({"query": a, "positive": b})
        if len(auxiliary) >= 24000:
            break
    aux_val, aux_train = auxiliary[:1000], auxiliary[1000:]
    manifest = {"dataset": DATASET, "revision": REVISION, "url": f"https://huggingface.co/datasets/{DATASET}", "upstream": "https://data.stackexchange.com/apple/query/fork/1456963", "rights": "Stack Exchange user content; CC BY-SA (version varies with post date). Dataset does not preserve per-post authors/URLs. Raw records and checkpoint are local research artifacts; resolve attribution before redistributing them. Not added to product question bank.", "raw_pairs": len(raw), "technical_unique_pairs": len(auxiliary), "auxiliary_train": len(aux_train), "auxiliary_validation": len(aux_val), "curriculum_train": len(splits["train"]), "sha256": hashlib.sha256(Path(filename).read_bytes()).hexdigest(), "filter": TECH.pattern, "seed": 42, "split": "globally unique normalized title endpoints; 1000 auxiliary validation pairs; frozen disjoint curriculum lesson split"}
    (ROOT / "data/expanded_manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    model = SentenceTransformer(str(backup), device="cuda" if torch.cuda.is_available() else "cpu", local_files_only=True)
    model.max_seq_length = 256
    device = model.device
    by_id = {r["id"]: r for r in resources}
    objective = losses.MultipleNegativesRankingLoss(model)
    optimizer = torch.optim.AdamW(model.parameters(), lr=5e-6, weight_decay=.01)
    initial_val = evaluate(model, splits["validation"], resources)
    best = initial_val["mrr"]
    candidate = artifacts / "retriever-v2-candidate"
    model.save_pretrained(str(candidate), create_model_card=False)
    history = []
    start = time.time()
    for epoch in range(3):
        rng = random.Random(42 + epoch)
        shuffled = list(aux_train)
        rng.shuffle(shuffled)
        curriculum = list(unique_document_batches(splits["train"], 16, rng))
        epoch_losses = []
        # Every auxiliary batch is followed by curriculum rehearsal. This keeps
        # the training objective aligned with the deployed lesson retriever.
        for step, offset in enumerate(range(0, len(shuffled), 32)):
            batch = shuffled[offset:offset + 32]
            lesson_batch = curriculum[step % len(curriculum)]
            for queries, docs in [([p["query"] for p in batch], [p["positive"] for p in batch]), ([p["query"] for p in lesson_batch], [document_text(by_id[p["resource_id"]]) for p in lesson_batch])]:
                model.train()
                features = [{k: v.to(device) if isinstance(v, torch.Tensor) else v for k, v in model.preprocess(texts).items()} for texts in (queries, docs)]
                optimizer.zero_grad(set_to_none=True)
                loss = objective(features, None)
                if not torch.isfinite(loss):
                    raise RuntimeError("Non-finite loss")
                loss.backward()
                torch.nn.utils.clip_grad_norm_(model.parameters(), 1)
                optimizer.step()
                epoch_losses.append(float(loss.detach()))
            if (step + 1) % 200 == 0:
                print(f"epoch={epoch+1} step={step+1} loss={np.mean(epoch_losses):.4f}", flush=True)
            if (step + 1) % 200 == 0 or offset + 32 >= len(shuffled):
                val = evaluate(model, splits["validation"], resources)
                history.append({"epoch": epoch + 1, "step": step + 1, "validation": val})
                print(json.dumps(history[-1]), flush=True)
                if val["mrr"] > best:
                    best = val["mrr"]
                    model.save_pretrained(str(candidate), create_model_card=False)
    model.save_pretrained(str(artifacts / "expanded-last"), create_model_card=False)
    selected = SentenceTransformer(str(candidate), device=str(device), local_files_only=True)
    # Test is read only after checkpoint selection is over.
    previous_test = evaluate(SentenceTransformer(str(backup), device=str(device), local_files_only=True), splits["test"], resources)
    final = {part: evaluate(selected, splits[part], resources) for part in ("validation", "test")}
    improved = best > initial_val["mrr"]
    report = {"model": "voidfill-curriculum-minilm-v2" if improved else "voidfill-curriculum-minilm-v1", "dataset": manifest, "previous": {"validation": initial_val, "test": previous_test}, "fine_tuned": final, "selection": "Validation MRR only, v1 included as incumbent; test inspected after all selection", "deployed_new_checkpoint": improved, "history": history, "training_seconds": round(time.time()-start, 1), "epochs": 3, "learning_rate": 5e-6, "limitations": "Small 87-query test set is a regression benchmark already reported for v1, not a fresh independent estimate. Auxiliary duplicate questions are not assessment questions; scores measure lesson retrieval, not resume parsing or learner proficiency."}
    (ROOT / "evaluation-v2.json").write_text(json.dumps(report, indent=2) + "\n")
    if improved:
        shutil.copytree(candidate, artifacts / "retriever", dirs_exist_ok=True)
        (artifacts / "metrics.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({k: v for k, v in report.items() if k != "history"}), flush=True)


if __name__ == "__main__":
    main()
