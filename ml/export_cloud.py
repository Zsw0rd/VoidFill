"""Export the active BGE checkpoint and select an optimization by validation quality.

Catalogue vectors stay at original precision. Test metrics are reported only after
selection. Export/training dependencies never enter the cloud serving package.
"""
import json
import os
import shutil
import time
from pathlib import Path

import numpy as np
import torch
from onnxruntime.quantization import QuantType, quantize_dynamic

from ml.onnx_encoder import OnnxEncoder
from ml.service import LearningEngine

ROOT = Path(__file__).resolve().parent


def retrieval_metrics(queries, corpus, owners, pairs, resources):
    scores = queries @ corpus.T
    grouped = np.stack([scores[:, owners == index].max(axis=1) for index in range(len(resources))], axis=1)
    lookup = {resource["id"]: index for index, resource in enumerate(resources)}
    ranks = np.array([int(np.where(np.argsort(-row, kind="stable") == lookup[pair["resource_id"]])[0][0]) + 1 for row, pair in zip(grouped, pairs)])
    return {"queries": len(ranks), "recall_at_1": float(np.mean(ranks <= 1)), "recall_at_5": float(np.mean(ranks <= 5)), "mrr": float(np.mean(1 / ranks))}


def main():
    os.environ["ML_BACKEND"] = "torch"
    work = ROOT / "runtime/cloud-export"
    work.mkdir(parents=True, exist_ok=True)
    active = LearningEngine()
    prefix = active.report.get("query_prefix", "")
    pairs = json.loads((ROOT / "data/training_pairs.json").read_text(encoding="utf8"))
    splits = json.loads((ROOT / "data/splits.json").read_text(encoding="utf8"))
    sets = {name: [pair for pair in pairs if pair["group"] in splits[name]] for name in ["validation", "test"]}
    texts = {name: [prefix + pair["query"] for pair in rows] for name, rows in sets.items()}
    references = {name: active.encode(rows) for name, rows in texts.items()}
    metrics = lambda vectors, name: retrieval_metrics(vectors, active.passage_vectors, active.passage_owners, sets[name], active.resources)
    baseline = {name: metrics(vectors, name) for name, vectors in references.items()}
    print("Original retrieval: " + json.dumps(baseline), flush=True)
    model = active.model.to("cpu")
    torch.set_num_threads(1)
    transformer = model[0].auto_model
    transformer.config._attn_implementation = "eager"

    class Embeddings(torch.nn.Module):
        def __init__(self):
            super().__init__()
            self.transformer = transformer

        def forward(self, input_ids, attention_mask, token_type_ids):
            result = self.transformer(input_ids=input_ids, attention_mask=attention_mask, token_type_ids=token_type_ids).last_hidden_state[:, 0]
            return torch.nn.functional.normalize(result, p=2, dim=1)

    original = work / "fp32"
    original.mkdir(exist_ok=True)
    shutil.copy2(ROOT / "artifacts/retriever/tokenizer.json", original / "tokenizer.json")
    example = model.tokenizer(["A Python learning exercise", "SQL"], return_tensors="pt", padding=True)
    if not (original / "model.onnx").exists():
        torch.onnx.export(Embeddings().eval(), tuple(example[key] for key in ["input_ids", "attention_mask", "token_type_ids"]), str(original / "model.onnx"), input_names=["input_ids", "attention_mask", "token_type_ids"], output_names=["embeddings"], dynamic_axes={key: {0: "batch", 1: "sequence"} for key in ["input_ids", "attention_mask", "token_type_ids"]} | {"embeddings": {0: "batch"}}, opset_version=17, dynamo=False)
    quantized = work / "int8"
    quantized.mkdir(exist_ok=True)
    shutil.copy2(original / "tokenizer.json", quantized / "tokenizer.json")
    if not (quantized / "model.onnx").exists():
        quantize_dynamic(str(original / "model.onnx"), str(quantized / "model.onnx"), per_channel=True, reduce_range=True, weight_type=QuantType.QInt8, op_types_to_quantize=["MatMul"])
    candidates = {}
    encoders = {}
    for name, directory in [("onnx-fp32", original), ("onnx-int8", quantized)]:
        encoder = OnnxEncoder(directory)
        validation = encoder.encode(texts["validation"])
        result = metrics(validation, "validation")
        eligible = all(result[key] + 1e-10 >= baseline["validation"][key] for key in ["recall_at_1", "recall_at_5", "mrr"])
        candidates[name] = {"validation": result, "eligible": eligible, "model_bytes": (directory / "model.onnx").stat().st_size, "cosine_to_original": float(np.mean(np.sum(validation * references["validation"], axis=1)))}
        encoders[name] = encoder
        print(name + ": " + json.dumps(candidates[name]), flush=True)
    selected = "onnx-int8" if candidates["onnx-int8"]["eligible"] else "onnx-fp32"
    if not candidates[selected]["eligible"]:
        raise RuntimeError("No export preserves the baseline validation metrics")
    selected_test = metrics(encoders[selected].encode(texts["test"]), "test")
    samples = [prefix + text for text in ["Python Basics. Python programming syntax functions dictionaries lists pandas", "SQL Fundamentals. SQL relational databases queries SELECT joins GROUP BY", "Git & Version Control. Git version control commits branches repositories merge"]]
    def latency(encode):
        encode(samples[:1])
        times = []
        for _ in range(4):
            for text in samples:
                start = time.perf_counter(); encode([text]); times.append((time.perf_counter() - start) * 1000)
        return {"median_ms": float(np.median(times)), "p95_ms": float(np.percentile(times, 95))}
    timing = {"torch_cpu": latency(active.encode), selected: latency(encoders[selected].encode)}
    destination = ROOT / "artifacts/cloud"
    destination.mkdir(exist_ok=True)
    chosen = quantized if selected == "onnx-int8" else original
    for file in ["model.onnx", "tokenizer.json"]:
        shutil.copy2(chosen / file, destination / file)
    np.savez_compressed(destination / "catalogue.npz", resources=active.resource_vectors, questions=active.question_vectors, topics=active.topic_vectors, passages=active.passage_vectors, owners=active.passage_owners)
    from ml.guest import SKILLS
    from ml.service import TOPICS
    public_queries = []
    for skill in SKILLS:
        topic = active.topic(skill["name"])
        if topic:
            query = f'{skill["name"]}. {TOPICS[topic]}'
            public_queries.extend([prefix + query, prefix + query + ". "])
    (destination / "public-queries.json").write_text(json.dumps(public_queries), encoding="utf8")
    np.savez_compressed(destination / "public-queries.npz", vectors=active.encode(public_queries))
    report = {"model": active.report["model"], "parameters": active.report["parameters"], "selected": selected, "baseline": baseline, "candidates": candidates, "selected_test": selected_test, "cpu_threads": 1, "latency": timing, "scope": "Same original catalogue, same CLS pooling, normalization, tokenizer and 256-token truncation. CPU timings are local measurements, not Vercel latency guarantees."}
    (ROOT / "evaluation-cloud.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf8")
    (destination / "metrics.json").write_text(json.dumps(active.report | {"inference_backend": selected}), encoding="utf8")
    print(json.dumps(report), flush=True)


if __name__ == "__main__":
    main()
