"""New brief contracts and their public-index preservation evidence."""
import copy
import json

from ml.career_case_audit import audit
from ml.career_case_contracts import case_contract
from ml.career_embedding_proof import ROOT, current_inventory, digest, file_digest, matcher_inputs, matcher_runtime
from ml.career_catalogue import CATALOGUE, content_fingerprints


def test_all_120_contracts_are_current_with_independent_boundary_results():
    report = audit()
    assert report["errors"] == []
    assert report["role_count"] == 60 and report["level_count"] == 120
    assert len(report["independent_checks"]) == 45
    assert all(row["passed"] and row["rendered_evidence_present"] for row in report["independent_checks"])
    observed = {(row["role"], row["check"]): row["observed"] for row in report["independent_checks"]}
    # These checks expose genuine wrong solutions, not merely missing metadata.
    assert any(role == "BI Analyst" and values == [160, 320, 200, 100] for (role, _), values in observed.items())
    assert any(role == "Software Engineer" and values == [["D", "B", "A", "C"], False] for (role, _), values in observed.items())
    assert any(role == "CAD Technician" and values == [True, False] for (role, _), values in observed.items())


def test_contract_sources_and_tasks_are_independent_snapshot_copies():
    first = case_contract("Frontend Developer", "foundation")
    original = copy.deepcopy(first)
    first["sources"][0]["url"] = "https://example.com/caller-only"
    first["task"] = "Caller-only task"
    assert case_contract("Frontend Developer", "foundation") == original


def test_no_reindex_proof_is_bound_to_every_current_input_and_vector_byte():
    report = json.loads((ROOT / "ml/evaluation-career-embedding-proof.json").read_bytes())
    assert all(report["checks"].values())
    assert report["backend"] == "onnx-fp32"
    assert report["current_content_fingerprints"] == content_fingerprints()
    for name, values in current_inventory().items():
        proof = report["inputs"][name]
        assert proof["equal"] and proof["count"] == len(values)
        assert digest(values) == proof["before_sha256"] == proof["after_sha256"], name
    assert file_digest((ROOT / "ml/data/careers/vectors.npz").read_bytes()) == report["vectors_sha256"] == report["baseline_vectors_sha256"]
    assert digest(matcher_inputs(CATALOGUE)) == report["matcher_inputs_sha256"]
    for name in ("ml/index_careers.py", "ml/retrieval.py"):
        assert file_digest((ROOT / name).read_text(encoding="utf8").encode()) == report["implementation_sha256"][name]
    assert file_digest(matcher_runtime((ROOT / "lib/careerCatalog.ts").read_text(encoding="utf8")).encode()) == report["implementation_sha256"]["matcher_executable_js"]
