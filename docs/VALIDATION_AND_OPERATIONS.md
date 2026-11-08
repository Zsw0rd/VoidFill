# Production validation and operating improvements

This work covers performance and monitoring, fresh-user acceptance, career
quality, usability/accessibility and Git history reconciliation. Backup changes
are explicitly excluded from this release. Existing model weights, pooling and
tokenizer remain the quality baseline unless separately documented.

## Git history reconciliation

Before reconciliation, the local `main` branch pointed to `01e3bf2` and had a
historical sequence that diverged from remote main. Its tracked files were
verified identical to the old remote baseline `7d5f8b2`; there were no additional
local content changes to discard. No other worktree had main checked out.

The complete old history is retained locally as
`codex/archive-local-main-20261107`, pointing to
`01e3bf2a7aea12899f8e22576dee2288e54e11b0`. Local main was aligned with remote main
at `b54e5024d8c2b3940fd7a0fb09a0ff3a33986745`, then verified zero commits ahead and
zero behind. No remote history was rewritten and the original feature branch
was retained. Subsequent releases should update local main by fast-forward.

## Acceptance evidence boundaries

The user selected Chrome-only UI verification for this work. No Playwright/axe
browser suite is executed for this release. The existing isolated browser tests
remain available through a separate explicit manual workflow input, disabled by
default. Pull requests and pushes continue to run the application/unit, model,
database and HTTP journey checks. Chrome walkthroughs provide the UI evidence.

Separate automated fixtures, disposable production demos and authenticated
real-account checks in all reports. A synthetic workflow is useful release
evidence but cannot establish real-user capacity, human usability, independent
subject-matter approval, professional qualification or accessibility compliance.

The designated college-account journey checks ordinary Google signup,
onboarding, an initial saved assessment, logout and returning login. Its email,
provider identifiers, cookies and assessment tokens must not appear in public
test fixtures, logs, screenshots or release notes. Authentication challenges and
binding agreements are completed by the account owner when required. The test
does not grant staff privileges or change existing mentor assignments.

On 7 November 2026 this real journey completed: new Google signup and onboarding
at zero XP; one saved daily check at 9/10 and 95 XP; reload; ordinary logout;
returning Google login directly to the dashboard; and reopening the same saved
daily result without another award. The saved path, streak and five skill scores
persisted. An earlier token expired during an interruption without saving a
result, exposing the need for clearer expiry and recovery UI. Full acceptance
details are in `AUTHENTICATION.md`; private proof images remain in ignored local
runtime files.

## Implemented performance and monitoring

Public embedding-cache hits no longer wait behind private inference. Actual
encoder work stays serialized and private inputs remain uncached. Deterministic
concurrency tests verify that distinction; model weights, tokenizer and pooling
are unchanged. Private process memory/CPU/initialization observations and a
metadata-only summary tool support diagnosis without logging learner inputs.

A bounded pre-change production demo workload completed 42 requests, with peak
four in flight, zero errors/throttles and all four disposable sessions ended.
This is not proof of concurrent real-account capacity. A separately gated
real-account harness requires legitimate operator-authenticated test sessions;
browser authentication state is never extracted. See `PERFORMANCE_VALIDATION.md`
for workload bounds, baseline results and interpretation limits.

The six-hour public availability workflow requires no production credentials.
The owner's existing failed-workflow Email and On GitHub preferences were
verified in Chrome, and this one repository was placed on All Activity watch
because GitHub has no workflow-only watch option. Other repository activity can
therefore also notify. No artificial failure was created to test email delivery.
The current Hobby plan was retained; no paid monitor or new provider was enabled.

## Career quality and assessment repairs

All 60 cases/rubrics and 55 selected intermediate explanations have source-bound
review records. All 2,121 stored question contracts and all 305 resource links
were checked. Four legacy items with ambiguous or preference-based evidence are
excluded only from new assessment selection; their raw rows, vector positions
and existing sealed grading remain intact. A concrete intermediate SQL join/
aggregation explanation was clarified and independently tested.

The real FP32 index regeneration produced identical vectors because that SQL
item's embedding prompt did not change. The frozen 88-case matching evaluation
records both gains and remaining misses; its observed results are now regression
evidence. `CAREER_QUALITY_REVIEW.md` includes the complete 60-role matrix and the
known original-foundation answer-length bias. Neither independent expert review
nor learner-based assessment calibration is claimed.

## Verification and release

The final local application suite passed 84 Node tests. The exact hosted serving
selection passed 77 Python tests; the default broader serving suite passed 89,
with five offline research cases deselected. TypeScript, ESLint, cloud artifact
fingerprints and the production Next build passed. Local HTTP journeys passed
for authentication, learners, staff, practical work and all 60 careers at both
learning levels. These totals overlap and must not be added together.

Chrome-only visual, keyboard, landmark and narrow-layout evidence is recorded in
`USABILITY_ACCESSIBILITY_AUDIT.md`. Hosted check runs, deployment identifiers and
post-deployment probe results are recorded in the release pull request after
publication. No backup files, policies or database migrations are part of this
release.
