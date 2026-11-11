"""Verify source bindings and selected calculations for the technical lessons."""

import json
import os
import re
import shutil
import statistics
import subprocess
from collections import Counter, defaultdict
from datetime import date
from fractions import Fraction
from pathlib import Path
from urllib.parse import urlsplit

import pytest

from ml.lesson_questions import ROOT, build_questions
from ml.lesson_validation import validate_lesson_questions, validate_lesson_resources
from ml.lessons.technical_professional import (
    BANKS,
    LEGACY_QUESTION_FINDINGS,
    NEW_RESOURCES,
    ORIENTATIONS,
    SOURCE_FINDINGS,
    TOPICS,
)


def read_rows(*paths):
    return [row for path in paths for row in json.loads((ROOT / path).read_text(encoding="utf8"))]


def original_resources():
    return read_rows("ml/data/resources.json", "ml/data/careers/resources.json")


def answer(code):
    return next(row[4] for bank in BANKS for row in bank["questions"] if row[0] == code)


def test_every_original_resource_has_one_reviewed_decision_and_each_topic_has_three_teaching_urls():
    originals = original_resources()
    assigned = {row["id"] for row in originals if TOPICS.intersection(row["topics"])}
    added = {row["id"] for row in NEW_RESOURCES}
    assert len(assigned) == 75
    assert len(added) == 15
    assert not assigned & added

    decisions = [*BANKS, *ORIENTATIONS]
    counts = Counter(rid for record in decisions for rid in record["resource_ids"])
    assert counts == Counter({rid: 1 for rid in assigned | added})
    assert len(BANKS) == 74
    assert len(ORIENTATIONS) == 15

    by_id = {row["id"]: row for row in [*originals, *NEW_RESOURCES]}
    teaching_urls = defaultdict(set)
    teaching_ids = {rid for bank in BANKS for rid in bank["resource_ids"]}
    for bank in BANKS:
        for topic in bank["topics"]:
            teaching_urls[topic].add(bank["url"])
    for record in decisions:
        bound = [by_id[rid] for rid in record["resource_ids"]]
        assert all(row["url"] == record["url"] for row in bound)
        assert set(record["topics"]) <= {topic for row in bound for topic in row["topics"]}
    for guide in ORIENTATIONS:
        assert guide["child_resource_ids"]
        assert set(guide["child_resource_ids"]) <= teaching_ids
        assert not set(guide["child_resource_ids"]) & set(guide["resource_ids"])
        assert len(guide["reason"]) > 40
    assert set(teaching_urls) == TOPICS
    assert all(len(urls) >= 3 for urls in teaching_urls.values())


def test_compiled_questions_are_bound_to_public_lessons_with_balanced_stages():
    resources = original_resources()
    allowed_topics = {topic for row in resources for topic in row["topics"]}
    assert validate_lesson_resources(NEW_RESOURCES, resources, allowed_topics) == NEW_RESOURCES
    legacy = read_rows("ml/data/questions.json", "ml/data/careers/questions.json")
    questions = build_questions(banks=BANKS, additional_resources=NEW_RESOURCES)
    assert validate_lesson_questions(questions, [*resources, *NEW_RESOURCES], [q["id"] for q in legacy]) == questions
    assert len(questions) == 444
    assert len({q["prompt"] for q in questions}) == len(questions)
    by_resource = defaultdict(list)
    for q in questions:
        by_resource[tuple(q["resource_ids"])].append(q)
    for bank in BANKS:
        rows = by_resource[tuple(bank["resource_ids"])]
        assert len(rows) == 6
        assert sum(row["difficulty"] <= 2 for row in rows) == 3
        assert sum(row["difficulty"] == 3 for row in rows) == 3
        assert len({row["objective_id"] for row in rows}) >= 3
        assert all(row["source_url"] == bank["url"] for row in rows)

    longest = shortest = 0
    for q in questions:
        lengths = [len(option) for option in q["options"]]
        key_length = lengths.pop(q["correct_index"])
        longest += key_length > max(lengths)
        shortest += key_length < min(lengths)
    assert longest / len(questions) < 0.45
    assert shortest / len(questions) < 0.45


def test_source_review_evidence_accounts_for_all_publisher_documents_and_guide_targets():
    rows = read_rows("ml/lessons/technical_professional_sources.json")
    evidence_by_id = {row["resource_id"]: row for row in rows}
    assert len(rows) == len(evidence_by_id) == 90
    assert set(evidence_by_id) == {rid for r in [*BANKS, *ORIENTATIONS] for rid in r["resource_ids"]}
    methods = {
        "publisher_page_capture", "publisher_manual_source", "publisher_manual_archive",
        "publisher_lesson_source", "publisher_indexed_text",
    }
    for record in [*BANKS, *ORIENTATIONS]:
        for rid in record["resource_ids"]:
            evidence = evidence_by_id[rid]
            assert evidence["url"] == record["url"]
            assert evidence["reviewed_at"] == record["reviewed_at"]
            assert date.fromisoformat(evidence["evidence_checked_at"]) >= date.fromisoformat(evidence["reviewed_at"])
            assert evidence["reference"] == "full_page"
            assert evidence["method"] in methods
            assert urlsplit(evidence["evidence_url"]).scheme == "https"
            if evidence["method"] == "publisher_indexed_text":
                assert evidence["direct_capture_status"] == 406
                assert "response_sha256" not in evidence
            else:
                assert re.fullmatch(r"[0-9a-f]{64}", evidence["response_sha256"])
            if evidence["method"] == "publisher_manual_archive":
                assert re.fullmatch(r"[0-9a-f]{64}", evidence["document_sha256"])
            if "questions" in record:
                assert evidence["decision"] == "teaching"
                assert evidence["verified_sections"] == record["source_sections"]
                assert evidence["verified_sections"]
            else:
                assert evidence["decision"] == "ungraded_guide"
                links = evidence["related_lessons"]
                assert [row["resource_id"] for row in links] == record["child_resource_ids"]
                assert all(row["relationship"] in {"linked_unit", "editorial_alternative"} for row in links)


def test_numeric_answers_agree_with_independent_calculations():
    point = tuple(a + b for a, b in zip((3, 2), (4, 5)))
    assert answer("cad-offset") == f"({point[0]},{point[1]})"
    assert answer("jit-takt") == f"{Fraction(420, 210)} minutes/unit"
    assert Fraction(420, 420) / Fraction(420, 210) == Fraction(1, 2)
    assert answer("jit-demand") == "It halves"
    assert answer("ohm-current") == f"{float(Fraction(12, 400)):g} A"
    assert answer("ohm-voltage") == f"{float(220 * Fraction('0.02')):g} V"
    assert answer("power-dc") == f"{float(9 * Fraction('0.2')):g} W"
    assert answer("power-resistor") == f"{float(Fraction(6 ** 2, 100)):g} W"
    assert answer("power-hours") == f"{10 * 2} Wh"
    assert answer("resistor-series-number") == f"{100 + 220} ohms"
    assert answer("resistor-equal-parallel") == f"{1 / (Fraction(1, 100) + Fraction(1, 100))} ohms"
    assert answer("resistor-mixed-parallel") == f"{1 / (Fraction(1, 6) + Fraction(1, 3))} ohms"


def test_bash_pipeline_keys_match_real_exit_statuses(tmp_path):
    git_bash = Path("C:/Program Files/Git/bin/bash.exe")
    bash = str(git_bash) if os.name == "nt" and git_bash.is_file() else shutil.which("bash")
    if not bash or os.name == "nt" and not git_bash.is_file():
        pytest.skip("GNU Bash or Git Bash is required for the pipeline execution check")
    env = {key: value for key, value in os.environ.items()
           if key not in {"BASH_ENV", "ENV", "SHELLOPTS", "BASHOPTS"} and not key.startswith("BASH_FUNC_")}
    script = """
set +o pipefail
false | true
printf '%d\\n' "$?"
set -o pipefail
(exit 2) | (exit 7) | true
printf '%d\\n' "$?"
! true | true
printf '%d\\n' "$?"
"""
    result = subprocess.run([bash, "--noprofile", "--norc", "-c", script],
                            env=env, cwd=tmp_path, capture_output=True, text=True, check=True, timeout=20)
    default, pipefail, negated = result.stdout.splitlines()
    assert answer("pipeline-hidden-failure") == default
    assert answer("pipeline-pipefail") == pipefail
    assert (answer("pipeline-negate"), negated) == ("Makes the status failure", "1")


def test_source_warnings_bind_to_actual_technical_lessons_and_correct_the_record():
    by_id = {row["id"]: row for row in [*original_resources(), *NEW_RESOURCES]}
    assert len(SOURCE_FINDINGS) == 3
    for warning in SOURCE_FINDINGS:
        assert warning["url"] == by_id[warning["resource_id"]]["url"]
        assert warning["reviewed_at"] == "2026-11-11"
        assert warning["detail"] and warning["warning"]
        assert all(urlsplit(url).scheme == "https" for url in warning["correct_primary_urls"])
    assert statistics.pstdev([0, 2]) == 1
    assert statistics.stdev([0, 2]) > statistics.pstdev([0, 2])
    assert LEGACY_QUESTION_FINDINGS == []
