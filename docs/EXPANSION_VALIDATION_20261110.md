# Lesson expansion and release verification

This release candidate builds on production commit `f8ffd9262127e5509ed1fda4f025f4f45ce65de1` from PR 11. The learning service uses the existing FP32 model on Vercel and Supabase. The owner deferred participant and specialist validation.

## Lesson coverage

The original catalogue contained 305 resource rows and 298 distinct URLs. Before this release, 206 rows had no eligible lesson bank, 93 had foundation questions only, and six had both levels. The current catalogue has 344 resource rows. Of those, 271 rows share 265 reviewed teaching banks and 73 rows represent 72 ungraded guides. All 55 assessed skills have at least three reviewed teaching URLs and ten eligible broad questions at each level.

The 1,590 new questions use original scenarios linked to the actual lesson. Each bank has three foundation and three applied checks. A full lesson check skips model ranking when all eligible items fit. Recommendations return teaching lessons. Existing saved guides provide context, and the roadmap excludes them from lesson completion.

The release adds 39 instructional URLs, all of which returned HTTP 200 in the public link check. Source review identified 61 learner-facing corrections and 34 additional legacy items to retire from new checks. The exclusion registry matches each original prompt and key. Original question rows, IDs, vector values, historical grades and sealed attempts are preserved. Two original AutomationDirect pages returned HTTP 406 in direct requests. Those reviews used the publisher text accessible through the web index.

The coverage inventory and independent encoder verification use the serving content. [Lesson coverage](LESSON_ASSESSMENT_COVERAGE.md) · [Index verification](../ml/evaluation-content-release.json) · [New resource link checks](../ml/evaluation-lesson-resource-links.json)

## Career matching and pilot preparation

The current matcher ranks the expected career first on all 60 established cases and all 60 established adversarial cases. The frozen new set ranks 10 of 12 first and all 12 in the top three. Its eight abstentions and four supported custom combinations pass. Two ambiguous queries still rank their expected career second. [Matching review](MATCHING_REVIEW_20261110.md)

The pilot tooling prepares both learning levels for all 60 careers. It binds briefs, resources, and question evidence to a source revision and accepts coded participant and reviewer records. Current human records total zero. [Pilot engineering](PILOT_ENGINEERING_20261110.md)

## Local verification

The production build, 166 Node tests, 189 Python tests, and HTTP journeys for all 60 careers at both levels passed. The checks exercised recommendation and grading, sealed draft restoration, learner and staff isolation, private practical work, and eight paired PDF parses. PostgreSQL 17.11 passed the ordered migrations, 12-way grading and replay checks, role permissions, and the atomic SQL editor export. The export rejected a stale prerequisite checksum and a replay.

The rebuilt app passed 16 document cases with both disposable sessions ended. The matrix included actual OCR, a 12-page PDF, exact 4 MiB PDF and DOCX files, structured DOCX extraction and cross-document isolation. A separate paced run completed all 930 requests at a peak of 16 in flight and closed all 16 workspaces. [Document validation](PERFORMANCE_DOCUMENT_MATRIX.md)

Chrome verified the 320 CSS pixel layout, mobile drawer focus and resize cleanup, the expanded atlas, a source correction, and a three-question lesson draft restored after reload. [Chrome accessibility evidence](ACCESSIBILITY_DEPTH_20261110.md)

## Reproduction and publication

```text
python -m ml.lesson_questions
python -m ml.lesson_coverage --write-catalogue
python -m ml.index_careers --incremental
python -m ml.content_release_proof
python -m ml.lesson_questions --check
python -m ml.lesson_coverage --check
node scripts/generate-resource-scope-sql.mjs --check
```

The pipeline checks the new banks and retains the original deployed vectors. Tests use the pinned packages in `ml/requirements-content-review.txt`. The Vercel serving build uses its existing runtime requirements.

Apply the two resource-progress migrations in order before the matching app goes live. The SQL editor export checks the prior release ledger and commits the two changes together. Production release and hosted acceptance evidence belong on the pull request. [Resource progress upgrade](RESOURCE_PROGRESS_SCOPES.md)
