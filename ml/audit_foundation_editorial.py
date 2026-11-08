"""Source-bound diagnostics of the explicit foundation editorial edition."""
from collections import Counter
import argparse
import hashlib
import json
from pathlib import Path

from ml.career_question_bank import BANK
from ml.career_question_bank_phase2 import BANK as BANK2
from ml.career_question_bank_phase3 import BANK as BANK3
from ml.career_foundation_editorial import EDITION, SOURCE_SHA256, revise_banks

ROOT = Path(__file__).resolve().parent

def digest(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode()).hexdigest()

def cues(rows):
    return {
        "count": len(rows),
        "unique_longest_correct": sum(len(row[0]) > max(map(len, row[1:])) for row in rows),
        "unique_shortest_correct": sum(len(row[0]) < min(map(len, row[1:])) for row in rows),
        "strictly_shorter_distractor_counts": {str(key): count for key, count in sorted(Counter(sum(len(other) < len(row[0]) for other in row[1:]) for row in rows).items())},
    }

def audit():
    original = {**BANK, **BANK2, **BANK3}
    revised = revise_banks(original)
    shipped = json.loads((ROOT / "data/careers/questions.json").read_text(encoding="utf8"))
    by_id = {row["id"]: row for row in shipped}
    before, after, records, errors = [], [], [], []
    for topic, rows in original.items():
        for index, (old, new) in enumerate(zip(rows, revised[topic])):
            identity = "career-" + hashlib.sha256((topic + ":" + old[0]).encode()).hexdigest()[:20]
            actual = by_id.get(identity)
            expected = [new[1], *new[2].split("|")]
            if not actual or actual["prompt"] != old[0] or actual["difficulty"] != old[4] or set(actual["options"]) != set(expected) or actual["options"][actual["correct_index"]] != new[1] or actual["explanation"] != old[3]:
                errors.append("Editorial source/output mismatch: " + identity)
            before.append([old[1], *old[2].split("|")])
            after.append(expected)
            records.append({"question_id": identity, "topic": topic, "objective_id": f"{topic}-{index+1:02d}", "original_contract_sha256": digest(old), "editorial_contract_sha256": digest(new), "shipped_question_sha256": digest(actual), "key_form": "retained" if new[1] == old[1] else "concise"})
    old, new = cues(before), cues(after)
    if set(original) != set(revised) or len(records) != 960:
        errors.append("Editorial coverage is not the complete 960-item foundation extension")
    if new["unique_longest_correct"] / new["count"] >= .45 or new["unique_shortest_correct"] / new["count"] >= .45:
        errors.append("A strong answer-length tail cue has returned")
    return {
        "edition": EDITION, "source_sha256": SOURCE_SHA256,
        "review_scope": "All960 explicit option sets were agent-authored against each existing prompt/key/explanation. Same item IDs, prompts, levels and explanations; historical source tuples remain in the original banks. Neither independent subject-specialist approval nor calibrated distractor effectiveness is claimed.",
        "key_form_rule": "SHA256('foundation-key-form:' + topic + ':' + prompt), first eight hexadecimal digits, even selects reviewed original key phrase; odd selects reviewed concise equivalent. This fixed rule is independent of option lengths and never changes which concept is correct.",
        "before": old, "after": new, "topic_count": len(original), "item_count": len(records),
        "interpretation": "Residual length-rank differences remain. Lower surface-cue counts do not establish better learner outcomes, fairness, factual perfection or measured difficulty. The 45% guards are engineering regression thresholds, not a psychometric standard.",
        "items": records, "errors": errors,
    }

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    result = audit()
    if not args.check:
        (ROOT / "evaluation-foundation-editorial.json").write_text(json.dumps(result, indent=2)+"\n", encoding="utf8")
    print(json.dumps({key: result[key] for key in ["edition", "topic_count", "item_count", "before", "after", "errors"]}, indent=2))
    if result["errors"]:
        raise SystemExit(1)
