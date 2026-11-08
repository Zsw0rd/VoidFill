"""Generate the complete inspectable curriculum matrix from authored metadata."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
catalogue = json.loads((ROOT / "ml/data/careers/catalogue.json").read_text(encoding="utf8"))
skills = {skill["key"]: skill["name"] for skill in catalogue["skills"]}
lines = [
    "# All-career applied learning paths", "",
    f"Catalogue `{catalogue['version']}` contains 60 curated paths across ten fields. Every path has two foundation milestones followed by two intermediate milestones: prepare a case, produce its foundation activity, investigate a complication, then deliver and defend a decision. Prerequisite IDs make that sequence explicit; they are learning guidance, not evidence that an earlier activity was completed.", "",
    "All 55 shared skills have ten original intermediate scenario questions (550 items). The extension has 1,510 questions plus the unchanged base pack. The 960 foundation items retain their prompts, IDs, levels and explanations while their explicit edition-2 options replace weak distractors; see [the editorial record](FOUNDATION_EDITORIAL.md). Foundation selection uses introductory banks; intermediate selection requests level 3 and receives actual level-3 items. Intermediate course checks request ten questions so a single-skill bank need not repeat items to fill a longer session. Authored difficulty is not a calibrated ability scale.", "",
    "Every career now also has an authored synthetic input pack, a verifiable foundation task and an additional intermediate change with a distinct check. [The complete 60-role case packs](CAREER_CASE_PACKS.md) document exactly what is served in Practical Studio. New briefs snapshot the inputs and rubric for mentor review; older private drafts and submitted versions keep their original briefs. Knowledge questions are still shared by supported skill, not falsely advertised as 60 separate role-exclusive banks.", "",
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
    "python -m ml.audit_foundation_editorial", "python -m ml.audit_career_content", "python -m ml.career_evaluation", "node --import tsx scripts/evaluate-career-matching.mts",
    "python -m ml.document_career_paths", "python -m pytest ml/tests/test_careers.py -q", "node --import tsx --test tests/careers.test.ts", "```", "",
    "The case-pack/editorial update changes public content only and needs no database seed: catalogue storage version, role/skill UUIDs, requirements, targets and weights stay unchanged. Never overwrite an already applied migration for a future requirement change; create a new additive seed and append it to the ordered manifest. No private input enters committed questions, vectors, examples or evaluation reports. The 408 precomputed public queries remain within the existing 500 build guard and 512-entry runtime LRU; novel/private queries remain uncached.", "",
])
(ROOT / "docs/CAREER_PATHS.md").write_text("\n".join(lines), encoding="utf8")
print("Documented every career path in docs/CAREER_PATHS.md")

details = ["# Synthetic practice cases for all 60 career paths", "",
           "These are fictional learning inputs for written work or safe desktop simulations. They are not employer records, professional approvals, statutory rules or real operational instructions. Physical equipment, safety, employment, financial and regulated decisions require appropriate qualified review outside these exercises.", "",
           "Practical Studio includes the inputs in every new brief. A submitted copy preserves its version, inputs and rubric for the assigned mentor. Existing saved projects and review history are not rewritten. Foundation and intermediate activities are separate; quiz scores do not grade practical work.", ""]
for role in catalogue["roles"]:
    block = role["curriculum"]
    details.extend(["## " + role["name"], "", *["- " + value for value in block["foundation"]["case_inputs"]], "",
                    "Foundation verification: " + block["foundation"]["case_verification"], "",
                    block["intermediate"]["case_inputs"][-1], "",
                    "Intermediate verification: " + block["intermediate"]["case_verification"], ""])
(ROOT / "docs/CAREER_CASE_PACKS.md").write_text("\n".join(details), encoding="utf8")
print("Documented the authored inputs and checks in docs/CAREER_CASE_PACKS.md")
