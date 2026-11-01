# VoidFill Site Documentation

Last reviewed from source: 2026-05-05

This document describes the original main-branch implementation. For the current
feature branch, use [project and design notes](PROJECT_AND_DESIGN.md),
[local ML architecture](LOCAL_ML.md), [resume and demo workflows](RESUMES_AND_DEMO.md)
and [authentication setup](AUTHENTICATION.md). Authentication now includes Google;
learning assessments and recommendations use the local ML service.

## 1. Product Overview

VoidFill is an AI-powered skill gap analysis platform for students and working professionals. The site helps a learner choose a target role, measure skill readiness through adaptive tests, generate a prioritized roadmap, get AI course/resource recommendations, review AI insights, and communicate with either an AI mentor or an assigned human mentor.

The application is built as a Next.js 14 App Router project with Supabase for authentication, Postgres data, row-level security, and storage. Gemini is used server-side for question generation, resource recommendations, skill gap analysis, AI chat, and chat moderation.

Primary user groups:

- Learners: students or professionals using dashboards, tests, roadmap, insights, profile, and mentor chat.
- Mentors: staff users assigned to specific learners; they can monitor student progress and chat with assigned learners.
- Admins: staff users who can view users, mentors, assignments, flagged chats, and analytics.
- Super admins: admins with permission to add staff and manage admin-level records.

## 2. Tech Stack

- Next.js 14 App Router with React 18 and TypeScript.
- Supabase Auth for email/password login.
- Supabase Postgres with RLS for all user-owned and staff-scoped data.
- Supabase Storage for resume uploads through the public `uploads` bucket.
- Tailwind CSS for styling.
- Framer Motion for page animations.
- Recharts for dashboard charts.
- Lucide React for icons.
- Gemini 2.5 Flash through REST calls in server route handlers.

Important project files:

- `app/`: application routes, server pages, API route handlers, and client UIs.
- `components/`: shared shells, UI primitives, stat/skill display components, toast system.
- `lib/`: Supabase clients, date helpers, skill gap scoring, Gemini parsing helpers.
- `supabase/actualused/used.sql`: authoritative database setup SQL.
- `docs/`: repository documentation.

## 3. Environment And Setup

Required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key used by browser and server session clients.
- `GEMINI_API_KEY`: Gemini API key used by all AI endpoints.
- `SUPABASE_SERVICE_ROLE_KEY`: used only by `lib/supabase/admin.ts`; currently available for admin server workflows if needed.
- Authentication callbacks and logout use the current site origin. The former
  `NEXT_PUBLIC_SITE_URL` logout override is no longer used.

Local commands:

```bash
npm install
npm run dev
npm run build
npm run start
npm run lint
```

Database setup:

1. Run `supabase/actualused/used.sql` in the Supabase SQL editor.
2. Create a public Supabase Storage bucket named `uploads`.
3. Create at least one auth user.
4. Seed a super admin row with `supabase/admin/admin_seed.sql` or insert into `admin_users` manually.

The README says `supabase/actualused/used.sql` is the active setup path. Other SQL files in `supabase/`, `supabase/migrations/`, `supabase/admin/`, and `sql/` are retained as migration history or reference.

## 4. Application Layout

Root layout:

- `app/layout.tsx` imports global CSS and mounts the global toast renderer.
- Metadata title is `VoidFill`.

Public landing/auth layout:

- `app/page.tsx` is the public landing page with links to signup, learner login, and admin login.
- `app/auth/login/page.tsx` is the learner login page.
- `app/auth/signup/page.tsx` creates a Supabase auth account and an initial `profiles` row.
- `app/auth/admin-login/page.tsx` signs in staff users and verifies an `admin_users` row.
- `app/auth/logout/route.ts` signs out only through `POST`; `GET` intentionally returns 405.

Learner shell:

- `components/AppShell.tsx` resolves the display name server-side and delegates navigation rendering to `AppShellClient`.
- Used by authenticated learner pages.

Admin shell:

- `components/AdminShell.tsx` resolves staff display name and passes admin role to `AdminShellClient`.
- Used by all `/admin/*` pages.

UI primitives:

- `components/ui/button.tsx`, `card.tsx`, `input.tsx`, `textarea.tsx`, `label.tsx`, `badge.tsx`, and `progress.tsx`.
- `components/toast/bus.ts` and `Toaster.tsx` provide a small global toast system.

## 5. Access Control

Middleware:

- `middleware.ts` currently checks only `/admin/**`, `/auth/login`, and `/auth/signup`.
- Admin routes require a logged-in user with a matching row in `admin_users`.
- Logged-in users are redirected away from learner login/signup to `/dashboard`.
- Unauthenticated admin access redirects to `/auth/admin-login?next=<path>`.
- Non-admin users trying to access `/admin/**` are redirected to `/dashboard`.

Page-level guards:

- Learner pages call `supabase.auth.getUser()` server-side and redirect to `/auth/login` if missing.
- Most learner pages require `profiles.onboarded = true`; otherwise they redirect to `/onboarding`.
- Admin pages also query `admin_users` and redirect based on role.
- Mentor pages rely on `mentor_assignments` to scope visible students.

Database RLS:

- Learner tables use owner policies based on `auth.uid()`.
- Catalog tables are readable by authenticated users.
- Staff tables use `admin_users`, `is_admin()`, and `is_super_admin()` helpers.
- Chat policies allow conversation owners, assigned mentors, and admins to read relevant conversations/messages.
- AI/system chat insert support is handled by the final `chat_msg_insert` policy near the end of `used.sql`.

## 6. Learner Route Map

### `/dashboard`

Main learner home after onboarding.

Data loaded:

- `profiles` with target role.
- `user_stats` for XP, level, and streak.
- Lowest `user_skill_scores` for focus skills.
- Recent `daily_attempts`.
- High-priority `user_roadmap` items.

Behavior:

- Redirects to `/auth/login` if unauthenticated.
- Redirects to `/onboarding` if profile is not onboarded.
- Shows level progress, XP, streak, weak skills, roadmap progress, recent attempts, and quick actions.

### `/onboarding`

Initial profile completion page.

Data loaded:

- Existing `profiles` row.
- All `roles`.

Behavior:

- Redirects onboarded users to `/dashboard`.
- Client form updates `profiles` with user type, education/professional details, target role, custom target role, strengths, weaknesses, future plans, and onboarding flag.

### `/profile`

Profile editor and progress overview.

Data loaded:

- `profiles` with role name.
- `role_skills`.
- `user_skill_scores`.
- `user_stats`.
- Recent `daily_attempts`.

Behavior:

- Allows profile edits.
- Supports resume URL/profile fields through Supabase.
- Displays skill and attempt trend data.

### `/daily-test`

Once-per-day adaptive assessment.

Data loaded:

- Today's `daily_attempts` row if already completed.

Client/API behavior:

- `DailyTestClient` calls `POST /api/ai/generate-questions`.
- Submits answers to `POST /api/daily-test/submit`.
- If an attempt already exists for today, the page shows completed attempt state instead of starting a new one.

Scoring:

- One daily attempt per user per date.
- XP is `50 + correct * 5`.
- Skill scores are blended as `previous * 0.7 + attempt * 0.3`.
- Streak is updated with calendar-day logic from `lib/date.ts`.

### `/practice-test`

Unlimited practice assessment flow.

Data loaded:

- Last five `practice_attempts`.
- Role skill names for the user's target role.

Client/API behavior:

- Generates assessment questions through `POST /api/roadmap/assess`.
- Submits results through `POST /api/practice-test/submit`.

Scoring:

- Difficulty affects awarded points.
- Skill scores use the same weighted blend pattern.
- XP is `30 + correct * 3`.
- Practice attempts are stored in `practice_attempts`.
- Roadmap progress is updated for affected skills.
- Mastered skills can unlock dependent skills through `skill_dependencies`.

### `/skill-graph`

Visual skill analytics view.

Data loaded:

- Target `roles` row.
- `role_skills`.
- `user_skill_scores`.
- Historical `daily_attempts` with `attempt_skill_scores`.
- Historical `practice_attempts`.

Behavior:

- Shows skill readiness and progress charts based on daily and practice attempts.

### `/roadmap`

Role-based roadmap and resources page.

Data loaded:

- Target role.
- Client loads role skills, dependencies, skill scores, `roadmap_courses`, and `course_assessments`.

Client/API behavior:

- `POST /api/roadmap/generate` builds `user_roadmap`.
- `POST /api/ai/recommend-courses` generates and saves resources in `roadmap_courses`.
- `POST /api/roadmap/assess` creates course or skill assessment quizzes.
- Client inserts `course_assessments`, marks `roadmap_courses.completed`, updates `user_skill_scores`, and updates `user_roadmap.progress`.
- Roadmap view mode is saved to `profiles.roadmap_view_mode`.

Roadmap prioritization:

- Skill score categories come from `lib/gapLogic.ts`:
  - `Strong`: score >= 75.
  - `Moderate`: score >= 50.
  - `Weak`: score >= 25.
  - `Missing`: score < 25.
- Priority is based on category rank, role skill weight, and dependency bonus.

### `/ai-insights`

Personalized AI analysis page.

Client/API behavior:

- Loads cached insight through `GET /api/ai/insights`.
- Generates fresh analysis through `POST /api/ai/analyze`.

Data used by analysis:

- Profile and target role.
- Skill scores.
- Role requirements.
- Recent daily attempts.
- Roadmap progress.

Persistence:

- Latest insight is upserted to `ai_insights`, one row per user.

### `/mentor-chat`

Learner chat page with two chat modes.

AI mentor:

- Loads latest AI conversation from `chat_conversations` where `is_ai = true`.
- Sends messages through `POST /api/chat/send`.
- AI mentor is named Sage in the system prompt.
- The AI is instructed to stay focused on learning, education, career, study techniques, and skill improvement.

Human mentor:

- Checks latest `mentor_assignments`.
- Creates or loads a human conversation where `is_ai = false`.
- Sends messages through `POST /api/chat/mentor-send`.
- Supports two-person clear request/accept/reject through `/api/chat/clear`.

## 7. Admin And Mentor Route Map

### `/admin/dashboard`

Admin analytics page for admins and super admins.

Data loaded:

- Total profiles.
- Total daily attempts.
- Flagged message count.
- Mentor count.
- Average XP and level.
- Profile creation dates for growth chart.
- Level distribution.

Behavior:

- Mentors are redirected to `/admin/mentor`.

### `/admin/users`

Admin user overview.

Data loaded:

- All `profiles`.
- `user_stats`.
- `user_skill_scores`.

Behavior:

- Shows user identity, course, onboarded status, XP, level, streak, and average skill score.
- Mentors are not allowed.

### `/admin/mentors`

Staff and mentor assignment management.

Data loaded:

- All `admin_users`.
- `mentor_assignments` with profile names.
- All learner profiles for assignment reference.

Behavior:

- Admins can view staff and assignments.
- Super admins get `MentorActions`, which can insert `admin_users` rows and `mentor_assignments`.
- Mentors are redirected away.

### `/admin/mentor`

Mentor dashboard.

Data loaded:

- Assigned student IDs from `mentor_assignments`.
- Student `profiles`.
- Student `user_skill_scores`.
- Student `user_stats`.
- Recent `daily_attempts`.

Behavior:

- Shows assigned students, average skill score charts, progress charts, levels, streaks, and recent attempts.
- Available to mentors and admins with an `admin_users` row.

### `/admin/mentor/chat`

Mentor chat workspace.

Data loaded:

- Assigned students.
- Human conversations for assigned students where `is_ai = false` and `mentor_id` is current user.
- Messages for the active conversation.

Client/API behavior:

- Discovers a conversation with `GET /api/chat/mentor-conversations?studentId=<id>`.
- Loads messages with `GET /api/chat/messages?conversationId=<id>`.
- Sends mentor messages with `POST /api/chat/mentor-send`.
- Uses `GET` and `POST /api/chat/clear` for clear request state and actions.

### `/admin/flagged`

Moderation review page.

Data loaded:

- Latest 50 `chat_messages` where `flagged = true`.
- Conversation owner profile details.

Behavior:

- Shows flagged user messages and AI moderation reasons.
- Mentors are not allowed.

### `/admin/profile`

Staff profile editor.

Data loaded:

- Current user's `admin_users` row.

Behavior:

- Allows staff display name updates.
- Uses `AdminShell`.

## 8. API Route Documentation

### AI Endpoints

#### `POST /api/ai/generate-questions`

Generates 10 adaptive daily-test questions.

Auth:

- Requires authenticated learner.

Inputs:

- No request body.

Reads:

- `profiles`.
- `user_skill_scores`.
- Last five `daily_attempts`.

AI behavior:

- Computes difficulty from recent average performance.
- Focuses more questions on weak skills.
- Requests exactly 10 multiple-choice questions from Gemini.

Returns:

- `questions`: generated question objects with `id`, `prompt`, `options`, `correct_index`, `difficulty`, `skill_name`, and `explanation`.
- `difficulty`.
- `difficultyLabel`.

#### `POST /api/ai/recommend-courses`

Generates recommended learning resources for every role skill.

Auth:

- Requires authenticated learner.

Reads:

- `profiles`.
- `user_skill_scores`.
- `skills`.
- `role_skills`.

Writes:

- Replaces all current `roadmap_courses` for the user.

Important behavior:

- Tells Gemini to use exact skill names from the database.
- Fuzzy-matches returned skill names to `skills`.
- Deletes old recommendations only after preparing replacement rows.
- Attempts to restore old recommendations if insert fails.

Returns:

- `saved`: count of inserted resources.
- `unmatched`: skill names that could not map to database skills.
- `message`.

#### `POST /api/ai/analyze`

Generates a personalized skill gap analysis.

Auth:

- Requires authenticated learner.

Reads:

- `profiles`.
- `user_skill_scores`.
- Target role `role_skills`.
- Recent `daily_attempts`.
- `user_roadmap`.

Writes:

- Upserts `ai_insights`.

Returns:

- `analysis`: JSON object from Gemini.
- `meta`: counts, average score, current difficulty, timestamp.

#### `GET /api/ai/insights`

Fetches cached AI insight for the authenticated learner.

Returns:

- `{ cached: false }` if no insight exists.
- `{ cached: true, analysis, meta, updatedAt }` if present.

### Assessment Endpoints

#### `POST /api/daily-test/submit`

Submits and scores the daily test.

Auth:

- Requires authenticated learner.

Body:

```json
{
  "answers": [{ "question_id": "id", "selected_index": 0 }],
  "ai_questions": [{ "id": "id", "correct_index": 0, "skill_name": "JavaScript" }],
  "difficulty_level": 2
}
```

Writes:

- `daily_attempts`.
- `attempt_answers` for database-backed questions only.
- `attempt_skill_scores`.
- `user_skill_scores`.
- `user_stats`.

Returns:

- Attempt row plus XP total, level, and streak.

#### `POST /api/practice-test/submit`

Submits and scores practice test answers.

Auth:

- Requires authenticated learner.

Body:

```json
{
  "answers": [{ "question_id": "id", "selected_index": 0 }],
  "ai_questions": [{ "id": "id", "correct_index": 0, "skill_name": "React" }],
  "difficulty_level": 3
}
```

Writes:

- `user_skill_scores`.
- `user_roadmap`.
- `practice_attempts`.
- `user_stats`.

Returns:

- Attempt row, XP totals, updated level, newly unlocked skills, and skill scores.

#### `POST /api/roadmap/assess`

Generates a course or skill assessment quiz.

Auth:

- Requires authenticated learner.

Body:

```json
{
  "course_title": "React Basics",
  "skill_name": "React",
  "is_skill_assessment": false
}
```

Returns:

- `questions`: generated assessment questions.
- Course assessments use 12 questions.
- Skill assessments use 10 questions.

### Roadmap Endpoint

#### `POST /api/roadmap/generate`

Generates or refreshes roadmap rows for the learner's selected target role.

Auth:

- Requires authenticated learner.

Reads:

- `profiles.target_role_id`.
- `role_skills`.
- `skill_dependencies`.
- `user_skill_scores`.

Writes:

- Upserts `user_roadmap`.

Returns:

- `{ ok: true, count }`.

### Chat Endpoints

#### `POST /api/chat/send`

Sends a learner message to the AI mentor.

Auth:

- Requires authenticated learner.

Body:

```json
{
  "message": "How do I improve in React?",
  "conversationId": "optional-conversation-id"
}
```

Writes:

- Creates `chat_conversations` if needed.
- Inserts user `chat_messages`.
- Inserts AI `chat_messages`.
- May update latest user message with `flagged` and `flag_reason` after moderation.

Returns:

- `conversationId`.
- `reply`.

#### `GET /api/chat/messages?conversationId=<id>`

Loads messages for a conversation.

Auth:

- Conversation owner or assigned mentor.

Returns:

- `messages`.

#### `POST /api/chat/mentor-send`

Sends a human mentor/student message.

Auth:

- Learner owner or assigned mentor.

Body:

```json
{
  "message": "Hello",
  "conversationId": "optional-conversation-id",
  "targetUserId": "student-id-for-mentor-sends"
}
```

Behavior:

- Mentors must be assigned to the target user.
- Learners send to their latest assigned mentor if available.
- Creates human conversations where needed.
- Attaches `mentor_id` to existing conversations when appropriate.

Returns:

- `conversationId`.
- `sent: true`.

#### `GET /api/chat/mentor-conversations?studentId=<id>`

Lets a mentor discover or claim the human conversation with a student.

Auth:

- Caller must be assigned to the student.

Returns:

- `conversationId` or `null`.

#### `GET /api/chat/student-conversation`

Lets a learner discover their human mentor conversation.

Auth:

- Requires authenticated learner.

Returns:

- `conversationId`.
- `mentorId`.

#### `GET /api/chat/clear?conversationId=<id>`

Returns clear-request state for a human chat.

Returns:

- `clearPending`.
- `requestedByMe`.
- `requestedBy`.

#### `POST /api/chat/clear`

Handles two-party chat clearing.

Body:

```json
{
  "conversationId": "conversation-id",
  "action": "request"
}
```

Actions:

- `request`: records who requested clearing.
- `accept`: deletes all messages for the conversation and resets request state.
- `reject`: resets request state without deleting messages.

### Auth Endpoint

#### `POST /auth/logout`

Signs out the current Supabase session and redirects to `/`.

Note:

- `GET /auth/logout` returns 405 by design.

## 9. Database Model

Authoritative SQL file: `supabase/actualused/used.sql`.

### Catalog And Role Tables

- `skills`: skill catalog with name, category, description.
- `roles`: target role catalog.
- `role_skills`: many-to-many mapping between roles and skills, with `weight`.
- `skill_dependencies`: prerequisite/dependent skill graph.
- `resources`: static resource catalog.
- `skill_resources`: maps static resources to skills.
- `questions`: static multiple-choice questions.

### Learner Profile And Progress Tables

- `profiles`: one row per auth user; stores email, name, phone, student/professional fields, target role, custom target role, future plans, strengths, weaknesses, onboarding status, resume URL, LinkedIn URL, and roadmap view mode.
- `user_stats`: XP, level, streak, and last activity date.
- `user_skill_scores`: current score per user and skill.
- `user_roadmap`: generated roadmap row per user, role, and skill; includes category, priority, status, and progress.
- `user_resource_completions`: static resource completion tracking.

### Assessment Tables

- `daily_attempts`: one daily test result per user per date; includes counts, XP, completion time, and difficulty.
- `attempt_answers`: answer rows for database-backed daily questions.
- `attempt_skill_scores`: per-skill score rows for a daily attempt.
- `practice_attempts`: unlimited practice attempt history with JSON skill score payloads.
- `ai_generated_questions`: cache table for generated questions, though current API responses do not rely on persisted rows.

### Roadmap Resource Tables

- `roadmap_courses`: AI-generated course/book/project/tutorial/practice recommendations by user and skill.
- `course_assessments`: assessment attempts for roadmap resources.

### AI Insight Tables

- `ai_insights`: latest persisted AI analysis per user, with `analysis` JSON and `meta` JSON.

### Staff And Chat Tables

- `admin_users`: staff users, keyed by auth user ID; role is `super_admin`, `admin`, or `mentor`.
- `mentor_assignments`: many-to-many mapping of mentors to learners.
- `chat_conversations`: AI or human chat thread metadata; includes `user_id`, optional `mentor_id`, `is_ai`, title, and `clear_requested_by`.
- `chat_messages`: messages in conversations; supports `user`, `mentor`, `ai`, and `system` sender roles, plus moderation flags.

### Database Functions

- `get_random_questions(p_limit int)`: returns random static questions.
- `handle_new_user()`: creates a profile after auth user creation.
- `get_user_difficulty(p_user_id uuid)`: computes adaptive difficulty from last five daily attempts.
- `is_admin()`: security-definer helper for admin/super admin checks.
- `is_super_admin()`: security-definer helper for super admin checks.

## 10. AI Integration

Gemini helper module:

- `lib/gemini.ts` contains `geminiUrl`, `extractGeminiText`, `parseJsonArray`, and `callGeminiForJson`.
- `extractGeminiText` handles Gemini 2.5 Flash thinking parts by selecting the last non-thinking response part.
- `parseJsonArray` strips markdown fences, extracts array/object JSON, handles trailing commas, and falls back safely.

AI route usage:

- Daily questions: `app/api/ai/generate-questions/route.ts`.
- Roadmap resources: `app/api/ai/recommend-courses/route.ts`.
- Skill gap analysis: `app/api/ai/analyze/route.ts`.
- Course/skill assessments: `app/api/roadmap/assess/route.ts`.
- AI mentor chat and moderation: `app/api/chat/send/route.ts`.

AI outputs are generally parsed into JSON and then either returned to the client or persisted in Supabase. Chat replies may contain markdown.

## 11. Scoring And Progress Logic

Skill category logic lives in `lib/gapLogic.ts`.

Categories:

- `Strong`: score >= 75.
- `Moderate`: score >= 50.
- `Weak`: score >= 25.
- `Missing`: score < 25.

Roadmap priority:

```ts
priority = categoryRank * roleWeight * dependencyBonus
```

Daily tests:

- Difficulty adapts from last five attempts.
- If average score is at least 80 percent, difficulty increases by one, up to 5.
- If average score is at most 40 percent, difficulty decreases by one, down to 1.
- Otherwise difficulty remains near the previous level.

Skill score blending:

```ts
newScore = previousScore * 0.7 + attemptScore * 0.3
```

Roadmap progress:

- Generated roadmap progress starts from skill score influence.
- Practice/course assessment flows combine skill score and completed course count.
- In practice submit, progress is roughly `skill score * 0.68 + course completion * 0.32`.

XP:

- Daily test: `50 + correct * 5`.
- Practice test: `30 + correct * 3`.
- Level is `Math.floor(totalXp / 500) + 1`.

## 12. Client-Side Data Mutations

Most sensitive operations are performed through server route handlers, but several client components write directly to Supabase using the browser client under RLS:

- Signup inserts initial `profiles` row.
- Onboarding updates `profiles`.
- Profile editor updates `profiles`.
- Roadmap UI inserts `course_assessments`.
- Roadmap UI marks `roadmap_courses.completed`.
- Roadmap UI upserts `user_skill_scores`.
- Roadmap UI updates `user_roadmap.progress`.
- Admin mentor actions insert `admin_users` and `mentor_assignments`; RLS requires super admin rights.
- Admin profile editor updates `admin_users.display_name`.

This works because Supabase RLS policies enforce ownership and role permissions.

## 13. Known Implementation Notes And Risks

Security-critical note:

- AI-generated test submissions currently send `correct_index` back from the client in `ai_questions`. This means a malicious client could tamper with answer keys and inflate scores. For production, correct answers should be stored server-side or signed before being sent to the client.

Logout behavior:

- `app/auth/logout/route.ts` supports `POST`, while any link-based logout using `GET` will receive 405. Use a form/button that posts to `/auth/logout`.

AI resource URLs:

- Gemini is asked to return real URLs, but URLs are not independently validated before insertion into `roadmap_courses`.

Resume storage:

- The app expects a public Supabase Storage bucket named `uploads`. Missing bucket setup will break resume upload flows.

Testing:

- No automated unit, integration, or end-to-end test suite is present in the repository.

Encoding artifacts:

- Some source text contains mojibake characters in UI copy/comments, likely from earlier encoding conversion. It does not usually break runtime behavior but should be cleaned for polish.

## 14. Suggested Future Improvements

1. Move AI answer-key validation server-side.
2. Add tests for scoring, roadmap priority, middleware redirects, and chat authorization.
3. Validate AI-generated resource URLs before saving.
4. Add a storage setup migration or admin setup checklist for the `uploads` bucket.
5. Consolidate old SQL history files or clearly mark them as reference-only.
6. Replace manual UUID entry in mentor assignment UI with dropdown/search selection.
7. Add admin actions for resolving or dismissing flagged messages.
8. Add audit fields for staff actions such as mentor assignment and chat moderation.

