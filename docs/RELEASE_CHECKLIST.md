# Verification and release process

The GitHub Actions workflow `.github/workflows/verify.yml` runs for pull requests,
pushes to `main`, and manual dispatch. Feature changes are checked through their
pull requests, avoiding duplicate push/PR model downloads. It uses no production
credentials, deployment tokens or real user accounts. Workflow token permissions
are read-only. Pull-request code cannot deploy to production through this file.

## Required checks

1. **TypeScript and application checks:** `npm ci`, `npm test`, TypeScript and
   ESLint. Tests exercise grading tokens, authentication, replay, role boundaries,
   career contracts, atlas layout and practical/request-body boundaries. The unit
   runner discovers every `tests/*.test.ts` automatically; the real-model
   `local-integration.test.ts` stays in the separate integration command.
2. **PostgreSQL integrity and migration checks:** fresh installation from the
   explicit manifest, repeatable additive migrations, score/XP write denial,
   injected transaction failure, independent-client concurrency tests, shared
   quotas, checksum-tracked repeated upgrades and a synthetic dump/restore drill.
3. **Model, production build and isolated journeys:** fetch the public checksummed
   model, validate content fingerprints, run ONNX serving/career/guest/staff
   tests, build Next.js and exercise auth, learner, staff and all-career journeys
   against the running production-mode local application. Chromium UX checks run
   on the same synthetic localhost app, never on a real account or production DB.

The model job uses the serving dependency set. Offline training experiments and
their private/untracked checkpoints are not fabricated in CI and are outside
that job. Resource links should be checked separately on content releases with
`scripts/check-career-resources.py`; external site availability is not a reliable
gate for every unrelated code change. Browser visual and accessibility checks
are additional release evidence, not covered by API smoke tests alone.

Synthetic CI passwords are restricted to isolated demos. They are not project
credentials. Failed journey logs are retained for three days; avoid adding
tokens, resume text, personal chat content or server secrets to logging.

## Branch and deployment sequence

Use `codex/**` branches for changes and reviewed pull requests into a canonical
`main`. Preserve the existing remote history; do not force-push to reconcile
historical duplicate commits. Vercel's configured production branch was verified
as `main` through its authenticated API on 6 November 2026. The live release was
manually promoted from `codex/local-ml-resumes-guest-demo`; its feature alias does
not change that setting. Merging into `main` is therefore a production release
operation and must wait for the matching database release. Adding this workflow
alone does not configure GitHub branch protection.

Configure the three named checks above as required for `main` once the workflow
has run successfully. Review a preview built from the exact pull-request head.
Vercel may build independently of GitHub Actions; do not treat a successful
Vercel build as a substitute for the workflow checks. Automatic production
promotion must be configured to respect the agreed release gate, or performed
after the checks by the existing authenticated deployment process.

For database changes, follow `DATABASE_RELEASES.md`: inspect the release SQL,
verify backup/recovery coverage, drain old grading requests, apply the additive
database release and deploy the matching application. Keep the server key only
in server-side environment settings. Never run all historical SQL files on a
live database or expose privileged test endpoints.

## Post-deployment verification

- Confirm the production hostname resolves to the intended source/deployment.
- Run the four integration scripts against the live base URL using private demo
  settings already configured in the local environment; do not print them.
- Verify real-account reads, assignment boundaries and assessment storage without
  awarding synthetic progress to real learners. SQL tests use rolled-back
  synthetic fixtures or a disposable project.
- Inspect grading failures and latency, then verify the new workflow visually on
  mobile and desktop. Record findings and unresolved limits honestly.
- Record the deployment ID, source SHA, migration checksums, checks and rollback
  floor in the release notes. Do not describe a checked-in workflow as a passing
  hosted CI run until GitHub actually reports success.

Google auth, account self-service and Gemini replacement are not changed by this
release. Real Google signup/recovery flows require their own scoped validation
when those features are changed.
