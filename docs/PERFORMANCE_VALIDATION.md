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

The current follow-up starts adaptive history reads alongside independent
profile/requirements reads when preparing daily/practice assessments. Owner
verification and request-budget checks still precede them; level caps, grading
and saved progress are unchanged. A blocked-profile concurrency regression proves
that history starts before that profile resolves. Actual hosted measurements
belong in the release record; removing a dependency alone does not prove a speedup.

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

## Explicit private-inference fixture

```text
node scripts/load-learning.mjs --base http://localhost:3000 --workload resume --clients 2 --rounds 2
node scripts/load-learning.mjs --base https://void-fill.vercel.app --live --workload resume --clients 2 --rounds 2
```

The optional resume workload adds a fictional one-page text PDF before each core
round: 24 workload requests across one/two-client stages, including six resume
parses with a distinct synthetic summary marker reaching the private encoder.
It never applies extracted fields, submits a quiz or saves a project. This mode
allows at most two clients, matching the existing parser admission bound. The
default core workload and its live caps are unchanged. Real mode additionally
requires the same verified, independently authenticated sessions and consumes
normal resume/assessment budgets.

The fixture is independently decoded with the actual PDF parser in CI. Reports
contain only fixed operation labels, numeric status/timing/size data and scope
metadata; parsed text, role suggestions, source PDFs, cookies and sealed tokens
are not copied into them. PDF generation rejects arbitrary input and uses no
real identity or document. These cases do not establish OCR, scanned-document,
maximum-size-file or unrestricted-user capacity.

All operations receive the smaller of their per-request timeout and remaining
workload budget. Body consumption and the final successful response are checked
against that budget too. A run outside its deadline cannot report success merely
because every completed response was HTTP 200. Failure evidence is retained;
no retries hide saturation or native crashes.

## Concurrent PDF extraction

The 8 November hosted private-inference baseline passed its one-client stage but
returned two HTTP 503 responses on simultaneous PDFs; the platform log recorded
`SIGSEGV`. The bounded probe stopped after ten total requests and ended both demo
sessions. The baseline failure is retained in ignored performance evidence.

PDFium is process-global and explicitly not thread-safe, including different
documents. Resume extraction now holds a dedicated process mutex across native
document creation, text/render calls and cleanup. Rendered bitmaps close even
when OCR fails. DOCX handling, public-cache synchronization and the encoder's
existing lock retain their own behavior. Parser admission, document bounds and
model quality are unchanged.

Tests prove a second document cannot enter a blocked native lifetime, lock release
on failure, bitmap/page cleanup before native document exit, and distinct text
from sixteen real PDFs under four parallel callers. The actual hosted mixed
resume workload must pass after deployment before the production repair is
claimed verified. Primary guidance: [PDFium thread incompatibility](https://pypdfium2-team.github.io/pypdfium2/python_api.html#thread-incompatibility).

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

### Published 8 November follow-up measurements

The `0a30ce3` production release passed the same 42-request demo workload with
four of four disposable sessions ended, no errors/throttles and peak four in
flight. At 1/2/4 clients its mixed medians were 612.1/559.1/566.9 ms; observed
sample P95 values were 733.5/1,108.1/762.8 ms. Compared with the baseline above,
the four-client median was essentially unchanged. Ordered, short runs with
different platform/network/cache conditions do not establish a causal speedup.

A separate normal Google/Supabase SDK login for two distinct controlled accounts
allowed an 18-request authenticated production probe. No browser cookies were
extracted and no credential file was written. All requests succeeded, peak
concurrency was two, and both newly created SDK sessions were ended with local
session scope. Existing browser sessions, grades, XP, evidence and profiles were
unchanged by this probe. The two-client stage had 12 samples, mixed median
333.4 ms and maximum 685.4 ms. The first one-client practice request took
4,958.1 ms; do not omit it or call the full journey uniformly subsecond.

A sanitized ten-minute platform sample contained 24 successful request events
and one successful learning-engine initialization at 148.4 ms. Maximum observed
process RSS was about 129.7 MiB for web and 99.4 MiB for learning. The model graph
was not necessarily loaded: curated queries need no ONNX session. Process memory
is shared and sampling is incomplete. No diagnostic threshold fired in this
window; this is not proof of a provisioned memory margin or an uptime SLA.

These results, hosted CI run IDs and production deployment ID are retained in
[PR 9](https://github.com/Zsw0rd/VoidFill/pull/9). They establish the measured
workloads, not maximum capacity or support for arbitrary numbers of real users.

### Broader local-only workload

The follow-up harness supports up to sixteen disposable demo clients on an HTTP
loopback origin, with stages 1, 2, 4, 8 and 16. For example:

```text
node scripts/load-learning.mjs --base http://localhost:3000 --clients 16 --rounds 4
```

This is 372 unsubmitted generation/read requests, plus demo setup/lease/cleanup.
The three-minute overall deadline, request deadlines, stop-on-first-failure and
private report policy still apply. Production remains capped at four demo or
two real clients and two rounds; an HTTPS production origin cannot enable the
sixteen-client loopback plan. Real-account mode cannot use the expanded limit.

For a paced local follow-up use `--clients 16 --rounds 10 --pause-ms 2000`.
It schedules 930 workload requests and ninety seconds of inter-round pauses
across the five stages. Request duration excludes these pauses; stage duration
and throughput include them, so paced throughput must not be compared to a
no-pause burst as a speedup/regression. Pauses are limited to two seconds and
rejected outside loopback disposable-demo mode. The same overall deadline can
stop a slow run; record that failure rather than raising limits to hide it.

Paced local runs renew every configured disposable session before each stage,
including clients waiting for their first active stage. Normal per-round leases
also continue. Otherwise late-stage clients could expire while waiting even when
all learning requests succeed. Application expiry is unchanged. The report
separately counts start/lease/end control requests; these are not workload
latencies or a real-account capacity measurement. Burst and live probe traffic
does not use this additional between-stage renewal.

Run against the rebuilt production-mode local app without concurrent model
indexing, builds or other probes. Record CPU/model/runtime conditions and all
errors, including demo capacity and cleanup failures. A local synthetic result
does not include cloud scaling, hosted Supabase authentication/storage or real
account quota costs. It cannot be relabelled as a production capacity result.

The new release's actual local result belongs in its release report after the
run; the command and its unit tests alone are not a measured application pass.

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
