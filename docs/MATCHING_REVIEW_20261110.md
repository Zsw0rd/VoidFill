# Career matching review — 10 November 2026

The matcher now distinguishes a formal title from a partial field/tool mention,
uses substantive public skill/task evidence, and preserves uncertain-input
abstention. The old golden and adversarial fixtures are unchanged. Their results
are software regressions, not independent career advice or validated fit scores.

## What changed

- A title stripped from an alias no longer makes one token a complete name.
  Previously, mentioning an API could give the same ordered-name bonus as
  naming an API developer. Likewise, distant `software` and `testing` tokens
  could act like the adjacent title phrase `software testing`.
- Conservative title/word forms recognize analyst/analysis,
  developer/development and writer/writing. Generic field terms and job-seeking
  language do not become substantive evidence on their own.
- Skill names, aliases, canonical keys and descriptions supply public evidence.
  An arbitrary single descriptive word is insufficient; explicit skill phrases,
  named skill concepts or multiple descriptive matches are required. Skill
  importance and coverage distinguish a narrow discipline from a combined one.
- Distinctive task terms have document-frequency weights. A single task term
  needs both a named field and its occurrence in the role's primary public
  activity before it can anchor intent. Explanation terms put substantive
  evidence before broad field nouns.
- A trailing `rather than` or `instead of` alternative is omitted. A query that
  contains only such an excluded alternative abstains. This limited contrast
  rule does not claim general natural-language negation understanding.

No role identity, catalogue requirement, bank row, embedding or model weight was
changed by this matcher work. The separate lesson expansion may update public
content/index artifacts under its own evidence. The earlier case-only matcher
equality proof is historical once this executable matcher changes.

## Observed comparisons

The baseline implementation was copied before editing and its SHA-256 bound in
the challenge freeze record. Both implementations were evaluated against the
same public fixtures and catalogue. Exact rows and rankings are inspectable in
[`evaluation-career-matching-v2-first.json`](../ml/evaluation-career-matching-v2-first.json).

| Fixture | Intended role first, before → after | Intended role top three | Abstentions, before → after | Custom top-three hits |
| --- | --- | --- | --- | --- |
| Existing golden | 59/60 → 60/60 | 60/60 → 60/60 | 20/20 → 20/20 | 10/10 → 10/10 |
| Existing adversarial | 54/60 → 60/60 | 59/60 → 60/60 | 20/20 → 20/20 | 7/8 → 8/8 |
| New frozen challenge | 7/12 → 10/12 | 12/12 → 12/12 | 7/8 → 8/8 | 4/4 → 4/4 |

All six earlier adversarial role misses now rank first, including the whole-web-
application narrative that previously ranked Full-Stack fourth. The mixed
adoption/troubleshooting/documentation goal now exposes both Customer Success
and Technical Writer among its top three. Every previously successful labelled
first choice in the two old sets is retained, rather than relying only on an
aggregate accuracy floor.

## New challenge methodology and remaining ambiguity

The 24 synthetic challenge queries/labels were authored and fingerprinted before
the matcher revision. The candidate executable fingerprint was recorded before
its first execution on them. Baseline and candidate predictions were first
inspected together after the candidate was frozen. The first report is not
overwritten by subsequent evaluator runs. No matcher tuning followed the two
observed challenge ambiguities:

1. A sports-club web-screens/server-endpoints narrative ranks Frontend first and
   its intended Full-Stack direction second.
2. A customer adoption/renewal narrative ranks Project Manager first and its
   intended Customer Success direction second.

Both intended directions remain in the top three. Those examples still require
comparison and an explicit learner choice. The labels are agent judgements;
freezing them does not create independent expertise or a representative sample.
Now that the predictions are observed, future evaluations of this challenge are
regressions, not a fresh untouched holdout. Any further tuning needs a separately
authored/versioned challenge and must keep this first result visible.

## Reproduction and checks

```text
node --import tsx scripts/evaluate-career-matching.mts
node --import tsx scripts/evaluate-career-adversarial.mts --all
node --import tsx scripts/evaluate-career-matching-v2.mts
node --import tsx --test tests/careers.test.ts tests/career-adversarial.test.ts tests/career-matching-v2.test.ts
```

The optional `--before ml/runtime/<baseline>.ts` evaluates an operator's ignored
baseline copy only when its source hash equals the frozen baseline hash. The
source-controlled first report contains the observed comparison, so CI needs no
private file or additional Git history. `--output ml/<name>-first.json` uses
exclusive creation to avoid replacing first-execution evidence.

The 17 focused tests cover frozen fixtures, every old expected first choice,
new challenge regression floors, exact names/unique formal aliases, title-
fragment failures, meta-language abstention, excluded alternatives, inspectable
evidence and filtering to database-available careers. Chrome rendering and
participant/expert interpretation are separate validation tasks. Human validation
remains pending at the owner's explicit choice.
