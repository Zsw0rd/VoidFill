// Export this release as one reviewed transaction for the authenticated SQL editor.
// No database access or credentials are used by this script.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";

const manifest=JSON.parse(readFileSync("supabase/migration-manifest.json","utf8"));
const output=resolve("ml/runtime/applied-learning-release.sql");
const records=manifest.release.map(file=>{
  if(!/^supabase\/migrations\/\d{14}_[a-z0-9_]+\.sql$/.test(file)) throw new Error("Invalid release path");
  const sql=readFileSync(file,"utf8").replace(/^\uFEFF/,"").replace(/\r\n/g,"\n");
  return {file,sql,hash:createHash("sha256").update(sql).digest("hex")};
});
if(!records.length || new Set(records.map(row=>row.file)).size!==records.length) throw new Error("Invalid release manifest");
const sql=`-- VoidFill applied-learning release. One atomic transaction; no historical bootstrap.
-- Keep learning writes paused and verify the encrypted logical snapshot first.
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
