"""Validate the additional open teaching choices without registry/index writes."""
from collections import Counter, defaultdict
from copy import deepcopy
from hashlib import sha256

from ml.lesson_questions import build_questions
from ml.lessons.business import BANKS as ORIGINAL_BANKS, NEW_RESOURCES as ORIGINAL_NEW
from ml.lessons.business_additions import BANKS, NEW_RESOURCES
from ml.tests.test_business_lessons import TOPICS


def test_three_distinct_teaching_urls_for_every_business_skill():
    by_topic = defaultdict(set)
    for bank in [*ORIGINAL_BANKS, *BANKS]:
        for topic in bank["topics"]:
            by_topic[topic].add(bank["url"])
    assert set(by_topic) == TOPICS
    assert all(len(by_topic[topic]) >= 3 for topic in TOPICS)
    assert len(BANKS) == len(NEW_RESOURCES) == 20
    assert len({bank["url"] for bank in BANKS}) == 20
    assert not {bank["url"] for bank in BANKS}.intersection(bank["url"] for bank in ORIGINAL_BANKS)
    assert Counter(row["topics"][0] for row in NEW_RESOURCES) == {
        "accounting": 2, "events": 2, "hr-operations": 2, "marketing": 2,
        "recruiting": 2, "sales": 2, "success": 2, "account-management": 1,
        "analysis": 1, "hospitality": 1, "inventory": 1, "projects": 1, "supply-chain": 1,
    }


def test_original_sources_are_unchanged_and_additions_build_deterministically():
    originals_before = deepcopy((ORIGINAL_BANKS, ORIGINAL_NEW))
    additions_before = deepcopy((BANKS, NEW_RESOURCES))
    first = build_questions(banks=BANKS, additional_resources=[*ORIGINAL_NEW, *NEW_RESOURCES])
    assert first == build_questions(banks=BANKS, additional_resources=[*ORIGINAL_NEW, *NEW_RESOURCES])
    combined = build_questions(banks=[*ORIGINAL_BANKS, *BANKS], additional_resources=[*ORIGINAL_NEW, *NEW_RESOURCES])
    assert len(first) == len({row["id"] for row in first}) == 120
    assert len(combined) == len({row["id"] for row in combined}) == 348
    assert len({row["prompt"] for row in combined}) == 348
    assert originals_before == (ORIGINAL_BANKS, ORIGINAL_NEW)
    assert additions_before == (BANKS, NEW_RESOURCES)
    assert {row["correct_index"] for row in first} == {0, 1, 2, 3}
    for bank in BANKS:
        rows = [row for row in first if row["resource_ids"] == bank["resource_ids"]]
        assert len(rows) == 6
        assert sum(row["difficulty"] in (1, 2) for row in rows) == 3
        assert sum(row["difficulty"] == 3 for row in rows) == 3
        assert len({row["objective_id"] for row in rows}) >= 3
        assert bank["source_sections"] and bank["source_anchor_note"]
        assert all(row["source_reviewed_at"] == "2026-11-10" for row in rows)
        assert all(row["source_url"].split("#", 1)[0] == bank["url"] for row in rows)
        assert all(row["evidence_type"] == "knowledge" for row in rows)
        assert all(len(row["prompt"]) <= 1500 and len(row["explanation"]) <= 1000 for row in rows)
        assert all(len(row["lesson_scope"]) <= 800 for row in rows)
        assert all(len(set(row["options"])) == 4 and all(0 < len(o) <= 300 for o in row["options"]) for row in rows)


def test_correct_choices_do_not_consistently_stand_out_by_length():
    for banks in (ORIGINAL_BANKS, BANKS):
        questions = [question for bank in banks for question in bank["questions"]]
        longest = sum(len(question[4]) > max(map(len, question[5])) for question in questions)
        shortest = sum(len(question[4]) < min(map(len, question[5])) for question in questions)
        assert longest / len(questions) < 0.45
        assert shortest / len(questions) < 0.45


def test_new_resource_metadata_has_stable_ids_and_no_duplicate_url_topic_pairs():
    old_pairs = {(row["url"], tuple(row["topics"])) for row in ORIGINAL_NEW}
    pairs = {(row["url"], tuple(row["topics"])) for row in NEW_RESOURCES}
    assert len(pairs) == 20 and not pairs.intersection(old_pairs)
    by_id = {row["id"]: row for row in NEW_RESOURCES}
    assert len(by_id) == 20
    required = {"id", "title", "url", "provider", "description", "text", "topics", "type",
                "difficulty", "estimated_hours", "source", "license"}
    for bank in BANKS:
        assert len(bank["resource_ids"]) == 1
        row = by_id[bank["resource_ids"][0]]
        assert set(row) == required
        assert row["url"] == bank["url"] and row["topics"] == bank["topics"]
        assert row["id"] == "lesson-resource-" + sha256((row["url"] + "|" + row["topics"][0]).encode()).hexdigest()[:20]
        assert row["url"].startswith("https://")
        assert "academy.hubspot.com" not in row["url"] and "onetonline.org" not in row["url"]
        assert row["type"] == "tutorial" and row["difficulty"] == "beginner"
        assert row["estimated_hours"] is None and row["text"] == row["description"] == bank["scope"]
        assert row["license"] == "Original metadata; linked material retains publisher license"


def test_additional_fictional_arithmetic_and_accounting_directions():
    def answer(page_suffix, code):
        bank = next(bank for bank in BANKS if bank["url"].endswith(page_suffix))
        return next(q[4] for q in bank["questions"] if q[0] == code)

    assert answer("4-2-discuss-the-adjustment-process-and-illustrate-common-types-of-adjusting-entries", "supplies") == f"{270 - 90} units"
    assert answer("4-5-prepare-financial-statements-using-the-adjusted-trial-balance", "net-income") == f"{920 - 610} units"
    assert answer("4-5-prepare-financial-statements-using-the-adjusted-trial-balance", "retained-math") == f"{240 + 85 - 30} units"
    assert answer("takt-time/", "calculate") == f"{420 // 140} minutes per unit"
    assert answer("takt-time/", "higher-demand") == f"It falls from {360 // 120} to {360 // 180} minutes per unit"
    assert answer("4-2-discuss-the-adjustment-process-and-illustrate-common-types-of-adjusting-entries", "earned-advance") == "Decrease unearned fees and increase revenue by 200"
    assert answer("4-2-discuss-the-adjustment-process-and-illustrate-common-types-of-adjusting-entries", "unpaid-wages") == "Wage expense and wages payable of 140"
