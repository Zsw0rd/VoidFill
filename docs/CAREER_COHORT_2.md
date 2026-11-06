# Second career foundation cohort

Expand pilot foundations from 12 to 30 existing profiles, across all ten career families. Keep all 60 discoverable careers and the same 55 skill identities. Nineteen formerly manual-only skills gain their own introductory knowledge bank; 42 areas have knowledge coverage and 13 remain explicitly marked for practical review.

New pilots: Full-Stack Developer, QA Engineer, BI Analyst, Data Engineer, DevOps Engineer, CAD Technician, Quality Engineer, Product Manager, UX Designer, Business Analyst, Operations Analyst, Content Writer, SEO Specialist, Financial Analyst, HR Operations Associate, Learning & Development Coordinator, Customer Support Specialist and Logistics Coordinator. The total cohort includes 13 technical, 15 non-technical and two product/design profiles.

The cohort adds 380 original items and 57 link-only resources, bringing the extension to 700 questions and 108 resources. Each new area has 20 questions at two introductory difficulty levels, three references and a dedicated mapping. Each of the 30 pilots has a distinct practical activity and rubric. Quizzes measure foundation knowledge; ungraded private reflections do not award skill mastery or XP. Professional, country-specific and employer-specific requirements remain outside this introductory pack.

Source builders are `ml/career_pack_phase2.py` and `ml/career_question_bank_phase2.py`. They extend the existing builders without replacing earlier questions. The metadata version is `2026.11-foundations-2`. Remaining specialist areas never receive a nearby semantic quiz as a substitute.

Rebuild with `python -m ml.build_career_catalogue`, `python -m ml.build_career_pack`, the ML virtual environment's `python -m ml.index_careers`, `python scripts/seed-career-catalogue.py`, then `python scripts/check-career-resources.py`. Failed transient source checks can be rechecked with `--retry-failed`; HTTP errors and certificate failures must not be bypassed.

Apply the additive `supabase/migrations/20261106_second_career_cohort.sql` after the existing career-profile and first catalogue migrations. It resolves existing names to production IDs, updates public descriptions and versioned requirements, and preserves all learner records, scores, courses and histories. The original applied seed remains unchanged.

Inference continues on Vercel + Supabase using the same ONNX weights, pooling and token limit. Public curriculum vectors are computed offline and verified through canonical JSON fingerprints. New private input is not cached. The extension is 3.71 MiB and contains 343 precomputed public queries, within the existing 500-query build guard and 512-entry runtime cache.

Validation before release: 40 Node tests, 49 Python tests, type checking and the 46-route production Next build passed. All 108 source links returned HTTP 200; one transient Google timeout passed a focused retry. Original 320 questions and 51 resources are unchanged, and all role/skill IDs match the first cohort. Production-mode local career, learner, staff and auth integration suites passed; the career suite covers all 30 pilots, exact question-to-skill mapping, custom goals, focus changes, private reflections and preserved scores/XP. The old non-technical-family assertion was too broad for SEO's legitimate web requirement; the test now verifies the source bank for every question in every role.

A local in-process benchmark of recommendation plus a ten-question check (20 repetitions per role) measured medians of 1.3 ms for UX Designer, 1.7 ms for Data Engineer and 1.4 ms for Logistics Coordinator, with no encoder graph loaded. Engine initialization was 0.11 seconds on this machine. These exclude HTTP, authentication, database and Vercel cold-start time and are not a live latency guarantee.

The additive seed was applied in Supabase and confirmed 241 requirements at the new version. Live release verification follows publication.
