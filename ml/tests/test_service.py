import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from ml.service import app

ROOT = Path(__file__).resolve().parents[1]
SQL = {"id": "00000000-0000-4000-8000-000000000001", "name": "SQL Fundamentals", "score": 20, "target": 75, "importance": 1}
PYTHON = {"id": "00000000-0000-4000-8000-000000000002", "name": "Python Basics", "score": 90, "target": 75, "importance": 1}
TOKEN = "test-service-token-with-at-least-32-characters"


@pytest.fixture(scope="module")
def client():
    import os
    previous = os.environ.get("ML_SERVICE_TOKEN")
    os.environ["ML_SERVICE_TOKEN"] = TOKEN
    with TestClient(app) as active:
        yield active
    if previous is None:
        os.environ.pop("ML_SERVICE_TOKEN", None)
    else:
        os.environ["ML_SERVICE_TOKEN"] = previous


def post(client, endpoint, payload):
    return client.post(endpoint, json=payload, headers={"X-ML-Token": TOKEN})


def test_service_rejects_unauthenticated_question_access(client):
    assert client.post("/assessment", json={"skills": [SQL]}).status_code == 401
    assert client.post("/guest/start", json={"role": 0}).status_code == 401
    assert client.post("/resume/parse", files={"file": ("resume.pdf", b"%PDF-invalid", "application/pdf")}).status_code == 401


@pytest.mark.offline_training
def test_real_trained_checkpoint_is_loaded(client):
    result = client.get("/health").json()
    assert result["status"] == "ready"
    assert result["model"] == json.loads((ROOT / "artifacts/metrics.json").read_text(encoding="utf8"))["model"]
    assert result["resources"] >= 100
    assert result["questions"] >= 500
    report = json.loads((ROOT / "evaluation.json").read_text(encoding="utf-8"))
    assert report["max_abs_parameter_change"] > 0


def test_resources_have_real_catalogue_urls_and_preserve_skill_identity(client):
    response = post(client, "/recommend", {"skills": [SQL, PYTHON], "role": "Data Analyst", "limit": 3})
    assert response.status_code == 200
    for result in response.json()["recommendations"]:
        assert result["skill_id"] in [SQL["id"], PYTHON["id"]]
        assert len(result["resources"]) >= 2
        assert all(r["url"].startswith("https://") and r["source"] for r in result["resources"])


def test_assessment_has_unique_questions_correct_mapping_and_valid_answer_keys(client):
    response = post(client, "/assessment", {"skills": [SQL, PYTHON], "count": 10, "difficulty": 2})
    assert response.status_code == 200
    questions = response.json()["questions"]
    assert len(questions) == 10
    assert len({q["id"] for q in questions}) == 10
    assert {q["skill_id"] for q in questions} == {SQL["id"], PYTHON["id"]}
    assert sum(q["skill_id"] == SQL["id"] for q in questions) > sum(q["skill_id"] == PYTHON["id"] for q in questions)
    assert all(0 <= q["correct_index"] < len(q["options"]) and q["explanation"] for q in questions)


def test_difficulty_changes_selection_rather_than_only_the_label(client):
    skill = SQL | {"name": "DSA Basics"}
    easy = post(client, "/assessment", {"skills": [skill], "count": 3, "difficulty": 1}).json()["questions"]
    hard = post(client, "/assessment", {"skills": [skill], "count": 3, "difficulty": 5}).json()["questions"]
    assert sum(q["difficulty"] for q in hard) > sum(q["difficulty"] for q in easy)


def test_unassessed_is_distinct_from_measured_weakness(client):
    response = post(client, "/analyze", {"skills": [SQL | {"score": None}, PYTHON], "role": "Data Analyst"})
    assert response.status_code == 200
    result = response.json()["analysis"]
    assert result["strengthAreas"] == ["Python Basics"]
    assert result["criticalGaps"][0]["severity"] == "unassessed"
    assert result["criticalGaps"][0]["assessed"] is False


def test_numeric_gaps_are_computed_from_supplied_assessments(client):
    result = post(client, "/analyze", {"skills": [SQL]}).json()["analysis"]
    assert result["criticalGaps"][0]["gap"] == 55
    assert result["criticalGaps"][0]["currentScore"] == 20


def test_unknown_skill_does_not_get_fabricated_coverage(client):
    skill = SQL | {"name": "Underwater basket weaving"}
    result = post(client, "/recommend", {"skills": [skill]}).json()
    assert result["unsupported_skills"] == [skill["name"]]
    assert result["recommendations"][0]["resources"] == []
    assert post(client, "/assessment", {"skills": [skill]}).status_code == 422


def test_out_of_range_difficulty_is_rejected(client):
    assert post(client, "/assessment", {"skills": [SQL], "difficulty": 9}).status_code == 422


def test_grouped_splits_have_no_shared_lessons_or_training_queries():
    splits = json.loads((ROOT / "data/splits.json").read_text(encoding="utf-8"))
    assert not set(splits["train"]) & set(splits["test"])
    assert not set(splits["train"]) & set(splits["validation"])
    assert not set(splits["validation"]) & set(splits["test"])
    pairs = json.loads((ROOT / "data/training_pairs.json").read_text(encoding="utf-8"))
    query_sets = {name: {p["query"] for p in pairs if p["group"] in ids} for name, ids in splits.items()}
    assert not query_sets["train"] & query_sets["test"]


def test_dataset_questions_are_structurally_valid_and_unique():
    questions = json.loads((ROOT / "data/questions.json").read_text(encoding="utf-8"))
    assert len({q["id"] for q in questions}) == len(questions)
    for question in questions:
        assert 2 <= len(question["options"]) <= 6
        assert len(set(question["options"])) == len(question["options"])
        assert 0 <= question["correct_index"] < len(question["options"])
        assert 1 <= question["difficulty"] <= 5
        assert question["source"] and question["source_url"]
