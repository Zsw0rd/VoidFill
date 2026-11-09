# Practical learning and mentor review

The learner's **Fieldwork** workspace is `/practical`. The mentor's **Review desk**
is `/admin/mentor/reviews`. Practical evidence is a separate learning record. It
does not award XP, change assessment scores, mark roadmap courses complete or
claim a professional qualification.

Every one of the 60 catalogue careers has a foundation and intermediate activity.
The chosen level's case contract supplies the concrete task, deliverable and
acceptance checks; its curriculum milestone supplies broader review criteria and
the existing role activity supplies context. The
workspace can explore a different activity without changing the learner's career
selection. Personal custom goals can use an explicitly chosen catalogue activity;
the application does not invent an unsupported role-specific rubric.

The [60 authored case packs](CAREER_CASE_PACKS.md) provide synthetic inputs and
an intermediate change, with a task and deliverable aligned to each level's
actual inputs. New edition-4 briefs include distinct acceptance checks and
optional primary concept references, which are background reading rather than
an endorsement. Learner and mentor views render the same frozen task, inputs
and rubric. Existing projects/submissions retain their original versioned brief;
updating the public catalogue never changes the basis of an earlier review.

## Learner workflow

1. Choose a career activity and learning level. Read the deliverable and checklist.
2. Write an explanation of the work, choices, checks and limitations. Add up to
   three public HTTPS project links if useful. Use synthetic or anonymized data.
3. Save a **private draft**. Evidence is limited to 12,000 characters. Saving a
   draft does not share it or import a private Career explorer reflection.
4. When a mentor has been explicitly assigned, save and review the draft, then
   check the sharing consent box and choose **Share for review**. At least 40
   characters of evidence are required. The API verifies that the mentor shown
   still matches the latest assignment.
5. Review the saved feedback, edit the private draft and save it. Share again to
   create a new immutable version. Earlier submissions and reviews remain intact.
6. **Withdraw mentor access** revokes access to a shared version on subsequent
   requests. The learner keeps the version and feedback in private history.
   Previously viewed evidence cannot be erased from a recipient's memory or
   independently retained copies. Edit and save a new draft version to share
   withdrawn work again.

There is one draft per learner/career/level. Optimistic `draft_version` checks
prevent one browser tab silently overwriting a newer draft from another tab.
Switching activities with unsaved changes is blocked; leaving the page triggers
the browser's unsaved-changes prompt. Drafts are saved explicitly, not on every
keystroke.

Links are not downloaded, copied or executed by VoidFill. They open in a new tab
with `noopener noreferrer`. A stored link can point to content that later changes
or loses access; the saved explanation and rubric are the review record. Binary
file uploads are not part of this release.

## Mentor workflow

The Review desk lists only versions explicitly shared with that mentor's current
assignment. It provides pending/all filters, evidence, saved rubric, per-criterion
judgements and comments, and overall feedback. A mentor can suggest a revision or
mark the work ready **for this activity**. Ready requires every criterion to be
marked demonstrated. Feedback must contain 10–6,000 characters.

A review is immutable. The learner submits a new version for another review.
Saving feedback does not message, email or notify any person outside the app.
Unsaved feedback is protected when switching work, refreshing or leaving the page.

## Permission and reassignment model

| Record | Learner | Currently assigned, explicitly consented mentor | Other staff / learners |
| --- | --- | --- | --- |
| Private draft | Read and save own | No access | No access |
| Shared snapshot | Read own; withdraw sharing | Read while assignment and consent remain current | No access |
| Mentor review | Read own history | Create once and read while that snapshot is shared | No access |
| Private career reflection | Existing owner-only reflection flow | No access through Fieldwork | No access through Fieldwork |

An administrator can review only when they are also the explicitly assigned
mentor. Broad administrative status alone does not expose practical evidence.
Consent stores the exact assignment ID as well as mentor ID. The latest assignment
is ordered by `assigned_at DESC, id DESC`. If a new assignment is created while
an older row remains, the old mentor immediately loses access on subsequent reads
and writes. The new mentor receives no earlier evidence or previous feedback.
The learner must explicitly share a new snapshot with the new assignment. A
recreated assignment has a new ID and does not restore old consent.

Mentors never read a live draft. Each submission copies the evidence, links,
learner/mentor display names and versioned rubric. Updating the catalogue or draft
does not modify an existing submission. Reviews refer to that saved rubric.
Role changes, assignment changes, withdrawal and duplicate-review checks are
revalidated inside the database mutation transaction, in addition to API checks.

## Database and deployment

Apply `supabase/migrations/20261106130000_practical_learning.sql` after the baseline
and career-profile migrations using the canonical database manifest. The migration
is additive and repeatable. It creates:

- `practical_projects`: private draft and versioned activity brief.
- `practical_submissions`: immutable evidence and consent snapshots; revocation time.
- `practical_reviews`: one immutable criterion-based review per submitted version.
- `vf_practical_current_mentor()`: only the signed-in learner's current mentor name.
- `vf_practical_can_review(...)`: current assignment check used by read policies.
- `vf_practical_mutate(...)`: server-only transactional save/share/withdraw/review.

Authenticated users have SELECT access under RLS and no table mutation privileges.
The mutation RPC is executable only by `service_role`. The API derives the actor
from Supabase `getUser()`, strictly validates the action body and builds activity
briefs from the server's catalogue. Browser-supplied identities, rubrics, scores
and extra properties are rejected. Service credentials stay on the server.
Share requests use a request UUID and a unique saved-draft/assignment constraint;
retrying cannot create duplicate submitted versions. Row locks and actor advisory
locks serialize competing updates. A database transaction preserves all-or-nothing
mutations. No assessment, XP or chat tables are written by this RPC.

Before the additive migration is applied, pages show a preparation notice while
existing learning remains available. Apply the migration before releasing the new
navigation and API. A code rollback can leave these additive tables in place;
do not drop them as part of a rollback, because that would delete learner work.

## Disposable previews

`ml/practical_demo.py` implements the same state transitions using the existing
capability-scoped demo session. A learner demo can save private drafts but has no
live mentor assignment. Mentor demos contain synthetic evidence for the seeded
mentoring circle and can record synthetic reviews. Each demo receives a separate
copy; no real learner is contacted. Generic demo database queries cannot read or
write the practical tables. Only the scoped practical operation accesses them.

Cloud previews keep this state in the existing encrypted Supabase session snapshot
and save it through the existing checkout lock. It survives Vercel function
instance changes and expires with the demo lease. Demo limits are 120 projects,
200 submissions and the existing 8 MB total session limit. A failed operation
restores the prior local snapshot. These limits do not define production capacity.

## Verification

Run `node --import tsx --test tests/practical.test.ts` and
`python -m pytest ml/tests/test_practical_demo.py -q`. The standard database CI
runner also executes `supabase/tests/practical_learning.sql` against a disposable
local PostgreSQL database. Its synthetic records are rolled back.

`npm test` automatically includes practical contracts, the real server write-path
mock, and bounded-stream request tests. `npm run test:practical` exercises the
running app's API; `npm run test:ux` checks the rendered workspaces with isolated
synthetic sessions. Evidence requests are limited while streaming, including
requests without a Content-Length header.

SQL assertions exercise actual grants, RLS, private draft isolation, exact
assignment consent, reassignment with old rows retained, no inherited feedback,
withdrawal, optimistic version conflicts, immutable reviews, retry idempotency,
rubric completeness and unchanged XP. Tests use a local Supabase Auth fixture;
they do not sign in real users or reproduce hosted Auth configuration.

Manual release acceptance: create a synthetic learner and eligible mentor in a
test environment, assign them, save/share/review/revise/resubmit/withdraw, change
the assignment and verify that the previous mentor loses access and the new
mentor receives only newly consented evidence. Check phone and keyboard flows,
empty/unassigned states, malformed links and simultaneous stale draft saves.


## Stored identities and concurrent assignment changes

Project foreign keys resolve the authenticated database's role by name; existing
legacy UUIDs are retained. Catalogue/demo UUIDs are not assumed to be production
UUIDs. The saved brief carries the stored role ID while retaining its catalogue
role key and version. A production-style regression test exercises the real
server write path with deliberately different legacy and catalogue UUIDs.

The practical transaction locks the evidence owner, including mentor reviews.
An assignment-table trigger takes the same learner lock for assignment changes.
This serializes review/withdrawal/sharing with reassignment and avoids allowing a
new assignment to race the membership check. The native PostgreSQL test observes
a concurrently inserted assignment waiting for an active review transaction,
then verifies that new assignment does not inherit previous consent. Reusing a
submission request ID with a different draft version, project or mentor returns
a conflict; replay also requires explicit sharing confirmation.

Practical writes have a shared per-user budget of twenty requests per five
minutes and 120 per UTC day. Reads remain available when the write budget is
exhausted. See `PERFORMANCE_AND_RECOVERY.md` for the retry and privacy behavior.
