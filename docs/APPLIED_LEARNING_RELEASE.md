# Applied learning and integrity release

Implementation covers phases 1, 3, 4, 5 and the announced phase-6 reliability work.
Phase 2 (account self-service and changing the existing Gemini dependency) was
explicitly excluded. No owner role changes or real learner assignments are part
of this release.

## Delivered behavior

- Assessment persistence is server-authoritative, transactional and idempotent.
  The database denies direct score/XP writes; failed transactions can be retried
  without duplicate awards. Concurrent daily tabs retain the first saved result
  and do not display another token's answer review.
- Every one of the 60 careers has a distinct case and four ordered milestones.
  All 55 skills have ten additional applied scenarios. Intermediate mode actually
  selects authored level-3 content; foundation remains within levels 1–2.
- Practical Studio supports private, version-checked drafts, text/public HTTPS
  evidence, immutable rubric snapshots, explicit assignment-specific sharing,
  feedback, revision/resubmission and withdrawal. Practical reviews do not award
  quiz scores, XP or professional certification. Private reflections stay separate.
- The overview offers a weekly learning route. Career comparison previews up to
  three paths without changing the saved goal. The atlas has search, meaningful
  progress filters, next-step explanations, genuine focus controls, milestone
  links and a list alternative. Stored skill links survive loading and navigation.
- Onboarding background/context is optional. Mentor assignment lists are
  searchable, and staff navigation includes the practical review queue.
- Shared request budgets, bounded evidence streams, privacy-safe timing and an
  explicit release-maintenance switch support operation on the existing stack.
  Profile charts load separately; the production build reports 275 kB first-load
  JavaScript for that page. No model weights, pooling or tokenizer were changed.

The 60 existing career IDs, 241 role-skill mappings, original 960 extension
questions, base questions and existing learning resources are preserved. The
curriculum extension contains 1,510 questions, 147 resources and 408 public query
embeddings in approximately 8.28 MiB. Private inputs remain outside that cache.

## Local release evidence

| Check | Result |
| --- | --- |
| Automatically discovered Node suites | 72 passed |
| Default ONNX serving tests | 77 passed; five offline research checks deselected |
| Optional existing offline training artifacts | Five passed separately; no artifacts fabricated |
| TypeScript and ESLint | Passed |
| Production Next.js build | Passed |
| Dependency audit | Zero reported vulnerabilities |
| Production-mode learner demo | Passed, including PDF, grading/replay and isolation |
| Production-mode staff demo | Passed, including assigned conversations and role boundaries |
| Authentication contract journey | Passed |
| All-career contract journey | All 60 passed at both foundation and intermediate levels |
| Practical API journey | Passed, including drafts, sharing, feedback, isolation and no XP |
| Isolated Chromium UX | Seven passed; desktop and 355px phone layouts checked |
| Native PostgreSQL | Fresh install, upgrades, actual RLS, failure recovery and concurrent writes passed |
| Synthetic pg_dump/pg_restore | Table fingerprints, grants and RLS retained |

Curated matching regressions return 59/60 first choices and 60/60 top-three
matches, with explicit unsupported/custom-goal checks. Semantic topic probes
report 85.45% Recall@1 and 92.73% Recall@5. These examples are regression evidence,
not an independent held-out study, expert curriculum review or hiring-readiness
validation. Misses and methodology are recorded in the career reports.

## Release and operating references

- [Every career's case, skills and capstone](CAREER_PATHS.md)
- [Practical workflow and sharing boundaries](PRACTICAL_LEARNING.md)
- [Database setup, ordered upgrades and cutover](DATABASE_RELEASES.md)
- [Actual transaction/concurrency/restore evidence](INTEGRITY_RELEASE_VERIFICATION.md)
- [Performance baseline, quotas and recovery limits](PERFORMANCE_AND_RECOVERY.md)
- [Hosted CI and release process](RELEASE_CHECKLIST.md)

All three hosted check groups passed in [GitHub Actions run 42339041780](https://github.com/Zsw0rd/VoidFill/actions/runs/42339041780)
for source `53e178edca5424178d3a2d0e26b381f4e4b02876`. The hosted model selection
passed 65 tests and all seven Chromium journeys passed. The real OCR check uses
Pillow's bundled scalable font on Windows and Linux; offline research checks are
explicit opt-ins. Main now requires the three named GitHub Actions checks,
up-to-date pull requests and conversation resolution, including for admins;
force pushes and branch deletion are disabled. No second-owner review is needed.

## Production database cutover: 7 November 2026

The tested source `53e178e` was first deployed with learning maintenance enabled.
All three grading entry points and practical writes returned HTTP 503 with
Retry-After 60. Old requests were allowed at least 300 seconds to drain before
the snapshot query ran at 04:45:51 UTC.

An encrypted selected-learning snapshot was captured and independently decrypted
and verified locally: 16 tables, 422 records. Its temporary plaintext input was
removed. This is not a full project/Auth/Storage backup and does not enable PITR
or recurring hosted backups. The current Supabase Free project has no hosted
backup entitlement; this recovery limitation remains explicit.

All four migrations and their canonical checksums committed in one transaction
through the authenticated project SQL Editor. All ten production verification
checks returned true: exact release ledger, safe stats bootstrap, browser
progress-write denial, service-only mutation RPCs, practical RLS/read helpers,
private server storage, catalogue version and no legacy pending/failed claims.
The existing 61 roles, 55 skills, 241 mappings, three statistics rows, five skill
scores and total 90 XP were retained. No synthetic awards were made to real users.

All three cleanup schedules are active. Demo expiry and submission retention
reported successful prior runs; the new hourly budget cleanup had not reached
its first scheduled execution at verification time. Existing owner Google login
returned successfully to the administrator dashboard, which exposes both
administrator and mentoring navigation. No staff roles or assignments changed.

Vercel's configured production branch is `main`; feature preview publication alone
does not promote production. Final deployment IDs and post-deployment results are
recorded in the release pull request. The transaction-aware application is the
rollback floor: do not restore old browser progress-write permissions.
