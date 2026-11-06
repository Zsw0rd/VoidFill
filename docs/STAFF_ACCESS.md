# Administrator and mentor access

The application stores one primary role per staff account. Its existing database policies allow administrators to mentor. The UI and message API must support that hierarchy while keeping mentor conversations tied to explicit learner assignments.

Implementation: admin/super-admin navigation includes the mentor dashboard and conversations. A staff account with an onboarded personal profile can return to its own learning workspace; the learner profile links back to its staff workspaces. Administrators can assign learners to eligible staff, while creating staff accounts remains restricted to super administrators.

Mentor message intent is explicit through the target learner. Only a verified staff role can use it, and the API checks assignment, learner identity and conversation ownership. Admin accounts can still send messages as themselves in their personal learner workspace. Reassigned learners get a new mentor thread; their previous mentor's conversation is never reused. Tests use disposable synthetic conversations and do not contact real learners.

The requested account upgrade will use an exact existing auth-user match. The typed email has a domain typo, so the intended account and persistent administrator privileges must be confirmed before applying the grant. No account-specific grant or credentials are committed to the public repository. No real learner assignments or messages are created automatically.

Career expansion foundation production release is verified at deployment `Dn7bBTZY2Tf97yZ53K2bDeXXNtkP`, source `2c6c9dca18d169574686f5024966b2110f6579b8`, on `https://void-fill.vercel.app`. Live career, learner, staff and authentication integration suites passed. Chrome's real signed-in career explorer loads with no console warnings/errors.

After staff access is complete and verified, continue the next career content cohort toward 30 pilot foundations, preserving explicit knowledge/practical coverage and Vercel + Supabase hosting.

Current verification: 40 Node tests passed; four focused Python staff-isolation tests passed. Local HTTP career/auth suites and expanded staff integration passed, including admin-as-mentor assignment, new-thread creation, nullable first-message conversation ID, denial for unassigned learners and forged learner mentor intent. A rollback-only real Supabase test passed administrator reads, assignment creation, mentor conversation/message writes and prevention of super-admin self-promotion. No real account privileges have been changed yet.

Chrome confirmed the combined administrator and mentor navigation. An expired local demo cookie initially redirected the private entry page away; the lifecycle component now lets private entry pages start a fresh session. Existing workspace lease/expiry behavior remains covered by integration tests.

Production-mode local build, staff and auth integration passed. Mentor mode uses the same verified staff role and an explicit target learner. Both learner and mentor conversation lookup now avoid adopting a thread attached to a previous mentor. The persistent account grant remains pending action-time confirmation; the exact Gmail account was found and no account exists at the typed gmai.com address.
