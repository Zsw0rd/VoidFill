# Resume ingestion and temporary demo

Cloud deployment uses encrypted, expiring Supabase demo snapshots instead of
process-local memory; see [CLOUD_DEPLOYMENT.md](CLOUD_DEPLOYMENT.md). Statements
about the local guest database below describe local development.

## Using the product

Resume ingestion is available at `/resume`, in the learner navigation, and from
Profile. Upload a valid PDF or DOCX up to 4 MB. PDFs can contain up to 12 pages.
The parser supports ordinary ATS documents, text-based designed layouts, DOCX
tables/textboxes, and scanned PDFs through offline RapidOCR ONNX models.

Review the extracted text, contact fields, sections and skill evidence. Choose
which skill mentions to apply, edit the name, and optionally choose a target role.
Existing profile skills are merged by default. Contact information and full text
are shown for review only. The original file and extraction are not retained by
the server after processing. Applied fields use the existing profile schema;
no Supabase migration or anonymous-auth setting is required.

Skill mentions and career suggestions are not assessment results. They never
change mastery scores, XP or course completions. Take a baseline assessment to
measure ability. Contacts, section headings and explicit skill mentions use local
rules; the trained MiniLM encoder ranks career contexts. RapidOCR is a separate
pretrained OCR model, not a resume NER model trained in this project. There is no
claim of measured field-extraction accuracy on a labelled resume benchmark.

ATS documents give the most predictable reading order. Designed layouts and scans
work on a best-effort basis; complex columns, handwriting, icons and unusual fonts
can require correction. English is the supported field/heading language. Legacy
`.doc`, password-protected PDFs and standalone images are not accepted.

## Private demo entry

`npm run dev` generates a server-only `DEMO_ENTRY_KEY` in `.env.local` if absent.
Open `http://localhost:3000/demo/<DEMO_ENTRY_KEY>`. The entry is not linked from
public navigation; invalid keys return 404. Demo responses use noindex and
no-referrer headers. Rotate the hex key to replace the entry URL. Anyone holding
this URL can start a demo, so share it only with intended testers.

Choose one of the three seeded roles and start. The demo opens the resume page
and supports the normal learner screens: dashboard, profile, daily/practice
questions, skill graph, roadmap/course assessments, insights and AI mentor. There
is no staff access or live human mentor assignment. The AI mentor keeps its
existing Gemini integration and needs a working key/quota; messages sent there
leave this device. Guest deletion removes local chat records, not any provider
retention. Resume files are never sent to Gemini by ingestion.

The browser receives a session-scoped HttpOnly capability cookie and a separate
non-authorizing UI marker. Server and browser query adapters redirect guest
queries into the local Python service. Every guest has its own in-memory tables,
assessment replay ledger and immutable seed catalogue. Guest records never enter
Supabase or the normal file-based submission ledger. Service authentication is
server-only; an invalid guest capability fails closed without falling back to a
real account. A signed-in account can coexist underneath the temporary demo;
ending the demo leaves that account untouched.

## Deletion and session boundaries

- **End demo & delete data** or logout removes the entire guest store immediately.
- Each document has its own lease and sends a heartbeat every 15 seconds.
- Closing a tab releases its lease with a 12-second grace period. This allows a
  refresh or full-page navigation to register a replacement lease.
- Other open demo tabs keep the same guest session alive. After the last release,
  the background cleanup removes records within about 14 seconds.
- A crash, suspended tab or lost connection without a release expires its lease
  after 60 seconds, with cleanup within about 62 seconds of the last heartbeat.
  A browser cannot guarantee delivery of a tab-close event.
- Sessions have a hard two-hour limit. Service restart discards all guests.
- Cleanup runs every two seconds independently of subsequent HTTP requests.

There are no guest database files or uploaded-resume backups to clean up. Multipart
uploads may be spooled to an OS temporary file while parsing; the file handle is
closed and temporary storage removed when processing finishes. Production crash
dumps, OS swap and external infrastructure logs are outside application retention.

This is a local, single-service demo store. Multi-process services need sticky
routing or a shared expiring store. Do not deploy it with multiple Uvicorn workers
without replacing the store. Session count and storage caps bound demo memory;
production public access also needs deployment-level rate limits.

## Verification

```bash
npm run test:ml
npm run dev
# Another terminal, against the running app:
npm run test:demo
```

The integration test uses separate cookie jars and disposable synthetic resume
data. It exercises nine learner pages, ingestion and profile application,
recommendations, analysis, daily/practice grading, course assessment/completion,
idempotency, isolation, immediate deletion and background lease expiry. Synthetic
test fixtures/screenshots under ignored `ml/runtime` are development artifacts,
not retained user uploads. Normal-account storage still uses Supabase and was not
modified by these guest tests.
# Staff demo accounts

The same private `/demo/<key>` page now includes a separate admin/mentor email
and password form. These credentials work in that form, not Supabase's normal
staff login. `npm run dev` generates three server-only passwords in `.env.local`:
`DEMO_ADMIN_PASSWORD`, `DEMO_MENTOR_PASSWORD`, and `DEMO_MENTOR2_PASSWORD`.
The emails are `admin@demo.voidfill.local`, `mentor@demo.voidfill.local`, and
`mentor2@demo.voidfill.local`. Rotate the local variables to change the passwords.
Credentials and the private entry key are never included in source control.

Every staff login gets an independent in-memory workspace. The admin is a demo
super admin and sees six synthetic learners, two mentors, 42 daily attempts,
skill scores, XP, streaks, assignments, sample conversations, and two explicitly
labelled moderation examples. Meera Shah mentors Aarav Sharma, Priya Singh, and
Rohan Das; Arjun Patel mentors Ananya Rao, Kabir Mehta, and Ishita Sen.
Mentors see only their assigned learners and can reply through the existing chat
routes. Admins can demonstrate staff additions using a sample learner UUID and
mentor assignments. These changes affect that login's copy only; adding a staff
row does not create an additional login credential.

Existing guest lease, explicit deletion, crash expiry, and two-hour limits apply
to staff workspaces too. Sample conversations are local simulations: no messages
are sent to real learners. Separate logins do not share edits or chat messages.
Run `npm run test:staff-demo` against a running server to check all three logins,
staff page rendering, access boundaries, sample mappings, and mentor replies.
