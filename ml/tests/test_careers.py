import json
import os
from pathlib import Path

import numpy as np
import pytest

from ml.career_catalogue import CATALOGUE, DIRECTORY, canonical_json_fingerprint, content_fingerprints, guest_catalogue, load_learning_content, topic_for_skill
from ml.service import AnalysisRequest, AssessmentRequest, LearningEngine, RecommendationRequest


@pytest.fixture(scope="module")
def engine():
    previous = os.environ.get("ML_BACKEND")
    os.environ["ML_BACKEND"] = "onnx"
    instance = LearningEngine()
    yield instance
    if previous is None:
        os.environ.pop("ML_BACKEND", None)
    else:
        os.environ["ML_BACKEND"] = previous


def test_pilot_has_substantive_question_and_resource_coverage():
    skills = {skill["key"]: skill for skill in CATALOGUE["skills"]}
    pilot = [role for role in CATALOGUE["roles"] if role["release_status"] == "pilot"]
    assert len(pilot) == 60
    assert {role["family"] for role in pilot} == {family["key"] for family in CATALOGUE["families"]}
    assert len({role["activity"]["title"] for role in pilot}) == len(pilot)
    for role in pilot:
        for requirement in role["requirements"]:
            skill = skills[requirement["skill"]]
            assert skill["coverage"]["questions"] >= 20, (role["name"], skill["name"])
            assert skill["coverage"]["resources"] >= 3
            assert len(skill["coverage"]["levels"]) >= 2


def test_nontechnical_content_never_receives_a_programming_question(engine):
    for topic in ["marketing", "recruiting", "sales", "success", "projects", "accounting", "spreadsheets", "communication", "analysis"]:
        skill = next(item for item in CATALOGUE["skills"] if item["key"] == topic)
        request = AssessmentRequest(skills=[{"id": skill["id"], "name": skill["name"]}], count=10, difficulty=2)
        result = engine.assessment(request)
        assert len(result["questions"]) == 10
        assert all(question["topics"] == [topic] for question in result["questions"])
        assert all(question["skill_id"] == skill["id"] for question in result["questions"])


def test_intermediate_content_is_not_labelled_as_expert(engine):
    skill = next(item for item in CATALOGUE["skills"] if item["key"] == "accounting")
    result = engine.assessment(AssessmentRequest(skills=[{"id": skill["id"], "name": skill["name"]}], count=10, difficulty=5))
    assert result["difficulty"] == 3
    assert result["difficultyLabel"] == "Intermediate"
    assert all(row["difficulty"] == 3 for row in result["questions"])


def test_specialist_and_unknown_skills_are_not_assigned_a_nearby_bank(engine):
    for name in ["Underwater basket weaving", "Clinical surgery", "Spacecraft propulsion engineering"]:
        assert topic_for_skill(name) is None
        result = engine.recommend(RecommendationRequest(skills=[{"id": "specialist", "name": name}]))
        assert result["unsupported_skills"] == [name]
        assert result["recommendations"][0]["resources"] == []


def test_every_pilot_uses_precomputed_public_recommendation_queries():
    previous = os.environ.get("ML_BACKEND")
    os.environ["ML_BACKEND"] = "onnx"
    try:
        instance = LearningEngine()
        skills = {skill["key"]: skill for skill in CATALOGUE["skills"]}
        for role in CATALOGUE["roles"]:
            if role["release_status"] != "pilot":
                continue
            result = instance.recommend(RecommendationRequest(role=role["name"], skills=[{"id": skills[row["skill"]]["id"], "name": skills[row["skill"]]["name"]} for row in role["requirements"]]))
            assert not result["unsupported_skills"]
            for recommendation in result["recommendations"]:
                urls = [resource["url"] for resource in recommendation["resources"]]
                assert len(urls) == len(set(urls))
                assert len(urls) >= 3
            instance.assessment(AssessmentRequest(skills=[{"id": skills[row["skill"]]["id"], "name": skills[row["skill"]]["name"]} for row in role["requirements"]], count=10))
            first = result["recommendations"][0]
            instance.assessment(AssessmentRequest(skills=[{"id": first["skill_id"], "name": first["skill_name"]}], context=first["resources"][0]["title"], count=10))
        assert instance.model.session is None
    finally:
        if previous is None:
            os.environ.pop("ML_BACKEND", None)
        else:
            os.environ["ML_BACKEND"] = previous


def test_original_items_have_valid_keys_sources_and_numerical_examples():
    rows = json.loads((DIRECTORY / "questions.json").read_text(encoding="utf8"))
    assert len(rows) == 1510
    assert len({row["id"] for row in rows}) == len(rows)
    for row in rows:
        assert len(set(row["options"])) == 4
        assert 0 <= row["correct_index"] < 4
        assert row["explanation"] and row["source_url"].startswith("https://")
        assert row["evidence_type"] == "knowledge"
    expected = {"What is the percentage increase from 100 to 120?": "20%", "An ad receives 100 clicks from 5,000 impressions. What is its click-through rate?": "2%", "Equipment costs 10,000, residual value is 1,000 and useful life is 3 years. What is annual straight-line depreciation?": "3,000"}
    for prompt, answer in expected.items():
        row = next(row for row in rows if row["prompt"] == prompt)
        assert row["options"][row["correct_index"]] == answer


def test_second_cohort_has_dedicated_banks_and_correct_numerical_examples(engine):
    from ml.career_question_bank_phase2 import BANK
    assert len(BANK) == 19
    for topic in BANK:
        skill = next(item for item in CATALOGUE["skills"] if item["key"] == topic)
        result = engine.assessment(AssessmentRequest(skills=[{"id": skill["id"], "name": skill["name"]}], count=10, difficulty=2))
        assert len(result["questions"]) == 10, topic
        assert all(question["topics"] == [topic] and question["skill_id"] == skill["id"] for question in result["questions"]), topic
        assert {row[-1] for row in BANK[topic]} == {1, 2}, topic
    expected = {
        "A circle has radius 8 mm. What is its diameter?": "16 mm",
        "A 100 mm feature is plotted at 1:2 scale. What length appears on paper?": "50 mm",
        "Stations can make 10, 6 and 8 units per hour in sequence. Ignoring buffers and downtime, what is the maximum steady output?": "6 units per hour",
        "A sample of 200 units contains 8 defective units. What is the observed defective-unit rate?": "4%",
        "Revenue is 200 and gross profit is 80. What is gross margin?": "40%",
        "Current assets are 150 and current liabilities are 100. What is the current ratio?": "1.5",
        "Opening stock is 100 units, receipts are 30 and dispatches are 20. Ignoring other movements, what is closing stock?": "110 units",
        "Expected lead-time demand is 40 units and safety stock is 15. What is the simple reorder point?": "55 units",
        "Demand is 120 units per day and capacity is 100. What is the daily capacity gap before other changes?": "20 units",
    }
    answers = {row[0]: row[1] for bank in BANK.values() for row in bank}
    assert all(answers[prompt] == answer for prompt, answer in expected.items())


def test_final_cohort_has_dedicated_knowledge_and_stated_calculation_rules(engine):
    from ml.career_question_bank_phase3 import BANK
    assert len(BANK) == 13
    assert len(CATALOGUE["skills"]) == 55
    assert all(skill["topic"] and skill["assessment_mode"] == "objective" for skill in CATALOGUE["skills"])
    for topic, rows in BANK.items():
        skill = next(item for item in CATALOGUE["skills"] if item["key"] == topic)
        result = engine.assessment(AssessmentRequest(skills=[{"id": skill["id"], "name": skill["name"]}], count=10, difficulty=5))
        assert result["difficulty"] == 3
        assert len(result["questions"]) == 10
        assert all(question["topics"] == [topic] and question["skill_id"] == skill["id"] for question in result["questions"]), topic
        assert {row[-1] for row in rows} == {1, 2}
    expected = {
        "An ideal 100-ohm resistor has 5 V across it. What current flows?": "0.05 A",
        "Two ideal 100-ohm resistors are connected in parallel. What is their equivalent resistance?": "50 ohms",
        "Fictional gross pay is 1,000 and stated deductions total 180. With no other adjustments, what is net pay?": "820",
        "Offer A costs 100 plus delivery of 20; offer B costs 115 with delivery included. Assuming otherwise identical terms, which has the lower delivered cost?": "Offer B at 115",
        "An event has a stated registration limit of 120 and 90 confirmed registrations. How many places remain under that limit?": "30",
        "An occupied-room count is 40 out of 50 available rooms. Under this stated definition, what is occupancy?": "80%",
    }
    answers = {row[0]: row[1] for rows in BANK.values() for row in rows}
    assert all(answers[prompt] == answer for prompt, answer in expected.items())


def test_shared_catalogue_keeps_legacy_ids_and_separates_priority_from_target():
    catalogue = guest_catalogue()
    assert [role["name"] for role in catalogue["roles"][:3]] == ["Data Analyst", "Frontend Developer", "AI Applications Developer"]
    assert [skill["name"] for skill in catalogue["skills"][:3]] == ["Python Basics", "SQL Fundamentals", "Data Visualization"]
    assert len(catalogue["roles"]) == 61
    assert all(0 <= row["required_score"] <= 100 for row in catalogue["role_skills"])
    assert any(row["weight"] == 1 and row["required_score"] != 100 for row in catalogue["role_skills"])


def test_index_provenance_and_resource_checks_match_the_current_pack():
    metadata = json.loads((DIRECTORY / "index.json").read_text(encoding="utf8"))
    assert metadata["inputs"] == content_fingerprints()
    resources = json.loads((DIRECTORY / "resources.json").read_text(encoding="utf8"))
    audit = json.loads((DIRECTORY / "resource-check.json").read_text(encoding="utf8"))
    assert {row["id"] for row in audit["results"]} == {row["id"] for row in resources}
    assert all(row["status"] == 200 for row in audit["results"])
    with np.load(DIRECTORY / "vectors.npz", allow_pickle=False) as vectors:
        assert vectors["questions"].shape == (1510, 768)
        assert np.isfinite(vectors["questions"]).all()
        assert vectors["roles"].shape == (60, 768)


def test_index_fingerprint_is_portable_but_detects_content_and_order_changes():
    linux = b'{\n  "name": "Example", "items": [1, 2]\n}\n'
    windows = b'{\r\n  "items": [1, 2], "name": "Example"\r\n}\r\n'
    assert canonical_json_fingerprint(linux) == canonical_json_fingerprint(windows)
    assert canonical_json_fingerprint(linux) != canonical_json_fingerprint(b'{"name":"Changed","items":[1,2]}')
    assert canonical_json_fingerprint(linux) != canonical_json_fingerprint(b'{"name":"Example","items":[2,1]}')


def test_specialist_insights_offer_practical_review_instead_of_nonexistent_quizzes(engine):
    result = engine.analyze(AnalysisRequest(role="Personal goal", skills=[{"id": "unknown", "name": "Underwater basket weaving"}]))
    assert "knowledge check is not available" in result["analysis"]["criticalGaps"][0]["recommendation"]
    assert "Record a private reflection" in result["analysis"]["learningPath"][0]["milestones"]


def test_non_technical_resume_extracts_explicit_claims_and_suggests_related_careers(engine):
    import io
    from docx import Document
    from ml.resume import parse_resume
    document = Document()
    for line in ["Jordan Example", "jordan@example.test", "SUMMARY", "Recruitment associate coordinating candidate communication and structured interviews.", "SKILLS", "Recruitment, Excel, Communication, Business Analysis", "EDUCATION", "Business administration"]:
        document.add_paragraph(line)
    stream = io.BytesIO(); document.save(stream)
    result = parse_resume(stream.getvalue(), "recruitment.docx", engine)
    areas = {row["name"] for row in result["matched_app_skills"]}
    assert {"Recruitment Foundations", "Spreadsheet Analysis", "Workplace Communication"} <= areas
    assert "Python Basics" not in areas
    assert "Recruitment Associate" in [row["name"] for row in result["role_suggestions"]]
    assert all(row["evidence_skills"] for row in result["role_suggestions"])
    assert all(not row["assessed"] for row in result["matched_app_skills"])


def test_all_careers_have_distinct_ordered_applied_curricula():
    capstones = set()
    all_keys = {skill["key"] for skill in CATALOGUE["skills"]}
    for role in CATALOGUE["roles"]:
        curriculum = role["curriculum"]
        assert set(curriculum["skill_sequence"]) == {row["skill"] for row in role["requirements"]}
        known = set()
        for level in ["foundation", "intermediate"]:
            block = curriculum[level]
            assert len(block["milestones"]) == 2
            for step in block["milestones"]:
                assert step["id"] not in known
                assert set(step["prerequisites"]) <= known
                assert set(step["skill_keys"]) <= all_keys
                assert step["deliverable"] and len(step["checks"]) >= 2
                known.add(step["id"])
        capstones.add(curriculum["intermediate"]["milestones"][-1]["deliverable"])
        assert curriculum["foundation"]["assessment"]["difficulty_max"] == 2
        assert curriculum["intermediate"]["assessment"]["difficulty_min"] == 3
    assert len(capstones) == 60


def test_every_skill_has_real_intermediate_questions_and_foundation_isolated(engine):
    from ml.career_intermediate_questions import BANK
    assert len(BANK) == 55
    for skill in CATALOGUE["skills"]:
        for requested, expected in [(1, 1), (2, 2), (3, 3)]:
            result = engine.assessment(AssessmentRequest(skills=[{"id": skill["id"], "name": skill["name"]}], count=10, difficulty=requested))
            assert result["difficulty"] == expected
            assert len(result["questions"]) == 10, (skill["key"], requested)
            assert all(row["topics"] == [skill["key"]] for row in result["questions"])
            assert all(row["difficulty"] == 3 for row in result["questions"]) if requested == 3 else all(row["difficulty"] <= 2 for row in result["questions"])


def test_intermediate_options_avoid_systematic_length_and_position_cues():
    from ml.audit_career_content import audit
    report = audit()
    assert report["intermediate_count"] == 550
    assert set(report["intermediate_per_topic"].values()) == {10}
    assert report["correct_option_unique_longest_rate"] < .4
    assert .8 < report["mean_correct_option_characters"] / report["mean_other_option_characters"] < 1.3
    assert all(100 <= count <= 175 for count in report["correct_positions"].values())


def test_applied_calculations_use_the_stated_boundary_and_adjustment_rules():
    from ml.career_intermediate_questions import BANK
    expected = {
        ("marketing", 1): "5%", ("marketing", 6): "30",
        ("accounting", 5): "100", ("accounting", 8): "150",
        ("financial-analysis", 2): "30%", ("financial-analysis", 3): "Current 1.5; quick 1.0",
        ("payroll", 0): "770", ("payroll", 4): "40",
        ("quality", 2): "4%", ("manufacturing", 0): "6 units per hour",
        ("manufacturing", 2): "2 minutes", ("manufacturing", 3): "92% first-pass; 95% final",
        ("cad", 6): "0.10 mm", ("electronics", 0): "0.0452 A", ("electronics", 3): "3.33 V",
        ("events", 0): "15", ("hospitality", 2): "90%", ("account-management", 7): "1100",
    }
    assert all(BANK[topic][index][1] == answer for (topic, index), answer in expected.items())
