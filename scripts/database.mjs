import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";

const manifest = JSON.parse(readFileSync("supabase/migration-manifest.json", "utf8"));
const [command, ...flags] = process.argv.slice(2);
if (!["bootstrap", "upgrade", "verify"].includes(command) || flags.some(flag => flag !== "--apply")) {
  console.error("Usage: node scripts/database.mjs bootstrap|upgrade|verify [--apply]");
  process.exit(1);
}
const baseline = [manifest.baseline, ...manifest.historical];
if (new Set([...baseline, ...manifest.release]).size !== baseline.length + manifest.release.length) throw new Error("Duplicate migration path in manifest");
if (manifest.release.some(file => !/^supabase\/migrations\/\d{14}_[a-z0-9_]+\.sql$/.test(file))) throw new Error("New release migrations require a unique fourteen-digit timestamp prefix");
const files = command === "bootstrap" ? [...baseline, ...manifest.release] : manifest.release;
const records = files.map(file => {
  // Git checkouts may use CRLF on Windows and LF on CI. Execute and fingerprint
  // the same UTF-8/LF text so an unchanged migration verifies across platforms.
  const sql = readFileSync(file, "utf8").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  return { file, sql, hash: createHash("sha256").update(sql).digest("hex") };
});
console.log(`${command}: ${flags.includes("--apply") ? "APPLY" : "PLAN ONLY"}`);
for (const item of records) console.log(`${item.hash.slice(0, 12)} ${item.file}`);
if (!flags.includes("--apply")) process.exit(0);
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required. Use a direct PostgreSQL connection; never a browser variable.");
const connection = new URL(process.env.DATABASE_URL);
if (!["postgres:", "postgresql:"].includes(connection.protocol) || !connection.hostname || connection.pathname.length < 2) throw new Error("Invalid PostgreSQL connection URI");
const connectionEnv = {
  ...process.env, PGHOST: connection.hostname, PGPORT: connection.port || "5432",
  PGDATABASE: decodeURIComponent(connection.pathname.slice(1)),
  PGUSER: decodeURIComponent(connection.username), PGPASSWORD: decodeURIComponent(connection.password),
  PGCONNECT_TIMEOUT: "10",
};
for (const [option, variable] of Object.entries({ sslmode: "PGSSLMODE", sslrootcert: "PGSSLROOTCERT", sslcert: "PGSSLCERT", sslkey: "PGSSLKEY", options: "PGOPTIONS", application_name: "PGAPPNAME", connect_timeout: "PGCONNECT_TIMEOUT" })) {
  if (connection.searchParams.has(option)) connectionEnv[variable] = connection.searchParams.get(option);
}
function run(sql) {
  // Connection details stay out of argv/output and use libpq environment fields.
  const result = spawnSync("psql", ["-X", "-v", "ON_ERROR_STOP=1", "--no-psqlrc"], {
    input: sql, encoding: "utf8", env: connectionEnv,
    windowsHide: true, stdio: ["pipe", "pipe", "pipe"],
  });
  if (result.error || result.status !== 0) {
    // SQL can contain private data in future migrations. Keep terminal errors concise.
    console.error(result.error?.code === "ENOENT" ? "Install PostgreSQL's psql client." : "Database command failed. No further files were applied; inspect the database/server logs.");
    process.exit(1);
  }
  return result.stdout;
}
if (command === "bootstrap") {
  run("do $$ begin if exists(select 1 from pg_tables where schemaname='public' and tablename in ('profiles','skills','roles','admin_users','user_stats')) then raise exception 'Bootstrap requires an empty application schema'; end if; end $$;");
} else {
  run("do $$ begin if to_regclass('public.vf_submission_ledger') is null or to_regclass('public.career_reflections') is null or not exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='career_level') then raise exception 'Historical cloud and career migrations must be applied first'; end if; end $$;");
}
if (command !== "verify") run(`create table if not exists public.vf_schema_releases (
  path text primary key, sha256 text not null, applied_at timestamptz not null default now()
); alter table public.vf_schema_releases enable row level security;
revoke all on public.vf_schema_releases from anon,authenticated;
grant select on public.vf_schema_releases to service_role;`);
for (const item of records) {
  // Manifest paths are repository-controlled; forbid quote injection defensively.
  if (!/^supabase\/[a-zA-Z0-9_./-]+\.sql$/.test(item.file)) throw new Error("Invalid migration path");
  if (command === "verify") {
    run(`do $$ begin if not exists(select 1 from public.vf_schema_releases where path='${item.file}' and sha256='${item.hash}') then raise exception 'Missing or changed release'; end if; end $$;`);
    continue;
  }
  const present = run(`select coalesce((select sha256 from public.vf_schema_releases where path='${item.file}'),'missing');`).match(/[a-f0-9]{64}|missing/)?.[0];
  if (present === item.hash) { console.log(`Already applied: ${item.file}`); continue; }
  if (present !== "missing") throw new Error(`Applied migration changed: ${item.file}. Add a new migration instead.`);
  // Each file and its checksum commit together; remove only top-level wrappers.
  const sql = item.sql.replace(/^begin;\s*$/gim, "").replace(/^commit;\s*$/gim, "");
  run(`begin;\n${sql}\ninsert into public.vf_schema_releases(path,sha256) values('${item.file}','${item.hash}');\ncommit;`);
  console.log(`Applied: ${item.file}`);
}
console.log("Database release verification complete.");
