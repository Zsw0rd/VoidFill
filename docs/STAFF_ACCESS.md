# Administrator and mentor access

Staff accounts have one primary database role. An administrator can also mentor explicitly assigned learners. The application now exposes administration, personal mentoring and the account's own learning workspace from the same login. A learner profile links back to eligible staff workspaces. Staff creation remains restricted to super administrators; ordinary administrators can manage assignments.

The message API determines mentor intent from an explicit target learner, checks the current database role and assignment, and verifies conversation ownership. Admins can still send learner messages in their own learning workspace. Reassignment starts a new mentor thread rather than exposing the previous mentor's conversation. An unassigned account sees an empty mentoring workspace.

The owner approved the corrected existing Gmail account and persistent administrator access at action time. The exact auth-user ID and email were guarded in the SQL grant, which was applied and verified. The account has `admin` access, including mentoring; it is not `super_admin`. No owner-specific grant, private identifier or credentials are stored in this public repository. No real learner assignments or messages were created.

Production is deployment `5SWzGurP1dfbceQfygM9BRH56niC`, source `8884679d1ddf14b97357cc4c16f913db292c0cda`, at https://void-fill.vercel.app. Vercel's existing authenticated CLI rebuilt the tested Git preview using production settings. Browser identity verification was not needed for this supported CLI deployment.

All four live integration suites passed: careers, learner demo, staff demo and authentication. Staff checks cover admin mentoring, explicit assignments, first-message conversation creation, unassigned-target denial, forged learner intent and conversation isolation. Synthetic demo sessions are temporary and do not contact real learners. Forty Node tests, four focused Python staff tests, type checking and the production build passed. A rollback-only real Supabase test validated administrator reads, assignments and mentor writes while denying super-admin self-promotion.

Chrome verified the real account's live administrator dashboard, mentoring dashboard, empty conversations workspace, personal learning dashboard and profile links back to both staff areas. The learner profile and progress were retained. The expired-demo entry recovery fix preserves existing lease expiry and deletion behavior.
