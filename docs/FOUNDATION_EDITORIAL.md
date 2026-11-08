# Foundation assessment editorial edition 2

All 960 foundation-extension items across 49 topics have explicit new option
sets in `ml/career_foundation_editorial.py`. Original source tuples remain in the
three cohort banks. Prompts, question IDs, difficulty, objectives and explanations
are retained; each item now uses three authored task/domain misconceptions rather
than many earlier unrelated or obviously impossible alternatives. These changes
do not modify the inherited 611-question base or the 550 intermediate items.

This is a coding-agent editorial pass. It is not independent specialist approval,
a learner experiment, professional certification, factual perfection or measured
improvement in educational outcomes. Every source-bound item record and the full
length-rank distribution are in `ml/evaluation-foundation-editorial.json`.

## Surface diagnostics and the rejected candidate

| Diagnostic | Original 960 | Shipped editorial 960 |
| --- | --- | --- |
| Uniquely longest correct option | 767 (79.9%) | 365 (38.0%) |
| Uniquely shortest correct option | 33 (3.4%) | 303 (31.6%) |

An initial candidate used concise correct phrases for every question; 548/960
(57.1%) then had a uniquely shortest correct option. That candidate was rejected
before shipping. Lowering only the longest-answer statistic would have hidden a
reversed guessing cue.

Both original/full and new/concise correct formulations were reviewed for the
same intended meaning. A fixed SHA-256 of topic and unchanged prompt chooses
between these formulations independently of option lengths. The rule is explicit
in the source and report. It does not pad answers, invent filler, swap incorrect
keys into correct positions, or inspect a learner's input. Existing deterministic
option shuffling still distributes the correct position.

The residual 38.0%/31.6% tail frequencies are not balanced to chance. Length rank,
wording and relative plausibility may still affect guessing. The tests' 45%
guards for both tails are engineering regression bounds, not a psychometric
standard. This is observed development evidence, not a held-out learner study.
Future authoring needs qualified reviewers and item-level learner statistics;
do not present these scores as validated occupational readiness.

## Integrity and model behavior

The builder refuses to apply this edition if the historical bank's canonical
SHA-256 changes. All 960 generated item identities and unchanged contracts are
checked against the explicit source; the review report records both hashes.
Representative arithmetic checks independently recompute 31 foundation answers,
and 17 additional case-pack calculations/checks cover denominators, units,
constraints, working capital and fictional payroll rules. The existing 27
intermediate arithmetic checks remain separate.

Already issued assessment tokens contain their original options and server-held
grading keys. Existing sealed attempts, results, score/XP transactions and replay
protection are unchanged; editing a public question never retroactively regrades
an earlier assessment. Original row/vector ordering is preserved.

The complete public extension index was rebuilt with the actual existing FP32
ONNX encoder. Question prompts and all other vector inputs are unchanged, so
every regenerated array was bit-identical. `vectors.npz` remains SHA-256
`134240caaaee4af3b44b084f65edd41641d9899aae3750f25f7570fb3a1bec96`.
Its source-content fingerprints now bind the edited options and new case packs.
No weight, tokenizer, pooling, truncation, archive or model shard changed.

## Primary concept references

The existing per-item resource references remain attached to the items. These
additional contexts were checked on 8 November 2026 while reviewing relevant
technical, evidence and educational boundaries:

- [React state-update queues](https://react.dev/learn/queueing-a-series-of-state-updates) explain updater functions and queued state changes.
- [W3C form labels](https://www.w3.org/WAI/tutorials/forms/labels/) explain associating a field with its purpose.
- [PostgreSQL transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html) explain all-or-nothing database operations.
- [NIST control charts](https://www.itl.nist.gov/div898/handbook/pmc/section3/pmc31.htm) describe observed process variation and control limits.
- [OpenStax accounting concepts](https://openstax.org/books/principles-financial-accounting/pages/3-1-describe-principles-assumptions-and-concepts-of-accounting-and-their-relationship-to-financial-statements) provide introductory financial-statement context; jurisdictional standards differ.
- [CIPD selection methods](https://www.cipd.org/uk/knowledge/factsheets/selection-factsheet/) provide context for job-related selection evidence.
- [HSE work-equipment guidance](https://www.hse.gov.uk/work-equipment-machinery/puwer.htm) identifies inspection, maintenance and training/competence as distinct topics in its UK context. The exercises authorize no real equipment work.
- [Carnegie Mellon assessment alignment](https://www.cmu.edu/teaching/assessment/basics/alignment.html) explains connecting objectives, activities and evidence of learning.

No third-party exams or long source passages were copied. These references do
not endorse VoidFill, certify every distractor, or supply fictional exercises'
jurisdiction-specific payroll/HR/legal rates. The synthetic input assumptions
remain explicit in each exercise.

## Reproduce

```text
python -m ml.build_career_catalogue
python -m ml.build_career_pack
python -m ml.index_careers
python -m ml.audit_foundation_editorial
python -m ml.career_quality_review --check
python -m pytest -q ml/tests/test_foundation_editorial.py ml/tests/test_career_quality_review.py
node --import tsx --test tests/practical.test.ts tests/careers.test.ts tests/career-adversarial.test.ts
python -m ml.document_career_paths
```

A new source edit needs renewed review records and actual index verification.
Do not silently update hashes to pass a check without reviewing changed content.
