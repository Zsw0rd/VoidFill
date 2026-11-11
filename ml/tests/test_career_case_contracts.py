"""New brief contracts and their public-index preservation evidence."""
import copy
import json

from ml.career_case_audit import audit
from ml.career_case_contracts import case_contract
from ml.content_release_proof import prove


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


def test_additive_lesson_release_preserves_original_content_and_really_indexes_new_prompts():
    report = prove(verify_encoder=True)
    assert report["new_lesson_questions"] > 0
    assert report["errors"] == []
    assert all(report["checks"].values())
