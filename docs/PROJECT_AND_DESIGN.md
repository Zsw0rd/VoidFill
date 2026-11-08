# VoidFill: project map and UI redesign

Reviewed from the local repository on 1 November 2026 and updated on 5 November 2026. This document describes the inspected branches, application behavior, and the implemented design. Cloud deployment details are in `CLOUD_DEPLOYMENT.md`; the selected Living Atlas design and browser verification are recorded in the project-root `design-qa.md`.

## Product and users

VoidFill helps learners move from a career goal to a measurable learning plan. Its core loop is:

1. Create an account and describe a student or professional background.
2. Choose a supported target role. Optionally import and review resume fields.
3. Take a baseline or daily assessment to measure skills.
4. Compare measured scores with the role's benchmarks.
5. Follow prioritized skills and learning resources in a roadmap.
6. Reassess skills or resources and review feedback.
7. Get guidance from Sage or an assigned human mentor.

Three connected workspaces support that loop:

| Audience | Main activities |
| --- | --- |
| Learner | Resume review, onboarding, daily and repeatable budgeted practice assessments, skill analytics, roadmap, insights, profile and mentoring |
| Mentor | Assigned learners, skill and XP summaries, learner conversations and mutual chat-clear requests |
| Administrator / super administrator | Platform analytics, learner directory, moderation, staff records and mentor assignments; staff creation is restricted to super administrators |

## Branches reviewed

The table records the initial branch audit, when no branch was merged, reset or
force-pushed. Subsequent releases have been merged into canonical `main` and
published to the existing Vercel production domain. Local main is synchronized;
its former history is retained on `codex/archive-local-main-20261107`. No remote
history was rewritten. See [current project status](PROJECT_STATUS.md).

| Available ref at the start | Inspected state | Relationship to this work |
| --- | --- | --- |
| `main` | `01e3bf2` | Main application, with learning, staff, mentoring and tree-roadmap features |
| `origin/main` | `7d5f8b2` | Same source tree as local `main`, despite different commit ancestry; both tree IDs were verified as `43f4b5b94f8493fed94bd6e4e899be1b8b563c7b` |
| `codex/local-ml-resumes-guest-demo` / its remote | `75b116f` | Starting checkout for this redesign; one commit ahead of `origin/main`, adding the local learning pipeline, resume ingestion and guest demos |
| `origin/branch1` | `dc8f861` | Earlier MVP: basic auth, profile, daily checks, gap scoring and roadmap. Its README describes the admin route as a placeholder. Compared with main it lacks the later staff, human mentoring and practice-test implementation |
| `origin/codex/fix-ai-mentor-reply-saving-issue` | `812fcff` | Historical fixes for chat persistence, permissions, auth-cookie refresh and navigation-triggered sign-outs. Main already contains corresponding fixes in its history |

The local-ML feature commit changes 93 files against main. The working checkout additionally contained staff-demo credentials/role handling, a synthetic staff dataset, demo client fixes and tests. Those additions explain why the redesign covers both learner and staff demos.

## Technical architecture

| Layer | Responsibility | Source |
| --- | --- | --- |
| Next.js 15.5 App Router + React 18 | Server pages load authenticated context; client components handle quizzes, charts, forms, chat and roadmap interaction | `app/` |
| Supabase | Normal-account authentication, Postgres, row-level security, user profiles/progress, staff and chat records | `lib/supabase/`, `supabase/actualused/used.sql` |
| Route handlers | Authenticated learning requests, sealed assessment grading, chat, resume processing and temporary-demo transport | `app/api/` |
| Python FastAPI service | Local development or a private Vercel Service: embedding retrieval, sourced question selection, recommendations, numerical/template-based insights, resume extraction and isolated demo data | `ml/service.py`, `ml/resume.py`, `ml/guest.py` |
| Learning utilities | Role context, score blending, priority calculation, assessment tokens and replay protection | `lib/learningContext.ts`, `gapLogic.ts`, `assessments.ts`, `submissions.ts` |
| External generative AI | Sage chat and chat moderation use Gemini | `app/api/chat/`, `lib/gemini.ts` |
| UI | Shared primitives, navigation, notifications and interaction patterns | `components/`, `app/globals.css`, `tailwind.config.ts` |

### Important data relationships

- `profiles.target_role_id` points to `roles`; `role_skills` associates a role, skill and weight.
- `user_skill_scores` stores measured skill scores. Role weights also supply benchmarks in the current implementation.
- `daily_attempts` and `practice_attempts` record assessment history. Per-skill daily results are in `attempt_skill_scores`.
- `user_stats` holds XP, level and streak. A level spans 500 XP.
- `skill_dependencies` influences roadmap priority. `user_roadmap` stores prioritized skills and progress.
- `roadmap_courses` stores retrieved resources; `course_assessments` records resource assessment outcomes.
- `admin_users` determines staff roles. `mentor_assignments` scopes mentor access to learners.
- `chat_conversations`, `chat_messages` and chat-clear state support AI and human conversations, moderation and clearing requests.

`supabase/actualused/used.sql` is the authoritative schema in the project documentation. Other schema and migration files are historical/reference material.

### Learning behavior that the interface must respect

- Daily assessments allow one completed attempt per calendar day. Practice assessments are repeatable.
- Question difficulty adapts from recent results. Questions are selected from a sourced bank rather than generated as new questions by a language model.
- Answers and explanations are hidden until server-side grading. Sealed tokens bind the assessment to its user and purpose; a submission ledger prevents duplicate awards.
- Existing skill scores blend 70% previous score and 30% latest assessment score.
- Roadmap branch progress combines 68% measured skill score and 32% resource completion.
- Priority combines score category, role weight and a dependency bonus. Course/skill assessment pass thresholds in the roadmap are 65%.
- Resume skill mentions are claims to review, not proficiency measurements. Applying resume fields does not award XP, scores or completion.
- Custom career goals can be saved, but the local learning endpoints currently require a supported role ID. The onboarding copy now explains that constraint.

### Local-model branch

The service loads the active checkpoint from `ml/artifacts/retriever`. Training and evaluation scripts cover the original MiniLM retriever, expanded/passage training and the larger BGE experiment. Data manifests and model/source locks record provenance; checkpoints, downloaded raw sources, caches and runtime state remain outside Git.

The source bank documented in this branch contains 611 questions and 158 learning resources. Training retrieval performance is not a measurement of learner proficiency or resume-field accuracy. The UI avoids treating model suggestions or resume mentions as assessment results.

PDF/DOCX ingestion is limited to 4 MiB and 12 PDF pages. Text extraction uses server-side parsing; scanned PDFs can use RapidOCR without an external OCR provider. Users review the extracted name, skill evidence, sections and suggested career context before applying supported fields.

### Temporary demos

- The private entry key stays server-side and is not linked from public navigation.
- Demo cookies select an isolated query adapter rather than normal learner tables. Local development keeps temporary snapshots in memory; Vercel uses encrypted snapshots stored in Supabase so requests can survive separate serverless instances.
- Learner demos begin fresh. Staff demos seed six synthetic learners, two mentors, assessment history, assignments, conversations and labelled moderation examples.
- Each staff login has its own workspace. Sample messages do not go to real learners.
- Document leases, explicit ending and expiry remove temporary state. Sessions have a two-hour limit.
- Sage remains an external Gemini integration, including in demos. The demo entry and mentor UI explain this.

## Design direction: a learning studio

The redesign uses warm paper, white working surfaces, forest green, restrained lime and burnt orange. Manrope provides the functional type system; Instrument Serif gives the public and authentication screens an editorial accent. Font files and their licenses are hosted locally under `public/fonts/`.

The visual identity is built around progress, direction and growth. It avoids decorative ambient effects, dark glass panels and uniform oversized cards. Numbered stages, compact labels, clear content hierarchy and deliberate empty states help explain what to do next.

### Route-by-route implementation

| Area | New experience |
| --- | --- |
| Public home | Editorial introduction, an explicitly illustrative learning plan, clear learner signup/login and staff entry, and an explanation of the three-stage learning loop |
| Login / signup / staff login | Consistent split layout, connected labels, password visibility, useful progress states and role-specific copy; original account and staff checks retained |
| Navigation | Grouped persistent desktop sidebar; mobile drawer with Escape, focus containment, focus restoration and active-route indication; skip link and a compact workspace header |
| Overview | Data-dependent next action, daily-completion awareness, XP/level/streak, focus skills, priority roadmap items and recent activity; useful first-use states |
| Resume studio | Drag-and-drop or file-picker input, explicit upload/review/apply stages, editable fields, evidence-backed skill selection, processing feedback and saved-state next actions |
| Onboarding | Named stages, student/professional selections, linked form labels and honest custom-role guidance |
| Daily / practice assessments | Shared native-radio answer choices, keyboard selection, previous-question navigation, answer persistence, disabled empty/duplicate submissions, loading feedback and review states |
| Roadmap | Retained interactive tree with pan/zoom/fit, light canvas, legible branches/resources, saved tree/list modes, progress context and resource assessment dialogs with focus containment and Escape |
| Skill analytics | Light-theme charts and tooltips; unassessed skills identified explicitly; chart choice and readable skill summaries |
| Learning insights | Clear analysis action, strength/gap/resource hierarchy, resource recommendations in a responsive grid and cached-analysis feedback |
| Learner mentoring | AI/human mode controls, starter prompts that fill the composer, conversation context, accessible composer and send control; original message persistence and clearing behavior retained |
| Profile | Readable profile summary, charts, skills and a deliberate edit mode rather than a wall of apparently inactive inputs |
| Admin overview / moderation | Shared workspace and chart palette, semantic status badges and clearer content hierarchy |
| Learner directory | Name/email/course search, profile-status filter, name/XP/score sorting, result count and resettable empty state; no invented learner metrics |
| Staff / assignments | Named account, mentor and learner selectors; separate staff/assignment actions; account-ID fallback for existing-account administration |
| Mentor desk / conversations | Shared navigation, readable student skill summaries, selected conversations and consistent message/composer surfaces |
| Demo / loading / errors | Redesigned private entry, temporary-session banner, matching workspace skeletons and custom retry/not-found states |

### Accessibility and responsive behavior

- Native radio controls support keyboard assessment selection.
- Status is communicated through labels as well as color.
- Form labels are connected to their fields; icon-only send, close, logout and menu controls have names.
- Drawer and assessment dialogs contain keyboard focus and restore it on close.
- Visible focus styles, a skip link and reduced-motion CSS are included.
- Desktop navigation becomes a drawer below 901 px. Forms and content columns stack on smaller screens, and long content remains within its working surface.
- Short desktop viewports hide the optional sidebar prompt so primary navigation and account controls remain usable.

## Data corrections made while redesigning

The daily trend/profile/mentor queries referenced a `daily_attempts.score` field that is not present in the authoritative daily-attempt schema. Daily percentage history now uses `correct_count / total_count` where needed. This is separate from `practice_attempts.score`, which does exist.

Skill analytics previously represented unassessed role skills as measured zeroes. The interface now marks them as not assessed and excludes invented gap values from the gap chart.

## Scope and validation boundaries

The redesign is implemented in the starting feature checkout. Main and historical branch refs remain untouched. Normal authentication, role guards, learning APIs, local model training and the existing guest/staff-demo work remain in place.

Validation uses TypeScript, Next.js lint/build, the existing assessment/client tests, learner/staff demo integration scripts and browser checks against disposable local sessions. Production Supabase mutations and externally generated Gemini replies are not implied by local-demo verification. Existing model quality and production RLS hardening remain separate backend concerns. Personal career goals now keep a supported learning track, and that track can be changed or repaired in the profile editor.

### Verification completed

| Check | Result |
| --- | --- |
| `npx tsc --noEmit --pretty false` | Passed |
| `npm run lint` | Passed without warnings or errors |
| `npm test` | 28 tests passed, including authentication, retained roadmap progress, cloud replay and private service URLs |
| Next.js production build | Passed; all 43 routes generated/validated, including the privacy notice |
| `npm run test:demo` | Passed: nine learner pages, PDF ingestion, profile application, resources, course completion, insights, grading, replay protection, isolation, deletion and lease expiry |
| `npm run test:staff-demo` | Passed: staff logins, rendering, role boundaries, sample mappings and mentor replies |
| Browser interaction | Assessment answer selection, backtracking, preserved answers, complete submission and review; directory search, empty results and reset; password visibility; mobile drawer and Escape focus restoration |
| Responsive visual review | Desktop workspace/public/auth/staff screens and a 390 × 844 mobile workspace; checked document width for horizontal overflow |
| Patch whitespace | `git diff --check` passed |

The production build ran from an isolated copy in the ignored `ml/runtime/ui-build-20261101` directory so the local preview could keep running. Application, component, library and public asset bytes were compared with the final workspace and matched. The source project keeps its original Next.js output configuration.

The tree now starts fitted to its canvas, offers readable zoom, and uses Ctrl/Command + scroll for zooming so ordinary page scrolling remains available. On touch screens, vertical page scrolling remains available over the canvas. Conversation updates scroll their own message panel instead of moving the document to the composer.

Google provider setup, real-account Chrome verification and authentication behavior
are recorded in [authentication notes](AUTHENTICATION.md). The follow-up fixes also
preserve course progress when refreshing roadmap priorities, restore learner chat
polling in Strict Mode, ignore stale mentor-chat responses after switching learners,
and keep form edits available after a network failure.
