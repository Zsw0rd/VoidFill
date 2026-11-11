# Current project status

This is the entry point for the current implementation. Historical experiments
and release records remain available, but their old pending tasks and policy
descriptions do not override the current architecture.

## Previous release baseline

The verified production baseline for this follow-up is merged commit `f8ffd92`
from [PR 11](https://github.com/Zsw0rd/VoidFill/pull/11). Deployment
`dpl_4NUE1j6QxXgKaBAZDA7rnXy29hdn` serves
[void-fill.vercel.app](https://void-fill.vercel.app). The earlier local commits
remain on `codex/archive-local-main-20261107`.

The runtime is Next.js 15.5 and a private FastAPI/float32 ONNX learning service
on Vercel, with Supabase Auth, Postgres and Storage. Curated public embeddings
avoid loading the encoder for ordinary supported queries. Private learner inputs
are not added to the shared cache. The embedding model retrieves authored
questions/resources; it is not a conversational language model.

Sage chat and its moderation still use Gemini. The owner explicitly requested
keeping this dependency and its long-conversation behavior unchanged for the
current follow-up. Core learning inference needs no third inference service.

All 60 catalogue careers have supported foundation/intermediate learning and
distinct practical briefs across 55 reusable skills. Shared skill questions are
not role-exclusive evidence. Personal goals explicitly select supported skills;
unsupported occupations do not silently acquire a full generated curriculum.

Grading is server-verified and persisted atomically through service-only
Postgres functions. Browser roles cannot award scores or XP directly. Shared
submission identity prevents duplicate awards across instances. The older
single-host file-ledger architecture describes local/disposable demos only.

## Implemented follow-up scope

The PR 10 release added the following work. Publication, exact source/deployment
identifiers and completed checks are recorded in its release pull request; a
source checkout alone does not prove that version is live.

- Password recovery and account data export, plus a visible, cancellable
  deletion-request workflow for administrator review. No real account is erased
  by implementation tests.
- Same-tab assessment recovery after refresh, with user/context binding,
  existing expiry and unchanged server grading.
- Editorial revision of foundation distractors and deeper role-specific
  practical work, with reproducible content checks and actual FP32 reindexing.
- Broader controlled local performance checks and documented learner/accessibility
  trial protocols. Agent walkthroughs do not count as human research.
- A consolidated documentation entry point and explicit historical labels.

The foundation editorial pass covers all 960 extension option sets. The earlier
79.9% uniquely-longest-correct rate describes the original edition; the revised
observed rate is 38.0%, with 31.6% uniquely shortest. Residual style/length effects
remain, and no learner calibration or independent specialist approval is claimed.

Backup changes, Gemini replacement and long-conversation changes are excluded.
No paid plan, new inference provider or broad credential scope is introduced.

The subsequent engineering batch addresses native Vercel model-build caching,
bounded hosted performance including private resume inference, PDFium thread
safety, additional keyboard/validation repairs and task/input alignment for all
120 foundation/intermediate career exercises. Its implementation, measurements
and publication gates are recorded in
[the engineering follow-up](ENGINEERING_IMPROVEMENTS_20261109.md). Source changes
and synthetic tests alone do not prove that a candidate is live or that Vercel
retained its model archive between builds; use the actual source, deployment and
acceptance evidence in [the PR 11 release record](https://github.com/Zsw0rd/VoidFill/pull/11).

## Where to look

| Topic | Current source of truth |
| --- | --- |
| Hosting, model artifacts and deployment | [Cloud deployment](CLOUD_DEPLOYMENT.md) |
| Verified model downloads between Vercel builds | [Model download efficiency](MODEL_DOWNLOAD_EFFICIENCY.md) |
| Authentication and real-account acceptance | [Authentication](AUTHENTICATION.md) |
| Password recovery, own-data export and deletion requests | [Account self-service](ACCOUNT_SELF_SERVICE.md) |
| Unfinished assessments after refresh | [Assessment recovery](ASSESSMENT_RECOVERY.md) |
| Database installation, upgrades and transaction boundaries | [Database releases](DATABASE_RELEASES.md) |
| Career content, matching and known quality limits | [Career quality review](CAREER_QUALITY_REVIEW.md) |
| New lesson checks, source corrections and guide coverage | [Lesson expansion](EXPANSION_VALIDATION_20261110.md) |
| Scope-aware progress and the ordered SQL upgrade | [Resource progress](RESOURCE_PROGRESS_SCOPES.md) |
| Updated matching fixtures and residual ambiguities | [Matching review](MATCHING_REVIEW_20261110.md) |
| Revised foundation options and before/after diagnostics | [Foundation editorial edition](FOUNDATION_EDITORIAL.md) |
| Synthetic tasks and expected checks for every role | [Career case packs](CAREER_CASE_PACKS.md) |
| Practical work and human mentor feedback | [Practical learning](PRACTICAL_LEARNING.md) |
| Performance tools, sample sizes and monitoring | [Performance validation](PERFORMANCE_VALIDATION.md) |
| Chrome UX evidence and accessibility limits | [Usability audit](USABILITY_ACCESSIBILITY_AUDIT.md) |
| Human trial preparation | [Learner pilot protocol](LEARNER_PILOT.md) |
| Coded records and specialist review pack | [Pilot engineering](PILOT_ENGINEERING_20261110.md) |
| CI, migration order and publication gates | [Release checklist](RELEASE_CHECKLIST.md) |

`LOCAL_ML.md` preserves research/training history; `SITE_DOCUMENTATION.md` and
`PROJECT_ANALYSIS.md` preserve the original implementation. The dated cohort and
release documents record events, not a queue of still-pending tasks.
