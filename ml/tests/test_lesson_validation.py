from copy import deepcopy

import pytest

from ml.assessment_selection import resource_question_indices
from ml.lesson_questions import build_questions
from ml.lesson_validation import validate_lesson_questions


def resources():
    from ml.career_catalogue import load_extension_content, ROOT
    import json
    extension, _ = load_extension_content()
    return [*json.loads((ROOT / "data/resources.json").read_text(encoding="utf8")), *extension]


def test_shared_page_questions_bind_explicitly_to_each_supported_topic():
    rows = build_questions()
    public = resources()
    validate_lesson_questions(rows, public)
    url = "https://docs.python.org/3/tutorial/datastructures.html"
    for topic in ["python", "algorithms"]:
        selected = resource_question_indices(public, rows, topic, url)
        assert len(selected) == 6
    assert resource_question_indices(public, rows, "sql", url) == set()


def test_invalid_manifest_cannot_silently_broaden_scope_or_change_grading():
    public = resources()
    original = build_questions()
    mutations = [("id", "unversioned"), ("resource_ids", []), ("resource_ids", ["unknown"]),
                 ("resource_ids", original[0]["resource_ids"] * 2), ("topics", ["sql"]),
                 ("source_url", "https://example.test/unrelated"), ("source_url", "http://docs.python.org/3/tutorial/datastructures.html"),
                 ("correct_index", True), ("correct_index", 4), ("difficulty", True),
                 ("options", ["A"] * 4), ("objective_id", ""), ("lesson_scope", ""), ("source_reviewed_at", "unknown")]
    for field, value in mutations:
        rows = deepcopy(original); rows[0][field] = value
        with pytest.raises(RuntimeError, match="Lesson question manifest"):
            validate_lesson_questions(rows, public)
    with pytest.raises(RuntimeError):
        validate_lesson_questions([*original, original[0]], public)
    with pytest.raises(RuntimeError):
        validate_lesson_questions(original, public, [original[0]["id"]])
