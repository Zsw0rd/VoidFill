"""Offline validation of exact lesson bindings and selected computed answers."""

from collections import Counter
from fractions import Fraction
import json
import re

import numpy as np
import pandas as pd
import pytest

from ml.career_quality_review import answer_cues
from ml.lesson_questions import ROOT, build_questions
from ml.lesson_validation import validate_lesson_questions
from ml.lessons.data_science_visualization import (
    BANKS,
    DATA_SCIENCE,
    DS,
    LEGACY_QUESTION_FINDINGS,
    ORIENTATIONS,
    REVIEWED_AT,
    SOURCE_FINDINGS,
    VISUALIZATION,
)


def public_rows(*paths):
    return [row for path in paths for row in json.loads((ROOT / path).read_text(encoding="utf8"))]


def resources():
    return public_rows("ml/data/resources.json", "ml/data/careers/resources.json")


def answer(resource_id, code):
    bank = next(row for row in BANKS if resource_id in row["resource_ids"])
    return next(question[4] for question in bank["questions"] if question[0] == code)


def test_every_original_resource_is_bound_to_one_reviewed_decision():
    by_id = {resource["id"]: resource for resource in resources()}
    expected = {rid: r for rid, r in by_id.items() if set(r["topics"]) & {DATA_SCIENCE, VISUALIZATION}}
    decisions = [*BANKS, *ORIENTATIONS]
    assert Counter(r["topics"][0] for r in expected.values()) == {DATA_SCIENCE: 17, VISUALIZATION: 14}
    assert Counter(rid for decision in decisions for rid in decision["resource_ids"]) == Counter(expected.keys())
    assert len(BANKS) == 24 and len(ORIENTATIONS) == 7
    for decision in decisions:
        [rid] = decision["resource_ids"]
        assert decision["url"] == expected[rid]["url"]
        assert decision["topics"] == expected[rid]["topics"]
        assert decision["reviewed_at"] == REVIEWED_AT
    for topic in [DATA_SCIENCE, VISUALIZATION]:
        assert len({r["url"] for r in BANKS if topic in r["topics"]}) == 12
    for guide in ORIENTATIONS:
        assert guide["reason"].strip() and "questions" not in guide
        assert set(guide["child_resource_ids"]) <= set(by_id)
    assert Counter(guide["kind"] for guide in ORIENTATIONS) == {"orientation": 6, "setup-guide": 1}


def test_compiled_checks_are_unique_and_balanced_within_each_lesson():
    checks = build_questions(banks=BANKS, additional_resources=[])
    assert checks == build_questions(banks=BANKS, additional_resources=[])
    assert validate_lesson_questions(checks, resources()) == checks
    assert len(checks) == len({row["id"] for row in checks}) == len({row["prompt"] for row in checks}) == 144
    for bank in BANKS:
        lesson = [check for check in checks if check["resource_ids"] == bank["resource_ids"]]
        assert len(lesson) == 6
        assert sum(check["difficulty"] <= 2 for check in lesson) == 3
        assert sum(check["difficulty"] == 3 for check in lesson) == 3
        assert len({check["objective_id"] for check in lesson}) >= 3
        assert all(check["source_url"].split("#", 1)[0] == bank["url"] for check in lesson)
    cues = answer_cues(checks)
    assert cues["unique_longest_correct_rate"] < 0.45
    assert cues["unique_shortest_correct_rate"] < 0.45
    assert set(cues["correct_positions"]) == {0, 1, 2, 3}


def test_source_evidence_matches_the_pinned_pages_and_literal_rendered_anchors():
    manifest = public_rows("ml/lessons/data_science_visualization_sources.json")
    evidence_by_id = {row["resource_id"]: row for row in manifest}
    assert len(manifest) == len(evidence_by_id) == 31
    for decision in [*BANKS, *ORIENTATIONS]:
        evidence = evidence_by_id[decision["resource_ids"][0]]
        assert evidence["url"] == decision["url"]
        assert evidence["reviewed_at"] == REVIEWED_AT
        assert re.fullmatch(r"[0-9a-f]{64}", evidence["sha256"])
        assert evidence["bytes"] > 200
        url = evidence["url"]
        expected_capture_url = (url.replace("https://github.com/", "https://raw.githubusercontent.com/")
                                .replace("/blob/", "/")) if url.startswith(DS) else url
        assert evidence["raw_url"] == expected_capture_url
        for question in decision.get("questions", []):
            fragment = question[-1]
            if fragment:
                assert fragment[1:] in evidence["section_slugs"]
        linked = set(evidence["catalogue_link_ids"])
        if parent := evidence.get("related_parent_resource_id"):
            assert decision["kind"] == "setup-guide" and url.endswith("/starter/README.md")
            assert evidence_by_id[parent]["url"] == url.replace("/starter/README.md", "/README.md")
            linked.add(parent)
        assert set(decision.get("child_resource_ids", [])) <= linked


def test_numerical_keys_against_independent_calculations():
    stats = "acdab68f5b66b329d778b49b"
    assert answer(stats, "equiprobable") == str(Fraction(3, 8))
    assert answer(stats, "mean") == f"{np.mean([3, 5, 8, 12]):g}"
    q1, q3 = 12, 20
    assert answer(stats, "outlier-fence") == str(next(value for value in [30, 32, 34, 22] if value > q3 + 1.5 * (q3 - q1)))
    assert answer(stats, "expectation") == f"{np.average([2, 6], weights=[0.25, 0.75]):g} units"

    quantities = "36542555913dc6f317da49c8"
    labels = [str(value) for value in [17, 40, 43, 49] if value > 40]
    assert answer(quantities, "labels-threshold") == " and ".join(labels)
    categories = Counter(["Rock", "Moss", "Rock", "Sand", "Rock"])
    assert answer(quantities, "counts") == ", ".join(f"{key} {value}" for key, value in categories.items())
    distribution = "aedd432f9b1ab8a2e1192fa2"
    counts, _ = np.histogram([1, 2, 4, 8, 9], bins=[0, 5, 10])
    assert answer(distribution, "bin-counts") == " and ".join(map(str, counts))
    assert answer("77cfa91e79657e8c0c1eb0fc", "share-calculation") == f"{Fraction(9, sum([9, 6, 15])):.0%}"
    assert answer("77cfa91e79657e8c0c1eb0fc", "waffle-scale") == str(Fraction(24, 120) * 100)
    assert answer("1247afec55e65feff5947891", "pie-angle") == f"{Fraction(12, 40) * 360} degrees"
    first, second, third = (count // 10 for count in [30, 60, 90])
    assert answer("1247afec55e65feff5947891", "scaled-counts") == f"{first}, {second} and {third}"
    assert answer("b9e1b048dcb1f2c56801144a", "line-aggregate") == f"{np.mean([2, 5, 8]):g}"
    assert answer("voidfill-visualization-0", "coordinate-pair") == str(list(zip([0, 2, 4], [3, 1, 7]))[1])


def test_dataframe_operations_and_legacy_fill_behavior_in_the_review_runtime():
    prep = "5b6039faba757e4d6dc1be12"
    frame = pd.DataFrame([[1, 2, 3], [None, 2, None], [1, 2, None]], index=list("ABC"))
    assert answer(prep, "threshold") == " and ".join(frame.dropna(thresh=2).index)
    readings = pd.Series([None, 4, None, 7]).ffill()
    assert answer(prep, "forward") == "[" + ", ".join("missing" if pd.isna(value) else f"{value:g}" for value in readings) + "]"
    with pytest.raises(TypeError, match="method"):
        pd.Series([None, 4]).fillna(method="ffill")
    assert pd.DataFrame({"value": [1, 2, 1]}).duplicated().tolist() == [False, False, True]

    table = pd.DataFrame({"amount": [25, 102, 140], "category": ["A", "B", "A"]})
    filtered = table.query("amount > 100", engine="python")
    assert filtered.index.tolist() == [1, 2] and filtered.columns.tolist() == ["amount", "category"]
    direct_counts = table["category"].value_counts().to_dict()
    assert direct_counts == table.value_counts(table["category"].values).to_dict() == {"A": 2, "B": 1}


def test_counterexamples_for_the_reviewed_statistics_claims():
    x = np.arange(-2, 3)
    y = np.square(x)
    assert np.isclose(np.corrcoef(x, y)[0, 1], 0)
    assert (y[x == 2] == 4).mean() == 1 and (y == 4).mean() == 0.4

    # Exact finite support from summing 100 ordinary die rolls.
    roll = np.ones(6) / 6
    distribution = roll
    for _ in range(99):
        distribution = np.convolve(distribution, roll)
    means = np.arange(100, 601) / 100
    assert len(distribution) == len(means) == 501
    assert distribution[0] > 0 and distribution[-1] > 0
    assert np.isclose(distribution.sum(), 1)
    assert np.isclose(means @ distribution, 3.5)


def test_legacy_findings_bind_exact_stored_prompts_and_keyed_answers():
    legacy = {row["id"]: row for row in public_rows("ml/data/questions.json", "ml/data/careers/questions.json")}
    assert len(LEGACY_QUESTION_FINDINGS) == len({f["question_id"] for f in LEGACY_QUESTION_FINDINGS}) == 10
    for finding in LEGACY_QUESTION_FINDINGS:
        row = legacy[finding["question_id"]]
        assert row["prompt"] == finding["prompt"]
        assert row["resource_id"] == finding["resource_id"]
        assert row["source_url"] == finding["url"]
        assert row["options"][row["correct_index"]] == finding["current_keyed_answer"]
        assert finding["suggested_action"] == "quarantine"
        assert len(finding["reason"]) > 70 and all(url.startswith("https://") for url in finding["primary_references"])


def test_warning_sections_match_the_reviewed_source_records():
    by_id = {r["resource_id"]: r for r in public_rows("ml/lessons/data_science_visualization_sources.json")}
    assert len(SOURCE_FINDINGS) == 23
    assert len({(f["resource_id"], f["section"]) for f in SOURCE_FINDINGS}) == 23
    for finding in SOURCE_FINDINGS:
        evidence = by_id[finding["resource_id"]]
        assert finding["url"] == evidence["url"]
        assert finding["reviewed_at"] == evidence["reviewed_at"]
        assert finding["section"][1:] in evidence["section_slugs"]
        assert finding["severity"] in {"error", "caution"}
        assert 30 < len(finding["warning"]) < 400
        assert finding["correct_primary_urls"] and all(url.startswith("https://") for url in finding["correct_primary_urls"])
