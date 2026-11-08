"""Reproducible all-career structure, review freshness and arithmetic audit.

No model calls, learner records, network requests or claimed expert certification.
Live link reachability is captured separately by check-career-resources.py.
"""
from collections import Counter
from datetime import datetime, timezone
from decimal import Decimal as D
import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def load(path):
    return json.loads(path.read_text(encoding="utf8"))


def fingerprint(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(",", ":")).encode("utf8")).hexdigest()


def answer_cues(rows):
    eligible = [row for row in rows if row.get("options") and isinstance(row.get("correct_index"), int) and 0 <= row["correct_index"] < len(row["options"])]
    longest = sum(len(row["options"][row["correct_index"]]) > max(len(value) for i, value in enumerate(row["options"]) if i != row["correct_index"]) for row in eligible)
    return {"count": len(eligible), "unique_longest_correct": longest, "unique_longest_correct_rate": longest / len(eligible) if eligible else None, "correct_positions": dict(sorted(Counter(row["correct_index"] for row in eligible).items()))}


def arithmetic(questions):
    """Independent recomputation using each identified exercise's stated rules."""
    cases = [
        ("66191c0db9bf3a519a19", f"100 and {100-8}", "COUNT rows versus non-NULL amounts"),
        ("649b69b2190d83c44842", f"{3-2} percentage point; {(3-2)/2:.0%} relative", "rate difference and relative change"),
        ("86fbc255b86cbcc2c946", f"{(D('10.20')-D('.05'))-(D('10.00')+D('.05')):.2f} mm", "minimum hole minus maximum shaft"),
        ("dac5c3bb2573bda42f4d", f"{min(12,8,10)*75//100} units per hour", "serial bottleneck times final good fraction"),
        ("35d65833341963027189", f"{(480-60)//210} minutes", "available shift minutes per required good unit"),
        ("5baabc82e3690ee460fa", f"{(100-8)/100:.0%} first-pass; {(100-8+3)/100:.0%} final", "first-pass and final yield definitions"),
        ("f6cd2a6ff19fc2d7d1af", f"{6/150:.0%}", "defective units, not defect instances"),
        ("a4bedff5c55fcc12d83d", f"{D('9.5')/(D(200)*D('1.05')):.4f} A", "minimum voltage divided by maximum resistance"),
        ("104e9325847c65b5cb5c", f"Each dissipates {10**2//100} W, above its rating", "power per parallel resistor"),
        ("5613987b65607f816b0c", f"{D(10)*(D(1000)/2)/(D(1000)+D(1000)/2):.2f} V", "loaded voltage-divider branch"),
        ("5cba4ed438126ce34291", f"{12/240:.0%}", "purchases in the matched click cohort"),
        ("f637812b5cfa49c9e3bb", str(600//(30-10)), "cost per valid qualified enquiry"),
        ("b599c73d852c6fbb03db", str(int(10*100*D('.2'))), "explicit illustrative weighted pipeline value"),
        ("1807e8eef3f14ac8d2da", f"Equipment +{1200+300}; cash -1200; payable +300", "asset equals cash paid plus new payable"),
        ("1a5260e3c597a4a87bc3", str(1200//12*2-1200//12), "additional adjustment after one month already expensed"),
        ("c9952d6bc21ccf995c80", str((1000-100)//3*6//12), "six-month straight-line depreciation under exercise assumptions"),
        ("4cd29e30e3ba04693116", f"{((500-50)-315)/(500-50):.0%}", "gross margin on net revenue"),
        ("d34e3b00d119142d15d8", f"Current {240/160:.1f}; quick {(240-80)/160:.1f}", "stated current and quick asset boundaries"),
        ("049fc73f2125a9f91c17", f"{60+20} units", "lead-time demand plus safety stock"),
        ("d593a63c1e545431ca20", f"{80+35-40-5} units", "authorized inventory movement equation"),
        ("eb513e74a113332b796e", f"{150-120} units", "same-time-basis demand less capacity"),
        ("a414429a831f4709169b", str(40*20+4*30-150), "fictional regular plus overtime pay less stated deductions"),
        ("0ecc950eee51f7caca51", str((37-35)*20), "incremental approved gross-pay correction"),
        ("7d74fdeebd5e68d45bbb", f"Offer B at {min(100+25,120)}", "equal-boundary delivered offer cost"),
        ("01825cac3a7643852f60", str(200-160-25), "all persons counted against the stated venue limit"),
        ("8a0676bf1f9eed469b58", f"{45/(60-10):.0%}", "occupied rooms divided by available rooms"),
        ("d72555c556d2e9975cdb", str(1000+200-100), "renewal plus expansion less agreed reduction"),
    ]
    by_id = {row["id"]: row for row in questions}
    results = []
    for suffix, expected, rule in cases:
        row = by_id.get("career-" + suffix)
        actual = row["options"][row["correct_index"]] if row else None
        results.append({"question_id": "career-"+suffix, "rule": rule, "expected": expected, "actual": actual, "passed": actual == expected})
    return results


def audit():
    catalogue = load(ROOT / "data/careers/catalogue.json")
    extension = load(ROOT / "data/careers/questions.json")
    questions = load(ROOT / "data/questions.json") + extension
    quality = load(ROOT / "data/question-quality.json")
    excluded_ids = {row["id"] for row in quality["excluded"]}
    eligible_questions = [row for row in questions if row["id"] not in excluded_ids]
    resources = load(ROOT / "data/resources.json") + load(ROOT / "data/careers/resources.json")
    notes = load(ROOT / "career-quality-review-v1.json")
    links = load(ROOT / "evaluation-career-resources.json")
    skills = {row["key"]: row for row in catalogue["skills"]}
    errors = []
    if len({row["id"] for row in questions}) != len(questions):
        errors.append("Duplicate question IDs")
    for row in questions:
        options = row.get("options", [])
        if len(options) < 2 or len(set(options)) != len(options) or not isinstance(row.get("correct_index"), int) or not 0 <= row["correct_index"] < len(options) or not row.get("explanation"):
            errors.append("Invalid question contract: " + str(row.get("id")))
    by_topic = {key: [row for row in eligible_questions if key in row["topics"]] for key in skills}
    resources_by_topic = {key: [row for row in resources if key in row["topics"]] for key in skills}
    reviewed_roles = {row["id"]: row for row in notes["roles"]}
    reviewed_samples = {row["topic"]: row for row in notes["question_samples"]}
    roles = []
    for role in catalogue["roles"]:
        curriculum = role["curriculum"]
        keys = {row["skill"] for row in role["requirements"]}
        problems = []
        if keys != set(curriculum["skill_sequence"]) or not keys <= skills.keys():
            problems.append("Skill sequence differs from required skills")
        known = set()
        for level in ["foundation", "intermediate"]:
            for step in curriculum[level]["milestones"]:
                if step["id"] in known or not set(step["prerequisites"]) <= known or not set(step["skill_keys"]) <= keys or not step["deliverable"] or len(step["checks"]) < 2:
                    problems.append("Invalid milestone contract: "+step["id"])
                known.add(step["id"])
        if len(known) != 4:
            problems.append("Expected four ordered milestones")
        for key in keys:
            if len([q for q in by_topic[key] if q["difficulty"] <= 2]) < 10 or len([q for q in by_topic[key] if q["difficulty"] == 3]) < 10 or len({r["url"] for r in resources_by_topic[key]}) < 3:
                problems.append("Missing level or resource coverage: "+key)
        reviewed = reviewed_roles.get(role["id"], {}).get("reviewed_sha256") == fingerprint({"curriculum": curriculum, "activity": role["activity"]})
        if not reviewed:
            problems.append("Case/rubric review missing or stale")
        roles.append({"id": role["id"], "name": role["name"], "family": role["family"], "skill_count": len(keys), "foundation_question_count": len({q["id"] for key in keys for q in by_topic[key] if q["difficulty"] <= 2}), "intermediate_question_count": len({q["id"] for key in keys for q in by_topic[key] if q["difficulty"] == 3}), "unique_resource_count": len({r["url"] for key in keys for r in resources_by_topic[key]}), "milestone_count": len(known), "case_rubric_review_current": reviewed, "problems": problems})
        errors.extend(role["name"]+": "+problem for problem in problems)
    samples = []
    for key, rows in by_topic.items():
        sample = reviewed_samples.get(key)
        row = next((q for q in rows if sample and q["id"] == sample["question_id"]), None)
        current = bool(row and sample["reviewed_sha256"] == fingerprint(row))
        samples.append({"topic": key, "question_id": sample["question_id"] if sample else None, "review_current": current})
        if not current:
            errors.append("Selected explanation review missing or stale: "+key)
    calculations = arithmetic(extension)
    errors.extend("Arithmetic mismatch: "+row["question_id"] for row in calculations if not row["passed"])
    current_links = {row["id"]: row for row in links["results"]}
    if set(current_links) != {row["id"] for row in resources} or any(current_links.get(row["id"], {}).get("url") != row["url"] for row in resources):
        errors.append("Full resource-link report is stale")
    cases = [role["curriculum"]["case"] for role in catalogue["roles"]]
    capstones = [role["curriculum"]["intermediate"]["milestones"][-1]["deliverable"] for role in catalogue["roles"]]
    if len(set(cases)) != 60 or len(set(capstones)) != 60:
        errors.append("Career cases or intermediate capstones are not distinct")
    return {
        "catalogue_version": catalogue["version"], "generated_at": datetime.now(timezone.utc).isoformat(),
        "scope": "All60 case/rubric consistency review plus all2121 question contracts and arithmetic/surface-cue diagnostics. First intermediate explanation in each55 skill bank was agent-reviewed against stated assumptions and primary-source context. This is not independent subject-matter-expert review, calibrated educational effectiveness, hiring readiness or a certification.",
        "career_count": len(roles), "skill_count": len(skills), "stored_question_count": len(questions), "served_question_count": len(eligible_questions), "excluded_question_count": len(excluded_ids), "question_quality_registry": quality["version"], "served_resource_count": len(resources),
        "question_contract_errors": len([error for error in errors if error.startswith("Invalid question")]),
        "selected_explanation_reviews": samples, "arithmetic": calculations,
        "links": {"checked_at": links["checked_at"], "http200": sum(row.get("status") == 200 for row in links["results"]), "total": len(links["results"]), "not_verified": [{"id": row["id"], "url": row["url"], "status": row.get("status"), "error": row.get("error")} for row in links["results"] if row.get("status") != 200]},
        "answer_cues": {"extension_foundation": answer_cues([q for q in extension if q["difficulty"] <= 2]), "extension_intermediate": answer_cues([q for q in extension if q["difficulty"] == 3]), "inherited_base": answer_cues(load(ROOT / "data/questions.json"))},
        "roles": roles, "errors": errors,
        "remaining_limits": ["Agent review is not independent professional or pedagogical validation.", "Foundation answer-length cues remain a known authoring limitation; original foundation items were not silently rewritten.", "Role mappings and difficulty labels need real learner and specialist evidence before being used for consequential decisions.", "Reachable resource pages can still require external accounts or contain paid/member-only activities; HTTP200 does not establish learning access or relevance of every exercise.", "The adversarial matching set is now observed regression evidence. New untouched probes are required for future independent software-validation claims."],
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="Verify contracts and review freshness without writing report files")
    args = parser.parse_args()
    report = audit()
    if not args.check:
        (ROOT / "evaluation-career-quality.json").write_text(json.dumps(report, indent=2)+"\n", encoding="utf8")
    print(json.dumps({"careers": report["career_count"], "skills": report["skill_count"], "questions": report["served_question_count"], "resources": report["links"], "arithmetic_passed": sum(row["passed"] for row in report["arithmetic"]), "arithmetic_total": len(report["arithmetic"]), "errors": report["errors"]}, indent=2))
    if report["errors"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
