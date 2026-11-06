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
    assert len(pilot) == 12
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


def test_foundation_content_is_not_labelled_as_expert(engine):
    skill = next(item for item in CATALOGUE["skills"] if item["key"] == "accounting")
    result = engine.assessment(AssessmentRequest(skills=[{"id": skill["id"], "name": skill["name"]}], count=10, difficulty=5))
    assert result["difficulty"] == 2
    assert result["difficultyLabel"] == "Moderate"


def test_specialist_and_unknown_skills_are_not_assigned_a_nearby_bank(engine):
    for name in ["UX Research & Interaction Design", "Containerization & CI/CD", "Underwater basket weaving", "Payroll Operations"]:
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
    assert len(rows) == 320
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
        assert vectors["questions"].shape == (320, 768)
        assert np.isfinite(vectors["questions"]).all()
        assert vectors["roles"].shape == (60, 768)


def test_index_fingerprint_is_portable_but_detects_content_and_order_changes():
    linux = b'{\n  "name": "Example", "items": [1, 2]\n}\n'
    windows = b'{\r\n  "items": [1, 2], "name": "Example"\r\n}\r\n'
    assert canonical_json_fingerprint(linux) == canonical_json_fingerprint(windows)
    assert canonical_json_fingerprint(linux) != canonical_json_fingerprint(b'{"name":"Changed","items":[1,2]}')
    assert canonical_json_fingerprint(linux) != canonical_json_fingerprint(b'{"name":"Example","items":[2,1]}')


def test_specialist_insights_offer_practical_review_instead_of_nonexistent_quizzes(engine):
    result = engine.analyze(AnalysisRequest(role="UX designer", skills=[{"id": "ux", "name": "UX Research & Interaction Design"}]))
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
