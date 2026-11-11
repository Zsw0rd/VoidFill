# Broader document and workload validation

This engineering batch extends the previous one-page text-PDF and short core
probes. It retains Vercel + Supabase, the FP32 encoder, existing request limits,
PDFium's native-lifetime mutex and offline OCR. It changes no account operations,
authentication permissions, generation quotas, grading or saved progress.

## Actual limits and document metadata

The parser accepts at most **4,194,304 bytes (4 MiB)** and **12 PDF pages**.
Extracted text is limited to **60,000 characters**. DOCX central-directory
expanded size is capped at **31,457,280 bytes (30 MiB)** before its parts inflate.
The web layer has a separate multipart-envelope bound and rejects a file one
byte over the file limit with HTTP 400; the direct parser uses HTTP 413.

DOCX physical pagination depends on fonts, paper settings and a layout engine.
The earlier unconditional `pages=1` metadata was misleading. DOCX now returns
`pages=null, page_count_known=false`; PDFs retain actual counts and
`page_count_known=true`. Content extraction and limits are unchanged.

## Fixed fictional matrix

`ml/document_probe_fixtures.py` creates only reviewed synthetic content. It
cannot read an original resume and writes only to a new directory inside ignored
`ml/runtime`. Existing output and paths through symlinks/junctions are rejected.
The manifest binds each file to its byte count and SHA-256.

| Case | What it establishes |
| --- | --- |
| One-page text PDF | Actual native text extraction and small private encoder input |
| Twelve-page text PDF | The maximum PDF page count, page order and complete extraction |
| Exactly 4 MiB PDF | Upload-byte acceptance with an explicitly inert, unreferenced stream |
| One scanned page | Actual bundled offline OCR, with no hidden text layer |
| Structured DOCX | Paragraph, table, textbox, header and footer extraction |
| Exactly 4 MiB DOCX | Upload-byte acceptance with an explicitly unreferenced stored ZIP part |
| Dense DOCX below 60,000 characters | Actual long paragraph extraction; no fabricated physical page count |
| Dense twelve-page PDF below 60,000 characters | Actual dense native text extraction |
| Thirteen-page PDF | The intended page-limit rejection |
| PDF one byte above 4 MiB | Distinct web/native upload-limit rejection contracts |
| PDF over 60,000 text characters | The intended extracted-text rejection |
| DOCX over 60,000 text characters | The same character guard through DOCX extraction |
| DOCX expanded above 30 MiB | Metadata guard before decompression; local testing only |
| Invalid PDF signature | Format rejection rather than accidental success |

The inert-padding cases measure the upload envelope, not complex rendering.
The clear 2.24-megapixel scan does not represent rotated, damaged, handwritten,
low-light or arbitrary multilingual documents. DOCX pagination is not computed.

The app matrix adds one light-PDF paired round in two disposable workspaces.
Each result must contain its own random fictional marker and exclude the other
document's marker. Before/after profile and statistics snapshots stay in memory;
the report records only whether they match. No Apply or grade operation exists
in this workload. Rejections require both the expected HTTP status and the
intended guard's fixed explanation; an unrelated 422 is not a passing limit test.

```text
.venv-ml/Scripts/python.exe -m pytest -q ml/tests/test_document_probe_fixtures.py
node scripts/test-document-matrix.mjs --help
node scripts/test-document-matrix.mjs --base http://localhost:3000 --output ml/runtime/performance/documents-local-<new>.json
```

On POSIX the existing environment interpreter is `.venv-ml/bin/python`.
The CLI uses the repository's environment automatically for fixture generation.
It never accepts an arbitrary input file or fixture directory. Local runs make
at most **16 parse uploads**: fourteen fixed cases and one two-client paired
round. An explicitly selected owned HTTPS deployment permits only the eight
valid cases plus that pair (**10 uploads**). Invalid/over-limit fixtures are
never posted by a hosted run. The limits are **two demo clients, 90 seconds per
request and a three-minute measured matrix deadline**. Session setup, matrix and
cleanup share a four-minute outer budget, with thirty seconds reserved for the
two cleanup attempts; the measured matrix budget is shortened when necessary.
Fixture generation separately permits at most thirty seconds. It stops on the first
unexpected response/throttle, always attempts demo cleanup, and retains a new
numeric report without replacing earlier evidence. Preview protection is not
bypassed; an owner must use the established approved access route.

## Sustained local concurrency

The existing core harness already supports a larger local envelope:

```text
node scripts/load-learning.mjs --base http://localhost:3000 --clients 16 --rounds 10 --pause-ms 2000 --output ml/runtime/performance/core-local-paced-<new>.json
```

This stages 1, 2, 4, 8 and 16 disposable clients, with **930** generation/read
requests and about **90 seconds of scheduled pauses**, inside the existing
three-minute deadline. A full-200 run over that deadline still fails. Run it
only while builds, indexing and other tests are idle. Ordinary leases keep the
later demo stages alive; application session lifetime is never increased.

Local demos have different authentication, storage and budget handling from real
accounts. Their result is local concurrency evidence, not a hosted real-user
capacity claim. Existing live core/resume caps remain unchanged: four demo or
two real clients, at most two rounds; resume workloads permit at most two.

## Separately authenticated read soak

`lib/workspaceReadProbe.mjs` provides a separate, fixed workload for the existing
in-memory OAuth diagnostic helper. It requires **two separately SDK-verified
accounts**, then stages one and two clients for **36 total practical-workspace
GET requests**, **one-second pacing**, a **60-second workload deadline** and
**15-second per-request timeouts** bounded by remaining time. No quiz generation,
submission, profile write, account export or chat read is part of this workload.
The fixed envelope cannot be increased by caller options. Identity verification
is setup outside the measured interval. The caller must sign out only its own
helper-created sessions in `finally`, clear their in-memory cookies and record
the created/ended counts. Browser authentication state must never be extracted.

Reports retain fixed labels, neutral client indices, status, latency, response
size and safe timing metadata. Workspace content, cookies and user identities do
not enter a report. The first error, throttle, malformed/demo response or deadline
stops the run. This measures repeated real-account **workspace reads**, not
generation/inference throughput, an SLA or arbitrary user counts.

## Executed evidence and release gate

On 10 November, the actual native-parser matrix/metadata suite passed **17
tests**, including bundled OCR and every positive/negative fixture above. Its
initial inspection-test failure was retained privately: PDF pages do not expose
a context-manager protocol. The inspection now explicitly closes native objects
under the existing lock; the production PDF parser was not changed for that
test. The DOCX metadata correction is the only parser behavior change.

The matrix/read-soak Node contracts passed **15 tests**, including actual local
HTTP GET verification for the read soak, privacy, early stop, immutable budgets,
strict origins, correct-limit explanations, cross-document marker leakage and
post-snapshot deadline handling. TypeScript verification passed.

On 11 November, the rebuilt app passed **16/16** document cases in **6.45 s**.
The scanned page used local OCR and completed in **3.93 s**. The paired round
preserved document isolation. Both workspaces ended and their profiles, scores
and XP matched their initial values.

The paced local run completed **930/930** requests in **100.13 s**, including
90 seconds of scheduled pauses. It reached **16** requests in flight and
closed **16/16** workspaces. The 16-client stage recorded 480 successful
requests, a median of **78.7 ms** and an observed 95th percentile of **230.4 ms**.
The stage had zero throttles or server errors.

The release pull request records the hosted document matrix and the two-account
read soak once executed against the deployed revision. Human usability, spoken
screen-reader output and specialist calibration remain pending by the owner's
choice.
