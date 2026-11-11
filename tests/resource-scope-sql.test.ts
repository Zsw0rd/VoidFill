import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import test from "node:test";
import { projectUngradedResourceUrls, renderUngradedResourceSeed, runResourceScopeSeedCli, RESOURCE_SCOPE_SOURCE, RESOURCE_SCOPE_SEED } from "../scripts/generate-resource-scope-sql.mjs";
import { isUngradedResource } from "../lib/resourceLearningScope";

test("the checked-in SQL seed is the deterministic projection of current public scopes", () => {
  const rows = JSON.parse(readFileSync(RESOURCE_SCOPE_SOURCE, "utf8"));
  const urls = projectUngradedResourceUrls(rows);
  assert.ok(urls.length > 0);
  assert.deepEqual(projectUngradedResourceUrls([...rows].reverse().concat(rows[0])), urls);
  for (const url of urls) assert.equal(isUngradedResource(`\t\u00a0${url}\uFEFF\n`), true);
  assert.equal(readFileSync(RESOURCE_SCOPE_SEED, "utf8").replace(/\r\n/g, "\n"), renderUngradedResourceSeed(rows));
});

test("SQL projection accepts only valid public ungraded URLs and quotes values safely", () => {
  const row = (url: string, assessment = "ungraded") => ({ url, assessment });
  for (const bad of [null, {}, [row("https://example.test/", "graded")], [row(" http://example.test/")],
    [row("https://example.test/\n")], [row("https://name:private@example.test/")], [row("javascript:alert(1)")], [row("not a url")]]) {
    assert.throws(() => projectUngradedResourceUrls(bad));
  }
  const url = "https://example.test/path?q=';drop-table";
  const sql = renderUngradedResourceSeed([row(url)]);
  assert.ok(sql.includes("('https://example.test/path?q='';drop-table')"));
  assert.ok(sql.includes("set local standard_conforming_strings = on"));
  assert.deepEqual(projectUngradedResourceUrls([row("https://EXAMPLE.test/a?q=1#x")]), ["https://EXAMPLE.test/a?q=1#x"]);
});

test("scope CLI detects drift and refuses to overwrite a different migration", () => {
  const dir = mkdtempSync(join(tmpdir(), "voidfill-scope-seed-"));
  const source = join(dir, "scopes.json"), output = join(dir, "seed.sql");
  try {
    writeFileSync(source, JSON.stringify([{ url: "https://example.test/first", assessment: "ungraded" }]));
    assert.deepEqual(runResourceScopeSeedCli(["--source", source, "--output", output]), { checked: false, urls: 1 });
    assert.deepEqual(runResourceScopeSeedCli(["--check", "--source", source, "--output", output]), { checked: true, urls: 1 });
    const before = readFileSync(output, "utf8");
    writeFileSync(source, JSON.stringify([{ url: "https://example.test/changed", assessment: "ungraded" }]));
    assert.throws(() => runResourceScopeSeedCli(["--check", "--source", source, "--output", output]), /drifted/);
    assert.throws(() => runResourceScopeSeedCli(["--source", source, "--output", output]), /exists with different content/);
    assert.equal(readFileSync(output, "utf8"), before);
  } finally {
    // Only the directory returned by mkdtemp above; never workspace paths.
    assert.ok(resolve(dir).startsWith(resolve(tmpdir()) + sep + "voidfill-scope-seed-"));
    rmSync(dir, { recursive: true, force: true });
  }
});

test("the additive grading replacement preserves the prior RPC except the resource-count filter", () => {
  const oldSql = readFileSync("supabase/migrations/20261106120000_atomic_grading.sql", "utf8").replace(/\r\n/g, "\n");
  const newSql = readFileSync("supabase/migrations/20261110130000_resource_progress_scope.sql", "utf8").replace(/\r\n/g, "\n");
  const signature = "create or replace function public.vf_commit_assessment(";
  const body = (sql: string) => sql.slice(sql.indexOf(signature), sql.indexOf("end $$;", sql.indexOf(signature)) + "end $$;".length);
  const predicate = "where c.user_id=p_user_id and c.skill_id=v_skill_id\n";
  assert.equal(body(oldSql).split(predicate).length, 2);
  assert.equal(body(newSql), body(oldSql).replace(predicate, predicate +
    "          and not exists(select 1 from public.vf_ungraded_resource_urls g\n" +
    "            where g.url=public.vf_resource_url_key(c.url))\n"));
});
