"""Precompute public extension vectors with the already deployed ONNX weights.

The small extension is committed with the content. It contains no learner input.
Cloud builds verify all input hashes; user requests never rebuild this index.
"""
import argparse
import hashlib
import json
import os
import tempfile
from pathlib import Path
import numpy as np
from ml.career_catalogue import CATALOGUE, DIRECTORY, TOPICS, content_fingerprints, load_extension_content, load_learning_content, role_texts
from ml.onnx_encoder import OnnxEncoder
from ml.retrieval import passages

ROOT = Path(__file__).resolve().parent


def digest(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def embedding_inputs(resources, questions, report):
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
    return {"resources": [r["title"] + ". " + r["description"] for r in resources],
            "questions": [q["prompt"] for q in questions], "topics": list(TOPICS.values()),
            "passages": chunks, "owners": owners, "queries": queries, "roles": role_texts()}


def build_index(encoder, resources, questions, report, fingerprints, values, previous=None, cached=None):
    """Encode appended public content; reject reuse of changed old inputs."""
    nonquestion_hashes = {name: digest(rows) for name, rows in values.items() if name != "questions"}
    question_hashes = [digest(row) for row in questions]
    resource_ids, question_ids = [r["id"] for r in resources], [q["id"] for q in questions]
    resource_hashes = [digest(row) for row in resources]
    reused, reused_resources, reused_passages = 0, 0, 0
    if previous is not None:
        reused_resources = len(previous["resource_ids"])
        if cached is None or previous["model"] != report["model"] or previous["resource_ids"] != resource_ids[:reused_resources]:
            raise ValueError("Incremental index model/resource identity changed; use a reviewed full index update.")
        reused = len(previous["question_ids"])
        reused_passages = len(cached["owners"])
        if previous["question_ids"] != question_ids[:reused]:
            raise ValueError("Incremental index cannot reorder or remove stored questions.")
        if "embedding_input_hashes" in previous:
            hashes = previous["embedding_input_hashes"]
            same = (hashes["resources"] == digest(values["resources"][:reused_resources]) and
                    hashes["passages"] == digest(values["passages"][:reused_passages]) and
                    hashes["owners"] == digest(values["owners"][:reused_passages]) and
                    all(hashes[name] == nonquestion_hashes[name] for name in ("topics", "roles")) and
                    hashes["queries"] == digest(previous["public_queries"]) and
                    set(previous["public_queries"]) <= set(values["queries"]))
            if not same or previous["question_row_hashes"] != question_hashes[:reused]:
                raise ValueError("Incremental index cannot reuse changed old content.")
            if "resource_row_hashes" in previous and previous["resource_row_hashes"] != resource_hashes[:reused_resources]:
                raise ValueError("Incremental index cannot rewrite earlier resource metadata.")
        elif any(fingerprints.get(key) != value for key, value in previous["inputs"].items()):
            # Upgrade of the old index format is allowed only when every earlier
            # source fingerprint still matches. The new lesson file is additive.
            raise ValueError("Legacy index inputs changed; incremental reuse is unproven.")
        for name in ("resources", "questions", "topics", "passages", "queries", "roles"):
            expected = {"questions": reused, "resources": reused_resources, "passages": reused_passages,
                        "queries": len(previous["public_queries"])}.get(name, len(values[name]))
            array = cached[name]
            if array.shape != (expected, 768) or array.dtype != np.float32 or not np.isfinite(array).all():
                raise ValueError("Incremental index contains malformed cached vectors.")
        if not np.array_equal(cached["owners"], np.asarray(values["owners"][:reused_passages], dtype=int)):
            raise ValueError("Incremental passage ownership changed.")
    encode = lambda texts: encoder.encode(texts, batch_size=4)
    if previous is not None:
        arrays = {name: np.array(array, copy=True) for name, array in cached.items()}
        for name, count in [("questions", reused), ("resources", reused_resources), ("passages", reused_passages)]:
            additions = values[name][count:]
            if additions:
                new_vectors = encode(additions)
                if new_vectors.shape != (len(additions), 768) or new_vectors.dtype != np.float32 or not np.isfinite(new_vectors).all():
                    raise ValueError("New vectors do not satisfy the FP32 encoder contract.")
                arrays[name] = np.concatenate([arrays[name], new_vectors])
        arrays["owners"] = np.asarray(values["owners"], dtype=int)
        old_queries = {text: arrays["queries"][i] for i, text in enumerate(previous["public_queries"])}
        new_queries = [text for text in values["queries"] if text not in old_queries]
        if new_queries:
            encoded_queries = encode(new_queries)
            if encoded_queries.shape != (len(new_queries), 768) or encoded_queries.dtype != np.float32 or not np.isfinite(encoded_queries).all():
                raise ValueError("New public queries do not satisfy the FP32 encoder contract.")
            old_queries.update(zip(new_queries, encoded_queries))
        arrays["queries"] = np.stack([old_queries[text] for text in values["queries"]])
    else:
        arrays = {name: encode(rows) for name, rows in values.items() if name != "owners"}
        arrays["owners"] = np.asarray(values["owners"], dtype=int)
    metadata = {"version": CATALOGUE["version"], "model": report["model"], "fingerprint_format": "canonical-json-sha256",
                "inputs": fingerprints, "public_queries": values["queries"], "resource_ids": resource_ids,
                "question_ids": question_ids, "embedding_input_hashes": nonquestion_hashes,
                "question_row_hashes": question_hashes, "resource_row_hashes": resource_hashes,
                "index_update": {"mode": "incremental-fp32" if previous is not None else "full-fp32", "preserved_question_vectors": reused, "encoded_question_vectors": len(questions) - reused,
                                 "preserved_resource_vectors": reused_resources, "encoded_resource_vectors": len(resources) - reused_resources},
                "scope": "Public curriculum only. New prompts were actually encoded by the existing FP32 ONNX model. Incremental updates preserve unchanged vectors exactly; changed inputs cannot be accepted by a fingerprint-only refresh."}
    return arrays, metadata


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--incremental", action="store_true", help="Only append new question rows after verifying unchanged earlier inputs.")
    args = parser.parse_args()
    encoder = OnnxEncoder(ROOT / "artifacts/cloud")
    report = json.loads((ROOT / "artifacts/cloud/metrics.json").read_text(encoding="utf8"))
    resources, questions = load_extension_content()
    values = embedding_inputs(resources, questions, report)
    previous = json.loads((DIRECTORY / "index.json").read_text(encoding="utf8")) if args.incremental else None
    cached = None
    if args.incremental:
        expected_hash = previous.get("vectors_sha256")
        if not expected_hash:
            historical = json.loads((ROOT / "evaluation-career-embedding-proof.json").read_text(encoding="utf8"))
            if historical["current_content_fingerprints"] != previous["inputs"]:
                raise ValueError("Legacy vector provenance does not match the historical verified index.")
            expected_hash = historical["vectors_sha256"]
        with (DIRECTORY / "vectors.npz").open("rb") as source:
            if hashlib.file_digest(source, "sha256").hexdigest() != expected_hash:
                raise ValueError("Cached vector archive hash does not match its verified metadata.")
        with np.load(DIRECTORY / "vectors.npz", allow_pickle=False) as archive:
            cached = {name: np.array(archive[name], copy=True) for name in archive.files}
    print("Encoding public career content with the existing ONNX model…", flush=True)
    arrays, metadata = build_index(encoder, resources, questions, report, content_fingerprints(), values, previous, cached)
    with tempfile.NamedTemporaryFile(dir=DIRECTORY, prefix=".index-", suffix=".npz", delete=False) as pending:
        temporary = Path(pending.name)
        np.savez_compressed(pending, **arrays)
    try:
        with temporary.open("rb") as source:
            metadata["vectors_sha256"] = hashlib.file_digest(source, "sha256").hexdigest()
        os.replace(temporary, DIRECTORY / "vectors.npz")
    finally:
        if temporary.exists():
            temporary.unlink()
    (DIRECTORY / "index.json").write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf8")
    print(json.dumps(metadata["index_update"]), flush=True)
    print(f"Indexed {len(questions)} questions, {len(resources)} resources and {len(TOPICS)} topic descriptions.", flush=True)


if __name__ == "__main__":
    main()
