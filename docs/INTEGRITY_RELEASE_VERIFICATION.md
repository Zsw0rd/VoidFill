# Integrity and workflow release verification

Verified locally on 6 November 2026 against temporary native PostgreSQL 17.11,
listening only on loopback. No production database, real accounts or hosted
backup settings were modified by these checks. The matching application release
must apply the ordered SQL before production promotion.

## Database evidence

- A fresh platform fixture, canonical bootstrap, five historical career/cloud
  files and all four current release migrations applied successfully.
- Each current release migration reapplied without losing data.
- The checksum runner applied the release, verified its recorded SHA-256 values,
  and skipped identical files on another upgrade.
- Twelve independent PostgreSQL connections replayed one assessment: one attempt
  and one XP award. Twelve distinct simultaneous assessments retained all awards.
- An injected error at the final ledger insert rolled back the earlier attempt,
  scores and XP. Retrying succeeded once. Actual authenticated roles could not
  forge scores/XP or call privileged mutation RPCs; default login stats still worked.
- A second daily token retained the first completion and returned no mismatched
  per-question review. UTC date-boundary tests cover local/cloud consistency.
- Eight concurrent resume budget calls admitted three; twenty-four concurrent
  practical calls admitted twenty. Other learners retained separate budgets.
- Practical RLS and transaction tests covered private drafts, immutable rubric
  snapshots/reviews, explicit consent, intent-bound retries, assignment changes,
  withdrawal and unchanged knowledge scores/XP. A new assignment was observed
  waiting for an active review transaction and inherited no old consent.
- A real custom-format `pg_dump` archive restored into a separate disposable
  database using official PostgreSQL 17 clients. Every public/auth fixture table
  had the same row count and content fingerprint. RPC grants, direct-write denial
  and authenticated learner RLS isolation survived restore.

The fixture does not test Supabase platform Cron scheduling, production backup
entitlements, PITR, external Storage objects, provider configuration or secrets.
Those remain platform checks. Cluster role objects preexist in the fixture;
per-database dumps preserve their grants rather than recreate Supabase roles.

## Current ordered SQL checksums

| Migration | SHA-256 of UTF-8/LF SQL |
| --- | --- |
| `supabase/migrations/20261106120000_atomic_grading.sql` | `5bed45d841f05ad27a12fe03a8868419f62b863b1ab3957ea21036a809b517e3` |
| `supabase/migrations/20261106130000_practical_learning.sql` | `89f514ddb2c9aec10bd7cfdbbcef7ebd4c5fced49b9d96d96c1fbe34de90c963` |
| `supabase/migrations/20261106140000_operation_limits.sql` | `46a95ea19c02200f5999ea43ecc9085a6a1f796b3ab68f60b6353e3e29e2e7b7` |
| `supabase/migrations/20261106150000_applied_career_paths.sql` | `738ca22a8b805587f6c1a5f096fd6a39434c0598da56df0c444f3a4abb6d3580` |

## Application and CI boundaries

Focused Node tests passed for authentication, exact assessment persistence,
UTC dates, practical permissions/legacy IDs and private operation telemetry.
The real practical server write path was tested with legacy production-style
role UUIDs that deliberately differ from catalogue/demo UUIDs. Five Python
practical workflow tests passed, and TypeScript checking passed after the fixes.

`.github/workflows/verify.yml` uses Node 24, matching the inspected Vercel project.
It runs application checks, independent PostgreSQL checks, a synthetic restore,
serving-model/content checks, the production build, isolated API journeys and
Chromium UX tests with synthetic credentials only. Its YAML was parsed locally.
A hosted GitHub Actions run is not claimed until the committed workflow actually
runs successfully. Root release notes record the broader build/browser results.

Reproduce using `DATABASE_RELEASES.md` and `RELEASE_CHECKLIST.md`. These checks do
not authorize a destructive production reset or an application rollback that
restores browser-controlled progress writes.
