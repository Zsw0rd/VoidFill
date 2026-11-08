# Learner and accessibility pilot protocol

Status: prepared protocol; no participant study has been run. The existing
Chrome walkthroughs are agent verification, not human usability evidence.

## Recruitment and privacy

Start with six to eight consenting adult volunteers: a mix of technical and
non-technical goals, foundation and intermediate experience, mobile and desktop,
and at least one person who regularly uses a screen reader. Do not treat this
convenience sample as representative of all learners or career fields. Use
fictional examples and a disposable demo where possible; demo expiry differs
from normal accounts, so record the environment.

Explain the task, expected 25–35 minute duration, voluntary participation and
the right to stop or skip a question. Ask separately before recording audio,
screens or quotations. No recording is necessary. Do not collect passwords,
Google/MFA challenges, resume files, email addresses, raw chats or private work
in the research record. The participant enters authentication information
directly and the observer pauses recording during sign-in.

Assign neutral IDs such as P01. Store any notes privately outside source control.
Report aggregate observations with sample counts; public screenshots must use
synthetic accounts and text. Do not contact participants or publish their data
automatically through a tool or CI job.

## Task cards

Present each task without pointing out the control to click. Record independent
completion, completion with help, abandonment and the reason for each request
for help. A declined task is not a failure.

| Task | Observation |
| --- | --- |
| Choose a career or describe a personal goal; explain its supported skills | Can the learner distinguish a suggestion from an assigned career and identify missing coverage? |
| Find the next learning step in the atlas | Is the starting point, prerequisite order and resource destination clear? |
| Begin an assessment, select several answers, refresh and return | Does recovery preserve the same assessment/answers without starting another graded attempt? |
| Finish a check and explain the feedback | Does the learner distinguish knowledge feedback, XP and unvalidated career-readiness claims? |
| Save a private practical draft, then inspect mentor sharing | Can the learner predict who sees the work and when it becomes a shared submission? |
| Find account export, recovery guidance and deletion-request status | Are download scope and request-versus-erasure consequences understood? Do not submit an actual deletion request during the pilot. |
| Sign out and return | Does saved progress remain? Does the prior user's unsaved draft disappear from the signed-out surface? |

For a real-account assessment task, agree in advance that one normal attempt may
save progress. Never fabricate grades or replay a token to manufacture success.
Do not intentionally disrupt the production service to test failure handling.
Use an isolated local/demo environment for network interruptions.

## Keyboard and screen-reader session

Use the participant's usual browser/assistive technology and settings. Record
browser, OS, screen reader and versions without a device fingerprint or account
identity. Chrome-only checks remain the automated agent boundary for this work;
do not launch Playwright or inject axe without a separate owner choice.

Check skip navigation, page title and heading discovery, mobile-menu opening and
closing, focus restoration, field names/help/errors, question/answer group context,
question-change announcements, saved-result announcement, draft recovery controls,
and export/deletion-request status messages. Test at browser zoom and narrow width
without assuming physical pixels equal CSS pixels. Ask the participant what was
announced; a DOM role or live-region attribute is not proof of spoken output.

Observe whether recovery notices or disabled controls create a focus dead end.
Do not change Windows security/privacy settings or enter authentication dialogs
on the participant's behalf. An issue reported by one participant is actionable
evidence, not a population prevalence estimate or accessibility certification.

## Private record template

```text
Participant: P__        Environment: local demo / production own account
Goal family: technical / non-technical      Level: foundation / intermediate
Input: keyboard / touch / pointer / screen reader
Task: __
Outcome: independent / helped / abandoned / skipped
Time: __ seconds (exclude authentication and voluntary breaks)
Observed friction: __ (anonymized; no private task content)
Severity: blocks completion / causes a mistake / slows progress / preference
Confidence explaining next action: 1–5
Suggested repair: __
```

Use counts such as “4 of 6 completed independently,” not an unsupported general
success rate. Prioritize blockers, unintended data sharing, lost work and incorrect
expectations before preferences. Write a small, anonymized findings report with
the tested source/deployment and unresolved problems; fix and retest the affected
task. Success in this pilot does not calibrate question difficulty, validate
professional competence or establish service capacity.
