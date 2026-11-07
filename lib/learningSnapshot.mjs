/** Server/operator-only logical snapshot helpers. Never imported by browser code. */
import { createCipheriv, createDecipheriv, createHash, hkdfSync, randomBytes, timingSafeEqual } from "node:crypto";
import { gzipSync, gunzipSync } from "node:zlib";
import { isAbsolute, relative, resolve, sep } from "node:path";

export const MAX_SNAPSHOT_BYTES = 64 * 1024 * 1024;
const MAX_ROWS = 250000;
const FORMAT = "voidfill-learning-snapshot";
const PURPOSE = "VoidFill pre-release learning logical snapshot v1";
const REQUIRED_CATALOGUE = new Set(["roles", "skills", "role_skills"]);
export const SNAPSHOT_TABLES = Object.freeze([
  { name: "roles", primaryKey: ["id"], columns: "*" },
  { name: "skills", primaryKey: ["id"], columns: "*" },
  { name: "role_skills", primaryKey: ["role_id", "skill_id"], columns: "*" },
  { name: "skill_dependencies", primaryKey: ["prerequisite_skill_id", "dependent_skill_id"], columns: "*" },
  { name: "profiles", primaryKey: ["id"], columns: "id,target_role_id,custom_target_role,career_level,career_focus_skill_ids,career_goal_context" },
  { name: "user_stats", primaryKey: ["user_id"], columns: "*" },
  { name: "user_skill_scores", primaryKey: ["user_id", "skill_id"], columns: "*" },
  { name: "daily_attempts", primaryKey: ["id"], columns: "*" },
  { name: "attempt_answers", primaryKey: ["id"], columns: "*" },
  { name: "attempt_skill_scores", primaryKey: ["attempt_id", "skill_id"], columns: "*" },
  { name: "practice_attempts", primaryKey: ["id"], columns: "*" },
  { name: "roadmap_courses", primaryKey: ["id"], columns: "*" },
  { name: "course_assessments", primaryKey: ["id"], columns: "*" },
  { name: "user_roadmap", primaryKey: ["id"], columns: "*" },
  { name: "user_resource_completions", primaryKey: ["user_id", "resource_id"], columns: "*" },
  { name: "vf_submission_ledger", primaryKey: ["id"], columns: "*" },
].map(definition => Object.freeze({ ...definition, primaryKey: Object.freeze(definition.primaryKey) })));

export function canonicalJson(value) {
  if (value === null || typeof value === "boolean" || typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" && Number.isFinite(value) && (!Number.isInteger(value) || Number.isSafeInteger(value))) return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonicalJson).join(",") + "]";
  if (value && typeof value === "object" && [Object.prototype, null].includes(Object.getPrototypeOf(value))) {
    return "{" + Object.keys(value).sort().map(key => JSON.stringify(key) + ":" + canonicalJson(value[key])).join(",") + "}";
  }
  throw new Error("Snapshot contains a non-JSON or unsafe numeric value.");
}

function digest(value) { return createHash("sha256").update(value).digest("hex"); }
function deriveKey(secret, salt) {
  if (typeof secret !== "string" || secret.length < 32) throw new Error("A server snapshot secret of at least 32 characters is required.");
  return Buffer.from(hkdfSync("sha256", Buffer.from(secret, "utf8"), salt, Buffer.from(PURPOSE), 32));
}
function compareKeys(a, b) {
  for (let i = 0; i < a.length; i++) {
    if (a[i] < b[i]) return -1;
    if (a[i] > b[i]) return 1;
  }
  return 0;
}
function validateRows(definition, rows) {
  let prior = null;
  const allowedColumns = definition.columns === "*" ? null : new Set(definition.columns.split(","));
  for (const row of rows) {
    if (!row || typeof row !== "object" || Array.isArray(row)) throw new Error(`Invalid snapshot row in ${definition.name}.`);
    if (allowedColumns && Object.keys(row).some(key => !allowedColumns.has(key))) throw new Error("Snapshot profile projection contains excluded fields.");
    const key = definition.primaryKey.map(column => {
      if (typeof row[column] !== "string" || !row[column]) throw new Error(`Missing snapshot key in ${definition.name}.`);
      return row[column];
    });
    if (prior && compareKeys(prior, key) >= 0) throw new Error(`Duplicate or unstable key order in ${definition.name}.`);
    prior = key;
  }
}

/** Advance by actual rows returned: a project API cap may be smaller than pageSize. */
export async function captureLearningSnapshot(reader, { projectRef, createdAt = new Date().toISOString(), pageSize = 500 } = {}) {
  if (!/^[a-z0-9]{20}$/.test(projectRef || "")) throw new Error("Invalid confirmed project reference.");
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 1000) throw new Error("Invalid snapshot page size.");
  const tables = {};
  let totalRows = 0;
  let serializedBytes = 0;
  for (const definition of SNAPSHOT_TABLES) {
    const rows = [];
    let expected = null;
    do {
      let page;
      try { page = await reader.page(definition, rows.length, pageSize); }
      catch { throw new Error(`Required snapshot table could not be read: ${definition.name}.`); }
      if (!page || !Array.isArray(page.rows) || !Number.isSafeInteger(page.count) || page.count < 0) throw new Error(`Exact snapshot count unavailable: ${definition.name}.`);
      if (expected === null) expected = page.count;
      if (page.count !== expected) throw new Error(`Table changed during snapshot: ${definition.name}.`);
      if (expected > MAX_ROWS || totalRows + expected > MAX_ROWS) throw new Error("Snapshot exceeds the bounded logical-export row limit.");
      if (page.rows.length > pageSize || rows.length + page.rows.length > expected) throw new Error(`Inconsistent snapshot page: ${definition.name}.`);
      if (!page.rows.length && rows.length < expected) throw new Error(`Snapshot pagination truncated: ${definition.name}.`);
      // Do not accumulate many individually valid large tables before enforcing
      // the total serialized export bound. Page brackets slightly overcount.
      serializedBytes += Buffer.byteLength(canonicalJson(page.rows));
      if (serializedBytes > MAX_SNAPSHOT_BYTES) throw new Error("Snapshot exceeds the bounded logical-export size.");
      rows.push(...page.rows);
    } while (rows.length < expected);
    validateRows(definition, rows);
    const serialized = canonicalJson(rows);
    if (Buffer.byteLength(serialized) > MAX_SNAPSHOT_BYTES) throw new Error("Snapshot exceeds the bounded logical-export size.");
    tables[definition.name] = { columns: definition.columns, primary_key: [...definition.primaryKey], count: rows.length, sha256: digest(serialized), rows };
    totalRows += rows.length;
  }
  // Detect count changes spanning table reads. Equal counts cannot detect row
  // updates: application writes must be paused/drained before this begins.
  for (const definition of SNAPSHOT_TABLES) {
    let count;
    try { count = await reader.count(definition); }
    catch { throw new Error(`Required snapshot count could not be verified: ${definition.name}.`); }
    if (count !== tables[definition.name].count) throw new Error(`Table changed during snapshot: ${definition.name}.`);
  }
  const payload = { version: 1, created_at: createdAt, project_ref: projectRef, scope: "selected-learning-tables-only", tables };
  validateSnapshot(payload);
  return payload;
}

export function validateSnapshot(payload) {
  if (!payload || payload.version !== 1 || payload.scope !== "selected-learning-tables-only" || !/^[a-z0-9]{20}$/.test(payload.project_ref || "") || !/^\d{4}-\d\d-\d\dT/.test(payload.created_at || "") || !Number.isFinite(Date.parse(payload.created_at))) throw new Error("Invalid learning snapshot format.");
  if (!payload.tables || Object.keys(payload.tables).length !== SNAPSHOT_TABLES.length) throw new Error("Snapshot table manifest is incomplete.");
  let totalRows = 0;
  for (const definition of SNAPSHOT_TABLES) {
    const table = payload.tables[definition.name];
    if (!table || !Array.isArray(table.rows) || table.count !== table.rows.length || table.count > MAX_ROWS || table.columns !== definition.columns || canonicalJson(table.primary_key) !== canonicalJson(definition.primaryKey)) throw new Error(`Invalid snapshot manifest: ${definition.name}.`);
    if (REQUIRED_CATALOGUE.has(definition.name) && !table.count) throw new Error(`Required snapshot catalogue is empty: ${definition.name}.`);
    totalRows += table.count;
    if (totalRows > MAX_ROWS) throw new Error("Snapshot exceeds the bounded logical-export row limit.");
    validateRows(definition, table.rows);
    if (table.sha256 !== digest(canonicalJson(table.rows))) throw new Error(`Snapshot table digest mismatch: ${definition.name}.`);
  }
  if (Buffer.byteLength(canonicalJson(payload)) > MAX_SNAPSHOT_BYTES) throw new Error("Snapshot exceeds the bounded logical-export size.");
}

export function encryptLearningSnapshot(payload, secret) {
  validateSnapshot(payload);
  const plaintext = Buffer.from(canonicalJson(payload), "utf8");
  if (plaintext.length > MAX_SNAPSHOT_BYTES) throw new Error("Snapshot exceeds the bounded logical-export size.");
  const salt = randomBytes(32), iv = randomBytes(12);
  const header = { format: FORMAT, version: 1, algorithm: "aes-256-gcm", kdf: "hkdf-sha256", salt: salt.toString("base64"), iv: iv.toString("base64"), plaintext_sha256: digest(plaintext) };
  const cipher = createCipheriv("aes-256-gcm", deriveKey(secret, salt), iv);
  cipher.setAAD(Buffer.from(canonicalJson(header)));
  const ciphertext = Buffer.concat([cipher.update(gzipSync(plaintext)), cipher.final()]);
  return Buffer.from(JSON.stringify({ ...header, tag: cipher.getAuthTag().toString("base64"), ciphertext: ciphertext.toString("base64") }) + "\n");
}

export function decryptLearningSnapshot(encoded, secret) {
  try {
    if (!Buffer.isBuffer(encoded) || encoded.length > MAX_SNAPSHOT_BYTES * 2) throw new Error();
    const envelope = JSON.parse(encoded.toString("utf8"));
    const { tag, ciphertext, ...header } = envelope;
    if (header.format !== FORMAT || header.version !== 1 || header.algorithm !== "aes-256-gcm" || header.kdf !== "hkdf-sha256" || !/^[a-f0-9]{64}$/.test(header.plaintext_sha256)) throw new Error();
    const salt = Buffer.from(header.salt, "base64"), iv = Buffer.from(header.iv, "base64"), authTag = Buffer.from(tag, "base64");
    if (salt.length !== 32 || iv.length !== 12 || authTag.length !== 16 || typeof ciphertext !== "string") throw new Error();
    const decipher = createDecipheriv("aes-256-gcm", deriveKey(secret, salt), iv);
    decipher.setAAD(Buffer.from(canonicalJson(header)));
    decipher.setAuthTag(authTag);
    const compressed = Buffer.concat([decipher.update(Buffer.from(ciphertext, "base64")), decipher.final()]);
    const plaintext = gunzipSync(compressed, { maxOutputLength: MAX_SNAPSHOT_BYTES });
    const actual = Buffer.from(digest(plaintext), "hex"), expected = Buffer.from(header.plaintext_sha256, "hex");
    if (!timingSafeEqual(actual, expected)) throw new Error();
    const payload = JSON.parse(plaintext.toString("utf8"));
    validateSnapshot(payload);
    return payload;
  } catch { throw new Error("Snapshot authentication or integrity check failed."); }
}

/** Summary deliberately excludes records, identities, credentials and profile text. */
export function snapshotSummary(payload) {
  validateSnapshot(payload);
  return { created_at: payload.created_at, plaintext_sha256: digest(canonicalJson(payload)), tables: SNAPSHOT_TABLES.map(({ name }) => ({ table: name, count: payload.tables[name].count, sha256: payload.tables[name].sha256 })) };
}

/** Public query text only; execution is an explicit authenticated operator action. */
export function learningSnapshotSql(projectRef) {
  if (!/^[a-z0-9]{20}$/.test(projectRef || "")) throw new Error("Invalid confirmed project reference.");
  const quote = value => {
    if (!/^[a-z_]+$/.test(value)) throw new Error("Invalid snapshot SQL identifier.");
    return '"' + value + '"';
  };
  const tables = SNAPSHOT_TABLES.map(definition => {
    const projection=definition.columns === "*" ? "*" : definition.columns.split(",").map(quote).join(", ");
    const order=definition.primaryKey.map(column=>"source_row."+quote(column)).join(", ");
    return `    '${definition.name}', (select jsonb_build_object('count', count(*), 'rows', coalesce(jsonb_agg(to_jsonb(source_row) order by ${order}), '[]'::jsonb)) from (select ${projection} from public.${quote(definition.name)}) as source_row)`;
  }).join(",\n");
  return `-- Verify the browser is the intended Supabase project: ${projectRef}.\n-- Read-only selected learning records. The CSV contains plaintext data encoded\n-- as base64; download directly, import/encrypt locally, then remove that CSV.\nbegin isolation level repeatable read read only;\nset local statement_timeout = '30s';\nselect replace(encode(convert_to(jsonb_build_object(\n  'version', 1,\n  'project_ref', '${projectRef}',\n  'created_at', to_char(transaction_timestamp() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),\n  'tables', jsonb_build_object(\n${tables}\n  )\n)::text, 'UTF8'), 'base64'), chr(10), '') as snapshot_base64;\ncommit;\n`;
}

/** Strict one-column/one-record CSV. It never logs or returns the raw envelope. */
export async function importLearningSnapshotCsv(encoded, projectRef) {
  if (!/^[a-z0-9]{20}$/.test(projectRef || "")) throw new Error("Invalid confirmed project reference.");
  let raw;
  try {
    if (!Buffer.isBuffer(encoded) || encoded.length > MAX_SNAPSHOT_BYTES * 2) throw new Error();
    let csv=new TextDecoder("utf-8",{fatal:true}).decode(encoded).replace(/^\uFEFF/,"").replaceAll("\r\n","\n");
    if (csv.includes("\r")) throw new Error();
    if (csv.endsWith("\n")) csv=csv.slice(0,-1);
    const lines=csv.split("\n");
    if (lines.length!==2 || !["snapshot_base64",'"snapshot_base64"'].includes(lines[0])) throw new Error();
    let value=lines[1];
    if (value.startsWith('"') && value.endsWith('"')) value=value.slice(1,-1);
    if (!value || value.length%4!==0 || /[^A-Za-z0-9+/=]/.test(value)) throw new Error();
    const decoded=Buffer.from(value,"base64");
    if (decoded.length > MAX_SNAPSHOT_BYTES || decoded.toString("base64")!==value) throw new Error();
    raw=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(decoded));
    if (!raw || typeof raw!=="object" || Array.isArray(raw) || Object.keys(raw).sort().join(",")!=="created_at,project_ref,tables,version" || raw.version!==1 || raw.project_ref!==projectRef || typeof raw.created_at!=="string" || !Number.isFinite(Date.parse(raw.created_at))) throw new Error();
    if (!raw.tables || typeof raw.tables!=="object" || Array.isArray(raw.tables) || Object.keys(raw.tables).sort().join(",")!==SNAPSHOT_TABLES.map(table=>table.name).sort().join(",")) throw new Error();
    let total=0;
    for (const definition of SNAPSHOT_TABLES) {
      const table=raw.tables[definition.name];
      if (!table || typeof table!=="object" || Array.isArray(table) || Object.keys(table).sort().join(",")!=="count,rows" || !Array.isArray(table.rows) || !Number.isSafeInteger(table.count) || table.count!==table.rows.length || table.count<0) throw new Error();
      total+=table.count;
      if (total>MAX_ROWS) throw new Error();
      validateRows(definition,table.rows);
    }
  } catch { throw new Error("Snapshot CSV format, project or record validation failed."); }
  return captureLearningSnapshot({
    async page(definition,offset,limit) {const table=raw.tables[definition.name];return {rows:table.rows.slice(offset,offset+limit),count:table.count};},
    async count(definition) {return raw.tables[definition.name].count;},
  },{projectRef,createdAt:raw.created_at});
}

export function snapshotOutputPath(workspace, requested) {
  if (typeof requested !== "string" || !requested || requested.length > 4096 || requested.includes("\0")) throw new Error("Invalid snapshot output path.");
  const base = resolve(workspace, "ml/runtime/backups");
  const output = isAbsolute(requested) ? resolve(requested) : resolve(base, requested);
  const within = relative(base, output);
  if (!within || within === ".." || within.startsWith(".." + sep) || isAbsolute(within) || !output.endsWith(".vfs")) throw new Error("Snapshot output must be a .vfs file inside ignored ml/runtime/backups.");
  if (within.split(sep).some(part => /[:<>"|?*]/.test(part) || /[. ]$/.test(part) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part))) throw new Error("Invalid snapshot output path.");
  return output;
}
