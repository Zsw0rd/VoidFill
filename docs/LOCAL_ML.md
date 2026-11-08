# VoidFill local ML

This document retains the local research/training history. Current deployment,
database integrity and release status are summarized in
[project status](PROJECT_STATUS.md) and [cloud deployment](CLOUD_DEPLOYMENT.md).

The latest experiment is **v3**, a larger BGE-base encoder with full-lesson passage
retrieval. See `LARGER_MODEL.md` and `ml/evaluation-v3.json` for the parameter/data
increase, comparison and the distinction between pretrained and fine-tuned
checkpoints. The v2 section below preserves earlier results. Resume
ingestion and the private guest demo are described in `RESUMES_AND_DEMO.md`.

The production serving export preserves this BGE model in float32 ONNX, uses
precomputed public embeddings and runs as a private Vercel service. See
[CLOUD_DEPLOYMENT.md](CLOUD_DEPLOYMENT.md) and the cloud evaluation JSON files
for configuration and measured quality/performance.

## What runs locally

All learning routes use a local embedding encoder through the Python service.
The larger-model experiment compares BGE-base against the previous fine-tuned
MiniLM encoder. Course recommendations retrieve existing catalogue items.
Daily, practice, course and skill assessments retrieve source questions with known
answer keys. Insights use numerical gap calculations, template explanations and
model-retrieved resources. This encoder does not generate new prose or new MCQs.

The mentor chatbot and its moderation still use Gemini. Its route and UI were not
changed. A Gemini key is no longer needed for any other learning feature.

## Original dataset and v1 training

The source dataset combines Microsoft's MIT-licensed Web Development, Machine
Learning, Data Science and AI for Beginners curricula. The exact Git revisions
are pinned in `ml/data/sources.lock.json`. Historical snapshots retain the author's
explicit quiz-to-lesson links, which provide the retrieval training labels.

- 142 imported lesson resources plus 16 original catalogue descriptions: **158 resources**.
- 551 imported questions plus 60 original supplementary questions: **611 questions**.
- **551 original quiz-to-lesson training pairs**, with no generated relevance labels.
- 383 training queries from 65 lessons; 81 validation queries from 14 lessons;
  87 test queries from 14 lessons.
- Entire lessons are assigned to one split. Duplicate source questions are removed.
- Supplements cover the six skills in the application's seed and are excluded from
  both training and reported evaluation. They are original authored content, not
  independently expert-reviewed questions.

`ml/prepare_data.py` downloads Markdown and JSON as data. It does not execute
downloaded source code. Original source notices are retained under `ml/licenses/`.
`ml/data/manifest.json` records import counts and rejected rows. The supplementary
catalogue URLs were checked successfully; results are in `catalogue_url_check.json`.

Training uses Multiple Negatives Ranking Loss, batches without duplicate positive
lessons, batch size 16, learning rate 0.00002, seed 42, and eight epochs. The
checkpoint is selected by validation MRR, not by test results. The selected run
changed the model weights and trained on the local RTX 3060. Full parameters,
per-epoch losses, metrics, model revision and dataset checksum are in
`ml/evaluation.json`. The base encoder is Apache-2.0 licensed.

Held-out exact linked-lesson retrieval on 87 questions:

| Metric | Original MiniLM | Fine-tuned MiniLM |
| --- | ---: | ---: |
| Recall@1 | 41.38% | 45.98% |
| Recall@5 | 64.37% | 73.56% |
| MRR | 0.5227 | 0.5698 |

These are small-sample retrieval results, not estimates of learner improvement,
skill proficiency accuracy or question-answer correctness. Validation MRR improved
but validation Recall@5 fell from 81.48% to 79.01%; fine-tuning does not improve every
metric. The test set was not used for checkpoint selection. A related lesson may
also be useful even when the exact source lesson is ranked lower.

## Expanded training and v2 results

The [Sentence Transformers Stack Exchange duplicate-pair dataset](https://huggingface.co/datasets/sentence-transformers/stackexchange-duplicates)
contains 304,525 title pairs. The pinned revision and file checksum are in
`ml/data/expanded_manifest.json`. Technical keyword filtering, length checks and
unique normalized title endpoints retain 13,048 pairs: **12,048 training pairs**
and 1,000 reserved auxiliary validation pairs. These are similarity examples,
not new MCQs; the product question bank remains 611 questions. Stack Exchange
content has CC BY-SA terms varying by post date. This export lacks per-post
authors/URLs, so raw data and derived checkpoints are local research artifacts;
resolve attribution before redistribution. Raw third-party text is ignored by Git.

`train_expanded.py` continues v1 for three epochs with technical duplicate pairs
and curriculum rehearsal. That stage alone reduced validation MRR, so it was not
deployed. `train_passages.py` then adapts those expanded-data weights using 2,832
task examples from the original 65 training lessons: source-authored headings and
excerpts plus repeated author quiz links. Passage selection for quiz positives
uses the frozen v1 encoder. This is weak/self supervision, not independent human
relevance annotation. Validation/test lesson text supplies retrieval candidates
only; their questions and adaptation examples never enter training.

The selected adaptation checkpoint is epoch 5 of eight predefined epochs, selected
by validation MRR. Adaptation uses seed 43, batch 24, learning rate 0.000008.
Inference indexes 140-word windows with stride 110 across full lesson text,
instead of encoding only the introduction. All comparisons use the same 87-query
regression test; this already-reported benchmark is not a new blind test.

| Test metric | Previous deployed v1 | v1 weights + passage indexing | v2 weights + passage indexing |
| --- | ---: | ---: | ---: |
| Recall@1 | 45.98% | 67.82% | **68.97%** |
| Recall@5 | 73.56% | **90.80%** | 87.36% |
| MRR | 0.5698 | 0.7775 | **0.7799** |

Most of the gain is from indexing complete lessons. Fine-tuning gives a smaller
top-one/MRR improvement over the passage baseline, with lower test Recall@5.
Validation MRR rises from 0.7842 to 0.8139 over the same passage baseline. Test
results are inspected after checkpoint selection; they do not choose epochs.
These numbers measure exact linked-lesson retrieval, not resume extraction,
learner competence, question correctness or career suitability. A larger fresh
human-labelled evaluation set remains necessary for a strong accuracy claim.

Reproduce both expanded stages after preparing/training v1:

```bash
npm run ml:train-expanded
```

The v1 backup is preserved under `ml/artifacts/retriever-v1/`; the active model is
`ml/artifacts/retriever/`. Restart the local service after retraining so its
embeddings and checkpoint match. Training and serving should not concurrently
replace a checkpoint directory in production.

## Local setup

Use Python 3.12 for the locked environment tested on Windows. Node and npm are also
required. Optionally set `ML_PYTHON` to the base Python executable for environment
creation. On a new checkout:

```bash
npm install
npm run ml:setup
npm run ml:prepare
npm run ml:train
npm run dev
```

Setup creates `.venv-ml`, installs PyTorch 2.11.0 using the CUDA 12.8 wheel index
when `nvidia-smi` is available, otherwise the CPU index, then installs the locked
Python dependencies. An NVIDIA card must support the selected PyTorch CUDA build;
CPU setup can instead be performed manually with the CPU wheel index. No driver
or system-wide Python settings are changed.

The installed workspace already has the trained checkpoint under
`ml/artifacts/retriever/`. Model downloads are approximately 90 MB; the CUDA
PyTorch installation is substantially larger. Generated artifacts and source
download caches are ignored by Git. A fresh clone recreates them with the commands
above. `ml/requirements.lock.txt` records the tested Python dependency versions;
PyTorch is installed separately to select the platform's CPU/CUDA build.

`npm run dev` starts Python on `127.0.0.1:8010`, waits for model readiness, then starts
Next.js. It reuses an already running compatible service. `npm run start` does the
same for a previously built production website. Use `npm run dev:ml` or
`npm run dev:web` to run them separately. Stop launched processes with Ctrl+C.

Environment settings:

| Variable | Purpose |
| --- | --- |
| `ML_SERVICE_URL` | Server-side service URL, default `http://127.0.0.1:8010` |
| `ML_SERVICE_TOKEN` | Private service authentication token; the launcher generates 64 hex characters in `.env.local` if missing |
| `ML_ASSESSMENT_SECRET` | Optional separate 32+ character encryption secret; defaults to the service token |
| `ML_DEVICE` | Inference device, default `cpu`; training automatically uses CUDA when available |
| `GEMINI_API_KEY` | Chatbot and chatbot moderation only |
| `DEMO_ENTRY_KEY` | Private `/demo/<key>` entry URL; generated by the launcher |

Inference loads the saved checkpoint with `local_files_only=True` and offline Hub
mode. Runtime recommendations and assessments need no Hugging Face, Google or
other hosted inference calls. The application still uses Supabase for auth/data,
and following learning-resource links requires internet access.

## Integration and assessment handling

The Next.js server authenticates the Supabase user, loads role requirements and
scores, and sends only the relevant skill information to the local service. The
browser never receives the service token. Python endpoints reject unauthenticated
inference requests; keep this service on loopback or a private network.

The service's trusted response includes source answer keys. Next.js encrypts these
inside a user-bound, purpose-bound, two-hour assessment token, returning only
prompts/options to the browser. Submission verifies the token and complete question
list, grades with the server's keys, and returns explanations after grading.
Difficulty and skill IDs come from the sealed session. Course and skill assessments
also save through a server route, rather than calculating scores in browser code.

Local file claims prevent the same assessment token from awarding progress twice.
Failed partial saves are marked failed instead of rerunning side effects. This is
single-host replay protection, not a replacement for database transactions.
Resources are added without deleting existing course rows, preserving completions
and assessment history. Older recommendations are retained as history.

## Limits and production follow-up

- The catalogue is primarily English beginner material. It is not a comprehensive
  course catalogue for arbitrary custom careers. Unsupported skills return explicit
  missing coverage. Personal career goals now retain an explicitly selected,
  supported learning track for assessments and resources. Existing custom-goal
  profiles without a track can select one in the profile editor. The app does not
  claim to generate arbitrary career requirements from a free-text goal.
- Some skill-specific quizzes contain fewer than the requested number of unique
  questions; the response returns the available count without duplicating questions.
- Difficulty is estimated from curriculum pre/post position and authored complexity,
  not learned from real student outcomes or calibrated to a psychometric scale.
- Similarity selects resources/questions; it does not establish learner competence.
  Current score thresholds and score blending remain explicit application rules.
- Source answers can contain errors. Add subject review before using these quizzes
  as formal completion credentials. Historical source material may be outdated.
- Production grading now uses service-only transactional database functions and
  a shared submission ledger. Browser writes to earned scores/XP are denied;
  concurrent attempts, replay, once-per-day daily checks and rollback are tested.
  The 7 November production cutover is recorded in
  [database releases](DATABASE_RELEASES.md) and
  [applied-learning evidence](APPLIED_LEARNING_RELEASE.md). The earlier direct-write
  limitations are historical and must not be used as current setup instructions.
- Multi-instance replay protection and private model hosting are implemented for
  Vercel. Only disposable/local demos use a local runtime ledger. The web service
  reaches the private learning service through its runtime binding, not the
  developer's loopback address. See [cloud deployment](CLOUD_DEPLOYMENT.md).
- The repository's older documentation describes the previous Gemini implementation;
  use this document for the current learning architecture.

## Verification

```bash
npm test
npm run test:ml
npm run dev:ml
# In another terminal:
npm run test:integration
npm run lint
npx tsc --noEmit --incremental false
npm run build
```

Serving tests use ONNX by default and exclude the explicitly registered
`offline_training` marker. They cover shipping model loading, dataset structure and split isolation,
recommendations, skill-specific question selection and estimated difficulty,
unassessed skills, service authentication, encrypted token tampering/expiry,
cross-user/purpose access, invalid answers, local replay protection and the actual
Python-to-TypeScript grading contract. Authenticated Supabase user journeys need
a separate live test account; the model integration tests do not modify user data.

To audit previously prepared local training checkpoints, raw research data and
the historical PyTorch cache as well, run `node scripts/ml.mjs test-offline`.
This opt-in command requires the real ignored training artifacts and research
dependencies; it does not download, fabricate or replace them. The underlying
selection is `python -m pytest ml/tests -m offline_training -q`. A plain unfiltered
pytest invocation continues to include these offline assertions.
