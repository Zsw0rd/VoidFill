# Bounded performance validation and operations

This work adds no inference provider, paid plan, backup changes, public test
endpoint or production credential in GitHub Actions. Vercel and Supabase remain
the application runtime. GitHub is the repository's existing CI platform.

## What is implemented

`LearningEngine.encode` now separates public embedding-cache synchronization
from the existing serialized encoder lock. A precomputed public skill query can
complete while another learner's private model encode is running. Actual model
calls remain serialized; private text never enters the public cache, returned
arrays remain independent copies and the cache retains its 512-entry bound.
Weights, pooling, tokenizer, truncation and numerical inference are unchanged.

The concurrency tests use events: the public hit must finish before the blocked
private encoder receives its release. They also check one encode for concurrent
identical misses, serialized private inference and no private cache entries.
This demonstrates removal of a blocking dependency; it is not a production
latency improvement claim or a held-out model-quality evaluation.

## Repeatable authenticated workload

```text
node scripts/load-learning.mjs --help
node scripts/load-learning.mjs --base http://localhost:3000 --clients 4 --rounds 2
node scripts/load-learning.mjs --base https://void-fill.vercel.app --live --clients 4 --rounds 2
```

The staged workload uses 1, 2 and 4 independent sessions. Each round generates
an unsubmitted practice quiz, generates an unsubmitted daily quiz and reads the
practical workspace. It never submits grades, edits profiles, creates evidence,
changes assignments or awards XP. The default measures 42 workload requests;
creating/renewing/ending four demo sessions adds 22 control requests. The script
stops future work after its first failure, throttling or deadline, cancels error
response bodies and explicitly ends every demo it created. Requests already in
flight may finish. Live runs are capped at two rounds; local runs are bounded
at ten rounds. Each request has a timeout and the workload has a three-minute
overall deadline.

Reports contain operation names, numeric client indexes, statuses, durations,
response sizes and parsed numeric application timing. Cookies, account IDs,
tokens, questions, answer keys and evidence are never printed or persisted in
reports. Output stays in ignored `ml/runtime`; existing reports are not replaced.

Real-account mode is separate:

```text
node scripts/load-learning.mjs --base https://void-fill.vercel.app --live --mode real --clients 2 --rounds 2 --sessions ml/runtime/private-test-sessions.json --acknowledge-real-accounts
```

The private input has version `1`, the exact `origin` and a `sessions` array
containing only `cookie` fields. Obtain these short-lived sessions through a
legitimate, operator-authorized Supabase API/SDK login for controlled test users.
Do not extract browser authentication state, use a college/Google account's
password as an application password, send sessions in chat/arguments, or put
the input in source/CI artifacts. This file is sensitive even though reports are
record-free. Delete or replace expired local sessions through the normal private
credential-handling process.

The script verifies each real session using Supabase's `auth.getUser`, rejects
duplicate identities and demo cookies, and requires the configured production
Supabase origin. Real live traffic is limited to two users/two rounds and consumes
their normal assessment budgets. Their quiz tokens remain unsubmitted. A fresh
Google browser signup is not permission or a technical mechanism for exporting
that browser's cookies. When independently authenticated operator sessions are
unavailable, real-account concurrent capacity remains unmeasured.

Every stage/operation reports sample counts, successful-request median, nearest-
rank observed P95, maximum, throttling, auth errors and server errors. Failed fast
requests do not improve the successful latency sample. Small samples, the fixed
stage order, platform scaling, caches and network conditions prevent these short
diagnostics from establishing an SLA or maximum user capacity.

## Recorded baseline before this runtime change

On 7 November 2026, the production application at source `b54e502` passed all 42
measured demo workload requests with peak four requests in flight, zero 5xx/
throttle responses and four of four sessions ended. These are **demo results**;
demo authentication/storage and real-account budget costs differ.

| Concurrent sessions | Measured requests | Successful mixed-workload median | Observed mixed-workload P95 | Workload requests/sec |
| --- | --- | --- | --- | --- |
| 1 | 6 | 647.4 ms | 1,230.4 ms | 1.2 |
| 2 | 12 | 606.5 ms | 1,183.5 ms | 2.6 |
| 4 | 24 | 565.6 ms | 721.7 ms | 5.6 |

The mixed-workload table includes private-workspace reads and quiz generation;
per-operation details are retained in the ignored JSON report. Later stages may
benefit from warming and cannot establish that higher concurrency reduces
latency. This baseline contains no private-resume/uncached-input stress and no
platform-confirmed cold starts. Compare the same workload after publication;
report both runs even if a difference is unfavorable or inconclusive.

## Private runtime and model initialization observations

Existing web request logs now include a random process runtime ID, first-request
observation, process age/uptime, RSS, heap and process CPU delta. Python's private
learning-service logs use the same resource concepts; Linux exposes current RSS
and supported platforms expose peak RSS. Unavailable values are null, not zero.
Separate `learning_engine` and `onnx_session` initialization events identify actual
lazy initialization and its duration. The model can answer curated queries
without loading the ONNX session, so an engine initialization is not necessarily
a weight/session initialization.

No paths, query strings, headers, account identities, resume text, prompts,
answers or evidence enter these events. Raw platform access logs have their own
provider-controlled contents and retention. Process memory/CPU are shared by
concurrent work and must not be interpreted as one request's exclusive resource
usage. A first request observed in a process is not proof of a platform cold
start: pair it with Vercel instance/start data and explicit initialization events.

For an authorized local NDJSON export of those private events:

```text
node scripts/summarize-runtime.mjs --help
Get-Content <private-local-runtime-log.jsonl> | node scripts/summarize-runtime.mjs
npx --yes vercel@65.12.1 logs runtime --environment production --since 10m --limit 100 --query "api_request OR ml_request OR ml_initialization" --json --scope zsw0rds-projects | node scripts/summarize-runtime.mjs
```

The parser whitelists known metadata from direct events or Vercel JSON records
with a JSON `message`, including CLI 65's typed `log.data.message` envelope. It
ignores CLI pagination summaries. Use a window within the actual plan's retention;
the inspected Hobby endpoint rejected one hour and accepted ten minutes. The
parser prints only aggregate operation/resource data, never
the original line or unknown fields. Optional `--memory-mib <verified limit>`
flags observed process memory at 85% of that limit. `--fail-on-alert` exits
nonzero for observed sample 5xx rates of at least 5% with at least three errors
in twenty requests, or a successful sample P95 over five seconds with at least
twenty samples. These are explicit initial diagnostic thresholds, not measured
service objectives or a persistent hosted alert subscription. Sampling and log
retention limit every result. Verify the provisioned limit before supplying it.

## Monitoring on the existing plans

`.github/workflows/production-availability.yml` runs six no-secret public checks
every six hours and supports manual dispatch. It checks the landing, login,
signup and privacy pages; protected learner redirects; and the unauthenticated
assessment boundary. Only failed contracts retry once. A persistent failure
fails the job; public requests over eight seconds produce a warning. The small
record-free JSON report is retained as a CI artifact for three days. The script
needs no npm dependencies or production secrets:

```text
node scripts/check-production.mjs --base https://void-fill.vercel.app --live --output ml/runtime/public-check.json
```

A successful public check proves reachability and unauthenticated boundaries.
It does not prove Google login, Supabase health, authenticated learning,
private inference or capacity. Planned learning maintenance can intentionally
fail its expected 401 assessment-boundary contract with a 503; interpret the
failure against the release window. Scheduled GitHub jobs can be delayed and
are not a continuous uptime SLA. Public-repository schedules may be disabled
after prolonged repository inactivity; check the workflow remains enabled.

Failure delivery uses existing GitHub Actions workflow notifications. Watch the
repository, then in the owner's GitHub **Settings → Notifications → System → Actions**, enable the
desired Email/On GitHub delivery and select failed workflows only if desired.
Use a verified notification email. Repository watching alone is not a substitute
for checking Actions notification preferences. A successful workflow run does
not test email delivery; do not create an artificial production failure or send
test messages to prove it. Record the actual preference verification separately.

Chrome verification on 7 November 2026 found Email, On GitHub and failed-workflow
notifications already selected. The repository was only participating, so the
owner's watch state was changed for `Zsw0rd/VoidFill` alone to All Activity and
verified after reload. GitHub offered no Actions-only repository watch option;
this also permits other activity notifications for this one repository. No token
scope was expanded and no artificial failure or test email was sent. This proves
the channel configuration, not receipt of a failure alert.

The inspected Vercel team is on Hobby. Native anomaly/custom monitors require
Pro/Enterprise with Observability Plus; no paid upgrade, trial, Slack connector
or webhook was enabled. Existing Vercel Observability/Functions views remain
available for inspection. Supabase Studio Reports remain useful for CPU,
connections and query behavior. No external metrics collector was introduced.

Sources checked 7 November 2026: [Vercel alerts](https://vercel.com/docs/alerts),
[custom monitors](https://vercel.com/changelog/create-custom-monitors-in-vercel-observability),
[Vercel Observability](https://vercel.com/docs/observability),
[Supabase metrics](https://supabase.com/docs/guides/observability/metrics),
[GitHub Actions notification preferences](https://docs.github.com/en/subscriptions-and-notifications/how-tos/managing-github-actions-notifications).
