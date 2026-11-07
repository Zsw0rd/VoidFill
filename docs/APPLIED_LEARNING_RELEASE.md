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
| Automatically discovered Node suites | 68 passed |
| Full Python test directory | 82 passed |
| TypeScript and ESLint | Passed |
| Production Next.js build | Passed |
| Dependency audit | Zero reported vulnerabilities |
| Production-mode learner demo | Passed, including PDF, grading/replay and isolation |
| Production-mode staff demo | Passed, including assigned conversations and role boundaries |
| Authentication contract journey | Passed |
| All-career contract journey | All 60 passed |
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

GitHub's workflow is configured to exercise all three check groups without
production credentials. Hosted run results and preview URLs must be verified
after publication. Vercel's configured production branch is `main`; feature
preview publication alone does not promote production. Do not merge/promote the
matching application until the four release migrations and cutover checks are
complete. Browser backup settings and production migrations require a verified
authenticated project session; a synthetic restore drill is not a production
backup guarantee.
