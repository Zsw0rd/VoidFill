from copy import deepcopy

import pytest

from ml.assessment_selection import resource_question_indices
from ml.career_catalogue import load_learning_content
from ml.lesson_questions import build_scopes
from ml.lesson_validation import validate_resource_scopes
from ml.resource_scopes import guide_for_resource, guide_only_question_ids


def test_guides_cannot_supply_new_lesson_or_skill_questions_but_history_is_preserved():
    resources, questions = load_learning_content()
    scopes = build_scopes()
    assert len(scopes) > 20
    validate_resource_scopes(scopes, resources)
    for scope in scopes:
        assert guide_for_resource(" " + scope["url"] + " ") == scope
        for topic in scope["topics"]:
            assert resource_question_indices(resources, questions, topic, scope["url"]) == set()
        historic = {"id": "historic-example", "resource_id": scope["resource_ids"][0]}
        before = deepcopy(historic)
        assert guide_only_question_ids(resources, [historic]) == {historic["id"]}
        assert historic == before
    assert guide_for_resource("https://docs.python.org/3/tutorial/datastructures.html") is None
    assert not guide_only_question_ids(resources, [{"id": "teaching-example", "resource_id": "voidfill-python-1"}])


def test_scope_manifest_fails_closed_on_answers_unknown_links_conflicts_and_wrong_identity():
    resources, questions = load_learning_content()
    original = build_scopes()
    for key, value in [("correct_index", 0), ("resource_ids", ["unknown"]), ("url", "https://example.test/other"),
                       ("topics", ["invented"]), ("child_resource_ids", ["unknown"]), ("assessment", "graded"),
                       ("kind", "quiz"), ("reason", ""), ("related_lessons", []), ("reviewed_at", "bad")]:
        rows = deepcopy(original)
        index = next((i for i, row in enumerate(rows) if row["related_lessons"]), 0) if key == "related_lessons" else 0
        rows[index][key] = value
        with pytest.raises(RuntimeError, match="Resource scopes"):
            validate_resource_scopes(rows, resources)
    with pytest.raises(RuntimeError):
        validate_resource_scopes([*original, original[0]], resources)
    conflict = {"source_url": original[0]["url"], "topics": original[0]["topics"]}
    with pytest.raises(RuntimeError):
        validate_resource_scopes(original, resources, [conflict])


def test_scope_metadata_contains_no_question_or_answer_data():
    forbidden = {"correct_index", "answers", "questions", "prompt", "options", "explanation"}
    def inspect(value):
        if isinstance(value, dict):
            assert not forbidden & value.keys()
            for child in value.values(): inspect(child)
        elif isinstance(value, list):
            for child in value: inspect(child)
    inspect(build_scopes())
