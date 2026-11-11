# VoidFill - AI Skill Gap Analyser

AI-powered skill-gap tracking platform built with Next.js + Supabase.

Start with [current project status](docs/PROJECT_STATUS.md) for the production
architecture, current follow-up scope and links to the maintained documentation.
Older analysis/research documents are explicitly historical.

It provides:
- Adaptive daily tests and repeatable practice tests with shared request budgets
- Role-based skill benchmarking and priority roadmap generation
- Local-model course recommendations, question selection, and skill insights
- Gemini mentor chatbot (the only remaining external AI feature)
- Student/professional onboarding flows
- Admin and mentor dashboards with chat moderation

## Quick Start

### 1) Prerequisites
- Node.js 24 LTS (matches production and CI)
- npm
- A Supabase project
- Python 3.11+ (3.12 tested) for the local ML service
- A Gemini API key only if you use the chatbot

### 2) Install dependencies
```bash
npm ci
```

### 3) Environment variables
Copy the template:
```bash
cp .env.example .env.local
```

Set values in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` (required)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (required)
- `GEMINI_API_KEY` (chatbot and its moderation only)
- `ML_SERVICE_URL` (defaults to `http://127.0.0.1:8010`)
- `ML_SERVICE_TOKEN` (server-only; `npm run dev` creates one in `.env.local` if absent)
- `SUPABASE_SERVICE_ROLE_KEY` (server-only; required for real assessment and generated roadmap writes locally and in production)

Google login/signup is configured through Supabase's Google provider. See
[authentication configuration and verification](docs/AUTHENTICATION.md) for the
OAuth client, local callbacks, account routing and the External / In production audience.

### 4) Initialize or upgrade the database
Use the ordered manifest and commands in [database releases](docs/DATABASE_RELEASES.md).
Inspect the plan before applying SQL:

```bash
node scripts/database.mjs bootstrap
# Fresh empty Supabase project only, after privately setting DATABASE_URL:
node scripts/database.mjs bootstrap --apply
```

An existing installation uses `upgrade`, which applies only the new release list.
Do not replay `supabase/actualused/used.sql` or all historical migrations: they
contain overlapping policies and historical account-specific setup.
No privileged account is automatically created by the canonical bootstrap.

### 5) Resume processing and model storage
Resume files are processed inline and are not retained as public uploads. No
public resume bucket is required. Extracted profile fields are saved only when
the user applies them. Production model artifacts use a separate checksummed
`model-artifacts` bucket; see [cloud deployment](docs/CLOUD_DEPLOYMENT.md).

### 6) Prepare the local ML model (first setup on a new machine)
```bash
npm run ml:setup
npm run ml:prepare
npm run ml:train
```

The current workspace already has the environment, prepared dataset, and trained checkpoint.
Setup installs PyTorch with CUDA when an NVIDIA GPU is detected, or CPU PyTorch otherwise.
Downloads and model checkpoints stay outside Git. Source revisions, normalized datasets,
licenses, training code, and evaluation results are included for reproducibility.

### 7) Run app
```bash
npm run dev
```

Open `http://localhost:3000`.

`npm run dev` starts the local ML service and the website together. See
[local ML setup and architecture](docs/LOCAL_ML.md) for evaluation results, limitations,
production configuration, and troubleshooting.

For deployment on Vercel and Supabase without a separate model host, see
[cloud deployment and model optimization](docs/CLOUD_DEPLOYMENT.md).

## Scripts
- `npm run dev`: start the local ML service and development server
- `npm run dev:web`: start only Next.js (for a separately hosted ML service)
- `npm run dev:ml`: start only the local ML service
- `npm test`: assessment security, authentication, roadmap progress and service-client unit tests
- `npm run test:auth`: callback failures, safe redirects and protected-page integration checks
- `npm run test:demo`: isolated learner workflow integration checks
- `npm run test:staff-demo`: staff login, rendering and role-isolation integration checks
- `npm run test:practical`: isolated learner submission, assigned mentor review and withdrawal integration checks
- `npm run test:ux`: local Chromium learner/atlas/mobile accessibility and interaction checks
- `npm run test:ml`: serving-model tests (ONNX by default), excluding explicitly marked offline training experiments
- `node scripts/ml.mjs test-offline`: opt-in checks using real, previously prepared local training artifacts and research dependencies
- `npm run test:integration`: actual local model to TypeScript grading integration (service must be running)
- `npm run build`: production build
- `npm run start`: run production server
- `npm run lint`: lint with Next.js ESLint config

## Tech Stack
- Next.js 15.5 App Router + TypeScript
- Supabase Auth + Postgres + RLS + Storage
- Tailwind CSS
- Framer Motion
- Recharts
- Local BGE-base encoder with a Python FastAPI service for learning features; prior fine-tuned MiniLM checkpoints retained for comparison
- Gemini 2.5 Flash for the mentor chatbot and its moderation only

## Architecture Summary

Detailed site documentation is available in `docs/SITE_DOCUMENTATION.md`.
Database setup and grading guarantees: [DATABASE_RELEASES.md](docs/DATABASE_RELEASES.md).
CI, branch consolidation and deployment gates: [RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md).
Practical evidence, explicit sharing and mentor review: [PRACTICAL_LEARNING.md](docs/PRACTICAL_LEARNING.md).

Lesson coverage, source corrections, and release verification are documented in
[lesson expansion](docs/EXPANSION_VALIDATION_20261110.md).

### Frontend
- App Router pages under `app/`
- Shared layout shells in `components/AppShell.tsx` and `components/AdminShell.tsx`
- UI primitives in `components/ui/*`
- Toast bus in `components/toast/*`

### Backend
- Route handlers under `app/api/**`
- Server-side auth/session via `@supabase/ssr`
- Domain logic utilities in `lib/*`:
  - `lib/gapLogic.ts`: category + priority scoring
  - `lib/date.ts`: date helpers
  - `lib/gemini.ts`: Gemini response extraction/parsing helpers

### Database
- Canonical fresh-install schema in `supabase/bootstrap.sql`
- Explicit historical/release ordering in `supabase/migration-manifest.json`
- Additive releases in `supabase/migrations/*`; use `scripts/database.mjs` rather than replaying all files
- Server-only atomic grading RPC; browser clients cannot write derived scores/XP
- RLS policies are enabled for user-owned and admin-scoped access

## Route Map

Resume parsing and the URL-only temporary demo are documented in
[`docs/RESUMES_AND_DEMO.md`](docs/RESUMES_AND_DEMO.md). Expanded local model training,
current benchmark results and reproduction steps are in
[`docs/LOCAL_ML.md`](docs/LOCAL_ML.md).
The 109M-parameter model experiment and its fine-tuning results are in
[`docs/LARGER_MODEL.md`](docs/LARGER_MODEL.md).

### Public/Auth
- `/`
- `/auth/login`
- `/auth/signup`
- `/auth/admin-login`
- `/auth/callback` (Supabase authentication return)

### Student/Professional App
- `/dashboard`
- `/onboarding`
- `/profile`
- `/resume`
- `/daily-test`
- `/practice-test`
- `/skill-graph`
- `/roadmap`
- `/ai-insights`
- `/mentor-chat`

### Admin/Mentor
- `/admin/dashboard`
- `/admin/users`
- `/admin/mentors`
- `/admin/mentor`
- `/admin/flagged`

### API Endpoints
- `POST /api/ai/generate-questions`
- `POST /api/ai/recommend-courses`
- `POST /api/ai/analyze`
- `GET /api/ai/insights`
- `POST /api/daily-test/submit`
- `POST /api/practice-test/submit`
- `POST /api/roadmap/generate`
- `POST /api/roadmap/assess`
- `POST /api/roadmap/submit-assessment`
- `POST /api/chat/send`

## Middleware and Access Control
- Learner pages and APIs require a Supabase user or a valid temporary demo session
- Redirects logged-in users away from `/auth/login` and `/auth/signup` to the appropriate learner or staff workspace
- Guards `/admin/**` by checking `admin_users` table
- Uses Supabase cookie-based server session

## Current Scope Notes
- Local assessments hide answer keys until submission and grade them on the server.
- Questions are selected from a sourced bank; they are not newly generated by a language model.
- The server commits scores and XP through a transaction in Supabase. See [database releases](docs/DATABASE_RELEASES.md).
- Admin and mentor features are implemented, with chat moderation and assignment support.
