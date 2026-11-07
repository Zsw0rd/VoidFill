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

Chrome testing on port 3001 completed Google consent and reached the real existing
account's dashboard. Sign-out returned to port 3001. Entering through Google on
the signup page returned to the same existing profile and target role. No real
profile fields or learning progress were changed for the test. First-time profile
creation, trigger races and role isolation also have automated regression tests.
The production build (including middleware), TypeScript, lint, all 28 unit tests,
learner/staff demo integration and anonymous auth integration checks passed.
The auth integration checks also passed against the built production server.

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

The existing learning-progress database policies and transactional grading work
remain a separate production requirement; see
[local ML limits and production follow-up](LOCAL_ML.md#limits-and-production-follow-up).

Provider setup reference: [Supabase Google Auth documentation](https://supabase.com/docs/guides/auth/social-sign-in/auth-google).
