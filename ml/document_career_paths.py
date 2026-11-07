"""Generate the complete inspectable curriculum matrix from authored metadata."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
catalogue = json.loads((ROOT / "ml/data/careers/catalogue.json").read_text(encoding="utf8"))
skills = {skill["key"]: skill["name"] for skill in catalogue["skills"]}
lines = [
    "# All-career applied learning paths", "",
    f"Catalogue `{catalogue['version']}` contains 60 curated paths across ten fields. Every path has two foundation milestones followed by two intermediate milestones: prepare a case, produce its foundation activity, investigate a complication, then deliver and defend a decision. Prerequisite IDs make that sequence explicit; they are learning guidance, not evidence that an earlier activity was completed.", "",
    "All 55 shared skills now have ten additional original intermediate scenario questions (550 new items). The extension has 1,510 questions, including the 960 previously published items unchanged, plus the unchanged base pack. Foundation selection uses introductory banks; intermediate selection requests level 3 and receives actual level-3 items. Intermediate course checks request ten questions so a single-skill bank need not repeat items to fill a longer session. Authored difficulty is not a calibrated ability scale.", "",
    "Practical submissions are separate evidence. A quiz score or saved private reflection does not establish that a practical deliverable has been reviewed. Sharing with an assigned mentor and receiving a rubric review is a distinct workflow; it does not confer professional qualification or certify job readiness. Use synthetic or appropriately licensed public inputs, never confidential employer, employee or customer material. Regulated, legal, financial, employment and physical-engineering decisions need appropriate qualified review outside these exercises.", "",
    "## Complete 60-path matrix", "",
    "The skill order is a learning sequence within the existing role requirements. No career/skill IDs, targets, weights or requirement mappings were changed. The capstones below are the authored intermediate deliverables, not claims of learner completion.", "",
    "| Career | Skill sequence | Foundation activity | Intermediate deliverable and complication |", "|---|---|---|---|",
]
for role in catalogue["roles"]:
    curriculum = role["curriculum"]
    sequence = " → ".join(skills[key] for key in curriculum["skill_sequence"])
    foundation = role["activity"]["title"]
    intermediate = curriculum["intermediate"]["milestones"]
    capstone = intermediate[-1]["deliverable"]
    complication = intermediate[0]["outcome"]
    cells = [role["name"], sequence, foundation, capstone + " **Complication:** " + complication]
    lines.append("| " + " | ".join(cell.replace("|", "\\|").replace("\n", " ") for cell in cells) + " |")
lines.extend([
    "", "## Evidence and evaluation", "",
    "`tests/fixtures/career-matching-golden.json` contains 60 role task narratives, ten custom combinations, ten unsupported specialties and ten ambiguous queries. This is a curated regression set and was used to improve explainable lexical ranking; it is not independent user research or a held-out estimate of real-world career advice quality. `ml/evaluation-career-matching.json` records the actual results. Rank scores remain ranking signals, never fit probabilities.", "",
    "`ml/career_evaluation.py` probes semantic topic vectors with 55 public paraphrases and ten unsupported specialties. `ml/evaluation-career-depth.json` records the actual ranking quality and cache-isolation result. A semantic miss does not silently assign an unrelated quiz: production skill coverage still uses exact catalogue/alias mapping. The probes are not a hiring benchmark, independently reviewed curriculum evaluation or validation of generated answers. The retriever weights, FP32 precision, pooling and token limit remain unchanged.", "",
    "`ml/audit_career_content.py` records answer-position and length-cue diagnostics. Distractors were revised to address domain-relevant competing interpretations; answer options were shortened while qualifications remain in explanations. These checks cannot establish distractor plausibility, educational effectiveness, fairness or calibrated difficulty. Independent subject specialists should continue reviewing ambiguity, reference relevance and role-specific expectations.", "",
    "## Rebuild and verify", "", "Run from the repository root with the existing ML environment and downloaded O*NET source:", "", "```text",
    "python -m ml.build_career_catalogue", "python -m ml.build_career_pack", "python -m ml.index_careers",
    "python scripts/seed-career-catalogue.py --output supabase/migrations/20261106150000_applied_career_paths.sql",
    "python -m ml.audit_career_content", "python -m ml.career_evaluation", "node --import tsx scripts/evaluate-career-matching.mts",
    "python -m ml.document_career_paths", "python -m pytest ml/tests/test_careers.py -q", "node --import tsx --test tests/careers.test.ts", "```", "",
    "Never overwrite an already applied migration when publishing a later catalogue. Create a new additive seed and append it to the ordered migration manifest. The applied-path seed resolves existing UUIDs by unique names and preserves referenced progress. No private input enters committed questions, vectors, examples or evaluation reports. The 408 precomputed public queries remain within the existing 500 build guard and 512-entry runtime LRU; novel/private queries remain uncached.", "",
])
(ROOT / "docs/CAREER_PATHS.md").write_text("\n".join(lines), encoding="utf8")
print("Documented every career path in docs/CAREER_PATHS.md")
