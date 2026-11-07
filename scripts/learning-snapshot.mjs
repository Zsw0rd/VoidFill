#!/usr/bin/env node
/** Explicit, read-only remote export; no restore or database mutation mode. */
import fs from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import nextEnv from "@next/env";
import { MAX_SNAPSHOT_BYTES, SNAPSHOT_TABLES, captureLearningSnapshot, decryptLearningSnapshot, encryptLearningSnapshot, importLearningSnapshotCsv, learningSnapshotSql, snapshotOutputPath, snapshotSummary } from "../lib/learningSnapshot.mjs";

const root = fs.realpathSync(resolve(dirname(fileURLToPath(import.meta.url)), ".."));
const args = process.argv.slice(2);
function fail(message) { throw new Error("Snapshot guard: " + message); }
function parse() {
  const options = {};
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    if (!["--capture", "--confirm-project", "--writes-paused", "--output", "--inspect", "--export-sql", "--import-csv", "--help"].includes(key) || Object.hasOwn(options, key)) fail("Unknown or repeated option.");
    if (["--confirm-project", "--output", "--inspect", "--import-csv"].includes(key)) {
      if (!args[i + 1] || args[i + 1].startsWith("--")) fail("Option requires a value.");
      options[key] = args[++i];
    } else options[key] = true;
  }
  return options;
}
function environment() {
  nextEnv.loadEnvConfig(root, false, { info() {}, error() {} });
  const secret = process.env.ML_ASSESSMENT_SECRET || process.env.ML_SERVICE_TOKEN;
  if (!secret || secret.length < 32) fail("Existing server snapshot secret is unavailable.");
  return secret;
}
function safeDirectory(output, {allowExisting=false}={}) {
  const directory = dirname(output);
  const pieces = relative(root, directory).split(sep);
  let current = root;
  for (const piece of pieces) {
    current = join(current, piece);
    if (!fs.existsSync(current)) fs.mkdirSync(current, { mode: 0o700 });
    const stat = fs.lstatSync(current);
    if (!stat.isDirectory() || stat.isSymbolicLink()) fail("Output directory must not traverse links or junctions.");
    const actual = fs.realpathSync(current);
    const within = relative(root, actual);
    if (!within || within.startsWith(".." + sep) || within === "..") fail("Output directory must remain in the workspace.");
  }
  const ignored = spawnSync("git", ["check-ignore", "--quiet", "--no-index", "--", relative(root, output)], { cwd: root, windowsHide: true, stdio: "ignore" });
  if (ignored.status !== 0) fail("Output must be ignored by Git.");
  if (!allowExisting && fs.existsSync(output)) fail("Refusing to overwrite an existing snapshot.");
}
function publish(output, bytes, secret) {
  const temporary = output + ".partial-" + randomUUID();
  let createdOutput = false;
  try {
    const fd = fs.openSync(temporary, "wx", 0o600);
    try { fs.writeFileSync(fd, bytes); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
    // Linking a complete same-directory file publishes without overwriting an
    // existing destination, unlike a rename on platforms that replace it.
    fs.linkSync(temporary, output);
    createdOutput = true;
    const verified = decryptLearningSnapshot(fs.readFileSync(output), secret);
    return snapshotSummary(verified);
  } catch {
    if (createdOutput) try { fs.unlinkSync(output); } catch {}
    throw new Error("Snapshot could not be published and verified safely.");
  } finally {
    try { fs.unlinkSync(temporary); } catch {}
  }
}

try {
  const options = parse();
  if (["--capture","--inspect","--export-sql","--import-csv"].filter(mode=>Object.hasOwn(options,mode)).length>1) fail("Choose only one snapshot mode.");
  if (options["--inspect"]) {
    if (Object.keys(options).length !== 1) fail("Inspect is an offline-only mode and cannot be combined with capture options.");
    const secret = environment();
    const input = resolve(root, options["--inspect"]);
    if (!input.endsWith(".vfs") || fs.statSync(input).size > MAX_SNAPSHOT_BYTES * 2) fail("Invalid or oversized snapshot file.");
    console.log(JSON.stringify(snapshotSummary(decryptLearningSnapshot(fs.readFileSync(input), secret)), null, 2));
  } else if (options["--export-sql"]) {
    if (Object.keys(options).some(key=>!["--export-sql","--confirm-project"].includes(key))) fail("SQL export accepts only the project confirmation.");
    const sql=learningSnapshotSql(options["--confirm-project"]);
    const output=resolve(root,"ml/runtime/learning-snapshot.sql");
    safeDirectory(output,{allowExisting:true});
    if (fs.existsSync(output)) {
      if (fs.lstatSync(output).isSymbolicLink() || fs.readFileSync(output,"utf8")!==sql) fail("Refusing to replace a different SQL export.");
    } else {
      fs.writeFileSync(output,sql,{flag:"wx",mode:0o600});
    }
    console.log(JSON.stringify({file:relative(root,output).replaceAll("\\","/"),project_ref:options["--confirm-project"],read_only:true}));
  } else if (options["--import-csv"]) {
    if (Object.keys(options).some(key=>!["--import-csv","--confirm-project","--writes-paused","--output"].includes(key)) || !options["--writes-paused"] || !/^[a-z0-9]{20}$/.test(options["--confirm-project"] || "")) fail("CSV import requires project confirmation and --writes-paused.");
    const secret=environment();
    const input=resolve(root,options["--import-csv"]);
    const stat=fs.statSync(input);
    if (!stat.isFile() || stat.size>MAX_SNAPSHOT_BYTES*2) fail("Invalid or oversized CSV import.");
    const payload=await importLearningSnapshotCsv(fs.readFileSync(input),options["--confirm-project"]);
    const name="learning-"+new Date().toISOString().replace(/[:.]/g,"-")+"-"+randomUUID().slice(0,8)+".vfs";
    const output=snapshotOutputPath(root,options["--output"] || name);
    safeDirectory(output);
    const summary=publish(output,encryptLearningSnapshot(payload,secret),secret);
    console.log(JSON.stringify({file:relative(root,output).replaceAll("\\","/"),...summary},null,2));
  } else if (!options["--capture"] || options["--help"]) {
    if (Object.keys(options).some(key => !["--help"].includes(key))) fail("Capture options require --capture.");
    console.log("No remote action. This exports selected learning tables only, not PostgreSQL/Auth/Storage or a point-in-time backup. Pause and drain all application writes first.");
    console.log("Capture: node scripts/learning-snapshot.mjs --capture --confirm-project <public-project-ref> --writes-paused");
    console.log("Inspect offline: node scripts/learning-snapshot.mjs --inspect <snapshot.vfs>");
    console.log("Browser fallback: --export-sql --confirm-project <ref>, then --import-csv <download.csv> --confirm-project <ref> --writes-paused");
    console.log("Required tables: " + SNAPSHOT_TABLES.map(table => table.name).join(", "));
  } else {
    if (!options["--writes-paused"] || !/^[a-z0-9]{20}$/.test(options["--confirm-project"] || "")) fail("Capture requires --writes-paused and the explicit --confirm-project reference.");
    const secret = environment();
    let url;
    try { url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || ""); } catch { fail("Supabase project URL is unavailable."); }
    const projectRef = options["--confirm-project"];
    if (url.protocol !== "https:" || url.hostname !== projectRef + ".supabase.co" || url.username || url.password || url.port || !["", "/"].includes(url.pathname) || url.search || url.hash) fail("Confirmed project does not exactly match the configured Supabase project URL.");
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) fail("Existing Supabase server key is unavailable.");
    if (!key.startsWith("sb_secret_")) {
      let claim;
      try { claim = JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString("utf8")); } catch { fail("A server-role key is required."); }
      if (claim.role !== "service_role" || (claim.ref && claim.ref !== projectRef)) fail("Configured key is not a matching server-role credential.");
    }
    const name = "learning-" + new Date().toISOString().replace(/[:.]/g, "-") + "-" + randomUUID().slice(0, 8) + ".vfs";
    const output = snapshotOutputPath(root, options["--output"] || name);
    safeDirectory(output);
    const { createClient } = await import("@supabase/supabase-js");
    const client = createClient(url.toString(), key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
    const reader = {
      async page(definition, offset, limit) {
        let query = client.from(definition.name).select(definition.columns, { count: "exact" });
        for (const column of definition.primaryKey) query = query.order(column, { ascending: true });
        const { data, count, error } = await query.range(offset, offset + limit - 1).abortSignal(AbortSignal.timeout(15000));
        if (error || !data || count === null) throw new Error("Table read failed.");
        return { rows: data, count };
      },
      async count(definition) {
        const { count, error } = await client.from(definition.name).select(definition.primaryKey.join(","), { count: "exact", head: true }).abortSignal(AbortSignal.timeout(15000));
        if (error || count === null) throw new Error("Count read failed.");
        return count;
      },
    };
    const payload = await captureLearningSnapshot(reader, { projectRef });
    if (!payload.tables.roles.count || !payload.tables.skills.count) fail("Refusing an unexpectedly empty career catalogue.");
    const bytes = encryptLearningSnapshot(payload, secret);
    decryptLearningSnapshot(bytes, secret);
    const summary = publish(output, bytes, secret);
    console.log(JSON.stringify({ file: relative(root, output).replaceAll("\\", "/"), ...summary }, null, 2));
  }
} catch (error) {
  const message = error instanceof Error && /^(Snapshot|Required snapshot|Exact snapshot|Table changed|Invalid confirmed|Invalid snapshot|Duplicate or unstable|Missing snapshot|A server snapshot)/.test(error.message) ? error.message : "Snapshot operation failed; no complete export was published.";
  console.error(message);
  process.exitCode = 1;
}
