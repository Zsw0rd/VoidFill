# Career expansion implementation

Current coverage: all 60 listed careers have foundation knowledge checks, resources and distinct practical activities across 55 shared skills. See [the verified third-cohort release](CAREER_COHORT_3.md) for current counts, validation and production details. The staged implementation history below is retained for context.

Started 6 November 2026. User approved the proposed expansion plan and requested implementation. Runtime stays on Vercel + Supabase. Existing Sage/Gemini chat is separate; the new career matching and learning paths must not depend on it.

## Delivery and acceptance

Build the shared catalogue and personal-goal flow first, including a 12-role pilot with six technical and six non-technical paths. Extend the discovery catalogue toward 60 careers with explicit coverage. A discoverable role must never be described as fully assessed when its specialist skills lack content. Existing IDs, scores, XP, assessment histories, and courses must survive migration and target changes.

Pilot technical roles: Frontend Developer, Backend Developer, Data Analyst, AI Applications Developer, Cloud Support Associate, Cybersecurity Analyst. Pilot non-technical roles: Digital Marketing Associate, Recruitment Associate, Sales Representative, Customer Success Associate, Project Coordinator, Accounting Associate.

Data from official O*NET 31.0 provides occupation references; role-specific skill mappings and learning objectives are curated app content, not claims that O*NET certifies an assessment. Source metadata and attribution travel with the catalogue. ESCO is a future import adapter; do not claim it was imported until implemented.

## Work sequence

- [x] Shared versioned catalogue: families, aliases, role profiles, skills, independent importance/proficiency targets, evidence and coverage metadata.
- [x] Pilot learning pack: original objective/scenario questions and primary-source resource links; practical activities use explicit review rubrics.
- [x] Python integration: data-driven topics, exact skill mapping, no unrelated-topic fallback, tests for technical and non-technical paths.
- [x] Cloud index refresh: same ONNX weights; precompute new catalogue embeddings offline; verify content hashes during build, never a user's cold request; reuse base vectors where compatible.
- [x] Single shared normal/demo catalogue; SQL seed preserves existing role and skill UUIDs by canonical names.
- [x] Shared career picker and personal-goal matching with explicit user confirmation; persist known selected skills and experience level without altering earned progress.
- [x] Consistent requirements across roadmap, assessment context, analytics, resume suggestions and mentoring.
- [x] Meaningful coverage, mapping, isolation, migration and regression tests; desktop/phone Chrome QA against disposable data.
- [x] Apply additive Supabase migration, deploy through existing Vercel project, and verify production flows.

## Starting implementation constraints (addressed)

- Clean starting commit: `77774fabf6335d9e556b5ee31be1c3dce377c5a6`; branch `codex/local-ml-resumes-guest-demo`. Keep this branch: existing Vercel preview secrets are scoped to it. No merge/force-push requested.
- `lib/learningContext.ts` currently takes preset role skills and derives target score from `weight`; separate these fields.
- `ml/service.py` has eight fixed technical TOPICS and loads `ml/data/questions.json` / `resources.json`. ONNX `catalogue.npz` in the existing model release contains the old vectors and must be refreshed for any new pack.
- `ml/guest.py` has a separate three-role/six-skill CATALOG. Replace its source with the shared JSON while retaining the legacy first three role ordering used in demo scripts and the `identifier(name)` UUID convention.
- Shared client-safe metadata can live in `ml/data/careers/catalogue.json` (TS resolveJsonModule is enabled). Answer keys stay in a separate server-only file.
- Production schema roles/skills have unique names. Role requirements use `role_skills(role_id,skill_id,weight)`; additive columns and profile preferences need a migration. Do not replace existing IDs with deterministic guest IDs.
- Preserve the selected Living Atlas design. This is feature implementation in the established design system, not a new visual direction.

## Browser/deployment context

User requested Chrome plugin for external configuration. Production URL `https://void-fill.vercel.app`; Supabase project `duklscnzisneioiwgfao`; Vercel project `zsw0rds-projects/void-fill`.

Production at start: `dpl_9y57eoN3qasEp9sFWUbSTVa18SZX`, source 77774fa. Fresh Google owner sign-in, production learner/staff/auth scripts passed on 6 November. Never use other signed-in Google accounts or modify the owner's progress for tests.

Prior permissions cover production OAuth, existing Vercel server secrets, model artifact uploads, production publication and tests. A fresh Vercel identity code, if requested by the website, must be entered by the user directly. Do not ask again for already authorized publishing.

CUA state may persist; currently selected Chrome was browser `3`, profile Person 1, extension ID `875f281c-2177-49d3-9009-34459045dac5`. On a summary resume read CUA documentation first. Tab snapshots can lag after actions; navigation sometimes needs a fresh tab handle. Use viewport-only screenshots: full-page capture previously resized/clipped the page. Reset temporary responsive viewport overrides. Save final proof and call the CUA completion-summary tool after observing the final browser outcome.

No new subagents unless the user or an applicable skill explicitly authorizes delegation.

## Implemented foundation pack

60 profiles across 10 families, 55 reusable skills and 12 pilot foundations (6 technical / 6 non-technical). Added 320 original knowledge questions and 51 primary-source resource links; all 51 links returned HTTP 200 in the recorded source check. Existing base question/resource content is retained. Each pilot has a distinct practical activity and review rubric. Specialist skills without a dedicated bank are explicitly marked for practical review.

The shared picker is used in onboarding, profile editing and Career explorer. Personal goals may select up to four known focus skills without forcing an occupation match. Career level changes curriculum targets, not awarded scores. Central requirements feed atlas, daily/practice context and analytics. Resume suggestions rank all 60 contexts, require explicit extracted skill evidence, and never award proficiency. Reflections are private and ungraded.

Validation so far: 36 Node tests; 45 Python regression tests; 10 updated career Python tests (includes non-technical resume and manual-skill insight checks); all 12 pilot career HTTP contracts passed, including question isolation, focus/custom goal validation and preserved scores/XP. Atlas layout tests include 10, 12 and 16 branches.

Supabase migration dry run on 6 November: 61 stored roles (60 profiles plus personal-goal storage), 55 skills, 241 role requirements; all 9 original role/skill IDs retained. Transaction rolled back. Initial production saved-score count and total XP were both zero. Persistent migration, real-table RLS validation and deployment remain pending.

Production database migrations applied through Chrome after the rollback tests passed. The synthetic two-user RLS check in `supabase/tests/career_profiles.sql` passed: own preferences/reflections readable, foreign read/update/insert blocked, earned score retained; transaction rolled back. Persistent catalogue has 61 storage roles, 55 skills and 241 requirements. Only public metadata and new private learning fields were changed.

Chrome local QA: recruitment alias and personal label saved; resource links load into its atlas; Workplace Communication knowledge assessment shows relevant content; private reflection survives navigation. At the phone breakpoint (390 requested pixels, 341 CSS pixels due browser zoom), no horizontal overflow. Unknown museum-role title produces no forced match and can be built with an explicit UX focus; dedicated UX knowledge checks remain pending.

Final checks: production Next build passed (46 routes/pages); 37 Node tests and 47 Python tests passed. After expanding the public cache, 24 focused career/service/cloud tests passed. 248 public recommendation/assessment queries are precomputed in a 2.15 MB extension using the unchanged ONNX weights. Tests exercise recommendations, general knowledge checks and catalogue course checks for every pilot without loading the encoder graph. Private resume/new-context encoding remains uncached.

Local learner, staff and auth integration scripts passed. Final production-mode local smoke and Vercel release verification follow before completion. Test expectations for practice question count were corrected to the existing 10-question contract. During SQL editor testing, an incomplete editor replacement failed before applying changes; the editor was cleared and the full query compared to the reviewed source before re-running. Both subsequent rollback tests and the persistent migration succeeded.

Final consistency fixes: the dashboard filters saved roadmap branches to current requirements without deleting historical rows. Insight cache fingerprints include career, personal goal, level, focus requirements and scores, so changing direction/evidence cannot reuse stale advice. Atlas icons now reflect business, people, finance, marketing, service and technical skill categories; its goal marker is a universal compass. Onboarding examples include non-technical skills.

Final production-mode local career integration passed all 12 pilots plus personal-goal/focus changes, reflection isolation, unchanged scores/XP, cache invalidation and removal of inactive focus from the dashboard. Build and type checking passed after the final atlas icon and copy changes. Vercel publication is the remaining release step.

Vercel preview AgRHfsB6SJLpD2HU1Pmcm1Butv1H rejected the first build because raw-byte fingerprints differed between Windows CRLF files and Linux Git blobs. Fixed fingerprints to use canonical parsed JSON: string values and list order remain significant, formatting and object key order do not. All six fingerprints were independently verified against Git blobs, and 25 career/service/cloud tests passed, including a new CRLF/LF regression. The existing vectors remain valid because parsed content is identical; no guard was removed and no model quality setting changed.

Release completed: production deployment Dn7bBTZY2Tf97yZ53K2bDeXXNtkP serves commit 2c6c9dca18d169574686f5024966b2110f6579b8 on https://void-fill.vercel.app. All four live integration scripts passed (careers, learner, staff, auth). Real signed-in Chrome Career explorer rendered without console warnings/errors. Final full suites: 37 Node and 48 Python tests passed. Screenshot: careers-production-live.png in the task visualization directory. User then requested admin + mentor access for their existing account and continuation of the expansion; tracked in docs/STAFF_ACCESS.md.
