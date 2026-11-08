# Account recovery and privacy controls

The Account & privacy page (`/account`) is linked from learner and staff profiles.
It provides a scoped application-data export and a recorded deletion-request
workflow. It does not automatically erase an account or transfer staff access.
Temporary demos cannot export or change a real account behind their demo session.

## Password recovery

Email/password users can choose **Forgot your password?** on sign-in. Supabase's
existing Auth service sends the one-time reset link; no new email provider,
credentials, public API key scope or paid service is introduced. Public success
and failure messages do not disclose whether an address has an account. Supabase
Auth enforces its recovery email rate limits; the form blocks duplicate in-flight
submissions. A configured Google-only account continues to use Google sign-in;
this feature never changes the user's Google password.

The reset request uses the existing `/auth/callback?intent=recovery` allowlist
path. PKCE requires opening the email in the same browser that requested it.
`sb_flow_id` is forwarded when supplied by the installed SDK. URL parameters and
the SDK's PASSWORD_RECOVERY event are routing hints, not authorization evidence:
the SDK event can derive from editable PKCE verifier storage.

After a successful exchange, the callback validates the exact access token with
Supabase's `auth.getUser(accessToken)`. Only then does it inspect that token's
server-issued claims: matching subject and Supabase issuer, authenticated audience
and role, non-anonymous identity, valid expiry and a `recovery` authentication
method with a timestamp within ten minutes (30 seconds of future clock skew is
tolerated). Missing/unsupported AMR fails closed. No fallback accepts a normal
OAuth/password session solely because the URL or SDK event says recovery.

The callback issues a ten-minute HttpOnly, SameSite=Lax grant bound to the exact
verified access token and user. Its HMAC uses a purpose-specific derived key from
the existing assessment/service secret fallback. Password writes require both
that grant and the recent recovery claims on the provider-validated exact token,
plus an exact same-origin POST and bounded JSON. Passwords have at least 12
characters, at most 256 UTF-8 bytes, and are never trimmed, logged or saved to
profile rows. A successful write clears the grant and ends this recovery session
locally. The flow does not use an admin password override or weaken OAuth.

Chrome inspection on 8 November found the project uses Supabase's built-in email
service, not custom SMTP. Supabase documents that built-in delivery is restricted
to project-team addresses with a two-email-per-hour default limit and is not a
general-public production mail service. Therefore **public email/password recovery
is not operationally complete** under the current Vercel + Supabase-only constraint.
The recovery UI states limited delivery and offers Google sign-in/support; it does
not promise a link for every address. No SMTP provider or credentials were added.

Real email delivery and password changes need a separate authorized mailbox
acceptance run. Automated checks do not request email, read a mailbox, change
any real user's password, or claim SMTP delivery was tested. Project mail
configuration and Supabase email quotas still apply. No external SMTP service
was configured. Google password/MFA entry remains a user handoff.

## Own-data export

`POST /api/account/export` authenticates through Supabase Auth and uses the
authenticated RLS client. Every root collection has an explicit auth-derived
owner predicate, even for administrators. Child assessment answers are scoped
through owned attempts, and messages through owned conversations. Callers cannot
provide a user ID or arbitrary table/column names.

The JSON attachment includes the allowlisted profile, statistics, skill scores,
roadmap, resource completions, courses, completed assessment history, private
career reflections, practical drafts/submissions and feedback shared with this
learner, saved insights, privacy request status, and the user's own/AI messages.
Mentor-authored chat messages, other learners, private staff moderation, operational
ledgers/logs, authentication metadata, access/refresh tokens and credentials are
excluded. The file explicitly describes these limits. It is not a complete
project, authentication, storage or disaster-recovery backup.

Queries paginate in stable order with 500 rows per page, enforcing a running byte
budget before accumulating each page. The complete export is
bounded to 10,000 rows, 12 MiB and a 25-second database budget. If a query fails or
the account exceeds these limits, the route fails without serving a partial file
and offers assisted export through the privacy contact. Concurrent writes may
occur during export: this is a paginated application-data read, not an atomic
database snapshot. Responses use private/no-store and attachment headers. The UI
downloads only after a successful complete response and warns that the resulting
file contains personal information.

## Deletion request and administrator review

Apply `supabase/migrations/20261108120000_account_requests.sql` through the
existing checksum-ledger release process before publishing this UI. This additive,
idempotent migration creates `account_deletion_requests` and one service-only
mutation RPC. It does not delete existing records, alter roles or grant new staff.

The signed-in account must have a verified email and explicitly type that email
to record its request. The server derives the user and canonical email from Auth;
body-supplied user IDs are rejected. One request row per account makes repeated
submissions idempotent while review is open. The owner sees a reference, status,
request time, staff-transfer notice when applicable, and any review response. They
can cancel a pending/in-review request or reopen a cancelled/closed request.
Reopening issues a fresh reference, so an old inbox or cancellation action cannot
target the later intent. The table retains the latest request state per account,
not a complete history of previous cancelled/closed requests.

`/admin/account-requests` is an administrator-only inbox linked from staff profile.
Mentors and learners cannot access it. It paginates 100 requests per page, with
open requests ordered oldest first and a separate all-requests view ordered newest
first. Old unreviewed requests are not hidden behind recent closed reviews.
Administrators can mark another account's request as in
review, or save a response of at least 20 characters and close the review. A
separate administrator must review the requesting administrator's own account.
The response is visible to that account; private notes must not be entered there.
No email or other outbound message is sent automatically.

**Closing a review does not erase the account.** Actual removal remains a separate
human operation: verify identity, clarify exported/shared evidence and retention,
transfer active mentor/administrator responsibilities, confirm the precise scope,
then perform and verify the approved removal through the existing trusted tools.
The app does not offer an unimplemented “Delete now” action or promise a completion
deadline. The privacy contact remains available for follow-up and larger exports.

Authenticated browsers can read their own request through RLS but cannot directly
insert, update or delete rows, nor call the privileged RPC. The service route checks
the actor; the SQL function independently restricts administrator actions and
ownership of cancellation. No request operation changes XP, assessments, roles,
assignments, Auth accounts or other learning records.

## Validation

```text
node --import tsx --test tests/account.test.ts
node scripts/test-account.mjs
python scripts/test-database.py --allow-test-database
```

Unit coverage includes recent/stale/missing/wrong-provider AMR, ordinary OAuth
rejection, signed-grant tampering/user/session/expiry/secret isolation, strict
origins, bounded passwords, action identity rejection, staff export isolation,
child ownership, pagination and failure without partial export. The HTTP script
checks public recovery pages and unauthenticated/wrong-origin boundaries only.
Real PostgreSQL tests exercise RLS, service-only grants, foreign cancellation,
mentor denial, request replay, owner cancellation, stale review rejection,
administrator response, staff flags and preservation of accounts/XP. Run those
only against a disposable loopback database or the existing hosted CI Postgres job.

Chrome verification follows the user's Chrome-only preference. No Playwright or
axe browser suite is invoked by this feature. Automated tests cannot substitute
for an authorized real recovery email or a human review of an actual deletion.

Primary references checked 8 November 2026: [Supabase password authentication](https://supabase.com/docs/guides/auth/passwords),
[PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow),
[JWT recovery AMR claims](https://supabase.com/docs/guides/auth/jwt-fields),
[resetPasswordForEmail](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail).
[Built-in email/SMTP delivery limits](https://supabase.com/docs/guides/auth/auth-smtp)
explain why a coded recovery flow is not proof of delivery to arbitrary accounts.
