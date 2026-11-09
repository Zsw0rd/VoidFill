# Career quality review — 8 November 2026

The9 November [case-contract review](CAREER_CASE_CONTRACT_REVIEW.md) supersedes
the earlier Practical Studio task/input alignment. It covers all120 new briefs,
45 independent exercise checks and current all60 role-review hashes. The question
and resource findings below retain their original dates and scope; this follow-up
does not claim a fresh specialist review of every question or a new learner study.

This review covers every one of the 60 career profiles and 55 shared skills. It
combines reproducible checks with an agent review of all case/complication/
capstone/rubric combinations and one intermediate explanation per skill. It is
not independent subject-matter-expert review, a calibrated assessment study,
real-user research, a hiring benchmark or professional certification.

## Results and concrete repairs

| Evidence | Result |
| --- | --- |
| Career case/rubric review | 60 profiles; current source hashes recorded |
| Ordered learning milestones | Four per role; all prerequisites and skill references valid |
| Selected intermediate explanation review | 55 skill banks; current question hashes recorded |
| Stored question contracts | 2,121 rows checked; original IDs preserved |
| New-assessment eligibility | 2,117 rows after four documented legacy exclusions |
| Independent arithmetic recomputation | 27 stated-boundary cases passed |
| Public resource reachability | All 305 served links returned HTTP 200 |
| New frozen matching probes | 88 synthetic cases; results and known misses retained |
| Original matching regressions | 59/60 first choices; 60/60 top-three; 20/20 abstentions; 10/10 custom goals |

The matcher previously recommended People Analyst for “work with people” and
could reject a browser/CSS/JavaScript narrative or a plural project-coordination
description. It now uses conservative word forms, downweights broad title
fragments and adds inspectable evidence from existing public role activities and
milestones. A trailing “rather than” clause is excluded from positive evidence.
That narrow rule does not claim general understanding of negation or intent.
Scores remain ranking signals, not probabilities or measured suitability.

One authored intermediate SQL explanation was clarified. Question
`career-595d1c837fe9ececcaf5` now says to sum shipping from one row per order,
explaining why a later item join can multiply a prior aggregate and why
`SUM(DISTINCT shipping)` loses legitimate equal-valued charges. Its original
prompt and ID are unchanged; the other intermediate rows are retained. The
separate foundation option revision and synthetic case packs are described below;
resources, role/skill identities and scored requirements remain unchanged. A concrete relational counterexample tests
these alternatives against the [PostgreSQL join and grouping model](https://www.postgresql.org/docs/current/queries-table-expressions.html).

The full public extension index was regenerated using the actual existing FP32
ONNX encoder again after the editorial/case-pack revision. Vector inputs remain
unchanged: question prompts, resource text, topic descriptions, public queries
and role embedding text are the same. Every regenerated array
was bit-identical; `vectors.npz` remains SHA-256
`134240caaaee4af3b44b084f65edd41641d9899aae3750f25f7570fb3a1bec96`.
The index records the new actual question-content fingerprint. No weights,
pooling, tokenizer, archive or shard changed, and no learner inputs were indexed.

## Frozen matching methodology

The 88 queries/labels were written before executing the matcher on them. The
fixture SHA-256 of UTF-8/LF bytes is
`cfa28c1978419a57ded74358e6fbaead7ddb387686b2aa617e32e53f153fa6f5`.
It contains one task narrative per career, twelve unsupported occupations, eight
underspecified requests and eight custom combinations. Diagnostic and sentinel
halves are identified explicitly. The author had access to catalogue/code, so
this is agent-authored software evaluation rather than independent recruitment
or educational validation.

Only diagnostic outputs informed the matching repair. Before the sentinel's first
execution, matcher source SHA-256
`6dad28dec7927cbbc07175a6697319ff86fd7f20ec212671462984dee4e8f3ea`
was recorded. No matcher adjustment was made after seeing sentinel results.

| Set | First choice | Top-three | Unsupported/ambiguous abstention | Custom top-three |
| --- | --- | --- | --- | --- |
| Diagnostic before repair | 24/30 | 25/30 | 9/10 | 3/4 |
| Diagnostic after repair | 26/30 | 29/30 | 10/10 | 3/4 |
| Sentinel first execution | 28/30 | 30/30 | 10/10 | 4/4 |
| Combined current regression | 54/60 | 59/60 | 20/20 | 7/8 |

The whole set is now observed regression evidence. Future changes cannot claim
it is still an untouched validation set. The automatically discovered Node tests
pin its fixture hash and fail if these recorded floors regress, including the
sentinel's 28 first choices and all 30 top-three results. The original curated
suite remains separate.

Known misses remain visible. The full-stack task narrative ranks its intended
role fourth. Data Analyst, Cloud Support Associate, Product Manager, Software
Engineer and AI Applications Developer each have a top-first ambiguity while
remaining in the top three. The mixed customer-adoption/troubleshooting-writing
goal misses its specified custom top-three set. Users must compare suggestions
and explicitly choose a direction or a personal goal; these examples do not
justify automatic career assignment.

## Four retired legacy assessment items

`ml/data/question-quality.json` records the IDs, exact imported stems, reasons
and primary references. The runtime validates this registry and excludes its
entries from new assessment selection. All original imported rows/vector positions
remain present, and existing sealed assessments, attempts, awards and history are
unchanged. No retroactive grading correction is implied.

| Original ID | Reason for exclusion from new skill evidence |
| --- | --- |
| `b2bd6e44742c5bd2a5843ea1` | “A database can be considered a table…” uses an unqualified analogy; databases and relational tables are different concepts. |
| `8007a31cf0ffc7c9974bc177` | “Python is a good language for…” asks broad suitability rather than an observable Python task. |
| `286359dc7f04d8a09e117139` | “Python is a good language for Data Science because…” mixes a library fact with subjective wording and an all-of-the-above option. |
| `54dc7c2d1924c49479c4d0a8` | Rejecting “You cannot do Data Science if you do not know Python” does not demonstrate Python mastery. Its original False key is not being declared wrong. |

[PostgreSQL describes tables as rows and columns within a relational database](https://www.postgresql.org/docs/current/ddl-basics.html).
[Python's own application overview](https://www.python.org/about/apps/) supports
its scientific and educational uses; those general uses do not measure a
learner's skill. The decision to retire suitability items follows the
[Carnegie Mellon guidance on observable objectives and aligned assessments](https://www.cmu.edu/teaching/designteach/syllabus/newcourse/learningobjectives.html).

## Source and assessment limits

All 147 extension references and 158 inherited resources were checked. The first
Python HTTPS pass could not validate the local issuer chain for 142 pinned
GitHub pages. Those were rechecked using Windows' system curl certificate store
with normal certificate validation and HTTPS-only redirects: all 305 resources
returned HTTP 200. No certificate check was disabled and no URL was rewritten to
hide an unavailable source. The result does not prove that every exercise is
free, accessible without a provider account, or pedagogically appropriate.

Targeted primary context also included [Python mutable defaults](https://docs.python.org/3/tutorial/controlflow.html#default-argument-values),
[W3C form labels](https://www.w3.org/WAI/tutorials/forms/labels/),
[NIST measurement-process characterization](https://www.itl.nist.gov/div898/handbook/mpc/section1/mpc1.htm),
[CIPD structured selection](https://www.cipd.org/uk/knowledge/factsheets/selection-factsheet/),
[HSE equipment training/competence context](https://www.hse.gov.uk/work-equipment-machinery/puwer.htm)
and [European Court of Auditors evidence guidance](https://methodology.eca.europa.eu/aware/GAP/Pages/Audit-evidence.aspx).
These links support the stated concepts; they do not certify VoidFill's role
maps, scores, curriculum or readiness claims. Physical, financial, HR and other
regulated exercises retain fictional/simulated inputs and qualified-review limits.

The explicit [foundation editorial edition 2](FOUNDATION_EDITORIAL.md) revises
all 960 option sets while retaining prompts, IDs, levels and explanations. All
three alternatives are now authored domain/task misconceptions, with reviewed
full/concise equivalent key formulations selected by a fixed identity hash that
does not inspect lengths. No words are appended merely to lengthen an option.

| Surface diagnostic | Previous foundation | Editorial foundation |
| --- | --- | --- |
| Uniquely longest correct option | 767/960 (79.9%) | 365/960 (38.0%) |
| Uniquely shortest correct option | 33/960 (3.4%) | 303/960 (31.6%) |

An initial all-concise candidate reduced the longest cue but created a 57.1%
shortest-answer cue; it was rejected before publication. Both tails are now
reported and guarded. Residual length-rank/style effects remain; a 45% regression
guard is an engineering threshold, not a psychometric standard or proof of fair
assessment. The intermediate bank remains 145/550 uniquely-longest (26.4%); the
inherited base remains 244/611 (39.9%, before the four exclusions). Specialist
review and real learner item statistics are still required before stronger
claims about competence, job readiness or certification.

All 60 roles also have versioned synthetic case inputs, a foundation verification
and an intermediate change with its own check. [The complete authored case
packs](CAREER_CASE_PACKS.md) are served in new Practical Studio briefs and in the
saved copy shown to the assigned reviewer. Existing drafts/submissions preserve
their original brief. The knowledge bank remains shared by underlying skill;
the case packs do not pretend to be 60 independent role-specific quiz banks.

## Reproduce and maintain the evidence

```text
node --import tsx --test tests/career-adversarial.test.ts tests/careers.test.ts
npx tsx scripts/evaluate-career-adversarial.mts --all
python -m ml.career_quality_review --check
python -m ml.audit_foundation_editorial --check
python -m pytest -q ml/tests/test_foundation_editorial.py
python -m pytest -q ml/tests/test_career_quality_review.py
python scripts/check-career-resources.py --include-base
python scripts/check-career-resources.py --include-base --retry-failed --system-tls
```

The `--check` mode makes no network requests and does not rewrite reports. Source
hashes in `ml/career-quality-review-v1.json` make a changed case or selected
explanation visibly stale rather than carrying an old review forward silently.
The full link check is an explicit content-release operation; external uptime is
not a deterministic CI gate. Future independent evaluation needs new frozen
queries and real participants or appropriately qualified reviewers.

## Every-career coverage after exclusions

Question counts below are unique eligible IDs within each role's mapped skills;
they are not role-exclusive banks. Foundation means levels 1–2 and intermediate
means level 3. Resource counts are distinct URLs. All 60 case/rubric review hashes
are current and all roles retain four ordered milestones.

<!-- Generated from ml/evaluation-career-quality.json. -->

| Career | Skills | Foundation questions | Intermediate questions | Resource URLs | Review |
| --- | --- | --- | --- | --- | --- |
| Frontend Developer | 3 | 184 | 33 | 47 | Current; 4 milestones |
| Backend Developer | 5 | 91 | 53 | 22 | Current; 4 milestones |
| Full-Stack Developer | 5 | 225 | 53 | 54 | Current; 4 milestones |
| QA Engineer | 4 | 207 | 42 | 49 | Current; 4 milestones |
| Mobile Developer | 4 | 77 | 41 | 16 | Current; 4 milestones |
| Software Engineer | 5 | 90 | 53 | 20 | Current; 4 milestones |
| Data Analyst | 4 | 88 | 44 | 30 | Current; 4 milestones |
| AI Applications Developer | 5 | 105 | 55 | 33 | Current; 4 milestones |
| BI Analyst | 4 | 95 | 42 | 25 | Current; 4 milestones |
| Data Engineer | 5 | 91 | 53 | 22 | Current; 4 milestones |
| Machine Learning Engineer | 4 | 390 | 41 | 99 | Current; 4 milestones |
| Data Scientist | 6 | 445 | 63 | 118 | Current; 4 milestones |
| Cloud Support Associate | 5 | 100 | 50 | 15 | Current; 4 milestones |
| Cybersecurity Analyst | 4 | 80 | 40 | 12 | Current; 4 milestones |
| IT Support Specialist | 4 | 80 | 40 | 12 | Current; 4 milestones |
| Systems Administrator | 4 | 80 | 40 | 12 | Current; 4 milestones |
| DevOps Engineer | 5 | 97 | 51 | 19 | Current; 4 milestones |
| Network Administrator | 4 | 80 | 40 | 12 | Current; 4 milestones |
| CAD Technician | 3 | 60 | 30 | 9 | Current; 4 milestones |
| Automation Technician | 3 | 60 | 30 | 9 | Current; 4 milestones |
| Quality Engineer | 3 | 60 | 30 | 9 | Current; 4 milestones |
| Manufacturing Engineer | 3 | 60 | 30 | 9 | Current; 4 milestones |
| Electronics Technician | 3 | 60 | 30 | 9 | Current; 4 milestones |
| Industrial Engineering Associate | 4 | 80 | 40 | 12 | Current; 4 milestones |
| Product Manager | 5 | 100 | 50 | 15 | Current; 4 milestones |
| UX Designer | 4 | 80 | 40 | 12 | Current; 4 milestones |
| UI Designer | 3 | 60 | 30 | 9 | Current; 4 milestones |
| UX Researcher | 4 | 80 | 40 | 12 | Current; 4 milestones |
| Product Designer | 4 | 80 | 40 | 12 | Current; 4 milestones |
| Technical Writer | 4 | 77 | 41 | 16 | Current; 4 milestones |
| Project Coordinator | 4 | 80 | 40 | 12 | Current; 4 milestones |
| Business Analyst | 4 | 80 | 40 | 12 | Current; 4 milestones |
| Operations Analyst | 4 | 80 | 40 | 12 | Current; 4 milestones |
| Project Manager | 4 | 80 | 40 | 12 | Current; 4 milestones |
| Management Analyst | 4 | 80 | 40 | 12 | Current; 4 milestones |
| Administrative Coordinator | 4 | 80 | 40 | 12 | Current; 4 milestones |
| Digital Marketing Associate | 4 | 80 | 40 | 12 | Current; 4 milestones |
| SEO Specialist | 4 | 210 | 41 | 44 | Current; 4 milestones |
| Content Writer | 4 | 80 | 40 | 12 | Current; 4 milestones |
| Social Media Coordinator | 4 | 80 | 40 | 12 | Current; 4 milestones |
| Graphic Designer | 3 | 60 | 30 | 9 | Current; 4 milestones |
| Marketing Analyst | 5 | 117 | 51 | 26 | Current; 4 milestones |
| Accounting Associate | 4 | 80 | 40 | 12 | Current; 4 milestones |
| Financial Analyst | 4 | 80 | 40 | 12 | Current; 4 milestones |
| Payroll Specialist | 4 | 80 | 40 | 12 | Current; 4 milestones |
| Accounts Payable Associate | 4 | 80 | 40 | 12 | Current; 4 milestones |
| Audit Associate | 4 | 80 | 40 | 12 | Current; 4 milestones |
| Credit Analyst | 4 | 80 | 40 | 12 | Current; 4 milestones |
| Recruitment Associate | 4 | 80 | 40 | 12 | Current; 4 milestones |
| HR Operations Associate | 4 | 80 | 40 | 12 | Current; 4 milestones |
| Learning & Development Coordinator | 3 | 60 | 30 | 9 | Current; 4 milestones |
| People Analyst | 4 | 97 | 41 | 23 | Current; 4 milestones |
| Talent Development Associate | 3 | 60 | 30 | 9 | Current; 4 milestones |
| Employee Experience Coordinator | 4 | 80 | 40 | 12 | Current; 4 milestones |
| Sales Representative | 4 | 80 | 40 | 12 | Current; 4 milestones |
| Customer Success Associate | 4 | 80 | 40 | 12 | Current; 4 milestones |
| Customer Support Specialist | 4 | 80 | 40 | 12 | Current; 4 milestones |
| Procurement Analyst | 4 | 80 | 40 | 12 | Current; 4 milestones |
| Logistics Coordinator | 4 | 80 | 40 | 12 | Current; 4 milestones |
| Hospitality Operations Associate | 4 | 80 | 40 | 12 | Current; 4 milestones |
