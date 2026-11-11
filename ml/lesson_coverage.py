"""Inspect actual lesson-bank bindings without treating references as coverage.

This reports selection coverage, not source accuracy or calibrated proficiency.
The same URL/topic resolution is used by the serving engine.
"""
import argparse
import json
from collections import Counter
from pathlib import Path

from ml.assessment_selection import question_in_skill_scope, question_resource_ids, resource_question_indices
from ml.resource_scopes import guide_for_resource, guide_only_question_ids

ROOT = Path(__file__).resolve().parents[1]


def audit_coverage(resources, questions, excluded_ids=(), scopes=None):
    excluded = set(excluded_ids)
    rows = []
    resource_ids = {row["id"] for row in resources}
    for resource in resources:
        guide = guide_for_resource(resource["url"], scopes=scopes)
        banks = []
        for topic in resource["topics"]:
            indices = set() if guide else resource_question_indices(resources, questions, topic, resource["url"])
            eligible = [questions[i] for i in sorted(indices) if questions[i]["id"] not in excluded]
            foundation = [q for q in eligible if q["difficulty"] <= 2]
            intermediate = [q for q in eligible if q["difficulty"] == 3]
            banks.append({"topic": topic, "foundation": len(foundation), "intermediate": len(intermediate),
                          "foundation_ids": [q["id"] for q in foundation],
                          "intermediate_ids": [q["id"] for q in intermediate]})
        foundation_ready = bool(banks) and all(bank["foundation"] > 0 for bank in banks)
        intermediate_ready = bool(banks) and all(bank["intermediate"] > 0 for bank in banks)
        status = ("ungraded_guide" if guide else "both_stages" if foundation_ready and intermediate_ready else
                  "foundation_only" if foundation_ready else "intermediate_only" if intermediate_ready else
                  "partial_topics" if any(bank["foundation"] or bank["intermediate"] for bank in banks) else "missing")
        rows.append({"id": resource["id"], "title": resource["title"], "url": resource["url"],
                     "provider": resource.get("provider", ""), "topics": resource["topics"],
                     "direct_links": sum(resource["id"] in question_resource_ids(q) and q["id"] not in excluded for q in questions),
                     "selection_status": status, "banks": banks,
                     **({"guide_kind": guide["kind"], "guide_reason": guide["reason"]} if guide else {})})
    orphan_links = sorted({key for q in questions for key in question_resource_ids(q) if key not in resource_ids})
    return {"version": 2, "scope": "Exact serving URL/topic links and eligible question counts. Reviewed ungraded guides are separate from teachable resources. References, semantic similarity and a nonempty bank do not establish editorial correctness, sufficient breadth or calibrated readiness.",
            "resource_count": len(rows), "unique_urls": len({r["url"] for r in rows}),
            "question_count": len(questions), "statuses": dict(Counter(row["selection_status"] for row in rows)),
            "without_direct_links": sum(row["direct_links"] == 0 for row in rows),
            "orphan_resource_links": orphan_links, "resources": rows}


def markdown(report):
    def safe(text):
        return str(text).replace("|", "\\|").replace("\n", " ")
    lines = ["# Lesson-specific assessment coverage", "",
             "Generated from the actual serving selection rules. This inventory measures explicit bindings, not source review, assessment validity or job readiness. A concept-reference URL alone never creates a lesson check.", "",
             f"The catalogue contains **{report['resource_count']}** resource rows, **{report['unique_urls']}** unique URLs and **{report['question_count']}** stored question rows. **{report['without_direct_links']}** resource rows lack a direct resource-ID link. Duplicate URLs can share a linked bank within the same topic.", "",
             "| Selection coverage | Resources |", "| --- | ---: |"]
    for key, count in sorted(report["statuses"].items()):
        lines.append(f"| {key} | {count} |")
    lines.extend(["", "## Complete resource inventory", "",
             "Foundation counts levels 1–2; intermediate counts level 3. Multi-topic resources are ready for a stage only when every declared topic has an explicit eligible bank. Ungraded guides have no new completion checks; they are excluded from recommendations of teaching lessons and from lesson-completion progress. Historical answers and scores are preserved. Short banks are reported honestly and never filled with another lesson's questions.", "",
                  "| Resource | Topic: foundation / intermediate | Selection coverage |", "| --- | --- | --- |"])
    for row in report["resources"]:
        counts = "; ".join(f"{bank['topic']}: {bank['foundation']} / {bank['intermediate']}" for bank in row["banks"])
        lines.append(f"| [{safe(row['title'])}]({row['url']}) | {safe(counts)} | {row['selection_status']} |")
    lines.extend(["", "## Release requirements", "",
                  "For uncovered teachable resources, author lesson-specific checks grounded in that resource's actual content, review answer keys and distractors, and record the intended learning objective. Preserve old question IDs and sealed assessments. Recompute actual FP32 embeddings for new question text; a fingerprint-only refresh is not an index update.", "",
                  "Source coverage, source correctness and human calibration are separate gates. Human participant/expert validation remains pending at the owner's request; no generated fixture or reviewer template can satisfy it.", ""])
    return "\n".join(lines)


def main():
    from ml.career_catalogue import CATALOGUE, DIRECTORY, load_learning_content
    from ml.service import load_question_exclusions
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="Require complete teaching coverage and current reports")
    parser.add_argument("--write-catalogue", action="store_true", help="Refresh public skill coverage counts")
    args = parser.parse_args()
    resources, questions = load_learning_content()
    excluded = load_question_exclusions(questions)
    guide_only = guide_only_question_ids(resources, questions)
    report = audit_coverage(resources, questions, excluded)
    required_topics = {skill["topic"] for skill in CATALOGUE["skills"] if skill["topic"]}
    teaching_urls = {topic: set() for topic in required_topics}
    gaps = []
    for resource in report["resources"]:
        if resource["selection_status"] == "ungraded_guide":
            continue
        for bank in resource["banks"]:
            ids = bank["foundation_ids"] + bank["intermediate_ids"]
            if bank["foundation"] >= 3 and bank["intermediate"] >= 3 and all(key.startswith("lesson-") for key in ids):
                teaching_urls[bank["topic"]].add(resource["url"])
            else:
                gaps.append({"resource_id": resource["id"], "topic": bank["topic"]})
    eligible = [question for question in questions if question["id"] not in excluded | guide_only and question["difficulty"] <= 3]
    topic_counts = {}
    for topic in sorted(required_topics):
        rows = [question for question in eligible if topic in question["topics"] and question_in_skill_scope(question, topic)]
        topic_counts[topic] = {"teaching_urls": len(teaching_urls[topic]),
                               "foundation": sum(question["difficulty"] <= 2 for question in rows),
                               "intermediate": sum(question["difficulty"] == 3 for question in rows),
                               "levels": sorted({question["difficulty"] for question in rows})}
    report.update({"reviewed_key_exclusions": len(excluded), "guide_only_legacy_questions": len(guide_only),
                   "authored_lesson_questions": sum(question["id"].startswith("lesson-") for question in questions),
                   "topic_coverage": topic_counts, "unreviewed_teaching_bindings": gaps})
    catalogue = {**CATALOGUE, "skills": []}
    for skill in CATALOGUE["skills"]:
        counts = topic_counts.get(skill["topic"])
        if counts:
            skill = {**skill, "coverage": {**skill["coverage"], "questions": counts["foundation"] + counts["intermediate"],
                                           "resources": counts["teaching_urls"], "levels": counts["levels"]}}
        catalogue["skills"].append(skill)
    json_path = ROOT / "ml/evaluation-lesson-coverage.json"
    doc_path = ROOT / "docs/LESSON_ASSESSMENT_COVERAGE.md"
    if args.check:
        if gaps or report["orphan_resource_links"] or any(row["teaching_urls"] < 3 or row["foundation"] < 10 or row["intermediate"] < 10 for row in topic_counts.values()):
            raise SystemExit("Teaching coverage is incomplete. Each supported topic needs three open reviewed lessons and ten broad questions per stage.")
        if catalogue != CATALOGUE or json.loads(json_path.read_text(encoding="utf8")) != report or doc_path.read_text(encoding="utf8") != markdown(report):
            raise SystemExit("Lesson coverage or public skill counts are stale.")
    else:
        if args.write_catalogue:
            (DIRECTORY / "catalogue.json").write_text(json.dumps(catalogue, indent=2, ensure_ascii=False) + "\n", encoding="utf8")
        json_path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf8")
        doc_path.write_text(markdown(report), encoding="utf8")
    print(json.dumps({"resources": report["resource_count"], "statuses": report["statuses"],
                      "questions": report["question_count"], "authored_lesson_questions": report["authored_lesson_questions"],
                      "reviewed_key_exclusions": len(excluded), "guide_only_legacy_questions": len(guide_only),
                      "topics": len(topic_counts), "unreviewed_teaching_bindings": len(gaps)}, indent=2))


if __name__ == "__main__":
    main()
