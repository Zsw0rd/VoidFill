"""Offline checks for the reviewed business-source inventory and original cases."""
from collections import Counter
from copy import deepcopy
from decimal import Decimal
from hashlib import sha256
import json
from pathlib import Path
import re

from ml.lesson_questions import build_questions
from ml.lessons.business import BANKS, NEW_RESOURCES, ORIENTATIONS


TOPICS = {
    "spreadsheets", "communication", "analysis", "success", "projects", "accounting",
    "marketing", "recruiting", "sales", "financial-analysis", "hr-operations",
    "learning-design", "inventory", "supply-chain", "payroll", "audit", "procurement",
    "account-management", "events", "hospitality",
}
ROOT = Path(__file__).resolve().parents[2]


def _catalogue():
    return {row["id"]: row for name in ("resources.json", "careers/resources.json")
            for row in json.loads((ROOT / "ml/data" / name).read_text(encoding="utf8"))}


def _questions():
    return build_questions(banks=BANKS, additional_resources=NEW_RESOURCES)


def test_all_sixty_assigned_original_resources_are_accounted_once():
    original = {key: row for key, row in _catalogue().items()
                if key.startswith("career-resource-") and TOPICS.intersection(row["topics"])}
    assert len(original) == 60
    counts = Counter(key for bank in [*BANKS, *ORIENTATIONS] for key in bank["resource_ids"]
                     if key in original)
    assert set(counts) == set(original)
    assert set(counts.values()) == {1}
    assert len({key for b in BANKS for key in b["resource_ids"] if key in original}) == 36
    assert len({key for b in ORIENTATIONS for key in b["resource_ids"]}) == 24
    for bank in [*BANKS, *ORIENTATIONS]:
        for key in bank["resource_ids"]:
            if key in original:
                assert bank["url"] == original[key]["url"]
                assert set(bank["topics"]).intersection(original[key]["topics"])


def test_all_twenty_topics_have_both_stages_and_multiple_concepts():
    before = deepcopy(BANKS)
    first = _questions()
    assert first == _questions()
    assert BANKS == before
    assert len(first) == len({row["id"] for row in first}) == 228
    assert len({row["prompt"] for row in first}) == 228
    assert {row["correct_index"] for row in first} == {0, 1, 2, 3}
    assert {topic for bank in BANKS for topic in bank["topics"]} == TOPICS
    for bank in BANKS:
        questions = [row for row in first if row["resource_ids"] == bank["resource_ids"]]
        assert len(questions) == 6
        assert sum(row["difficulty"] in (1, 2) for row in questions) == 3
        assert sum(row["difficulty"] == 3 for row in questions) == 3
        assert len({row["objective_id"] for row in questions}) >= 3
        assert bank["source_sections"] and bank["source_anchor_note"]
        assert bank["reviewed_at"] == "2026-11-10"
        for row in questions:
            assert row["source_url"].split("#", 1)[0] == bank["url"]
            assert row["source_reviewed_at"] == "2026-11-10"
            assert row["evidence_type"] == "knowledge"
            assert len(row["prompt"]) <= 1500
            assert len(row["explanation"]) <= 1000
            assert len(row["lesson_scope"]) <= 800
            assert len(set(row["options"])) == 4
            assert all(0 < len(option) <= 300 for option in row["options"])
    for topic in TOPICS:
        rows = [row for row in first if topic in row["topics"]]
        assert sum(row["difficulty"] <= 2 for row in rows) >= 3
        assert sum(row["difficulty"] == 3 for row in rows) >= 3


def test_guides_are_explicit_findings_and_point_only_to_actual_teaching():
    catalogue = {**_catalogue(), **{row["id"]: row for row in NEW_RESOURCES}}
    taught = {key for bank in BANKS for key in bank["resource_ids"]}
    for guide in ORIENTATIONS:
        assert guide["kind"] in {"orientation", "career-context", "reference-directory", "setup-guide"}
        assert guide["reviewed_at"] == "2026-11-10"
        assert len(guide["reason"]) >= 100
        assert set(guide["child_resource_ids"]) <= taught
        assert not set(guide["resource_ids"]).intersection(taught)
        assert len(guide["child_resource_ids"]) == len(set(guide["child_resource_ids"]))
        for child in guide["child_resource_ids"]:
            assert child in catalogue
            assert set(catalogue[child]["topics"]).intersection(guide["topics"])
    assert len([guide for guide in ORIENTATIONS if guide["kind"] == "career-context"]) == 7
    # Public course marketing and occupational tasks must not quietly become
    # evidence that the learner can perform the methods they describe.
    assert not any("academy.hubspot.com" in b["url"] or "onetonline.org" in b["url"] for b in BANKS)
    assert any("log in or become a member" in guide["reason"] for guide in ORIENTATIONS)


def test_added_resources_are_stable_complete_and_actually_have_checks():
    assert len(NEW_RESOURCES) == 4
    assert len({row["id"] for row in NEW_RESOURCES}) == 4
    required = {"id", "title", "url", "provider", "description", "text", "topics",
                "type", "difficulty", "estimated_hours", "source", "license"}
    taught = {key for bank in BANKS for key in bank["resource_ids"]}
    for row in NEW_RESOURCES:
        assert set(row) == required
        assert len(row["topics"]) == 1
        assert row["id"] == "lesson-resource-" + sha256((row["url"] + "|" + row["topics"][0]).encode()).hexdigest()[:20]
        assert row["id"] in taught
        assert row["url"].startswith("https://")
        assert row["type"] == "tutorial" and row["difficulty"] == "beginner"
        assert row["estimated_hours"] is None
        assert row["text"] == row["description"] and row["source"]
        assert row["license"] == "Original metadata; linked material retains publisher license"


def test_fictional_financial_and_flow_arithmetic_matches_correct_choices():
    def answer(path, code):
        bank = next(bank for bank in BANKS if bank["url"].split("/pages/")[-1] == path or bank["url"].endswith(path))
        return next(question[4] for question in bank["questions"] if question[0] == code)

    assert answer("2-2-define-explain-and-provide-examples-of-current-and-noncurrent-assets-current-and-noncurrent-liabilities-equity-revenues-and-expenses", "equity") == f"{86 - 31} units"
    assert answer("a-financial-statement-analysis", "growth") == f"{(200 - 160) / 160:.0%}"
    assert answer("a-financial-statement-analysis", "decline") == f"{(72 - 90) / 90:.0%}".replace("-", "−")
    assert answer("5-7-common-size-statements", "margin") == f"{42 / 140:.0%}"
    assert answer("5-7-common-size-statements", "inventory-share") == f"{36 / 240:.0%}"
    assert answer("6-2-operating-efficiency-ratios", "ar-math") == f"{144 / ((18 + 30) / 2):g} times"
    assert answer("6-2-operating-efficiency-ratios", "stock-math") == f"{100 / ((16 + 24) / 2):g} times"
    assert answer("12-5-record-transactions-incurred-in-preparing-payroll", "hours") == f"{24 * 15} units"
    assert answer("12-5-record-transactions-incurred-in-preparing-payroll", "deduct") == f"{740 - 95} units"
    assert answer("12-1-identify-and-describe-current-liabilities", "advance") == f"{300 - 100} units"
    assert answer("value-stream-mapping/", "pitch") == f"{24 * 15 // 60} minutes"
    functions = next(b for b in BANKS if "/table/25273" in b["url"])
    round_answer = next(q[4] for q in functions["questions"] if q[0] == "round")
    assert round_answer == "ROUND(18.746,2)"
    assert Decimal("18.746").quantize(Decimal("0.01")) == Decimal("18.75")


def test_sensitive_and_ambiguous_source_subtopics_remain_out_of_quizzes():
    # The payroll source contains historical US rates/allowances, and the service
    # chapter makes broad NPS threshold claims. Neither is reproduced as a rule.
    relevant = [bank for bank in BANKS if set(bank["topics"]).intersection({"payroll", "success"})]
    authored = " ".join(str(q[3:7]) for bank in relevant for q in bank["questions"]).lower()
    for historical_rule in ("6.2%", "1.45%", "7.65%", "127,200", "w-4", "fica", "world class", "nps"):
        assert not re.search(r"(?<!\w)" + re.escape(historical_rule) + r"(?!\w)", authored)
    payroll = next(bank for bank in BANKS if bank["url"].endswith("12-5-record-transactions-incurred-in-preparing-payroll"))
    assert "fictional" in payroll["scope"].lower()
    listening = next(bank for bank in BANKS if "skillsbuilder.org" in bank["url"])
    assert "Eye contact is optional" in listening["scope"]
    assert not any("60–70%" in str(q) or "60-70%" in str(q) for q in listening["questions"])
