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
The remaining npm audit findings are moderate issues in the development lint
dependency tree; no high or critical findings remain in the checked lockfile.

The learning service uses ONNX Runtime CPU inference with one CPU thread and a
four-item inference batch limit. It imports no PyTorch or Transformers. The
original BGE model, CLS pooling, tokenizer, 256-token truncation, normalization,
catalogue vectors, source questions and answer keys are preserved. Exact public
queries for the app's six skill names are precomputed with the original model.
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
SHA-256 hashes. `ml/cloud_build.py` downloads four shards concurrently, verifies
every checksum and rejects archive paths escaping the model directory. It runs
at deployment build time. User requests do not download model weights.

The runtime bundle needs Vercel Large Functions (`VERCEL_SUPPORT_LARGE_FUNCTIONS=1`).
The release uses unchanged pretrained BGE weights under MIT; its model card and
license notice are included. Unsuccessful experimental fine-tuned weights and raw
research datasets are excluded. Cloud serving requirements exclude training and
export dependencies.

## Stateless persistence

Apply `supabase/migrations/20261101_cloud_runtime.sql` before deployment. The two
new tables enable RLS and grant access only to `service_role`; their RPCs revoke
execution from public, anonymous and authenticated client roles.

- Real assessment replay records use a Supabase ledger instead of local files.
  A per-user pending claim serializes different assessments and prevents concurrent
  read/modify/write XP races through the application routes. Completed tokens
  return their stored result; failed partial writes are not rerun automatically.
- Temporary demos use isolated AES-GCM encrypted snapshots bound to a hashed
  session capability. Database checkout locks serialize changes across function
  instances; no demo session depends on a particular process's RAM.
- A Supabase Cron job deletes expired demo snapshots each minute. Logical access
  expires with the lease immediately; physical cleanup can lag until the next job.
  Another job retains submission ledger/history records for seven days.

The shared server key is stored as a Vercel Secret, never a browser variable or
source-code value. Secrets are scoped to Production and the current feature
branch's Preview environment. Local development retains its local guest store
and filesystem ledger. Existing direct client progress-write policies and fully
transactional grading remain separate integrity-hardening work; this migration
does not claim to replace all grading mutations with an atomic SQL transaction.

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
.venv-ml/Scripts/python.exe -m pytest ml/tests -q
npm test
npm run lint
```

`supabase/tests/cloud_runtime.sql` checks real database grants, replay behavior and
checkout locks using rolled-back synthetic records. Run learner/staff integration
scripts against the deployed app to verify the private binding and shared state.

Platform references: [Vercel Services](https://vercel.com/docs/services),
[service bindings](https://vercel.com/docs/services/bindings),
[function limits](https://vercel.com/docs/functions/limitations),
[Supabase Cron](https://supabase.com/docs/guides/cron).
