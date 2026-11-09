# Model downloads, hosted inference, usability and career exercises

This batch follows production `50cc8a0` / PR 10. It retains Vercel + Supabase,
the FP32 model and current learning/assessment contracts. Gemini, long conversations,
backup arrangements, account roles and earned real-user progress are outside this
change. The user-owned untracked backup folder is not part of this release.

## Required outcomes and evidence

| Workstream | Required evidence |
| --- | --- |
| Model download efficiency | Verified cold/warm archive fixtures, actual consecutive hosted cache restoration, zero shard-download log on the warm build, unchanged runtime bundle/model hashes |
| Hosted performance | Scoped baseline/follow-up core and private-inference reports, separately authenticated owner/learner probe, stopped failures retained, no progress mutation or unsupported capacity claim |
| UX/accessibility | Fresh Chrome screenshots and numbered flow checks, repaired focus/validation states verified in the rebuilt candidate, phone/keyboard checks and explicit human/screen-reader limits |
| All 60 career paths | All 120 authored task/input/deliverable contracts, concrete acceptance/counterexamples, cross-runtime frozen-brief parity, concept sources, all-role audit matrix and unchanged inference-input proof |

Exact source commits, hosted CI runs, deployment IDs and post-publication results
belong in the release pull request. An unexecuted command or plausible source
change is not completion evidence.

## Implementation

The model build retains its source-hash-verified compressed archive within the
active native Vercel Python environment's cache-preserved directory. The runtime
bundle explicitly excludes that build cache. Unknown layouts and missing or
corrupt cache entries fall back to the verified download; unsafe paths fail closed.
See [model download efficiency](MODEL_DOWNLOAD_EFFICIENCY.md).

Independent assessment-history reads run alongside profile/requirements reads
after authentication and budget checks. The optional bounded synthetic-resume
workload exercises private encoder inputs rather than assuming cached skill
queries represent private inference. It exposed a real hosted concurrent-PDF
native crash; extraction now serializes PDFium's process-global native lifetime
and guarantees bitmap cleanup. Regression coverage retains the failed baseline
and distinguishes HTTP success from completing within the workload deadline.
See [performance validation](PERFORMANCE_VALIDATION.md).

Career exercises have level-specific tasks and deliverables tied to their actual
supplied fictional inputs. New practical briefs snapshot their positive/negative
checks and concept references; existing saved briefs retain their old versions.
Content changes do not imply new model weights, a new encoder run, professional
qualification or independent practitioner endorsement.
See the [all-career contract review](CAREER_CASE_CONTRACT_REVIEW.md) for the
60-role matrix, independent fixture checks and unchanged embedding-input proof.

The UX batch follows current Chrome evidence and the established cream/forest
atlas design. It addresses route-arrival focus, persistent personal-goal errors,
paused-assessment discard focus, practical-link field errors and save feedback,
pending-write interactions and career-copy contrast. The dated UX report records
which repaired behaviors were actually observed in the candidate.
See the [eight-step Chrome audit](UX_ACCESSIBILITY_20261109.md), including its
explicit baseline-versus-post-repair evidence boundary.

## Baseline observations

The 8 November production core probe completed 42 requests at peak four demo
clients in 15,528.3 ms, without errors/throttling, and ended all four demos.
Its small ordered stages are not an SLA or a controlled causal speed comparison.

A normal Google/Supabase SDK login for the two already authorized accounts
completed 18 real-authenticated, unsubmitted/read requests in 8,904.8 ms at peak
two; both helper-created sessions ended with local scope. Existing browser
sessions and saved learning records were unchanged. The first stage's slowest
request was 4,467.8 ms and remains included. No browser authentication state was
extracted or credentials written to a report.

The private-inference baseline completed eight successful one-client operations,
then two concurrent resume requests failed with HTTP 503 and a platform-observed
segmentation fault. The probe stopped, retained the failure and ended both demos.
This is the trigger for the PDF repair, not a successful performance result.

## Boundaries

Existing Supabase cached-egress usage cannot be undone by code. A native build
cache can be evicted, recreated or bypassed; hosted reuse must be observed and
reported honestly. No paid plan, third hosting/inference provider, broader OAuth
scope or quota bypass is added.

Chrome-only engineering checks do not constitute a participant study, spoken
screen-reader validation or accessibility certification. Career acceptance checks
support authored fictional exercises, not calibrated job-readiness scoring.
