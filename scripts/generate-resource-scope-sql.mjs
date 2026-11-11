// Public metadata only. This never connects to a database or changes learner data.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const RESOURCE_SCOPE_SOURCE = "ml/data/lessons/resource-scopes.json";
export const RESOURCE_SCOPE_SEED = "supabase/migrations/20261110130100_ungraded_resource_seed.sql";

export function projectUngradedResourceUrls(rows) {
  if (!Array.isArray(rows)) throw new Error("Resource scopes must be an array");
  const urls = new Set();
  for (const row of rows) {
    if (!row || typeof row !== "object" || row.assessment !== "ungraded" ||
        typeof row.url !== "string" || !row.url || row.url !== row.url.trim() ||
        Buffer.byteLength(row.url, "utf8") > 2048 || /[\u0000-\u0020\u007f]/.test(row.url)) {
      throw new Error("Invalid ungraded resource scope");
    }
    let parsed;
    try { parsed = new URL(row.url); } catch { throw new Error("Invalid scope URL"); }
    if (parsed.protocol !== "https:" || !parsed.hostname || parsed.username || parsed.password) {
      throw new Error("Scopes require public HTTPS URLs without credentials");
    }
    urls.add(row.url);
  }
  // Exact URL membership after request-side trim; no case/query/fragment rewriting.
  return [...urls].sort();
}

export function renderUngradedResourceSeed(rows) {
  const urls = projectUngradedResourceUrls(rows);
  const hash = createHash("sha256").update(JSON.stringify(urls) + "\n").digest("hex");
  const quoted = urls.map(url => "('" + url.replaceAll("'", "''") + "')").join(",\n  ");
  return `-- Generated from ${RESOURCE_SCOPE_SOURCE}; public URL metadata only.
-- Sorted URL projection SHA256: ${hash}
-- Regenerate before first application; after release, emit a NEW timestamped seed.
-- Apply after 20261110130000_resource_progress_scope.sql and before the matching app.
-- Learner course/completion/history/XP records are not modified.
begin;
set local standard_conforming_strings = on;
select pg_advisory_xact_lock(hashtextextended('vf-resource-scope',0));
delete from public.vf_ungraded_resource_urls;
${urls.length ? "insert into public.vf_ungraded_resource_urls(url) values\n  " + quoted + ";" : "-- No reviewed ungraded resource URLs in this projection."}
commit;
`;
}

export function runResourceScopeSeedCli(args = process.argv.slice(2)) {
  let source = RESOURCE_SCOPE_SOURCE, output = RESOURCE_SCOPE_SEED, check = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--check") check = true;
    else if (args[i] === "--source" && args[i + 1]) source = args[++i];
    else if (args[i] === "--output" && args[i + 1]) output = args[++i];
    else throw new Error("Usage: node scripts/generate-resource-scope-sql.mjs [--check] [--source path] [--output path]");
  }
  const expected = renderUngradedResourceSeed(JSON.parse(readFileSync(source, "utf8")));
  if (check) {
    const actual = readFileSync(output, "utf8").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
    if (actual !== expected) throw new Error("Ungraded resource SQL projection has drifted; generate a new reviewed seed migration");
    return { checked: true, urls: projectUngradedResourceUrls(JSON.parse(readFileSync(source, "utf8"))).length };
  }
  // Refuse to overwrite a different file. Applied migration checksums are immutable.
  // For an uncommitted seed, remove only that reviewed file explicitly before
  // regenerating; released updates always use a new --output timestamp.
  if (existsSync(output)) {
    if (readFileSync(output, "utf8").replace(/\r\n/g, "\n") !== expected) {
      throw new Error("Seed output exists with different content; use a new timestamped output path");
    }
  } else writeFileSync(output, expected, { flag: "wx" });
  return { checked: false, urls: projectUngradedResourceUrls(JSON.parse(readFileSync(source, "utf8"))).length };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(runResourceScopeSeedCli())); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
