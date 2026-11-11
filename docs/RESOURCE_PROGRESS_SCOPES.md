# Reviewed guides and roadmap progress

Roadmap progress keeps the existing formula: 68% skill mastery plus 32% completed
instructional resources. A URL classified as an ungraded guide contributes to
neither the completed-resource numerator nor the resource denominator. This
applies whether a historical course row says the guide is complete or incomplete.
If no counted resources remain, the resource fraction is zero: mastery of 100
still produces progress of 68, as it did for an empty course list before this change.

Opening a guide does not complete a course, award XP or write progress. Existing
course rows, assessment history, XP, scores and submission replay results are kept.
New guide assessments are prevented at generation; a sealed assessment issued
before reclassification can still be graded and replayed. Its historical course
completion is retained but does not add guide-based resource progress.

Unknown or null legacy URLs keep their previous counted-resource behaviour.
Membership is exact after trimming surrounding ECMAScript whitespace. URLs are
not redirected, lowercased or rewritten; query strings and fragments are distinct.

## Application and database projections

- `lib/roadmapProgress.ts` supplies the pure client/server calculation.
- Demo score updates and roadmap refresh fetch course URLs for that calculation.
- The dashboard derives display progress from current scores and course rows,
  rather than displaying stale stored progress after a scope change. Failed reads
  show the existing partial-load notice and withhold those roadmap suggestions.
- Real assessment grading filters the same guide membership inside the existing
  `vf_commit_assessment` transaction. Lock ordering, validation, score blending,
  XP awards and idempotent replay are unchanged.

There is no stored-value backfill. Stored roadmap progress is refreshed by the
existing explicit refresh or a subsequent assessment. Account exports and logical
snapshots continue to include the stored historical values.

`ml/data/lessons/resource-scopes.json` is the public metadata source.
The compiler projects the URL sets into `resource-display-index.json` for
`lib/resourceLearningScope.ts`. The database
uses a separate `vf_ungraded_resource_urls` table containing only the sorted URL
projection. Anonymous and authenticated clients cannot access or change this table;
the application service role can read it but cannot redefine membership. Reviewed
migrations own its updates. `vf_resource_url_key` matches JavaScript's whitespace
trimming, including tabs, nonbreaking spaces and the BOM.

## Migration order

Apply these **after the existing atomic-grading migration and before the matching
application release**:

1. `20261110130000_resource_progress_scope.sql`: creates the private classification
   table and URL-key helper, then replaces the grading function with the same body
   plus one resource-count predicate.
2. `20261110130100_ungraded_resource_seed.sql`: fills the classification table from
   the reviewed public scope metadata in one transaction.
3. Release the matching application and verify the scope-aware display/refresh.

Both migrations are listed in `supabase/migration-manifest.json`. Existing
installations can use the checksum-aware database runner. For the Supabase SQL
editor, generate the upgrade with `node scripts/export-release-sql.mjs --resource-progress`.
It writes `ml/runtime/resource-progress-release.sql` and prints its hash. The
export verifies the earlier recorded checksums, then applies the function and
seed together in one transaction. Apply the upgrade before publishing the app.
Existing clients can still submit assessments during this upgrade.

Before release, verify the deterministic projection:

```text
node scripts/generate-resource-scope-sql.mjs --check
```

The check fails if URL membership changes without a matching SQL seed. Changes to
descriptions, related lesson labels or other metadata do not unnecessarily alter
the URL seed. Its header records the SHA256 of the sorted URL projection. Values
are validated as public HTTPS URLs without credentials and safely quoted as SQL
literals; each URL is bounded to 2048 UTF-8 bytes for the primary-key index.

The generator refuses to overwrite a different output. An initial seed that has
**never been applied** may be explicitly replaced during review. Once a seed has
been deployed, retain its bytes and checksum. Generate the next snapshot into a
new timestamped migration, for example:

```text
node scripts/generate-resource-scope-sql.mjs --output supabase/migrations/20261111130100_ungraded_resource_seed.sql
```

Review it, append it to the release manifest after earlier seeds, and advance the
generator's `RESOURCE_SCOPE_SEED` pointer to that new migration so the ordinary
`--check` and unit tests verify the current snapshot. Each snapshot atomically
replaces only the private URL membership table. It never removes learner records.

## Verification

```text
node --import tsx --test tests/roadmap-progress.test.ts tests/resource-scope-sql.test.ts
python scripts/test-database.py --allow-test-database
```

The database command requires the documented empty, disposable loopback
`voidfill_ci` or `voidfill_test` database and an updated release manifest. The
harness runs `supabase/tests/resource_progress_scope.sql` alongside the existing
atomic-grading checks. Synthetic data and scope additions roll back.

On 10 November 2026, an isolated native PostgreSQL 17.11 run passed baseline and
historical setup, both new migrations, repeat application of release migrations,
the original atomic-grading assertions and the new scope assertions. Those cover
guide numerator/denominator exclusion, the all-guide 68% case, foreign-owner
isolation, unchanged historic completions, no automatic completion/XP, old sealed
guide sessions and exact replay. Local verification does not claim a hosted
migration has been applied or that human usability validation is complete.
