# Offline pilot and specialist review engineering

Status: engineering preparation complete; **human validation pending at the owner's request**. No participant sessions, expert reviews or assistive-technology speech results have been collected. The tool does not contact people, run a study, collect analytics, create accounts, change database schemas or make network requests. Account recovery/deletion and longer chat work are outside this pack.

The earlier [learner protocol](LEARNER_PILOT.md) supplies the voluntary adult session procedure. These new tools make its source binding, anonymous records and review references enforceable. The fixtures in `tests/pilot-validation.test.ts` are wholly fictional engineering inputs; even its human-shaped counting test is not a participant result. Marking a fixture as `synthetic_fixture` excludes it from every human count.

## Prepare an empty, source-bound pack

From the repository root, after the source/data changes to be reviewed are stable:

```powershell
node --import tsx scripts/pilot-validation.mjs --help
node --import tsx scripts/pilot-validation.mjs prepare --output ml/runtime/pilot/review-local-20261110
```

Use a new directory name for every run. Existing files/directories are refused; a partial failed write is not resumed. The command needs the existing project Python at `.venv-ml/Scripts/python.exe` on Windows, or `.venv-ml/bin/python` on Unix, and the repository's installed `tsx`/`zod`. It installs nothing and never loads `.env` or the embedding/model runtime.

Generated files, all under ignored `ml/runtime`:

| File | Purpose |
| --- | --- |
| `reviewer-pack.json` | Actual app briefs, current public question rows, stage eligibility and exact resource links |
| `reviewer-pack.md` | Readable task/input/deliverable/rubric/source brief for every career at each level, plus complete lesson-link inventory |
| `task-cards.md` | Seven neutral learner tasks, consent/environment instructions and observer boundaries |
| `record-templates.json` | Incomplete learner/specialist record examples; false consent, placeholder IDs and unset outcomes intentionally fail ingestion |
| `records.json` | Empty record bundle, `records: []` |
| `summary-pending.json` | Zero human observations; 120 case reviews pending |

All 60 catalogue careers have separate foundation and intermediate briefs. The exporter imports the **actual `practicalBrief()` app builder**, including case inputs, deliverable, each rubric criterion and authored source references; it does not invent alternate reviewer tasks. Missing inputs/sources fail preparation. The JSON deduplicates question rows while every case references its current broad-skill and lesson-specific stage banks. Foundation uses difficulties 1–2; intermediate uses difficulty 3. Higher difficulty rows may appear in the complete source inventory but are not eligible case checks for these levels.

The fixed metadata-only Python subprocess calls `load_learning_content()`, `audit_coverage()`, `question_in_skill_scope()` and `question_resource_ids()`. Global quarantines and the existing broad-skill scope exclusions apply. Lesson banks use explicit `resource_id`/`resource_ids` with the same URL and topic as serving; `source_url` alone creates no lesson binding. The pack additionally validates all exported lesson bank memberships and their completeness against those explicit links. A question may be valid for its exact lesson and excluded from a broader skill check; those sets remain separately labelled. URL presence is not proof that a source was opened, read or endorsed by a specialist.

## Source and environment binding

Each pack carries the current Git HEAD, a canonical SHA-256 content digest, working-tree/committed state and an environment. The digest covers public app/component/library source, public assets, public `ml/data` including optional lesson resource/guide manifests, `ml/lessons`, the relevant serving/selection/coverage/validation files, cloud release manifest, package/lock/TS configuration, this CLI and the prior learner protocol. JSON is bound by canonical parsed content; text uses LF normalization; binary assets use their bytes. It does not read `backup/`, `.env`, runtime records, downloaded data or private model artifacts. Hosted environment/identity settings are not inspected.

Preparation checks the same digest before and after imports/evidence export and fails if the source changed. Every record must carry exactly the pack's source and pack digest; every specialist record also carries the exact case brief digest. This preserves an archived review even if newer code is later written. Ingestion checks records against the supplied immutable pack, rather than silently rebinding old observations to the latest working tree. Regenerate a new pack for a new source; never copy old results and change their digests.

Local preparation defaults to `local_demo` and can explicitly bind unfinished working-tree changes. A hosted pack requires source to be committed/clean within the digest scope, the correct Vercel deployment ID and a deliberate operator attestation:

```powershell
node --import tsx scripts/pilot-validation.mjs prepare --output ml/runtime/pilot/review-preview-20261110 --environment preview_demo --deployment dpl_REPLACE_WITH_REAL_ID --deployment-confirmed
```

`production_own_account` is also an available environment code. The tool **does not verify a deployment, participant identity, consent or expertise**; it only validates the supplied declaration and source binding. Confirm the exact deployed revision yourself before observations. Never exercise account recovery/deletion, submit work to a real mentor, intentionally break production networking or manufacture grades. Skip disposable-demo tasks if the chosen environment cannot support them. A production normal attempt needs the learner's informed agreement outside this tool. Preparing a pack does not grant permission to run sessions or mutate accounts.

## Anonymous records and coded findings

The task cards cover choosing a career/personal goal, atlas/resource navigation, disposable assessment refresh/resume, feedback understanding, private practical draft recovery, inspecting sharing before submission, and sign-out/return. No account recovery/deletion task is generated.

Copy a template only after voluntary adult participation and anonymous notes consent have actually been given. The schema requires all consent declarations plus no recording; no consent is inferred from a completed form. Use neutral learner IDs `P001`–`P999`, session IDs `S001`–`S999` and reviewer IDs `R001`–`R999`. Fictional rehearsal IDs use `F001` or `FR001`, with `origin: synthetic_fixture`. Neutral IDs are supplied labels, not authenticated or independently verified people. Use a new session for a different career/level/environment; a session's context must stay consistent. Prefer disposable demos and supplied fictional case data.

Learner records allow only the pack's task/role IDs (or `personal_goal`), level, consent, coarse browser/OS/input/assistive-tool environment with numeric versions, viewport class and zoom, coded outcome/friction/severity, optional bounded duration and confidence. No raw goal text is collected. Outcomes are `independent`, `helped`, `abandoned`, `skipped`; skipped tasks have null duration/confidence. Severity is `none`, `preference`, `slows_progress`, `causes_mistake` or `blocks_completion`; a non-none severity needs one or more unique friction codes. Durations exclude authentication and breaks. An actual screen-reader session must record the tool/version; no DOM assertion is treated as spoken output.

Friction codes are `navigation`, `coverage_boundary`, `unclear_label`, `focus_lost`, `keyboard_trap`, `layout_overflow`, `error_recovery`, `work_lost`, `sharing_expectation`, `announcement_missing`, `motion_discomfort`, `target_size`, `slow_response`. Unknown fields are rejected at every level. There are no free-text notes, quotations, resumes, chats, work submissions, contact details, user/profile/auth IDs, credentials or upload fields. Observer notes that do not fit these codes stay outside ingestion until a separately reviewed protocol change; do not hide private data inside a code or identifier.

Specialist records require relevant expertise attestation without collecting a CV or identity, the bound case ID/digest, judgements for task/inputs/deliverable/rubric/source grounding, zero-based rubric criterion references, and optional specific question checks. Question IDs must be eligible for that case/level. Repeated criteria/questions and duplicate reviewer/case records are rejected. `usable_for_pilot` requires all case components and every rubric criterion aligned, no severity, and no adverse supplied question check; it makes **no claim about unreviewed questions**. `revise` and `not_reviewed` remain valid outcomes. A complete case review means all components and rubric criteria were inspected and a disposition recorded; it can still require revisions. Reviewer presence alone is not approval.

## Validate and aggregate privately

When genuine observations are eventually authorized and available, append only conforming records to the pack's private `records.json`, retaining the bundle `protocol` and `pack_digest`. Then:

```powershell
node --import tsx scripts/pilot-validation.mjs summarize --pack ml/runtime/pilot/review-local-20261110/reviewer-pack.json --records ml/runtime/pilot/review-local-20261110/records.json --output ml/runtime/pilot/review-local-20261110/summary-01.json
```

Zero human records always reports `pending`. Fictional records are reported only as excluded. Human input reports `observations_recorded_human_validation_incomplete`, never validated/calibrated/approved. Reports contain outcome, severity and friction counts, per-task outcome counts, supplied-ID/session counts, complete/pending case-review counts, explicit question-review coverage and coded question findings. Repeated question judgements across cases/reviewers count as supplied findings; `questions_reviewed` is a separate unique-ID count. No percentages, representative statistics, inferred prevalence, professional competence, accessibility certification or calibrated difficulty are claimed. No individual participant/reviewer IDs or private content are emitted in summaries or terminal output. An invalid record produces a fixed error code without echoing its values, field names, file contents or path.

Only new output paths below Git-ignored `ml/runtime` are accepted. Absolute paths, traversal, unsafe segments, junctions/symlinks, hard-linked input files, non-files, oversized JSON, existing outputs and unknown CLI options are refused. Input pack JSON is bounded to 16 MiB; record JSON to 4 MiB and 10,000 records. Creation uses exclusive writes, POSIX private modes where supported and no automatic publication. Windows mode bits do not configure an ACL; keep runtime files in the user's private workspace. This is local operator tooling, not an adversarial multi-user filesystem service, participant identity system or encrypted research repository. Do not commit or share runtime data; source-control ignore is not encryption.

## Engineering evidence

Executed on 2026-11-10:

```powershell
node --import tsx --test tests/pilot-validation.test.ts
npx tsc --noEmit
npm run lint
node --import tsx scripts/pilot-validation.mjs prepare --output ml/runtime/pilot/engineering-20261110-c
node --import tsx scripts/pilot-validation.mjs summarize --pack ml/runtime/pilot/engineering-20261110-c/reviewer-pack.json --records ml/runtime/pilot/engineering-20261110-c/records.json --output ml/runtime/pilot/engineering-20261110-c/summary-verified.json
```

The focused suite passed 10 tests for strict consent/ID/outcome validation, mismatched source/case, duplicates, unknown/private field injection, exact lesson binding and stage rules, fictional exclusion, counts, private paths, junction/hard-link rejection, overwrite refusal, empty summaries and CLI error redaction. TypeScript and lint passed without diagnostics. The actual app-source preparation at that temporary snapshot exported 120 briefs for 60 careers, 305 resources and 2,139 question rows, with **0 human records**; independent empty-record CLI ingestion returned `pending`, zero human/fictional records and all 120 case reviews pending. Generated Markdown and JSON were reopened and inspected. Counts are a source snapshot, not hardcoded completion criteria; regenerate after subsequent lesson/career changes. These command results demonstrate engineering behavior only. The suite is discovered automatically by the existing unit-test runner and CI; it does not run a participant study or browser automation. Real learner/specialist sessions and accessibility speech/render validation remain pending.
