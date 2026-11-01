# VoidFill - AI Skill Gap Analyser

AI-powered skill-gap tracking platform built with Next.js + Supabase.

It provides:
- Adaptive daily tests and unlimited practice tests
- Role-based skill benchmarking and priority roadmap generation
- Local-model course recommendations, question selection, and skill insights
- Gemini mentor chatbot (the only remaining external AI feature)
- Student/professional onboarding flows
- Admin and mentor dashboards with chat moderation

## Quick Start

### 1) Prerequisites
- Node.js 18+ (recommended: latest LTS)
- npm
- A Supabase project
- Python 3.11+ (3.12 tested) for the local ML service
- A Gemini API key only if you use the chatbot

### 2) Install dependencies
```bash
npm install
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

Google login/signup is configured through Supabase's Google provider. See
[authentication configuration and verification](docs/AUTHENTICATION.md) for the
OAuth client, local callbacks, account routing and current Testing audience.

### 4) Initialize the database
Use `supabase/actualused/used.sql` in Supabase SQL Editor.

Notes:
- `supabase/actualused/used.sql` is the authoritative SQL used by this project.
- The other SQL files under `supabase/` are retained as reference/history and are not the active setup path.
- `supabase/admin/admin_seed.sql` is still optional, after you create an auth user for super admin.

### 5) Storage setup (required for resume upload)
Create Supabase Storage bucket:
- Bucket name: `uploads`
- Access mode: public (current code uses `getPublicUrl`)

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
- `npm run test:ml`: tests using the saved local model
- `npm run test:integration`: actual local model to TypeScript grading integration (service must be running)
- `npm run build`: production build
- `npm run start`: run production server
- `npm run lint`: lint with Next.js ESLint config

## Tech Stack
- Next.js 14 App Router + TypeScript
- Supabase Auth + Postgres + RLS + Storage
- Tailwind CSS
- Framer Motion
- Recharts
- Local BGE-base encoder with a Python FastAPI service for learning features; prior fine-tuned MiniLM checkpoints retained for comparison
- Gemini 2.5 Flash for the mentor chatbot and its moderation only

## Architecture Summary

Detailed site documentation is available in `docs/SITE_DOCUMENTATION.md`.

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
- Core schema in `supabase/schema.sql`
- Feature migrations in `supabase/migrations/*`
- Admin/chat model in `supabase/admin/006_chat.sql`
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
- Existing Supabase progress-write policies still need production hardening; see `docs/LOCAL_ML.md`.
- Admin and mentor features are implemented, with chat moderation and assignment support.
