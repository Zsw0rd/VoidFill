"""Local/CI synthetic dump-and-restore rehearsal, never a production backup job.

Requires pg_dump/pg_restore matching the PostgreSQL server and psycopg[binary].
The source must be a loopback voidfill_ci/voidfill_test database. The target is
a new <source>_restored database on the same disposable cluster. Existing role
objects stand in for Supabase-managed roles; grants/RLS/functions/data are checked.
"""
import argparse
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
from urllib.parse import unquote, urlparse, urlunparse

import psycopg
from psycopg import sql


def fingerprint(connection):
    tables = connection.execute("select schemaname,tablename from pg_tables where schemaname in ('public','auth') order by 1,2").fetchall()
    result = {}
    for schema, table in tables:
        result[(schema, table)] = connection.execute(sql.SQL(
            "select count(*),md5(coalesce(string_agg(row_to_json(t)::text,'|' order by row_to_json(t)::text),'')) from {}.{} t"
        ).format(sql.Identifier(schema), sql.Identifier(table))).fetchone()
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--allow-test-database", action="store_true", required=True)
    parser.parse_args()
    uri = os.environ.get("DATABASE_URL", "")
    parsed = urlparse(uri)
    if parsed.hostname not in ("localhost", "127.0.0.1", "::1") or parsed.path not in ("/voidfill_ci", "/voidfill_test"):
        raise RuntimeError("Restore rehearsal requires a loopback voidfill_ci or voidfill_test source")
    target_name = parsed.path[1:] + "_restored"
    target_uri = urlunparse(parsed._replace(path="/" + target_name))
    admin_uri = urlunparse(parsed._replace(path="/postgres"))
    container = os.environ.get("POSTGRES_TEST_CONTAINER", "")
    if container and not re.fullmatch(r"[a-f0-9]{12,64}", container):
        raise RuntimeError("Invalid local PostgreSQL test container ID")
    for tool in (("docker",) if container else ("pg_dump", "pg_restore")):
        if not shutil.which(tool):
            raise RuntimeError("Install the PostgreSQL clients or supply the local test container")
    with psycopg.connect(admin_uri, autocommit=True) as admin:
        if admin.execute("select 1 from pg_database where datname=%s", (target_name,)).fetchone():
            raise RuntimeError("Restore target already exists; choose a new disposable cluster")
        admin.execute(sql.SQL("create database {}").format(sql.Identifier(target_name)))
    with tempfile.TemporaryDirectory(prefix="voidfill-synthetic-restore-") as directory:
        archive = str(Path(directory) / "synthetic.dump")
        env = {**os.environ, "PGHOST": parsed.hostname, "PGPORT": str(parsed.port or 5432),
               "PGUSER": unquote(parsed.username or "postgres"), "PGPASSWORD": unquote(parsed.password or ""),
               "PGDATABASE": parsed.path[1:], "PGCONNECT_TIMEOUT": "10"}
        if container:
            # CI uses the server's own matching-version clients; credentials stay
            # in the disposable container, and no archive leaves the local runner.
            dumped = subprocess.run(["docker", "exec", container, "pg_dump", "--format=custom", "--no-owner",
                                     "--username=postgres", "--dbname", parsed.path[1:]], check=True, capture_output=True)
            Path(archive).write_bytes(dumped.stdout)
            subprocess.run(["docker", "exec", "-i", container, "pg_restore", "--no-owner", "--exit-on-error",
                            "--username=postgres", "--dbname", target_name], input=dumped.stdout, check=True, capture_output=True)
        else:
            subprocess.run(["pg_dump", "--format=custom", "--no-owner", "--file", archive],
                           env=env, check=True, capture_output=True)
            subprocess.run(["pg_restore", "--no-owner", "--exit-on-error", "--dbname", target_name, archive],
                           env={**env, "PGDATABASE": target_name}, check=True, capture_output=True)
        with psycopg.connect(uri, autocommit=True) as source, psycopg.connect(target_uri, autocommit=True) as restored:
            assert fingerprint(source) == fingerprint(restored), "Restored table content differs"
            assert restored.execute("select has_function_privilege('service_role','public.vf_commit_assessment(uuid,uuid,jsonb,jsonb)','execute')").fetchone()[0]
            assert not restored.execute("select has_function_privilege('authenticated','public.vf_commit_assessment(uuid,uuid,jsonb,jsonb)','execute')").fetchone()[0]
            assert not restored.execute("select has_table_privilege('authenticated','public.user_stats','update')").fetchone()[0]
            assert restored.execute("select relrowsecurity from pg_class where oid='public.user_skill_scores'::regclass").fetchone()[0]
            # Read isolation still works after restore, using actual authenticated role.
            # Pick a learner: assigned mentors intentionally retain scoped staff
            # reads and must not be mistaken for an unauthorized ordinary user.
            users = restored.execute("select u.id from auth.users u left join public.admin_users a on a.id=u.id where a.id is null order by u.id").fetchall()
            assert users, "Source lacks synthetic users"
            restored.execute("select set_config('request.jwt.claim.sub',%s,false)", (str(users[0][0]),))
            restored.execute("set role authenticated")
            assert restored.execute("select count(*) from public.user_stats where user_id<>auth.uid()").fetchone()[0] == 0
            restored.execute("reset role")
    print("PASS pg_dump/pg_restore: all public/auth table fingerprints, function grants, protected writes and RLS isolation retained")
    print("Restore target contains synthetic test data only; no production backup/restore was performed")


if __name__ == "__main__":
    try:
        main()
    except subprocess.CalledProcessError:
        raise RuntimeError("PostgreSQL dump/restore failed; inspect the disposable database logs") from None
