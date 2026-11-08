"""Inspect content structure and simple answer-cue diagnostics, not pedagogy."""
import json
from collections import Counter
from pathlib import Path
from ml.audit_foundation_editorial import audit as foundation_audit

ROOT = Path(__file__).resolve().parent


def audit():
    catalogue = json.loads((ROOT / "data/careers/catalogue.json").read_text(encoding="utf8"))
    questions = json.loads((ROOT / "data/careers/questions.json").read_text(encoding="utf8"))
    intermediate = [row for row in questions if row["group"].startswith("career-intermediate-")]
    by_topic = Counter(row["topics"][0] for row in intermediate)
    cues = sum(len(row["options"][row["correct_index"]]) > max(len(value) for i, value in enumerate(row["options"]) if i != row["correct_index"]) for row in intermediate)
    correct_length = sum(len(row["options"][row["correct_index"]]) for row in intermediate) / len(intermediate)
    other_length = sum(sum(len(value) for i, value in enumerate(row["options"]) if i != row["correct_index"]) for row in intermediate) / (3 * len(intermediate))
    foundation = foundation_audit()
    return {
        "version": catalogue["version"],
        "scope": "Structural and surface-cue diagnostics of original authored learning content. These checks do not validate educational effectiveness, domain-expert correctness, difficulty calibration or job readiness.",
        "career_count": len(catalogue["roles"]), "skill_count": len(catalogue["skills"]),
        "extension_question_count": len(questions), "intermediate_count": len(intermediate),
        "intermediate_per_topic": dict(sorted(by_topic.items())),
        "correct_option_unique_longest_rate": cues / len(intermediate),
        "mean_correct_option_characters": correct_length,
        "mean_other_option_characters": other_length,
        "correct_positions": dict(sorted(Counter(row["correct_index"] for row in intermediate).items())),
        "foundation_editorial": {key: foundation[key] for key in ["edition", "item_count", "before", "after", "interpretation"]},
        "review_note": "Distractors were revised for domain-relevant competing interpretations; explanations retain qualifications removed from answer options. Independent reviewers should still challenge ambiguous wording, distractor plausibility and reference relevance before high-stakes use.",
    }


if __name__ == "__main__":
    result = audit()
    (ROOT / "evaluation-career-content.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf8")
    print({key: value for key, value in result.items() if key not in {"intermediate_per_topic", "scope", "review_note"}})
