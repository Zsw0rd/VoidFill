# Vercel + Supabase deployment

Production hostname: `https://void-fill.vercel.app`. The existing Vercel project
is `void-fill` in `zsw0rds-projects`; its plan is Hobby.

## Runtime

`vercel.json` defines a Next.js `web` service and a private FastAPI `learning`
service in the same Vercel project. Only `web` has a public rewrite. Its runtime
binding supplies `ML_SERVICE_URL`; the URL helper preserves the binding path.
The model service also requires the shared server-only `ML_SERVICE_TOKEN`.
No inference requests depend on the developer's computer.

Next.js 15.5 runs authentication middleware with the Node.js runtime because
Vercel Services does not support Edge Function output. Server cookies and dynamic
route parameters use the asynchronous request APIs required by this version.
Functions target Singapore (`sin1`), matching the Supabase database region.

The dependency refresh also patches runtime validation and CSS processing.
The most recent recorded dependency audit reported zero vulnerabilities. Run
`npm audit` again on dependency releases; that recorded result is not a permanent
guarantee about later advisories.

The learning service uses ONNX Runtime CPU inference with one CPU thread and a
four-item inference batch limit. It imports no PyTorch or Transformers. The
original BGE model, CLS pooling, tokenizer, 256-token truncation, normalization,
catalogue vectors, source questions and answer keys are preserved. Exact public
queries for supported catalogue skill names and public contexts are precomputed
with the original model. The current corpus/cache metadata is recorded in
`ml/data/careers/index.json`; rebuild it whenever content changes.
Routine recommendations and context-free assessments can use these embeddings
without loading the model graph. Dynamic resume input is never put in that cache.

ONNX and tokenizer libraries load only when a dynamic query needs them. Warm
instances reuse the model and keep a bounded 512-entry cache of public embeddings.
Private assessment context bypasses that cache; question sampling still runs on
each request, so cached embeddings do not turn assessments into cached quizzes.

## Quality and performance evidence

`ml/evaluation-cloud.json` compares the original model with float32 ONNX and a
per-channel int8 candidate. The int8 candidate reduced validation Recall@1 and MRR
and was rejected. Float32 ONNX exactly retained the aggregate validation and test
retrieval metrics on the existing 81/87-query regression benchmark. The selected
test Recall@1 is 74.71%, Recall@5 91.95%, and MRR 0.82310. These are retrieval
metrics on the existing small benchmark, not general learner-outcome accuracy.

The recorded local CPU single-query median is about 84 ms for PyTorch versus
45 ms for float32 ONNX, with one CPU thread. The separate serving benchmark
`ml/evaluation-cloud-serving.json` measures initialization and all six standard
skill recommendations using public precomputed embeddings. These measurements
exclude Vercel platform startup, network, authentication and database time.

## Model artifact delivery

The validated release is a losslessly compressed archive split into nine objects,
each at most 32 MiB, in the public Supabase `model-artifacts` bucket. That bucket
contains public model artifacts only; the existing user-upload bucket was not
made public. `ml/cloud-release.json` records per-object and complete-archive
SHA-256 hashes and source-controlled hashes/sizes for all eight extracted files,
bound to the same verified archive. `ml/cloud_build.py` first verifies the exact
cached file set, sizes and SHA-256 values; a valid cache needs no download. A
missing, modified or extra file causes a fresh download of four shards in
parallel, followed by shard, archive and extracted-file verification before
publication. Symlinks, junctions, duplicate/colliding names and unsafe paths are
rejected. An unbound cache marker is never trusted.

This avoids repeatedly downloading the unchanged 276,954,446-byte archive when
the model directory is restored by GitHub Actions' configured cache or is already
present locally. Vercel build-cache retention of this directory is not assumed;
a fresh deployment still downloads and verifies the archive. Hash checks run at
build time, not on learner requests. The existing archive, nine shards, weights,
tokenizer and public precomputed embeddings are unchanged; no artifact upload
was needed. `ml.package_cloud` derives future file manifests from the completed,
archive-verified ZIP rather than trusting a cached marker.

`ml/tests/test_cloud_build.py` uses tiny synthetic archives to verify no-network
cache hits, recovery from incomplete/tampered caches, checksum failures and path
attacks. These tests are included in hosted CI. User requests do not download
model weights.

The runtime bundle needs Vercel Large Functions (`VERCEL_SUPPORT_LARGE_FUNCTIONS=1`).
The release uses unchanged pretrained BGE weights under MIT; its model card and
license notice are included. Unsuccessful experimental fine-tuned weights and raw
research datasets are excluded. Cloud serving requirements exclude training and
export dependencies.

## Stateless persistence

The historical `supabase/migrations/20261101_cloud_runtime.sql` installed the two
cloud tables with RLS and access only to `service_role`; their RPCs revoke
execution from public, anonymous and authenticated client roles.

- Real assessment replay records use a Supabase ledger instead of local files.
  The current release replaces separate pending-claim/client writes with the
  server-only `vf_commit_assessment` transaction. Attempts, score blending, course
  completion, roadmap progress, XP/streak and the replay result commit together.
  Per-user transaction locks serialize concurrent requests; failures roll back
  and allow a safe retry. Completed tokens return their exact saved result.
- Temporary demos use isolated AES-GCM encrypted snapshots bound to a hashed
  session capability. Database checkout locks serialize changes across function
  instances; no demo session depends on a particular process's RAM.
- A Supabase Cron job deletes expired demo snapshots each minute. Logical access
  expires with the lease immediately; physical cleanup can lag until the next job.
  Another job retains submission ledger/history records for seven days.

The shared server key is stored as a Vercel Secret, never a browser variable or
source-code value. Secrets are scoped to Production and the current feature
branch's Preview environment. Real local learning writes use the same grading
transaction and require the server-only Supabase key. Local guest demos retain
the isolated guest ledger. Apply the current release SQL in the explicit order
from `supabase/migration-manifest.json` before deploying the matching application;
see [database releases](DATABASE_RELEASES.md). Browser write grants/policies on
derived scores, XP, attempts, course completion and roadmap progress are removed.
Default sign-in stats initialization remains restricted to untouched defaults.
This release does not automatically reconcile old partially failed submissions.

## Upload and auth configuration

Resume uploads are limited to 4 MiB in both client and server so multipart requests
fit Vercel's 4.5 MB request limit. Parsing and OCR still run in the Python service.

Google OAuth's audience is External / In production. Its web origin is
`https://void-fill.vercel.app`; Google redirects through the existing Supabase
callback. Supabase Site URL is the production origin and its allowlist includes
`https://void-fill.vercel.app/auth/callback**` plus the existing localhost callbacks.
Google branding points to `/privacy`. The provider requests basic name, email and
profile information; staff authorization still comes from `admin_users`.

## Reproduction and checks

```powershell
npm run ml:export-cloud
# Upload only the new parts named by ml/cloud-release.json to model-artifacts.
.venv-ml/Scripts/python.exe -m ml.cloud_build
$env:ML_BACKEND='onnx'
.venv-ml/Scripts/python.exe -m ml.benchmark_cloud_runtime
.venv-ml/Scripts/python.exe -m pytest ml/tests -m "not offline_training" -q
npm test
npm run lint
```

`npm run test:ml` runs this serving-model selection with ONNX as the default
backend. Tests requiring unpublished local checkpoints, prepared research data
or the historical PyTorch training cache carry the registered `offline_training`
marker. They are not fabricated or silently treated as production evidence.
After preparing the real local research artifacts and dependencies, opt in with
`node scripts/ml.mjs test-offline` (equivalent to
`python -m pytest ml/tests -m offline_training -q`). Plain pytest still includes
these tests unless a marker selection is supplied.

`supabase/tests/cloud_runtime.sql` checks real database grants, replay behavior and
checkout locks using rolled-back synthetic records. Run learner/staff integration
scripts against the deployed app to verify the private binding and shared state.

Platform references: [Vercel Services](https://vercel.com/docs/services),
[service bindings](https://vercel.com/docs/services/bindings),
[function limits](https://vercel.com/docs/functions/limitations),
[Supabase Cron](https://supabase.com/docs/guides/cron).


## Automated release checks

The GitHub workflow verifies Node/TypeScript, a clean PostgreSQL migration and
concurrency test, ONNX/content fingerprints, the production build and isolated
learner/staff journeys without production credentials. See
[release process](RELEASE_CHECKLIST.md). A checked-in workflow must run successfully
on GitHub before it is described as a passing hosted CI check.
