"""Prove append-only lesson/index changes against the last deployed release.

The earlier case-only no-reindex proof remains historical. New lesson prompts
must have real new FP32 vectors, while original content and vectors stay intact.
"""
import hashlib
from io import BytesIO
import json
from pathlib import Path
import subprocess

import numpy as np

from ml.career_catalogue import content_fingerprints, load_extension_content
from ml.index_careers import digest, embedding_inputs

ROOT = Path(__file__).resolve().parents[1]
BASELINE = "f8ffd9262127e5509ed1fda4f025f4f45ce65de1"
ORIGINAL_DATA = ["ml/data/resources.json", "ml/data/questions.json", "ml/data/careers/resources.json", "ml/data/careers/questions.json", "ml/cloud-release.json"]


def baseline_bytes(path):
    result = subprocess.run(["git", "show", BASELINE + ":" + path], cwd=ROOT, capture_output=True, check=True)
    return result.stdout


def prove(verify_encoder=False):
    checks = {}
    for path in ORIGINAL_DATA:
        checks["preserved:" + path] = json.loads(baseline_bytes(path)) == json.loads((ROOT / path).read_bytes())
    old_catalogue = json.loads(baseline_bytes("ml/data/careers/catalogue.json"))
    current = json.loads((ROOT / "ml/data/careers/catalogue.json").read_bytes())
    checks["roles_and_requirements_preserved"] = current["roles"] == old_catalogue["roles"]
    without_coverage = lambda rows: [{key: value for key, value in row.items() if key != "coverage"} for row in rows]
    checks["skill_identity_and_scope_preserved"] = without_coverage(current["skills"]) == without_coverage(old_catalogue["skills"])
    resources, questions = load_extension_content()
    report = json.loads((ROOT / "ml/artifacts/cloud/metrics.json").read_bytes())
    values = embedding_inputs(resources, questions, report)
    metadata = json.loads((ROOT / "ml/data/careers/index.json").read_bytes())
    old_metadata = json.loads(baseline_bytes("ml/data/careers/index.json"))
    original_count = len(old_metadata["question_ids"])
    checks["metadata_fingerprints_current"] = metadata["inputs"] == content_fingerprints()
    checks["same_encoder_model"] = metadata["model"] == old_metadata["model"] == report["model"]
    old_resource_count = len(old_metadata["resource_ids"])
    checks["resource_order_preserved"] = metadata["resource_ids"][:old_resource_count] == old_metadata["resource_ids"]
    checks["all_resource_order_current"] = metadata["resource_ids"] == [row["id"] for row in resources]
    checks["question_prefix_preserved"] = metadata["question_ids"][:original_count] == old_metadata["question_ids"]
    checks["all_question_order_current"] = metadata["question_ids"] == [row["id"] for row in questions]
    checks["question_rows_bound_to_index"] = metadata["question_row_hashes"] == [digest(row) for row in questions]
    checks["public_embedding_inputs_bound"] = metadata["embedding_input_hashes"] == {name: digest(rows) for name, rows in values.items() if name != "questions"}
    archive_path = ROOT / "ml/data/careers/vectors.npz"
    with archive_path.open("rb") as source:
        vector_hash = hashlib.file_digest(source, "sha256").hexdigest()
    checks["current_vector_archive_bound"] = vector_hash == metadata["vectors_sha256"]
    with np.load(BytesIO(baseline_bytes("ml/data/careers/vectors.npz")), allow_pickle=False) as original, np.load(archive_path, allow_pickle=False) as updated:
        for name in original.files:
            if name == "questions": actual = updated[name][:original_count]
            elif name == "resources": actual = updated[name][:old_resource_count]
            elif name in ("passages", "owners"): actual = updated[name][:len(original[name])]
            elif name == "queries":
                positions = {text: i for i, text in enumerate(metadata["public_queries"])}
                actual = np.stack([updated[name][positions[text]] for text in old_metadata["public_queries"]])
            else: actual = updated[name]
            checks["old_vectors_preserved:" + name] = np.array_equal(original[name], actual)
        checks["new_vectors_fp32_finite"] = updated["questions"].shape == (len(questions), 768) and updated["questions"].dtype == np.float32 and bool(np.isfinite(updated["questions"]).all())
        new_vectors = np.array(updated["questions"][original_count:], copy=True)
        new_resource_vectors = np.array(updated["resources"][old_resource_count:], copy=True)
        old_passage_count = len(original["passages"])
        new_passage_vectors = np.array(updated["passages"][old_passage_count:], copy=True)
        old_queries = set(old_metadata["public_queries"])
        extra_queries = [(i, text) for i, text in enumerate(metadata["public_queries"]) if text not in old_queries]
        new_query_vectors = np.array(updated["queries"][[i for i, _ in extra_queries]], copy=True)
    if verify_encoder:
        from ml.onnx_encoder import OnnxEncoder
        encoder = OnnxEncoder(ROOT / "ml/artifacts/cloud")
        actual = encoder.encode(values["questions"][original_count:], batch_size=4)
        checks["every_new_vector_matches_fp32_encoder"] = np.allclose(actual, new_vectors, atol=2e-5, rtol=2e-5)
        for name, text, encoded in [("resources", values["resources"][old_resource_count:], new_resource_vectors),
                                    ("passages", values["passages"][old_passage_count:], new_passage_vectors),
                                    ("public_queries", [text for _, text in extra_queries], new_query_vectors)]:
            checks["every_new_" + name + "_vector_matches_fp32_encoder"] = np.allclose(encoder.encode(text, batch_size=4), encoded, atol=2e-5, rtol=2e-5)
    return {"version": 1, "baseline_commit": BASELINE, "model": metadata["model"],
            "scope": "Original deployed content/model/vector preservation plus explicit real indexing of newly authored public lesson questions. Changed matcher quality is evaluated separately. Human validation remains pending.",
            "original_extension_questions": original_count, "new_lesson_questions": len(questions) - original_count,
            "additional_teaching_resources": len(resources) - old_resource_count,
            "vectors_sha256": vector_hash, "checks": checks, "errors": [key for key, passed in checks.items() if not passed]}


if __name__ == "__main__":
    proof = prove(verify_encoder=True)
    (ROOT / "ml/evaluation-content-release.json").write_text(json.dumps(proof, indent=2) + "\n", encoding="utf8")
    print(json.dumps({key: value for key, value in proof.items() if key not in {"checks", "scope"}}, indent=2))
    raise SystemExit(bool(proof["errors"]))
