# Assessment recovery in the same browser tab

Daily checks, practice checks, roadmap course assessments and roadmap skill
assessments now retain an unfinished draft through a page refresh. Returning to
the matching page in the same tab checks the draft before allowing a new
assessment request. It restores the original questions, selected options and
question position, without generating a replacement quiz or consuming another
generation budget.

The recovery notice is visible before starting and while answering. A blocked
browser storage policy leaves the current in-memory quiz usable and tells the
learner to keep the page open. A temporary restore failure keeps the draft and
offers Retry restoring or Discard saved draft. Failed saves keep selected answers
and show an inline error for all four assessment purposes. Retrying submits the
same sealed assessment to the existing idempotent grading path.

Course checks now use questions explicitly linked to the owner's saved resource
and its configured skill. A similar title, embedding score or concept-reference
URL cannot substitute a broader skill quiz. Short linked banks remain short;
resources without a linked bank keep focused guidance in the dialog and offer a
direct **Check the broader skill** action or a return to the atlas.
Existing sealed drafts retain their original questions and grading contract.

Deliberate Next/Previous navigation focuses the new question heading, including
when the clicked button becomes disabled. Choosing an answer retains option
focus. Discarding a daily/practice session returns focus to its page heading;
discarding a roadmap session returns it to the atlas heading.

## What is stored

Only the current tab's `sessionStorage` is used. There is one bounded, versioned
slot each for daily, practice and roadmap checks. A slot contains:

- The original encrypted, user-bound assessment token.
- Selected question IDs/option indexes and the current question position.
- An authenticated owner ID, a hashed learning-context fingerprint and the
  original expiry timestamp.

Question prompts, options, answer keys, explanations, user names, emails,
authentication cookies, access/refresh tokens, profile text and model inputs are
not written to the draft. The opaque assessment token itself is sensitive and
remains confined to session storage and the same-origin authenticated resume/save
requests. No browser authentication state is exported. Malformed, unknown-version,
oversized, wrong-purpose, expired or mismatched-owner/context drafts are removed.
Selected indexes are intersected with the server's actual question IDs and
available option ranges before restoration.

## Server authority and expiry

`POST /api/assessments/resume` authenticates the caller, decrypts the original
assessment with the existing server secret, verifies its user, purpose and
two-hour expiry, and checks its sealed learning-context fingerprint against the
current career, level, personal goal and focus skills. Course/skill targets must
still belong to the learner's current learning direction; course ownership is
queried again. Only public questions and target labels are returned. The handler
uses a bounded request reader and the existing origin/maintenance boundary.

The browser cannot extend the sealed lifetime by changing its local timestamp.
Resuming never creates a new assessment ID, invokes inference, writes grades or
awards XP. Existing PostgreSQL/demo submission replay guards remain authoritative
when the same saved assessment is retried. Old assessments issued before the new
context field remain gradeable until their original expiry, but cannot enter the
new restore flow; no historical keys, scores or attempts are rewritten.

An active question page removes its stored draft at expiry and disables finishing
that expired check. The application boundary also prunes expired drafts on route
changes, focus and a one-minute sweep while the application is open. Background
browser suspension can delay physical storage cleanup; the server rejects expiry
immediately regardless of the browser timer. After expiry the learner can discard
the old check and start another. There is no offline grading or extended deadline.

## Clearing and navigation

Successful submission, explicit discard, normal sign-out and account switch
clear the corresponding draft(s). The global boundary clears on public auth,
demo-entry and landing routes, intercepts the normal logout form, and observes
ordinary Supabase sign-out notifications. It does not read authentication cookies.
Transient verification connection failures do not erase valid answers.

Closing a roadmap assessment dialog pauses its draft; a Resume saved assessment
control reopens it. Its Discard action removes the draft. Navigating between
authenticated learning pages preserves other unexpired slots. A daily result
already saved on the server takes precedence and clears its old daily draft.

`sessionStorage` does not synchronize drafts to another device or independent
tab. Browser duplicate-tab/session-restore behavior may carry an initial copy;
each restore still requires the matching authenticated account, context and
unexpired server token, and existing replay guards prevent a second award.
Sign out when using a shared device. Closing/reopening a browser is not a
guaranteed recovery mechanism.

## Verification

```text
node --import tsx --test tests/assessment-drafts.test.ts tests/assessments.test.ts tests/cloud-submissions.test.ts
npm run test:demo
```

The focused Node checks cover reload data minimization, account switch cleanup,
context changes, forged browser expiry, token tampering, cross-user/purpose
access, malformed/oversized storage, option filtering, background expiry cleanup,
blocked storage and compatibility with older sealed grading. The HTTP demo
journey exercises all four authenticated restore purposes and rejects foreign
users, wrong purposes and changed learning directions. It also retains the
existing grading/replay/score isolation checks.

UI verification remains Chrome-only at the user's request. The implementation
and Node tests do not by themselves claim that refresh, browser storage denial,
offline restore or every screen-reader announcement has been exercised in a
browser. Record completed Chrome walkthrough evidence separately. No Playwright
or axe execution is required or implied by this work.
