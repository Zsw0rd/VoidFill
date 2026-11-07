import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import {
  MAX_SNAPSHOT_BYTES, SNAPSHOT_TABLES, canonicalJson, captureLearningSnapshot,
  decryptLearningSnapshot, encryptLearningSnapshot, snapshotOutputPath, snapshotSummary,
  learningSnapshotSql, importLearningSnapshotCsv,
  type SnapshotTable,
} from "../lib/learningSnapshot.mjs";

const projectRef="abcdefghijklmnopqrst";
const secret="synthetic-snapshot-key-for-tests-only-32-characters";
const root=fileURLToPath(new URL("../",import.meta.url));
type Row=Record<string,unknown>;
type Dataset=Record<string,Row[]>;
function dataset(overrides:Dataset={}):Dataset {
  return {
    ...Object.fromEntries(SNAPSHOT_TABLES.map(table=>[table.name,[]])),
    roles:[{id:"role-a",name:"Synthetic role"}],
    skills:[{id:"skill-a",name:"Synthetic skill"}],
    role_skills:[{role_id:"role-a",skill_id:"skill-a",required_score:70}],
    ...overrides,
  };
}
function reader(data:Dataset,cap=1000) {
  return {
    async page(definition:SnapshotTable,offset:number,limit:number) {
      return {rows:data[definition.name].slice(offset,offset+Math.min(cap,limit)),count:data[definition.name].length};
    },
    async count(definition:SnapshotTable) {return data[definition.name].length;},
  };
}
const options={projectRef,createdAt:"2026-11-06T12:00:00.000Z"};

test("logical export advances through smaller API row caps and preserves every selected row",async()=>{
  const data=dataset({roles:Array.from({length:5},(_,i)=>({id:`role-${i}`,name:`Role ${i}`}))});
  const calls:number[]=[];
  const capped=reader(data,2);
  const payload=await captureLearningSnapshot({
    ...capped,
    async page(definition,offset,limit) {if(definition.name==="roles") calls.push(offset); return capped.page(definition,offset,limit);},
  },{...options,pageSize:500});
  assert.deepEqual(calls,[0,2,4]);
  assert.deepEqual(payload.tables.roles.rows,data.roles);
  assert.equal(payload.tables.roles.sha256,createHash("sha256").update(canonicalJson(data.roles)).digest("hex"));
  assert.equal(payload.tables.profiles.columns,"id,target_role_id,custom_target_role,career_level,career_focus_skill_ids,career_goal_context");
});

test("counts, missing pages, unreadable tables and excessive counts fail instead of publishing a partial export",async()=>{
  const data=dataset();
  const valid=reader(data);
  await assert.rejects(captureLearningSnapshot({...valid,async page(definition,offset,limit){if(definition.name==="roles") return {rows:[],count:1};return valid.page(definition,offset,limit);}},options),/pagination truncated/);
  await assert.rejects(captureLearningSnapshot({...valid,async count(definition){return definition.name==="roles"?2:valid.count(definition);}},options),/Table changed/);
  await assert.rejects(captureLearningSnapshot({...valid,async page(definition,offset,limit){if(definition.name==="roles") return {rows:[],count:1000000};return valid.page(definition,offset,limit);}},options),/row limit/);
  await assert.rejects(captureLearningSnapshot({...valid,async page(){throw new Error("private upstream details");}},options),error=>error instanceof Error && /Required snapshot table/.test(error.message) && !error.message.includes("private upstream"));
  let rolePages=0;
  const changing=reader(dataset({roles:[{id:"a"},{id:"b"}]}),1);
  await assert.rejects(captureLearningSnapshot({...changing,async page(definition,offset,limit){const page=await changing.page(definition,offset,limit);if(definition.name==="roles" && rolePages++>0) page.count++;return page;}},options),/Table changed/);
});

test("missing or duplicate keys, out-of-order pages, excluded profile fields and empty catalogue fail closed",async()=>{
  for(const roles of [[{id:"a"},{id:"a"}],[{id:"b"},{id:"a"}],[{}]]) {
    await assert.rejects(captureLearningSnapshot(reader(dataset({roles}),1),options),/key|order/);
  }
  await assert.rejects(captureLearningSnapshot(reader(dataset({profiles:[{id:"learner-a",email:"excluded@example.invalid"}]})),options),/excluded fields/);
  for(const name of ["roles","skills","role_skills"]) {
    await assert.rejects(captureLearningSnapshot(reader(dataset({[name]:[]})),options),/Required snapshot catalogue is empty/);
  }
  assert.ok(!SNAPSHOT_TABLES.some(table=>/auth|chat|admin|mentor|resume|reflection|practical/.test(table.name)));
});

test("serialized export budget applies across tables before more data accumulates",async()=>{
  const text="x".repeat(MAX_SNAPSHOT_BYTES/2+1024);
  const data=dataset({roles:[{id:"role-a",description:text}],skills:[{id:"skill-a",description:text}]});
  const base=reader(data);
  const seen:string[]=[];
  await assert.rejects(captureLearningSnapshot({...base,async page(definition,offset,limit){seen.push(definition.name);return base.page(definition,offset,limit);}},options),/logical-export size/);
  assert.deepEqual(seen,["roles","skills"]);
});

test("authenticated encryption round-trips privately with fresh salt/nonce and a record-free summary",async()=>{
  const payload=await captureLearningSnapshot(reader(dataset({profiles:[{id:"learner-a",career_goal_context:"private-goal-that-must-not-be-logged"}]})),options);
  const first=encryptLearningSnapshot(payload,secret),second=encryptLearningSnapshot(payload,secret);
  assert.notDeepEqual(first,second);
  assert.deepEqual(decryptLearningSnapshot(first,secret),payload);
  assert.ok(!first.toString().includes("private-goal"));
  const summary=JSON.stringify(snapshotSummary(payload));
  assert.ok(!summary.includes("private-goal") && !summary.includes("learner-a") && !summary.includes("rows"));
  assert.equal(snapshotSummary(payload).tables.length,SNAPSHOT_TABLES.length);
});

test("wrong keys, truncated files, changed headers, tags, ciphertext and stale table digests are rejected",async()=>{
  const payload=await captureLearningSnapshot(reader(dataset()),options);
  const encoded=encryptLearningSnapshot(payload,secret);
  assert.throws(()=>decryptLearningSnapshot(encoded,secret+"wrong"),/authentication or integrity/);
  assert.throws(()=>decryptLearningSnapshot(encoded.subarray(0,encoded.length-20),secret),/authentication or integrity/);
  for(const field of ["tag","ciphertext","salt","iv"]) {
    const envelope=JSON.parse(encoded.toString());
    const bytes=Buffer.from(envelope[field],"base64");bytes[0]^=1;envelope[field]=bytes.toString("base64");
    assert.throws(()=>decryptLearningSnapshot(Buffer.from(JSON.stringify(envelope)),secret),/authentication or integrity/);
  }
  const altered=structuredClone(payload);altered.tables.roles.rows[0].name="Different value";
  assert.throws(()=>encryptLearningSnapshot(altered,secret),/digest mismatch/);
});

test("snapshot destination cannot escape the ignored backup directory or use alternate streams/devices",()=>{
  const base=resolve(root,"ml/runtime/backups");
  assert.equal(snapshotOutputPath(root,"release.vfs"),join(base,"release.vfs"));
  assert.equal(snapshotOutputPath(root,join(base,"nested","release.vfs")),join(base,"nested","release.vfs"));
  for(const requested of ["../outside.vfs",resolve(root,"outside.vfs"),"backup.json","data.vfs:stream.vfs","CON.vfs","bad\0.vfs"]) {
    assert.throws(()=>snapshotOutputPath(root,requested),/Snapshot output|Invalid snapshot/);
  }
});

test("CLI help and access guards require no remote contact; publishing refuses existing files and symlink parents",async()=>{
  const fakeKey=["header",Buffer.from(JSON.stringify({role:"service_role",ref:projectRef})).toString("base64url"),"synthetic"].join(".");
  const env={...process.env,NEXT_PUBLIC_SUPABASE_URL:`https://${projectRef}.supabase.co`,SUPABASE_SERVICE_ROLE_KEY:fakeKey,ML_ASSESSMENT_SECRET:secret,ML_SERVICE_TOKEN:secret};
  const run=(args:string[])=>spawnSync(process.execPath,["scripts/learning-snapshot.mjs",...args],{cwd:root,env,encoding:"utf8",timeout:10000,windowsHide:true});
  const help=run(["--help"]);assert.equal(help.status,0);assert.match(help.stdout,/No remote action/);
  const missingPause=run(["--capture","--confirm-project",projectRef]);assert.equal(missingPause.status,1);assert.match(missingPause.stderr,/writes-paused/);
  const mismatch=run(["--capture","--confirm-project","zzzzzzzzzzzzzzzzzzzz","--writes-paused"]);assert.equal(mismatch.status,1);assert.match(mismatch.stderr,/does not exactly match/);
  const fixtureName="snapshot-unit-"+randomUUID();
  const fixture=resolve(root,"ml/runtime/backups",fixtureName);
  const existing=join(fixture,"existing.vfs"),linked=join(fixture,"linked");
  const outside=fs.mkdtempSync(join(tmpdir(),"voidfill-snapshot-link-"));
  fs.mkdirSync(fixture,{recursive:true});
  try {
    fs.writeFileSync(existing,"do-not-overwrite");
    const duplicate=run(["--capture","--confirm-project",projectRef,"--writes-paused","--output",`${fixtureName}/existing.vfs`]);
    assert.equal(duplicate.status,1);assert.match(duplicate.stderr,/Refusing to overwrite/);assert.equal(fs.readFileSync(existing,"utf8"),"do-not-overwrite");
    fs.symlinkSync(outside,linked,process.platform==="win32"?"junction":"dir");
    const escape=run(["--capture","--confirm-project",projectRef,"--writes-paused","--output",`${fixtureName}/linked/escape.vfs`]);
    assert.equal(escape.status,1);assert.match(escape.stderr,/links or junctions|remain in the workspace/);assert.ok(!fs.existsSync(join(outside,"escape.vfs")));
    const payload=await captureLearningSnapshot(reader(dataset()),options);
    fs.writeFileSync(existing,encryptLearningSnapshot(payload,secret));
    const inspected=run(["--inspect",existing]);assert.equal(inspected.status,0);const summary=JSON.parse(inspected.stdout);assert.equal(summary.tables.length,SNAPSHOT_TABLES.length);assert.ok(!inspected.stdout.includes("Synthetic role"));
  } finally {
    if(fs.existsSync(linked)) process.platform==="win32"?fs.rmdirSync(linked):fs.unlinkSync(linked);
    if(fs.existsSync(existing)) fs.unlinkSync(existing);
    fs.rmdirSync(fixture);fs.rmdirSync(outside);
  }
});

function sqlEnvelope(data:Dataset=dataset()) {
  return {version:1,project_ref:projectRef,created_at:options.createdAt,tables:Object.fromEntries(SNAPSHOT_TABLES.map(definition=>[definition.name,{count:data[definition.name].length,rows:data[definition.name]}]))};
}
function csvEnvelope(raw:unknown,quoted=false) {
  const value=Buffer.from(JSON.stringify(raw)).toString("base64");
  return Buffer.from(quoted?`\uFEFF"snapshot_base64"\r\n"${value}"\r\n`:`snapshot_base64\n${value}\n`);
}

test("browser export SQL is one read-only repeatable-read query with explicit table counts and stable keys",()=>{
  const sql=learningSnapshotSql(projectRef);
  assert.match(sql,/begin isolation level repeatable read read only;/i);
  assert.match(sql,/as snapshot_base64;\ncommit;/);
  assert.equal((sql.match(/count\(\*\)/g)||[]).length,SNAPSHOT_TABLES.length);
  assert.ok(!/\b(insert|update|delete|alter|drop|truncate|create)\b/i.test(sql));
  for(const definition of SNAPSHOT_TABLES) {
    assert.ok(sql.includes(`from public."${definition.name}"`));
    assert.ok(sql.includes(definition.primaryKey.map(column=>`source_row."${column}"`).join(", ")));
  }
  assert.match(sql,/select "id", "target_role_id", "custom_target_role", "career_level", "career_focus_skill_ids", "career_goal_context" from public\."profiles"/);
  assert.ok(!sql.includes("secret") && !sql.includes("email"));
  assert.throws(()=>learningSnapshotSql(projectRef+"';drop"),/Invalid confirmed/);
});

test("strict single-record CSV imports canonically and encrypts with only the local secret",async()=>{
  const raw=sqlEnvelope(dataset({profiles:[{id:"learner-a",career_goal_context:"private source text"}]}));
  const payload=await importLearningSnapshotCsv(csvEnvelope(raw,true),projectRef);
  const expected=await captureLearningSnapshot(reader(dataset({profiles:[{id:"learner-a",career_goal_context:"private source text"}]})),options);
  assert.deepEqual(payload,expected);
  const encrypted=encryptLearningSnapshot(payload,secret);
  assert.deepEqual(decryptLearningSnapshot(encrypted,secret),payload);
  assert.ok(!JSON.stringify(snapshotSummary(payload)).includes("private source text"));
});

test("CSV corruption, multiple rows/columns, wrong project and malformed table data are rejected",async()=>{
  const raw=sqlEnvelope();
  const csv=csvEnvelope(raw).toString();
  for(const broken of [csv+"extra\n",csv.replace("snapshot_base64","snapshot_base64,other"),csv.replace(/\n[^\n]+\n$/,"\n%%%\n"),csv.replace(/\n$/,"" ).slice(0,-3)]) {
    await assert.rejects(importLearningSnapshotCsv(Buffer.from(broken),projectRef),/Snapshot CSV/);
  }
  await assert.rejects(importLearningSnapshotCsv(csvEnvelope(raw),"zzzzzzzzzzzzzzzzzzzz"),/Snapshot CSV/);
  const changes=[
    (value:ReturnType<typeof sqlEnvelope>)=>{value.version=2;},
    (value:ReturnType<typeof sqlEnvelope>)=>{delete value.tables.skills;},
    (value:ReturnType<typeof sqlEnvelope>)=>{value.tables.roles.count=2;},
    (value:ReturnType<typeof sqlEnvelope>)=>{value.tables.roles={count:2,rows:[{id:"same"},{id:"same"}]};},
    (value:ReturnType<typeof sqlEnvelope>)=>{value.tables.profiles={count:1,rows:[{id:"a",email:"excluded@example.invalid"}]};},
  ];
  for(const mutate of changes) {const changed=structuredClone(raw);mutate(changed);await assert.rejects(importLearningSnapshotCsv(csvEnvelope(changed),projectRef),/Snapshot CSV/);}
});

test("CSV CLI import and inspection work offline without a Supabase server key",()=>{
  const fixtureName="snapshot-csv-unit-"+randomUUID();
  const fixture=resolve(root,"ml/runtime/backups",fixtureName),csv=join(fixture,"source.csv"),encrypted=join(fixture,"imported.vfs");
  fs.mkdirSync(fixture,{recursive:true});
  const env={...process.env,ML_ASSESSMENT_SECRET:secret,ML_SERVICE_TOKEN:secret,SUPABASE_SERVICE_ROLE_KEY:"",NEXT_PUBLIC_SUPABASE_URL:"https://no-network.invalid"};
  const run=(args:string[])=>spawnSync(process.execPath,["scripts/learning-snapshot.mjs",...args],{cwd:root,env,encoding:"utf8",timeout:10000,windowsHide:true});
  try {
    fs.writeFileSync(csv,csvEnvelope(sqlEnvelope()),{mode:0o600});
    const guarded=run(["--import-csv",csv,"--confirm-project",projectRef]);assert.equal(guarded.status,1);assert.match(guarded.stderr,/writes-paused/);
    const imported=run(["--import-csv",csv,"--confirm-project",projectRef,"--writes-paused","--output",`${fixtureName}/imported.vfs`]);
    assert.equal(imported.status,0,imported.stderr);assert.equal(JSON.parse(imported.stdout).tables.length,SNAPSHOT_TABLES.length);
    assert.ok(fs.existsSync(csv),"Operator must explicitly remove the downloaded plaintext after verification");
    const inspected=run(["--inspect",encrypted]);assert.equal(inspected.status,0);assert.ok(!inspected.stdout.includes("Synthetic role"));
    assert.deepEqual(JSON.parse(inspected.stdout),snapshotSummary(decryptLearningSnapshot(fs.readFileSync(encrypted),secret)));
  } finally {
    for(const file of [csv,encrypted]) if(fs.existsSync(file)) fs.unlinkSync(file);
    fs.rmdirSync(fixture);
  }
});
