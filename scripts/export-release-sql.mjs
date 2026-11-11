// Export this release as one reviewed transaction for the authenticated SQL editor.
// No database access or credentials are used by this script.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";

const manifest=JSON.parse(readFileSync("supabase/migration-manifest.json","utf8"));
const args = process.argv.slice(2);
const scopeUpgrade = args.length === 1 && args[0] === "--resource-progress";
if (args.length && !scopeUpgrade) throw new Error("Usage: node scripts/export-release-sql.mjs [--resource-progress]");
const scopeFiles = ["supabase/migrations/20261110130000_resource_progress_scope.sql",
  "supabase/migrations/20261110130100_ungraded_resource_seed.sql"];
const scopeStart = manifest.release.indexOf(scopeFiles[0]);
if (scopeUpgrade && (scopeStart < 1 || manifest.release[scopeStart + 1] !== scopeFiles[1])) {
  throw new Error("Resource progress migrations must follow the earlier release entries in order");
}
const output=resolve(scopeUpgrade ? "ml/runtime/resource-progress-release.sql" : "ml/runtime/applied-learning-release.sql");
function record(file) {
  if(!/^supabase\/migrations\/\d{14}_[a-z0-9_]+\.sql$/.test(file)) throw new Error("Invalid release path");
  const sql=readFileSync(file,"utf8").replace(/^\uFEFF/,"").replace(/\r\n/g,"\n");
  return {file,sql,hash:createHash("sha256").update(sql).digest("hex")};
}
const records=(scopeUpgrade ? scopeFiles : manifest.release).map(record);
if(!records.length || new Set(records.map(row=>row.file)).size!==records.length) throw new Error("Invalid release manifest");
const prerequisites = scopeUpgrade ? manifest.release.slice(0, scopeStart).map(record) : [];
const prerequisiteCheck = prerequisites.length ? `
  if exists(
    select 1 from (values ${prerequisites.map(row=>`('${row.file}','${row.hash}')`).join(",")}) expected(path,sha256)
    left join public.vf_schema_releases applied using(path)
    where applied.sha256 is distinct from expected.sha256
  ) then
    raise exception 'An earlier release is missing or has a different checksum';
  end if;` : "";
const sql=`-- VoidFill ${scopeUpgrade ? "resource progress" : "applied-learning"} release. One atomic transaction.
-- ${scopeUpgrade ? "Requires the recorded earlier releases. Existing learner rows are preserved." : "Apply during the documented initial learning cutover."}
begin;
select pg_advisory_xact_lock(hashtextextended('vf-schema-release',0));
do $$ begin
  if to_regclass('public.vf_submission_ledger') is null or to_regclass('public.career_reflections') is null then
    raise exception 'Historical cloud and career schema must exist';
  end if;
end $$;
create table if not exists public.vf_schema_releases (
  path text primary key, sha256 text not null, applied_at timestamptz not null default now()
);
alter table public.vf_schema_releases enable row level security;
revoke all on public.vf_schema_releases from public,anon,authenticated;
grant select on public.vf_schema_releases to service_role;
do $$ begin
  ${prerequisiteCheck}
  if exists(select 1 from public.vf_schema_releases where path in (${records.map(row=>`'${row.file}'`).join(",")})) then
    raise exception 'A release entry is already recorded. Use the checksum-aware CLI upgrade/verify instead of replaying this export';
  end if;
end $$;
${records.map(row=>`\n-- ${row.file}\n-- SHA256 UTF-8/LF: ${row.hash}\n${row.sql.replace(/^begin;\s*$/gim,"").replace(/^commit;\s*$/gim,"")}\ninsert into public.vf_schema_releases(path,sha256) values('${row.file}','${row.hash}');`).join("\n")}
commit;
select path,sha256 from public.vf_schema_releases where path in (${records.map(row=>`'${row.file}'`).join(",")}) order by path;
`;
mkdirSync(dirname(output),{recursive:true});
try {writeFileSync(output,sql,{flag:"wx",mode:0o600});}
catch(error) {if(error.code!=="EEXIST" || readFileSync(output,"utf8")!==sql) throw error;}
console.log(JSON.stringify({output,files:records.length,bytes:Buffer.byteLength(sql),sha256:createHash("sha256").update(sql).digest("hex")}));
