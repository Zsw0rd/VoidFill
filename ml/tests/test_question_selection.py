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
from ml.assessment_selection import RESOURCE_ASSESSMENT_UNAVAILABLE, question_in_skill_scope, resource_question_indices


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


def test_resource_scope_requires_an_explicit_link_and_the_configured_topic():
    url = "https://example.com/python/containers"
    resources = [
        {"id": "containers", "url": url, "topics": ["python"]},
        {"id": "wrong-topic", "url": url, "topics": ["algorithms"]},
        {"id": "other-lesson", "url": "https://example.com/regression", "topics": ["python"]},
    ]
    questions = [
        {"resource_id": "containers", "topics": ["python"]},
        {"resource_id": "other-lesson", "topics": ["python"]},
        {"source_url": url, "topics": ["python"]},  # A concept reference alone is not a lesson bank.
        {"resource_id": "containers", "topics": ["algorithms"]},
        {"resource_id": "wrong-topic", "topics": ["python"]},
    ]
    assert resource_question_indices(resources, questions, "python", url) == {0}
    assert resource_question_indices(resources, questions, "python", "https://unknown.example/containers") == set()


def test_python_data_structures_never_substitutes_regression_or_reference_only_questions(engine, monkeypatch):
    resource = next(row for row in engine.resources if row["id"] == "voidfill-python-1")
    assert any("Regression analysis-based" in row["prompt"] and "python" in row["topics"] for row in engine.questions)
    assert any(row.get("source_url") == resource["url"] for row in engine.questions)
    monkeypatch.setattr(engine, "encode_queries", lambda *args, **kwargs: pytest.fail("A missing lesson bank must fail before encoder inference"))
    for options in [
        {"purpose": "course", "resource_url": resource["url"]},
        {"resource_url": resource["url"]},
        {"purpose": "course"},  # Legacy title-only course requests must fail honestly.
        {"purpose": "course", "resource_url": "https://unknown.example/python"},
    ]:
        with pytest.raises(HTTPException) as caught:
            engine.assessment(AssessmentRequest(skills=[{"id": "fixture-python", "name": "Python Basics"}], context=resource["title"], count=12, **options))
        assert caught.value.status_code == 422
        assert caught.value.detail == {"code": RESOURCE_ASSESSMENT_UNAVAILABLE}


def test_linked_resource_bank_cannot_be_outscored_or_padded_by_other_lessons(engine, monkeypatch):
    resource = next(row for row in engine.resources if row["id"] == "voidfill-python-0")
    original_rows = deepcopy(engine.questions)
    original_vectors = engine.question_vectors
    fake_vectors = np.zeros_like(original_vectors)
    for index, question in enumerate(engine.questions):
        fake_vectors[index, 0] = 1 if question.get("resource_id") == resource["id"] else 1_000_000
    monkeypatch.setattr(engine, "question_vectors", fake_vectors)
    monkeypatch.setattr(engine, "encode_queries", lambda *args, **kwargs: np.eye(1, original_vectors.shape[1], dtype=np.float32))
    for difficulty in [1, 2, 3, 4, 5]:
        expected = {row["id"] for row in engine.questions if row.get("resource_id") == resource["id"] and row["id"] not in engine.excluded_question_ids and (row["difficulty"] <= 2 if difficulty <= 2 else row["difficulty"] == difficulty)}
        result = engine.assessment(AssessmentRequest(purpose="course", resource_url=resource["url"], context=resource["title"], skills=[{"id": "fixture-python", "name": "Python Basics"}], difficulty=difficulty, count=20))
        assert {row["id"] for row in result["questions"]} == expected
        assert len(result["questions"]) == len(expected) < 20
        assert all(row.get("resource_id") == resource["id"] and row["topics"] == ["python"] for row in result["questions"])
        assert result["question_source"] == "explicitly linked resource questions"
    assert engine.questions == original_rows


def test_resource_difficulty_cap_and_quarantine_use_only_the_linked_bank(engine, monkeypatch):
    resource = next(row for row in engine.resources if row["id"] == "voidfill-python-0")
    source = next(row for row in engine.questions if row.get("resource_id") == resource["id"])
    safe = {**source, "id": "fixture-linked-safe", "difficulty": 1}
    quarantined = {**source, "id": next(iter(engine.excluded_question_ids)), "difficulty": 5}
    unrelated = {**source, "id": "fixture-unrelated-expert", "resource_id": "other-resource", "difficulty": 5}
    monkeypatch.setattr(engine, "questions", [safe, quarantined, unrelated])
    monkeypatch.setattr(engine, "question_vectors", np.ones((3, 2), dtype=np.float32))
    monkeypatch.setattr(engine, "encode_queries", lambda *args, **kwargs: np.ones((1, 2), dtype=np.float32))
    request = AssessmentRequest(purpose="course", resource_url=resource["url"], skills=[{"id": "fixture-python", "name": "Python Basics"}], difficulty=5, count=20)
    result = engine.assessment(request)
    assert result["difficulty"] == 1
    assert [row["id"] for row in result["questions"]] == [safe["id"]]
    monkeypatch.setattr(engine, "questions", [quarantined, unrelated])
    with pytest.raises(HTTPException) as caught:
        engine.assessment(request)
    assert caught.value.detail == {"code": RESOURCE_ASSESSMENT_UNAVAILABLE}


def test_broad_python_check_excludes_the_regression_lesson_without_losing_ten_foundation_items(engine, monkeypatch):
    resource_id = "d4efc35e0bb394adf9e02a90"
    resource = next(row for row in engine.resources if row["id"] == resource_id)
    assert resource["source_path"] == "2-Regression/1-Tools/README.md"
    regression = {row["id"] for row in engine.questions if row.get("resource_id") == resource_id}
    assert len(regression) == 6
    original_rows = deepcopy(engine.questions)
    original_vectors = engine.question_vectors
    fake_vectors = np.zeros_like(original_vectors)
    for index, question in enumerate(engine.questions):
        fake_vectors[index, 0] = 1_000_000 if question["id"] in regression else 1
    monkeypatch.setattr(engine, "question_vectors", fake_vectors)
    monkeypatch.setattr(engine, "encode_queries", lambda *args, **kwargs: np.eye(1, original_vectors.shape[1], dtype=np.float32))
    for difficulty in [1, 2, 3]:
        expected = {row["id"] for row in engine.questions if "python" in row["topics"] and row["id"] not in engine.excluded_question_ids and row["id"] not in regression and (row["difficulty"] <= 2 if difficulty <= 2 else row["difficulty"] == 3)}
        result = engine.assessment(AssessmentRequest(skills=[{"id": "fixture-python", "name": "Python Basics"}], difficulty=difficulty, count=20))
        assert len(expected) >= 10
        assert {row["id"] for row in result["questions"]} == expected
        assert not regression & {row["id"] for row in result["questions"]}
        if difficulty <= 2:
            assert len(expected) == 10
            assert {row.get("resource_id") for row in result["questions"]} == {"voidfill-python-0", "c9b51ac25661fe54207ddcd9"}
        else:
            assert len([row for row in result["questions"] if row["id"].startswith("career-")]) == 10
    # The lesson's own six ML questions remain available when that exact lesson,
    # rather than a broad Python-language skill check, is explicitly selected.
    linked = engine.assessment(AssessmentRequest(purpose="course", resource_url=resource["url"], context=resource["title"], skills=[{"id": "fixture-python", "name": "Python Basics"}], difficulty=2, count=12))
    assert {row["id"] for row in linked["questions"]} == regression
    assert len(linked["questions"]) == 6
    assert engine.questions == original_rows


def test_python_scope_exception_cannot_change_any_other_topics_eligibility():
    _, questions = load_learning_content()
    for question in questions:
        for topic in CATALOGUE["topics"]:
            if topic != "python" or question.get("resource_id") != "d4efc35e0bb394adf9e02a90":
                assert question_in_skill_scope(question, topic)
