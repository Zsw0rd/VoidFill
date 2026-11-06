"""Precompute public extension vectors with the already deployed ONNX weights.

The small extension is committed with the content. It contains no learner input.
Cloud builds verify all input hashes; user requests never rebuild this index.
"""
import json
from pathlib import Path
import numpy as np
from ml.career_catalogue import CATALOGUE, DIRECTORY, TOPICS, content_fingerprints, load_learning_content, role_texts
from ml.onnx_encoder import OnnxEncoder
from ml.retrieval import passages

ROOT = Path(__file__).resolve().parent


def main():
    encoder = OnnxEncoder(ROOT / "artifacts/cloud")
    report = json.loads((ROOT / "artifacts/cloud/metrics.json").read_text(encoding="utf8"))
    resources = json.loads((DIRECTORY / "resources.json").read_text(encoding="utf8"))
    questions = json.loads((DIRECTORY / "questions.json").read_text(encoding="utf8"))
    chunks, owners = [], []
    for i, resource in enumerate(resources):
        windows = passages(resource)
        chunks.extend(windows)
        owners.extend([i] * len(windows))
    prefix = report.get("query_prefix", "")
    queries = []
    all_resources, _ = load_learning_content()
    for skill in CATALOGUE["skills"]:
        if skill["topic"]:
            query = f'{skill["name"]}. {TOPICS[skill["topic"]]}'
            queries.extend([prefix + query, prefix + query + ". "])
            queries.extend(prefix + query + ". " + resource["title"][:500] for resource in all_resources if skill["topic"] in resource["topics"])
    queries = list(dict.fromkeys(queries))
    assert len(queries) <= 500, "Keep precomputed queries within the bounded public cache."
    encode = lambda texts: encoder.encode(texts, batch_size=4)
    print("Encoding public career content with the existing ONNX model…", flush=True)
    np.savez_compressed(DIRECTORY / "vectors.npz", resources=encode([r["title"] + ". " + r["description"] for r in resources]), questions=encode([q["prompt"] for q in questions]), topics=encode(list(TOPICS.values())), passages=encode(chunks), owners=np.array(owners, dtype=int), queries=encode(queries), roles=encode(role_texts()))
    metadata = {"version": CATALOGUE["version"], "model": report["model"], "inputs": content_fingerprints(), "public_queries": queries, "resource_ids": [r["id"] for r in resources], "question_ids": [q["id"] for q in questions], "scope": "Public curriculum only. Same model, CLS pooling, normalization and token limit as the production ONNX runtime; new-domain relevance is tested separately."}
    (DIRECTORY / "index.json").write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf8")
    print(f"Indexed {len(questions)} questions, {len(resources)} resources and {len(TOPICS)} topic descriptions.", flush=True)


if __name__ == "__main__":
    main()
