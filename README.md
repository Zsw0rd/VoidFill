# VoidFill - AI Skill Gap Analyser

AI-powered skill-gap tracking platform built with Next.js + Supabase.

It provides:
- Adaptive daily tests and unlimited practice tests
- Role-based skill benchmarking and priority roadmap generation
- AI-powered course recommendations and insights (Gemini)
- Student/professional onboarding flows
- Admin and mentor dashboards with chat moderation

## Quick Start

### 1) Prerequisites
- Node.js 18+ (recommended: latest LTS)
- npm
- A Supabase project
- A Gemini API key

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
- `GEMINI_API_KEY` (required for AI features)
- `NEXT_PUBLIC_SITE_URL` (optional, used for logout redirect in `app/auth/logout/route.ts`)

### 4) Initialize the database (SQL order)
Run these in Supabase SQL editor in this order:
1. `supabase/schema.sql`
2. `supabase/seed.sql`
3. `supabase/migrations/001_profile_enhancements.sql`
4. `supabase/migrations/002_roadmap_courses.sql`
5. `supabase/migrations/003_ai_questions.sql`
6. `supabase/migrations/004_ai_insights.sql`
7. `supabase/migrations/005_practice_tests.sql`
8. `supabase/admin/006_chat.sql`

Optional:
9. `supabase/admin/admin_seed.sql` (after you create an auth user for super admin)

### 5) Storage setup (required for resume upload)
Create Supabase Storage bucket:
- Bucket name: `uploads`
- Access mode: public (current code uses `getPublicUrl`)

### 6) Run app
```bash
npm run dev
```

Open `http://localhost:3000`.

## Scripts
- `npm run dev`: start development server
- `npm run build`: production build
- `npm run start`: run production server
- `npm run lint`: lint with Next.js ESLint config

## Tech Stack
- Next.js 14 App Router + TypeScript
- Supabase Auth + Postgres + RLS + Storage
- Tailwind CSS
- Framer Motion
- Recharts
- Gemini 2.5 Flash (server-side route handlers)

## Architecture Summary

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

### Public/Auth
- `/`
- `/auth/login`
- `/auth/signup`
- `/auth/admin-login`

### Student/Professional App
- `/dashboard`
- `/onboarding`
- `/profile`
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
- `POST /api/chat/send`

## Middleware and Access Control
- `middleware.ts` enforces login for non-public routes
- Redirects logged-in users away from `/auth/login` and `/auth/signup` to `/dashboard`
- Guards `/admin/**` by checking `admin_users` table
- Uses Supabase cookie-based server session

## Additional Documentation
- Detailed analysis and implementation notes: `docs/PROJECT_ANALYSIS.md`

## Current Scope Notes
- AI-generated question correctness is currently client-visible in some flows (MVP tradeoff).
- Admin and mentor features are implemented, with chat moderation and assignment support.
