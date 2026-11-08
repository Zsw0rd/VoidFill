# Authentication

Email/password and Google use the same profile bootstrap and role routing. Google
is available on learner login, signup and staff login. Staff access requires an
existing row in `admin_users`; Google metadata cannot grant a staff role.

## Configured environment (1 November 2026)

- Google Cloud project: `voidfill` (`gen-lang-client-0593769349`).
- OAuth web client: `VoidFill Web`.
- Public client ID: `895013381788-isf38v6gdulj84mdtuqp2jr92l9cuh9b.apps.googleusercontent.com`.
- JavaScript origins: `https://void-fill.vercel.app`, `http://localhost:3000` and `http://localhost:3001`.
- Google redirect URI: `https://duklscnzisneioiwgfao.supabase.co/auth/v1/callback`.
- Google provider is enabled in the VoidFill Supabase project.
- Its client secret is stored in the Supabase provider settings, never in source
  code or a `NEXT_PUBLIC_*` environment variable.
- Supabase Site URL is `https://void-fill.vercel.app`.
- Supabase redirect allowlist includes
  `http://localhost:3000/auth/callback**` and
  `http://localhost:3001/auth/callback**` and
  `https://void-fill.vercel.app/auth/callback**`.
- Google audience is **External / In production**. Basic Google sign-in is no
  longer restricted to the test-user list. Branding uses the production homepage
  and `https://void-fill.vercel.app/privacy`.

The browser constructs its callback from its current origin, so both allowed local
ports work. The app only requests Google name, email and profile access. The
consent screen currently identifies the Supabase project domain.

## Sign-in behavior

1. Google returns through Supabase to `/auth/callback`. Supabase validates its
   OAuth flow and the server exchanges the PKCE code for a session.
2. The app checks `admin_users` and initializes missing learner profile fields and
   stats. It supports the existing `handle_new_user` trigger and does not insert a
   duplicate profile or overwrite a returning user's profile or earned XP.
3. New learners go to onboarding. Returning learners go to their requested learner
   page or dashboard. Staff go to their authorized workspace.
4. A real login ends a previous temporary demo workspace so the demo cannot mask
   the real account. Sign-out stays on the current site origin.

Return destinations are restricted to application routes. Cancelled, missing and
invalid callbacks show a friendly error without echoing provider error details.
Protected pages refresh session cookies in middleware; the refreshed cookies also
survive redirects. Logout accepts POST only.

Email signup passes display fields as auth metadata. If email confirmation is
enabled in Supabase, the form shows a check-inbox state and waits for confirmation
before attempting authenticated profile writes. The same callback completes that
flow. Confirmation-enabled email delivery was not exercised in this local test.

## Verification

The production college-account acceptance run on 7 November 2026 completed a
genuinely new Google signup, first-time learner onboarding and one saved daily
assessment. Optional background/skill claims were left empty; the selected path
was AI Applications Developer at foundation level, with context identifying the
account acceptance test. The learner began at zero XP with unassessed skills.

The first saved check returned 9/10 and 95 XP. Reloading retained that result.
After ordinary logout and a new Google account selection, the returning learner
went directly to the dashboard, retained 95 XP, streak one and five skill scores,
and could reopen the same saved daily result without another award. Stale tokens
from an interrupted earlier session expired without saving progress. The live
test exposed an ambiguous original SQL item; the quality review records its
exclusion from future checks. Existing sealed attempts are preserved as graded.

The designated college identity remains a regular learner; no staff privileges
or mentor assignments were added. Its email, provider IDs, authentication data
and private screenshots remain outside this public repository. Google password
entry was completed by the account owner directly in Chrome.

The existing owner's Google login and administrator/mentoring access were also
verified in the preceding production release. First-time profile creation,
trigger races, preservation of edited profiles and role isolation have automated
Node regression coverage. Current release checks and Chrome-only UX evidence are
recorded in `VALIDATION_AND_OPERATIONS.md`; the HTTP auth script also checks
callback errors, cancellation, return-path validation and POST-only logout.

```powershell
npm test
$env:TEST_BASE_URL='http://localhost:3001'
npm run test:auth
npm run test:demo
npm run test:staff-demo
```

`test:auth` runs without a user session and checks callback failures, cancellation,
safe redirects, protected pages and POST-only logout. The demo suites exercise
isolated temporary accounts, learner workflows and staff role isolation.

## Deployment

The Vercel/Supabase cloud runtime and quality evidence are documented in
[CLOUD_DEPLOYMENT.md](CLOUD_DEPLOYMENT.md). The production domain is configured.


When changing domains, update the Google origin and Supabase callback allowlist
together. Keep Google's redirect URI pointing to Supabase, and keep the public
privacy notice reachable on the deployed domain.

The production transactional grading migration is applied. Browser roles cannot
write earned scores/XP or execute the privileged grading RPC; server-verified
results commit atomically. See [database releases](DATABASE_RELEASES.md) and
[the applied-learning release evidence](APPLIED_LEARNING_RELEASE.md).

Provider setup reference: [Supabase Google Auth documentation](https://supabase.com/docs/guides/auth/social-sign-in/auth-google).
