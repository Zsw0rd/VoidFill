"""Build original explicitly bound lesson checks from reviewed source modules."""
import argparse
import hashlib
import json
import random
from pathlib import Path

from ml.lessons.python_algorithms import BANKS as PYTHON_ALGORITHMS
from ml.lessons.web_git import BANKS as WEB_GIT, ORIENTATIONS as WEB_GUIDES
from ml.lessons.business import BANKS as BUSINESS, ORIENTATIONS as BUSINESS_GUIDES, NEW_RESOURCES as BUSINESS_RESOURCES
from ml.lessons.business_additions import BANKS as BUSINESS_ADDITIONS, NEW_RESOURCES as BUSINESS_ADDED_RESOURCES
from ml.lessons.core_programming import BANKS as CORE_PROGRAMMING, ORIENTATIONS as CORE_GUIDES, SOURCE_FINDINGS as CORE_FINDINGS
from ml.lessons.machine_learning import BANKS as ML_BANKS, ORIENTATIONS as ML_GUIDES, SOURCE_FINDINGS as ML_FINDINGS, LEGACY_QUESTION_FINDINGS as ML_LEGACY
from ml.lessons.technical_professional import BANKS as TECHNICAL_BANKS, ORIENTATIONS as TECHNICAL_GUIDES, NEW_RESOURCES as TECHNICAL_RESOURCES, SOURCE_FINDINGS as TECHNICAL_FINDINGS, LEGACY_QUESTION_FINDINGS as TECHNICAL_LEGACY
from ml.lessons.data_science_visualization import BANKS as DATA_BANKS, ORIENTATIONS as DATA_GUIDES, SOURCE_FINDINGS as DATA_FINDINGS, LEGACY_QUESTION_FINDINGS as DATA_LEGACY
from ml.lesson_validation import validate_lesson_questions, validate_lesson_resources, validate_resource_scopes, validate_source_warnings

ROOT = Path(__file__).resolve().parents[1]
EDITION = "2026.11-lesson-checks-1"
BANKS = [*PYTHON_ALGORITHMS, *WEB_GIT, *BUSINESS, *BUSINESS_ADDITIONS, *CORE_PROGRAMMING, *ML_BANKS, *TECHNICAL_BANKS, *DATA_BANKS]
ADDITIONAL_RESOURCES = [*BUSINESS_RESOURCES, *BUSINESS_ADDED_RESOURCES, *TECHNICAL_RESOURCES]
ORIENTATIONS = [*WEB_GUIDES, *BUSINESS_GUIDES, *CORE_GUIDES, *ML_GUIDES, *TECHNICAL_GUIDES, *DATA_GUIDES]
SOURCE_FINDINGS = [*CORE_FINDINGS, *ML_FINDINGS, *TECHNICAL_FINDINGS, *DATA_FINDINGS]
LEGACY_FINDINGS = [*ML_LEGACY, *TECHNICAL_LEGACY, *DATA_LEGACY]


def source_rows(kind):
    return [row for path in (f"ml/data/{kind}.json", f"ml/data/careers/{kind}.json")
            for row in json.loads((ROOT / path).read_text(encoding="utf8"))]


def build_warnings(findings=SOURCE_FINDINGS):
    return [{"resource_ids": row.get("resource_ids") or [row["resource_id"]],
             "url": row["url"], "reviewed_at": row["reviewed_at"],
             "section": row["section"].lstrip("#").replace("-", " ") if row["section"].startswith("#") else row["section"],
             "detail": row.get("warning") or row["detail"],
             "support_urls": row.get("support_urls", row.get("correct_primary_urls", []))}
            for row in findings]


def build_exclusions(findings=LEGACY_FINDINGS):
    original = {row["id"]: row for row in source_rows("questions")}
    prior = json.loads((ROOT / "ml/data/question-quality.json").read_text(encoding="utf8"))
    seen = {row["id"] for row in prior["excluded"]}
    rows = []
    for finding in findings:
        key = finding["question_id"]
        question = original[key]
        assert key not in seen and finding["suggested_action"] == "quarantine"
        assert question["prompt"] == finding["prompt"]
        assert question["resource_id"] == finding["resource_id"]
        assert question["options"][question["correct_index"]] == finding["current_keyed_answer"]
        seen.add(key)
        rows.append({"id": key, "prompt": finding["prompt"], "keyed_answer": finding["current_keyed_answer"],
                     "reason_code": "reviewed_lesson_source_issue", "reason": finding["reason"],
                     "reference_urls": finding["primary_references"]})
    return rows


def build_scopes(guides=ORIENTATIONS):
    """Public display/selection metadata only; never include answer keys."""
    resources = source_rows("resources") + ADDITIONAL_RESOURCES
    by_id = {row["id"]: row for row in resources}
    guide_urls = {row["url"] for row in guides}
    rows = []
    for guide in guides:
        rows.append({key: guide[key] for key in ("resource_ids", "url", "topics", "reviewed_at", "reason", "child_resource_ids")} |
                    {"kind": guide.get("kind", "orientation"), "assessment": "ungraded",
                     "related_lessons": [{key: by_id[rid][key] for key in ("id", "title", "url")}
                                         for rid in guide["child_resource_ids"] if by_id[rid]["url"] not in guide_urls]})
    return rows


def build_questions(banks=BANKS, additional_resources=ADDITIONAL_RESOURCES):
    resources = source_rows("resources")
    by_id = {row["id"]: row for row in [*resources, *additional_resources]}
    result, seen = [], set()
    for bank in banks:
        assert bank["scope"].strip() and bank["reviewed_at"]
        assert bank["resource_ids"] and len(set(bank["resource_ids"])) == len(bank["resource_ids"])
        for resource_id in bank["resource_ids"]:
            resource = by_id[resource_id]
            assert resource["url"] == bank["url"]
            assert set(resource["topics"]) & set(bank["topics"])
        assert set(bank["topics"]) <= {topic for rid in bank["resource_ids"] for topic in by_id[rid]["topics"]}
        for code, objective, difficulty, prompt, answer, wrong, explanation, section in bank["questions"]:
            key = bank["url"] + "#" + code
            question_id = "lesson-" + hashlib.sha256(key.encode("utf8")).hexdigest()[:20]
            assert question_id not in seen
            seen.add(question_id)
            assert difficulty in (1, 2, 3) and prompt.strip() and explanation.strip()
            options = [answer, *wrong]
            assert len(options) == 4 and len(set(options)) == 4 and all(option.strip() for option in options)
            random.Random(question_id).shuffle(options)
            result.append({"id": question_id, "prompt": prompt, "options": options,
                           "correct_index": options.index(answer), "explanation": explanation,
                           "difficulty": difficulty, "topics": bank["topics"],
                           "resource_id": bank["resource_ids"][0], "resource_ids": bank["resource_ids"],
                           "source": "VoidFill original lesson check; " + EDITION,
                           "source_url": bank["url"] + section, "source_reviewed_at": bank["reviewed_at"],
                           "objective_id": "lesson-" + objective, "group": EDITION,
                           "evidence_type": "knowledge", "lesson_scope": bank["scope"]})
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="Check compiled manifests without rewriting files")
    args = parser.parse_args()
    from ml.career_catalogue import TOPICS
    directory = ROOT / "ml/data/lessons"
    original = source_rows("resources")
    resources = original + ADDITIONAL_RESOURCES
    rows, scopes, warnings, exclusions = build_questions(), build_scopes(), build_warnings(), build_exclusions()
    validate_lesson_resources(ADDITIONAL_RESOURCES, original, TOPICS)
    validate_lesson_questions(rows, resources, [row["id"] for row in source_rows("questions")])
    validate_resource_scopes(scopes, resources, rows)
    validate_source_warnings(warnings, resources)
    artifacts = {"questions": rows, "resources": ADDITIONAL_RESOURCES, "resource-scopes": scopes,
                 "resource-warnings": warnings, "question-exclusions": exclusions,
                 "resource-display-index": {"guide_urls": sorted({row["url"] for row in scopes}),
                                            "correction_urls": sorted({row["url"] for row in warnings})}}
    for name, payload in artifacts.items():
        path = directory / (name + ".json")
        if args.check:
            if not path.exists() or json.loads(path.read_text(encoding="utf8")) != payload:
                raise SystemExit(f"Lesson manifest is stale: {name}.json")
        else:
            directory.mkdir(exist_ok=True)
            path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf8")
    print(f"{len(rows)} authored checks across {len(BANKS)} teaching banks, {len(scopes)} guides, {len(warnings)} source corrections, {len(exclusions)} additional retired keys.")


if __name__ == "__main__":
    main()
