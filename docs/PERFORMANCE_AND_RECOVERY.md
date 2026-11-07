# Performance, request budgets and recovery

This release keeps the existing float32 ONNX model, pooling, tokenizer and token
limit. It adds no inference provider and does not quantize the weights. Account
self-service and the existing Gemini chat dependency are outside this release.

## Measured starting point

The pre-change production probe on 2026-11-06 made three sequential requests per
operation using one disposable demo session, which was explicitly ended afterward.
Recommendations had a 709 ms median, question generation 731 ms, and learning
analysis 753 ms from the developer's network. First-observed requests were
1,898 / 1,662 / 1,086 ms respectively. All nine returned HTTP 200.

This is a small diagnostic sample, **not** a capacity benchmark, stable P95,
confirmed cold-start measurement or service-level commitment. Demo storage and
authentication differ from real-account costs. No real learner records were used.

Reproduce a bounded local probe with `npm run test:latency`. Production requires
an explicit `--live --base https://void-fill.vercel.app`; the script refuses other
remote origins. It accepts 2–8 samples per operation, logs no cookies or request
bodies, and cleans up its disposable session. The server-only demo entry key is
read from the existing local environment, never sent through command arguments.

## Changes and boundaries

- Existing 408 public query embeddings and the bounded embedding cache remain;
  private resume/assessment context is not added to this cache.
- Profile charts are loaded as a separate client chunk, keeping the charting
  library out of the initial profile form bundle. They keep the existing scores,
  targets and chart dimensions; a loading state reserves space.
- Expensive authenticated APIs emit one structured event with operation,
  generated request ID, status and duration. They also return `X-Request-Id` and
  `Server-Timing`. These events contain no account ID, email, IP, input text,
  query string, cookie or assessment answer. Existing provider access logs have
  their own platform-controlled retention.
- These APIs reject cross-origin browser requests and return private/no-store
  responses. Missing Origin remains compatible with authenticated scripts.

Shared budgets are enforced by Supabase transactions across Vercel instances:

| Operation | Short window | Daily window (UTC fixed windows) |
| --- | --- | --- |
| Assessment generation, across daily/practice/course/skill | 30 per 15 minutes | 240 |
| Resource recommendations | 15 per 5 minutes | 120 |
| Learning insights | 10 per 5 minutes | 80 |
| Resume parsing | 3 per 5 minutes | 20 |
| Existing AI chat | 12 per minute | 120 |
| Practical draft saves, submissions, withdrawals and reviews | 20 per 5 minutes | 120 |

Only server code can consume or inspect these budgets. It supplies the identity
returned by verified authentication; client bodies cannot choose another user.
Rejected requests return HTTP 429 and `Retry-After`. If shared budget storage
cannot be checked, expensive operations return 503 rather than bypassing limits.
Requests consume budget even if later validation/inference fails. Assessment
submission/replay is outside these generation quotas so safe retries can recover.
Practical workspace reads remain unthrottled; only its mutations consume the
practical budget. Twenty-four concurrent practical calls are checked to admit
exactly twenty, independently of another learner.

Disposable demos retain their separate capability/lease/storage controls and do
not consume real-account budgets. A request must authenticate its demo capability
before reaching that branch. These controls do not claim to stop distributed
abuse across many new accounts or to establish aggregate project capacity.

Budget rows expire after their window plus one day. If pg_cron is present, the
migration schedules hourly bounded cleanup (up to 10,000 rows per run). Without
it, an operator must schedule `select public.vf_prune_operation_budgets();` using
the existing Supabase facilities. Expired rows never continue blocking a user.

## Recovery verification

The isolated PostgreSQL test runner checks clean setup, repeatable upgrades,
rollback after an injected grading failure, exact retries and concurrent writes.
The restore runner creates a custom-format dump of synthetic public/Auth-fixture
data, restores into a separate disposable database, compares every table's data
fingerprint and verifies RPC grants and row-level access restrictions.

Run `npm run test:db` followed by `npm run test:db:restore` against a disposable
loopback database named `voidfill_ci` or `voidfill_test`; the scripts reject remote
databases. PostgreSQL clients and the documented Python test dependency are
required. Dumps are temporary and removed by the test runner. No production data
or credentials belong in the public repository or CI artifacts.

This proves the application restore procedure against a local platform fixture.
It does **not** establish hosted recovery points, Storage recovery or restoration
of Auth-provider/project configuration. On 6 November 2026 the authenticated
Supabase dashboard was inspected: the project was on the Free plan, displayed
"No backups", and its backup page stated that Free does not include project
backups. No paid backup/PITR feature was enabled.

## Encrypted pre-release learning snapshot

`scripts/learning-snapshot.mjs` provides a separate, read-only logical export of
the affected learning records. It is useful before an additive upgrade; it is
**not** a full PostgreSQL/Auth/Storage backup or a point-in-time snapshot. Pause
and drain application writes first, using the documented maintenance cutover.
Counts are checked during pagination and again after all tables; unchanged counts
cannot detect concurrent edits, so the pause is a required operator condition.

```text
node scripts/learning-snapshot.mjs --help
node scripts/learning-snapshot.mjs --capture --confirm-project <public-project-ref> --writes-paused
node scripts/learning-snapshot.mjs --inspect <path-to-snapshot.vfs>
```

If the server-role credential is unavailable locally, use the existing
authenticated Supabase SQL Editor instead of retrieving a protected Vercel secret:

```text
node scripts/learning-snapshot.mjs --export-sql --confirm-project <public-project-ref>
node scripts/learning-snapshot.mjs --import-csv <downloaded-file.csv> --confirm-project <public-project-ref> --writes-paused
```

The first command only writes public query text to the Git-ignored file
`ml/runtime/learning-snapshot.sql`; it uses no credentials and makes no network
request. Verify the browser's project address, then execute that exact query in
the authorized SQL Editor. It runs one SELECT inside a read-only repeatable-read
transaction, orders every table by its primary key and returns one
`snapshot_base64` value containing all 16 table arrays and explicit counts. This
path gives a consistent database transaction view rather than the API export's
separate reads. It still omits Auth, Storage, schema and the other excluded data.

Use Download CSV on that SELECT result, then import the downloaded file directly;
do not copy its data into chat, source files or the clipboard. **Base64 is not
encryption:** the downloaded CSV contains plaintext learning records. Offline
import strictly checks the single column/single row, canonical base64, project,
format version, exact table set, counts, profile projection, primary-key order
and existing export bounds before canonicalizing and encrypting it. It requires
only the existing local ML secret, makes no network request and prints no records.
After successful `.vfs` verification, explicitly remove only the downloaded
plaintext file created for this export. The importer deliberately does not delete
an operator-supplied file automatically.

The API capture command uses the existing server-only Supabase credential and must
exactly match the configured HTTPS project origin. It requires explicit capture,
project confirmation and writes-paused flags. Default/help and offline inspection
make no remote requests. Capture reads selected profiles' career fields, career
metadata, progress, attempts/answer rows, roadmap/course completion and the old
submission ledger. It excludes Auth records, staff/chat, resumes, private
reflections and the new practical tables that do not exist before this release.
Existing referenced Auth/resource/question records and the database schema are
outside this export; this file alone cannot rebuild a lost Supabase project.

Pagination advances by the number actually returned, so a project API row cap
below the requested page size cannot silently truncate an export. Required-table
read/count failures, count drift, missing/duplicate/out-of-order primary keys,
unexpected profile fields, an empty career catalogue, more than 250,000 total
rows or more than 64 MiB of serialized data cause failure without a published
snapshot. Individual API calls time out after 15 seconds. These limits describe
the logical export, not a strict bound on JavaScript process memory.

The file is compressed and encrypted using AES-256-GCM with a fresh salt/nonce;
HKDF-SHA256 derives its key from the existing `ML_ASSESSMENT_SECRET`, or
`ML_SERVICE_TOKEN` when the separate secret is absent. An authenticated plaintext
SHA-256 and each table's digest are checked during decryption. Output is restricted
to Git-ignored `ml/runtime/backups/*.vfs` (optional subdirectories), avoids
symlink/junction parents and existing-file overwrite, and is verified after
atomic publication. Summary output contains only dates, counts and digests;
records and keys are never printed. There is no automatic restore or database
mutation mode.

Keep the original server secret available through the authorized secret store:
rotating or losing it without retaining access makes older snapshots unreadable.
The local file survives independently of the hosted project but remains on the
developer's computer. Keep an access-controlled encrypted copy in an approved
backup location outside this public repository, verify it periodically, and
choose retention/recovery objectives explicitly. This command does not configure
recurring backups or upload the file to another provider. No production snapshot
is claimed until the operator runs capture and verifies its returned summary.

The default Node test suite exercises read-only SQL generation, strict CSV import
and offline CLI import without a Supabase key, capped pagination, count drift, primary-key
and profile boundaries, aggregate size limits, authenticated tamper rejection,
wrong keys, path escape/alternate-stream guards, real symlink/junction parents,
overwrite denial, CLI help/access guards and offline summary inspection using
synthetic local fixtures only.

Before broad public rollout, address the verified hosted-backup gap, record
recovery point/time objectives and rehearse restoration to an isolated target.
Keep an encrypted backup outside the production project, with controlled access;
never place it in this public repository. Configuration and public model artifacts
need their own recovery inventory. Do not restore into the live project to test.

## Operational follow-up

Use Vercel's existing function views to distinguish platform cold starts from
application timing. Measure actual signed-in flows under a planned concurrent-user
workload before choosing a latency target or increasing limits. Inspect slow
Supabase query plans before adding indexes. Paid monitoring or hosting changes
require a separate decision; this release enables none.

References: [Vercel Observability](https://vercel.com/docs/observability/insights),
[Supabase backups](https://supabase.com/docs/guides/platform/backups),
[Supabase RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security).
