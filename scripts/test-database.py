"""Disposable PostgreSQL schema, RLS, rollback and multi-connection concurrency checks.

Run only against a loopback database named voidfill_ci/voidfill_test. Requires
psycopg[binary]. Supabase Auth is a small fixture; Cron is not simulated/tested.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor
import json
import os
from pathlib import Path
import time
from urllib.parse import urlparse
from uuid import uuid4

import psycopg
from psycopg.types.json import Jsonb

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--allow-test-database", action="store_true", required=True)
    parser.parse_args()
    uri = os.environ.get("DATABASE_URL", "")
    parsed = urlparse(uri)
    if parsed.hostname not in ("localhost", "127.0.0.1", "::1") or parsed.path not in ("/voidfill_ci", "/voidfill_test"):
        raise RuntimeError("Use only a loopback voidfill_ci or voidfill_test database")
    manifest = json.loads((ROOT / "supabase/migration-manifest.json").read_text())
    files = ["supabase/tests/platform_fixture.sql", manifest["baseline"], *manifest["historical"], *manifest["release"]]
    with psycopg.connect(uri, autocommit=True) as db:
        if db.execute("select to_regclass('public.profiles')").fetchone()[0]:
            raise RuntimeError("Database must be empty; create a new disposable test database")
        for file in files:
            sql = (ROOT / file).read_text(encoding="utf8")
            if file.endswith("20261101_cloud_runtime.sql"):
                # Standard PostgreSQL CI lacks Supabase's pg_cron platform extension.
                # Only the scheduling section is excluded; production SQL is intact.
                sql = sql.split("create extension if not exists pg_cron;")[0] + "commit;"
            db.execute(sql)
            print("PASS", file)
        # Additive current release migrations must be repeatable without data loss.
        for file in manifest["release"]:
            db.execute((ROOT / file).read_text(encoding="utf8"))
        db.execute((ROOT / "supabase/tests/atomic_grading.sql").read_text())
        if (ROOT / "supabase/tests/practical_learning.sql").exists():
            db.execute((ROOT / "supabase/tests/practical_learning.sql").read_text())
        db.execute((ROOT / "supabase/tests/operation_limits.sql").read_text())
        db.execute((ROOT / "supabase/tests/account_requests.sql").read_text())
        skill = str(db.execute("select id from public.skills order by name limit 1").fetchone()[0])
        learners = [str(uuid4()), str(uuid4())]
        for learner in learners:
            db.execute("insert into auth.users(id) values(%s)", (learner,))
    shared_id = str(uuid4())

    def submit(user, submission):
        grade = {"assessmentId": submission, "metadata": {"purpose": "practice", "difficulty": 2},
                 "correct": 1, "total": 1, "score": 100, "review": [],
                 "skills": [{"skill_id": skill, "skill_name": "Synthetic", "correct": 1, "total": 1, "score": 100}]}
        with psycopg.connect(uri, autocommit=True) as connection:
            # Different physical connections exercise advisory locks/transaction visibility.
            return connection.execute("select public.vf_commit_assessment(%s,%s,%s,%s)",
                                      (submission, user, Jsonb(grade), Jsonb({"q": 0}))).fetchone()[0]

    with ThreadPoolExecutor(max_workers=12) as pool:
        replay = list(pool.map(lambda _: submit(learners[0], shared_id), range(12)))
        distinct = list(pool.map(lambda _: submit(learners[1], str(uuid4())), range(12)))
    assert all(result == replay[0] for result in replay), "Concurrent replay returned differing awards"
    with psycopg.connect(uri, autocommit=True) as db:
        for user, count in zip(learners, (1, 12)):
            assert db.execute("select count(*) from public.practice_attempts where user_id=%s", (user,)).fetchone()[0] == count
            assert db.execute("select xp from public.user_stats where user_id=%s", (user,)).fetchone()[0] == count * 33
            assert db.execute("select count(*) from public.vf_submission_ledger where user_id=%s and status='completed'", (user,)).fetchone()[0] == count
    assert sorted(result["xp_total"] for result in distinct) == [33*n for n in range(1, 13)], "Concurrent distinct submissions lost progress"
    def consume(user, operation="resume"):
        with psycopg.connect(uri, autocommit=True) as connection:
            return connection.execute("select public.vf_consume_operation_budget(%s,%s)", (user, operation)).fetchone()[0]
    # Avoid straddling the intentionally fixed five-minute quota boundary.
    if time.time() % 300 > 298:
        time.sleep(302 - time.time() % 300)
    with ThreadPoolExecutor(max_workers=8) as pool:
        quota = list(pool.map(lambda _: consume(learners[0]), range(8)))
    assert sum(result["allowed"] for result in quota) == 3, "Concurrent resume requests bypassed quota"
    assert consume(learners[1])["allowed"], "One learner exhausted another learner budget"
    with ThreadPoolExecutor(max_workers=24) as pool:
        practical_quota = list(pool.map(lambda _: consume(learners[0], "practical"), range(24)))
    assert sum(result["allowed"] for result in practical_quota) == 20, "Concurrent practical requests bypassed quota"
    assert consume(learners[1], "practical")["allowed"], "Practical writes exhausted another learner budget"

    # Real independent transactions: reassignment waits for the evidence-owner
    # lock held by a review, then revokes access instead of racing its check.
    mentors = [str(uuid4()), str(uuid4())]
    with psycopg.connect(uri, autocommit=True) as db:
        for mentor in mentors:
            db.execute("insert into auth.users(id) values(%s)", (mentor,))
            db.execute("insert into public.admin_users(id,admin_role,display_name) values(%s,'mentor','Synthetic reviewer')", (mentor,))
        db.execute("insert into public.mentor_assignments(mentor_id,user_id,assigned_at) values(%s,%s,now()-interval '1 day')", (mentors[0], learners[0]))
        stored_role = str(db.execute("select id from public.roles where name='Frontend Developer'").fetchone()[0])
        brief = {"version": "synthetic", "role_id": stored_role, "role_name": "Frontend Developer", "role_key": "frontend",
                 "level": "foundation", "title": "Synthetic activity", "instructions": "Use fictional data", "deliverable": "A checked example",
                 "rubric": ["Explain choices", "Check the result"], "note": "Not a qualification"}
        payload = {"role_id": stored_role, "level": "foundation", "expected_version": 0, "brief": brief,
                   "content": "Synthetic evidence documenting choices, checks and limitations against two examples.", "links": []}
        project = db.execute("select public.vf_practical_mutate(%s,'save',%s)", (learners[0], Jsonb(payload))).fetchone()[0]["project"]
        share = {"project_id": project["id"], "expected_version": 1, "mentor_id": mentors[0], "request_id": str(uuid4()), "consent": True}
        submission = db.execute("select public.vf_practical_mutate(%s,'submit',%s)", (learners[0], Jsonb(share))).fetchone()[0]["submission"]
    review = {"submission_id": submission["id"], "verdict": "ready", "feedback": "Synthetic review with both criteria demonstrated.",
              "criteria": [{"criterion": i, "judgement": "demonstrated", "comment": ""} for i in range(2)]}

    def reassign():
        with psycopg.connect(uri, autocommit=True, application_name="vf_assignment_race_test") as db:
            db.execute("insert into public.mentor_assignments(mentor_id,user_id) values(%s,%s)", (mentors[1], learners[0]))

    with ThreadPoolExecutor(max_workers=1) as pool:
        transaction = psycopg.connect(uri)
        try:
            transaction.execute("select public.vf_practical_mutate(%s,'review',%s)", (mentors[0], Jsonb(review)))
            reassignment = pool.submit(reassign)
            deadline = time.monotonic() + 3
            blocked = False
            while time.monotonic() < deadline and not reassignment.done():
                with psycopg.connect(uri, autocommit=True) as observer:
                    blocked = observer.execute("select exists(select 1 from pg_stat_activity where application_name='vf_assignment_race_test' and wait_event_type='Lock')").fetchone()[0]
                if blocked:
                    break
                time.sleep(.02)
            assert blocked, "Assignment changes did not serialize with the active review"
            transaction.commit()
            reassignment.result(timeout=5)
        finally:
            transaction.rollback()
            transaction.close()
    with psycopg.connect(uri, autocommit=True) as db:
        assert db.execute("select xp from public.user_stats where user_id=%s", (learners[0],)).fetchone()[0] == 33, "Practical review changed XP"
        db.execute("select set_config('request.jwt.claim.sub',%s,false)", (mentors[1],))
        db.execute("set role authenticated")
        assert db.execute("select count(*) from public.practical_submissions where id=%s", (submission["id"],)).fetchone()[0] == 0, "New mentor inherited earlier consent"
    print("PASS 12-way replay, 12-way distinct assessments, exact XP totals, RLS and atomic failure recovery")
    print("PASS 8-way resume quota: exactly 3 allowed, other learner unaffected")
    print("PASS 24-way practical quota: exactly 20 allowed, other learner unaffected")
    print("PASS concurrent practical review/reassignment serialization and assignment-specific consent")


if __name__ == "__main__":
    main()
