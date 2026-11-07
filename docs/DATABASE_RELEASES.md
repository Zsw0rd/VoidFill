# Database installation and releases

`supabase/migration-manifest.json` is the ordered installation/release manifest.
Do not sort the historical filenames: the career profile columns must exist
before the catalogue seed, even though their filenames share a date prefix.
Do not run every SQL file in this repository. Historical copies overlap.

## Fresh Supabase project

1. Create an empty Supabase project. Its platform supplies `auth.users`, the
   `anon`, `authenticated`, `service_role` roles and the Cron extension.
2. Install PostgreSQL's `psql` client locally. Set `DATABASE_URL` in a private
   local shell to the project's direct/session-pooler PostgreSQL connection URI.
   Never commit it or use a `NEXT_PUBLIC_` variable. Do not paste it into logs.
3. Review the exact plan, then apply it:

   ```text
   node scripts/database.mjs bootstrap
   node scripts/database.mjs bootstrap --apply
   node scripts/database.mjs verify --apply
   ```

The bootstrap refuses an existing `public.profiles` table. It installs
`supabase/bootstrap.sql`, then the manifest's historical and current release
migrations in dependency order. Each SQL file and its checksum commit together.
The baseline contains no owner-specific staff grant and creates no privileged
account. Existing verified auth accounts must be provisioned as staff separately
through the authorized administration process.

`bootstrap.sql` is the consolidated historical schema, including its later chat
policy fixes. It replaces `supabase/actualused/used.sql` for fresh installations.
The latter is an immutable historical record; it contains an account-specific
grant and must not be replayed into a fresh or production project.

No public resume upload bucket is required. The parser processes the file inline
and the user explicitly applies extracted profile fields. Model artifacts use a
separate public `model-artifacts` bucket described in `CLOUD_DEPLOYMENT.md`.

## Existing installation

The existing production database already has the baseline, cloud runtime and
three career cohorts. Confirm that baseline before applying the release:

```text
node scripts/database.mjs upgrade
node scripts/database.mjs upgrade --apply
node scripts/database.mjs verify --apply
```

`upgrade` applies only the manifest's **release** list. It does not replay the
baseline or historical career seed files. It checks for the historical cloud and
career tables/columns first. A table `vf_schema_releases`, inaccessible to browser
roles, records path, SHA-256 and application time. Rerunning the same file skips
it; a changed checksum fails closed. SQL is normalized to UTF-8/LF (without a BOM)
before execution and SHA-256 calculation, so Windows and Linux checkouts agree.
Fix later issues with new migrations.

Apply the database release immediately before the matching application release.
The grading migration removes direct authenticated writes that the older app
used; an old application must not continue accepting graded submissions during
the cutover. Pause assessment entry or use a short maintenance window, drain
in-flight requests, apply SQL, deploy the matching tested application, then run
the authenticated smoke tests. Do not run the legacy bootstrap as an upgrade.

For the first cutover, deploy this transaction-aware application with
`LEARNING_MAINTENANCE=1` before applying SQL. Its learning API wrappers return a
clear HTTP 503/Retry-After without invoking grading, generation, uploads, chat or
practical writes. Authentication and existing read pages remain available. Drain
old requests before changing permissions. Apply and verify all four ordered
release files, then disable the flag and redeploy the same tested source. Confirm
the live learning APIs accept authenticated requests again and run the release
smoke tests. The pause is disabled by default. The first hosted cutover used
`1` for the paused deployment and `0` for normal operation; see the recorded
production evidence in `APPLIED_LEARNING_RELEASE.md`.

For an authenticated Supabase SQL-editor cutover, run
`node scripts/export-release-sql.mjs`. It writes the four ordered files and their
UTF-8/LF checksums to ignored `ml/runtime/applied-learning-release.sql`, wrapped
in one transaction. It never connects to a database. The export refuses to replay
already recorded release paths; a failed transaction can be retried, while an
already-applied release should use the checksum-aware CLI verification flow.
Review the generated SQL, pause/drain writes, verify the snapshot, then execute it
only in the confirmed VoidFill project. The checksum rows commit with the schema.

## Atomic assessment contract

The browser submits an encrypted assessment token and selected answer indices.
The authenticated Next route calls `gradeAssessment`, which checks the owner,
expiry, purpose, exact question set and answer indices and computes scores from
the server-held answer key. Only those computed results go to
`vf_commit_assessment(uuid,uuid,jsonb,jsonb)` using the server-only Supabase key.
No public or authenticated client can execute the RPC.

One PostgreSQL transaction:

- Locks the learner, checks submission ownership and returns exact saved replays.
- Saves a daily/practice/course attempt and course completion where appropriate.
- Blends knowledge scores using the existing 70/30 rule and updates roadmap
  progress using the existing 68/32 knowledge/resource rule.
- Applies practice prerequisite unlocks and the existing XP/level/streak rules.
- Saves the completed replay result with the other changes.

Any failure rolls back all mutations, including the replay record, so the same
valid token can be retried. Concurrent different assessments for one learner
serialize in PostgreSQL, and concurrent copies of one token award once. A second
daily token on the same UTC date returns the existing completion without new XP.
Tokens expire after two hours; the existing seven-day ledger retention exceeds
that lifetime. Previously failed/pending legacy submissions are not automatically
replayed: reconcile any partial historical progress explicitly before retiring
those rows. Existing completed legacy replay records remain readable by the RPC.
The server bounds the transaction HTTP wait to fifteen seconds. A transport
timeout can lose an acknowledgement after the database has committed; its error
therefore says that results could not be confirmed. Retrying the same still-valid
token returns the exact prior result or commits it once, without partial awards.

Browser roles retain their existing read boundaries but lose writes to scores,
attempts, XP, derived roadmap progress and course completions. Sign-in can insert
only its own untouched default stats row, naming only `user_id`; it cannot set XP
or update existing statistics. Generated roadmap/resources are saved by trusted
server routes after deriving the learner ID from authentication. Resume claims,
reflection notes and practical feedback do not award knowledge scores.

Real local development uses the same transaction and requires the server-only
`SUPABASE_SERVICE_ROLE_KEY`. Temporary demos retain their separate encrypted/
isolated guest ledger and synthetic records; no demo record reaches a learner's
real tables.

## Verification

The GitHub workflow creates a disposable PostgreSQL 17 database and applies the
exact baseline, historical SQL and current release manifest. A small fixture
supplies auth roles and `auth.uid()`; Supabase Cron scheduling is excluded from
that local fixture and must be verified on the platform separately.

```text
python -m pip install "psycopg[binary]==3.2.12"
python scripts/test-database.py --allow-test-database
```

This destructive **test bootstrap** accepts only loopback databases named
`voidfill_ci` or `voidfill_test`, and requires an empty application schema. It
checks actual authenticated-role denial, default login bootstrap, exact replay,
cross-owner denial, injected final-write rollback, safe retry, daily uniqueness,
course/score consistency and twelve independent concurrent PostgreSQL clients.
It also reruns release migrations to check repeatability, runs the practical and
operation-limit SQL suites, and verifies eight concurrent resume requests admit
exactly three requests without consuming another learner's budget. A 24-way
practical-write burst admits exactly twenty, and concurrent review/reassignment
transactions are checked for serialization and fresh-consent isolation. Never use a
production URI for this script. The grading SQL checks live in
`supabase/tests/atomic_grading.sql`.

On this Windows workspace Docker's PostgreSQL daemon was unavailable. Temporary
native PostgreSQL 17 binaries were started on loopback instead. The full fresh
schema, release replay, integrity, independent-connection concurrency, quota and
checksum-runner checks passed against that real PostgreSQL server. Grading and
practical RLS were additionally checked in an isolated PostgreSQL WASM runtime.

## Synthetic restore rehearsal

`scripts/test-database-restore.py --allow-test-database` accepts only the same
loopback test database names and restores a custom-format `pg_dump` archive into
a new `<source>_restored` database. It refuses an existing target. PostgreSQL's
matching-version `pg_dump` and `pg_restore` clients must be on `PATH`. CI uses the
disposable server container's own clients through `POSTGRES_TEST_CONTAINER`.

The rehearsal compares row counts and content fingerprints of every `public`
and fixture `auth` table, function grants, protected write denial and actual
authenticated RLS isolation after restore. The Windows native PostgreSQL run
passed this rehearsal with official PostgreSQL 17 clients. The local temporary
archive is removed when the script ends. The restored database contains only
synthetic test records.

This proves the application schema/data can be restored in the fixture. It is
not evidence that production backups, PITR or project-wide recovery are enabled.
Supabase-managed role objects already exist on the test cluster; a per-database
dump preserves their grants but does not recreate cluster roles. A real recovery
plan must also address platform Auth, Storage objects, Cron, configuration and
secrets using the platform's documented backup coverage.

## Rollback

Take a verified platform backup before release and record the deployment and
schema checksums. There is no automatic destructive down migration. After the
grading privilege change, do not roll back to an application that performs
client-authorized progress writes. Keep the tested transaction-aware application
as the rollback floor, or deploy a forward fix. Preserve learner history and
replay records. Never restore broad client write permissions merely to make an
older application work.
