from ml.lesson_coverage import audit_coverage, markdown


def resource(key, url="https://example.test/lesson", topics=None):
    return {"id": key, "title": key, "url": url, "topics": topics or ["python"]}


def question(key, linked=None, difficulty=1, topics=None, **extra):
    return {"id": key, "resource_id": linked, "difficulty": difficulty, "topics": topics or ["python"], **extra}


def test_coverage_matches_serving_url_topic_resolution_without_reference_fallback():
    resources = [resource("first"), resource("same-page"), resource("other-topic", topics=["sql"]), resource("missing", "https://example.test/other")]
    questions = [question("intro", "first"), question("applied", "same-page", 3),
                 question("reference-only", source_url=resources[-1]["url"]), question("foreign", "first", topics=["sql"])]
    report = audit_coverage(resources, questions)
    assert [row["selection_status"] for row in report["resources"]] == ["both_stages", "both_stages", "missing", "missing"]
    assert report["resources"][0]["banks"][0]["foundation_ids"] == ["intro"]
    assert report["resources"][0]["banks"][0]["intermediate_ids"] == ["applied"]
    assert report["without_direct_links"] == 2


def test_quarantine_advanced_only_and_partial_topic_banks_cannot_be_reported_ready():
    resources = [resource("mixed", topics=["python", "sql"]), resource("advanced", "https://example.test/expert")]
    questions = [question("valid", "mixed"), question("retired", "mixed", 3), question("advanced-only", "advanced", 5), question("orphan", "unknown")]
    report = audit_coverage(resources, questions, ["retired"])
    assert report["resources"][0]["selection_status"] == "partial_topics"
    assert report["resources"][1]["selection_status"] == "missing"
    assert report["orphan_resource_links"] == ["unknown"]
    assert "0 / 0" in markdown(report)


def test_report_is_deterministic_and_does_not_modify_public_rows():
    from copy import deepcopy
    resources, questions = [resource("lesson")], [question("one", "lesson")]
    before = deepcopy((resources, questions))
    report = audit_coverage(resources, questions)
    assert report == audit_coverage(resources, questions)
    assert (resources, questions) == before
    assert report["statuses"] == {"foundation_only": 1}
