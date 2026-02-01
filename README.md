# AI-Powered Skill Gap Identifier (MVP)

Duolingo-style, gamified upskilling tracker with daily skill checks, gap detection, and a prioritized learning roadmap.

## Tech Stack
- Next.js (App Router) + TypeScript
- Tailwind CSS
- Framer Motion (animations)
- Supabase (Auth + Postgres + RLS)

## What’s implemented in this codebase (MVP scope)
- User signup/login (email + password)
- Profile + onboarding (course + plans/strengths/weaknesses + target role)
- Gamified dashboard (XP, level, streak)
- Daily test (quiz) + scoring per-skill
- Gap categories + prioritized roadmap generation (based on your formula)
- Admin route placeholder (UI only, role gate ready)

## Setup
1) Create a Supabase project
2) Run SQL:
   - `supabase/schema.sql`
   - `supabase/seed.sql`

3) Copy env:
```bash
cp .env.example .env.local
```

4) Fill:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

5) Install & run:
```bash
npm i
npm run dev
```

## Notes
- Questions are stored in the DB for MVP. For production, evaluate answers server-side only and avoid exposing answer keys via public policies.
