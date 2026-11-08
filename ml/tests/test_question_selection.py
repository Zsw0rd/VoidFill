"""The reviewed selection quarantine never rewrites bank rows or embeddings."""
from copy import deepcopy
import json
import os
from types import SimpleNamespace

from fastapi import HTTPException
import numpy as np
import pytest

from ml.career_catalogue import CATALOGUE, load_learning_content
from ml.service import ROOT, AssessmentRequest, LearningEngine, load_question_exclusions


@pytest.fixture(scope="module")
def engine():
    previous = os.environ.get("ML_BACKEND")
    os.environ["ML_BACKEND"] = "onnx"
    result = LearningEngine()
    yield result
    if previous is None:
        os.environ.pop("ML_BACKEND", None)
    else:
        os.environ["ML_BACKEND"] = previous


def registry():
    return json.loads((ROOT / "data/question-quality.json").read_text(encoding="utf8"))


def test_registry_rejects_unknown_duplicate_stale_or_unexplained_exclusions(tmp_path):
    _, questions = load_learning_content()
    valid = registry()
    assert len(load_question_exclusions(questions)) == 4
    mutations = []
    for key, value in [("id", "unknown-question"), ("reason", "   "), ("reason_code", ""), ("prompt", "Stale edited stem"), ("reference_urls", ["http://unverified.invalid"]), ("reference_urls", ["https://secret@reference.invalid"]), ("reference_urls", [])]:
        changed = deepcopy(valid); changed["excluded"][0][key] = value; mutations.append(changed)
    duplicate = deepcopy(valid); duplicate["excluded"].append(deepcopy(duplicate["excluded"][0])); mutations.append(duplicate)
    path = tmp_path / "quality.json"
    for changed in mutations:
        path.write_text(json.dumps(changed), encoding="utf8")
        with pytest.raises(RuntimeError, match="Question-quality registry"):
            load_question_exclusions(questions, path)
    path.write_text("not valid JSON", encoding="utf8")
    with pytest.raises(RuntimeError):
        load_question_exclusions(questions, path)
    with pytest.raises(RuntimeError):
        load_question_exclusions(questions, tmp_path / "absent.json")


def test_quarantined_items_never_win_even_with_overwhelming_retrieval_scores(engine, monkeypatch):
    original_rows = deepcopy(engine.questions)
    original_vectors = engine.question_vectors
    fake_vectors = np.zeros_like(original_vectors)
    for index, question in enumerate(engine.questions):
        fake_vectors[index, 0] = 1_000_000 if question["id"] in engine.excluded_question_ids else 1
    monkeypatch.setattr(engine, "question_vectors", fake_vectors)
    monkeypatch.setattr(engine, "encode_queries", lambda *args, **kwargs: np.eye(1, original_vectors.shape[1], dtype=np.float32))
    monkeypatch.setattr(np.random, "default_rng", lambda: SimpleNamespace(gumbel=lambda location, scale, size: np.zeros(size), shuffle=lambda values: None))
    for name in ["SQL Fundamentals", "Python Basics"]:
        for difficulty in [1, 2, 3, 5]:
            result = engine.assessment(AssessmentRequest(skills=[{"id": "fixture-skill", "name": name}], count=10, difficulty=difficulty))
            # Supported learner stages are foundation/intermediate (<=3).
            # Legacy higher labels may have smaller banks; never pad them with
            # quarantined items merely to meet a requested count.
            if difficulty <= 3:
                assert len(result["questions"]) == 10
            else:
                assert result["questions"]
            assert not {question["id"] for question in result["questions"]} & engine.excluded_question_ids
    assert engine.questions == original_rows
    assert all(any(question["id"] == excluded for question in engine.questions) for excluded in engine.excluded_question_ids)
    assert fake_vectors.shape == original_vectors.shape


def test_no_coverage_path_never_falls_back_to_excluded_questions(engine, monkeypatch):
    excluded_rows = [question for question in engine.questions if question["id"] in engine.excluded_question_ids]
    monkeypatch.setattr(engine, "questions", excluded_rows)
    for name in ["SQL Fundamentals", "Python Basics"]:
        with pytest.raises(HTTPException) as caught:
            engine.assessment(AssessmentRequest(skills=[{"id": "fixture-skill", "name": name}], count=10, difficulty=5))
        assert caught.value.status_code == 422


def test_difficulty_cap_ignores_a_quarantined_only_higher_level(engine, monkeypatch):
    source = next(question for question in engine.questions if question["id"] == "b2bd6e44742c5bd2a5843ea1")
    bad = {**source, "difficulty": 5}
    safe = [{**source, "id": f"fixture-allowed-{index}", "difficulty": 1} for index in range(10)]
    monkeypatch.setattr(engine, "questions", [bad, *safe])
    monkeypatch.setattr(engine, "question_vectors", np.ones((11, 2), dtype=np.float32))
    monkeypatch.setattr(engine, "encode_queries", lambda *args, **kwargs: np.ones((1, 2), dtype=np.float32))
    result = engine.assessment(AssessmentRequest(skills=[{"id": "fixture-skill", "name": "SQL Fundamentals"}], count=10, difficulty=5))
    assert result["difficulty"] == 1
    assert len(result["questions"]) == 10
    assert source["id"] not in {question["id"] for question in result["questions"]}


def test_every_career_still_has_ten_unique_questions_at_both_learning_levels(engine):
    skills = {skill["key"]: skill for skill in CATALOGUE["skills"]}
    for role in CATALOGUE["roles"]:
        if role["release_status"] != "pilot":
            continue
        selected_skills = [{"id": skills[row["skill"]]["id"], "name": skills[row["skill"]]["name"]} for row in role["requirements"]]
        for difficulty in [2, 3]:
            result = engine.assessment(AssessmentRequest(role=role["name"], skills=selected_skills, count=10, difficulty=difficulty))
            assert len(result["questions"]) == 10, (role["name"], difficulty)
            assert len({question["id"] for question in result["questions"]}) == 10
            assert not {question["id"] for question in result["questions"]} & engine.excluded_question_ids
            assert all(question["difficulty"] <= 2 if difficulty == 2 else question["difficulty"] == 3 for question in result["questions"])
