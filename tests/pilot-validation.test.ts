import test from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {mkdtempSync,writeFileSync,mkdirSync,linkSync,symlinkSync,rmSync,existsSync} from "node:fs";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {PILOT_VERSION,TASK_CARDS,buildReviewPack,digest,validatePack,validateRecords,emptyRecords,recordTemplates,aggregateRecords,reviewerMarkdown,createPrivateDirectory,privatePath,writePrivateJson,readPrivateJson,type PilotSource,type PilotPack} from "../lib/pilotValidation.mjs";

// Entirely fictional source fixtures. No people, sessions, experts or study results.
const source:PilotSource={revision:"a".repeat(40),content_digest:"b".repeat(64),state:"working_tree",environment:"local_demo",deployment:"local",deployment_binding:"local_source"};
function fixturePack():PilotPack {
  const roles=Array.from({length:60},(_,i)=>({id:`00000000-0000-4000-8000-${String(i+1).padStart(12,"0")}`,key:`fictional-role-${i+1}`,name:`Fictional role ${i+1}`,family:i%2?"fictional-technical":"fictional-business",requirements:[{skill:"fictional-skill"}]}));
  const catalogue={version:"fictional-v1",roles,skills:[{key:"fictional-skill",name:"Fictional skill",topic:"fictional-topic",assessment_mode:"objective"}]};
  const briefs=roles.flatMap(role=>["foundation","intermediate"].map(level=>({version:"fictional-v1/case-v1",role_id:role.id,role_key:role.key,role_name:role.name,level,title:`Fictional ${level} task`,instructions:"Inspect the supplied fictional table and explain a choice.",deliverable:"One fictional recommendation with evidence.",rubric:["Evidence supports the choice.","A limitation is stated."],note:"Fictional engineering fixture only; no expert reviewed it.",case_inputs:["Fictional rows: A=1, B=2."],case_sources:[{title:"Fictional public reference",url:"https://example.org/reference"}]})));
  const question=(id:string,difficulty:number,resource_ids:string[]=[])=>({id,prompt:"Fictional engineering question?",options:["Fictional A","Fictional B"],correct_index:0,explanation:"Fictional answer explanation.",difficulty,topics:["fictional-topic"],resource_ids,source_url:"https://example.org/reference",source:"Fictional engineering fixture",objective_id:null,lesson_scope:null});
  const evidence={questions:[question("fictional-foundation",1,["fictional-resource"]),question("fictional-intermediate",3,["fictional-resource"]),question("fictional-lesson-only",2,["fictional-resource"]),question("fictional-reference-only",2),question("fictional-quarantined",1),question("fictional-level-five",5)],resources:[{id:"fictional-resource",title:"Fictional resource",url:"https://example.org/lesson",provider:"Fictional",topics:["fictional-topic"],selection_status:"both_stages",banks:[{topic:"fictional-topic",foundation_ids:["fictional-foundation","fictional-lesson-only"],intermediate_ids:["fictional-intermediate"]}]}],skill_banks:{"fictional-topic":{foundation:["fictional-foundation","fictional-reference-only"],intermediate:["fictional-intermediate"]}},excluded_question_ids:["fictional-quarantined"]};
  return buildReviewPack({source,catalogue,briefs,evidence});
}
const PACK=fixturePack();
const copy=<T,>(value:T):T=>structuredClone(value);
const consent={adult:true,voluntary:true,anonymous_notes:true,no_recording:true};
function learner(overrides:Record<string,unknown>={}) {
  return {kind:"learner",source:copy(source),pack_digest:PACK.pack_digest,origin:"synthetic_fixture",consent:copy(consent),participant:"F001",session:"S001",environment:{browser:"chrome",browser_version:"130.0",os:"windows",os_version:"11",input:"keyboard",screen_reader:"none",screen_reader_version:null,viewport:"wide",zoom_percent:200},role_key:PACK.cases[0].role_key,level:"foundation",task:"goal",outcome:"independent",duration_seconds:45,confidence:3,severity:"none",frictions:[],...overrides};
}
function specialist(overrides:Record<string,unknown>={}) {
  return {kind:"specialist",source:copy(source),pack_digest:PACK.pack_digest,origin:"synthetic_fixture",consent:copy(consent),reviewer:"FR001",expertise_attested:true,case_id:PACK.cases[0].id,brief_digest:PACK.cases[0].brief_digest,components:{task:"aligned",inputs:"aligned",deliverable:"aligned",rubric:"aligned",source_grounding:"aligned"},rubric_checks:[{criterion:0,judgement:"aligned"},{criterion:1,judgement:"aligned"}],question_checks:[{question_id:"fictional-foundation",judgement:"aligned"}],disposition:"usable_for_pilot",severity:"none",...overrides};
}
const bundle=(records:unknown[])=>({protocol:PILOT_VERSION,pack_digest:PACK.pack_digest,records});
const rejected=(rows:unknown[])=>assert.throws(()=>validateRecords(PACK,bundle(rows)),/Pilot validation stopped/);

test("pack binds all sixty fictional careers and both actual brief levels without pretending they are reviews",()=>{
  assert.equal(PACK.cases.length,120);assert.equal(new Set(PACK.cases.map(row=>row.role_key)).size,60);
  assert.equal(PACK.status,"human_validation_pending");assert.equal(validatePack(PACK).pack_digest,PACK.pack_digest);
  assert.deepEqual(PACK.cases[0].lesson_question_ids,["fictional-foundation","fictional-lesson-only"]);
  assert.ok(!PACK.cases[0].lesson_question_ids.includes("fictional-reference-only"));
  assert.ok(PACK.cases[0].eligible_question_ids.includes("fictional-lesson-only"));
  assert.ok(!PACK.cases[0].eligible_question_ids.includes("fictional-quarantined"));
  assert.ok(!PACK.cases[1].eligible_question_ids.includes("fictional-level-five"));
  const markdown=reviewerMarkdown(PACK);
  assert.equal((markdown.match(/^## Fictional role /gm)||[]).length,120);
  for(const text of ["Task:","Supplied fictional inputs","Deliverable","Rubric","Case source references","Current knowledge evidence","pending"])assert.ok(markdown.includes(text));
  const changed=copy(PACK);changed.cases[0].brief.instructions="Changed";assert.throws(()=>validatePack(changed),/pack_digest_mismatch/);
});

test("exact lesson bindings reject reference-only and wrong-stage bank injections even with recomputed pack digest",()=>{
  for(const id of ["fictional-reference-only","fictional-intermediate","fictional-quarantined"]) {
    const altered=copy(PACK);altered.resources[0].banks[0].foundation_ids.push(id);
    const {pack_digest:_,...body}=altered;altered.pack_digest=digest(body);
    assert.throws(()=>validatePack(altered),/invalid_lesson_evidence/);
  }
});

test("empty records and entirely fictional fixtures remain pending with zero human counts",()=>{
  const empty=aggregateRecords(PACK,emptyRecords(PACK));assert.equal(empty.status,"pending");assert.equal(empty.human_records,0);assert.equal(empty.pending_case_reviews,120);
  const fixtures=aggregateRecords(PACK,bundle([learner(),specialist()]));
  assert.equal(fixtures.status,"pending");assert.equal(fixtures.human_records,0);assert.equal(fixtures.fictional_records_excluded,2);assert.equal(fixtures.complete_case_reviews,0);assert.equal(fixtures.questions_reviewed,0);
  assert.deepEqual(fixtures.learner_outcomes,{independent:0,helped:0,abandoned:0,skipped:0});
  const templates=recordTemplates(PACK);assert.match(templates.notice,/NOT OBSERVATIONS/);
  rejected([templates.learner]);rejected([templates.specialist]);
});

test("fictional human-shaped records exercise coded counts without representing actual participants",()=>{
  const rows=[
    learner({origin:"human_observation",participant:"P001"}),
    learner({origin:"human_observation",participant:"P002",outcome:"helped",severity:"slows_progress",frictions:["navigation"]}),
    learner({origin:"human_observation",participant:"P003",outcome:"abandoned",severity:"blocks_completion",frictions:["keyboard_trap"]}),
    learner({origin:"human_observation",participant:"P004",outcome:"skipped",duration_seconds:null,confidence:null}),
    specialist({origin:"human_observation",reviewer:"R001"}),learner({participant:"F002"}),
  ];
  const report=aggregateRecords(PACK,bundle(rows));
  assert.deepEqual(report.learner_outcomes,{independent:1,helped:1,abandoned:1,skipped:1});assert.equal(report.learner_ids_supplied,4);assert.equal(report.specialist_ids_supplied,1);
  assert.equal(report.complete_case_reviews,1);assert.equal(report.pending_case_reviews,119);assert.equal(report.questions_reviewed,1);assert.equal(report.fictional_records_excluded,1);
  assert.equal(report.learner_severity.blocks_completion,1);assert.equal(report.friction_counts.navigation,1);
  assert.equal(report.status,"observations_recorded_human_validation_incomplete");assert.match(report.limitations,/not representative statistics/);
  const serialized=JSON.stringify(report);for(const text of ["P001","R001","F002","Fictional engineering question"])assert.ok(!serialized.includes(text));
});

test("unknown outcomes, task/career IDs, consent gaps, identity formats and stale source are rejected",()=>{
  const invalid=[
    learner({outcome:"passed"}),learner({task:"account_deletion"}),learner({role_key:"unknown-role"}),
    learner({participant:"person@example.org"}),learner({participant:"P001"}),learner({consent:{adult:true,voluntary:true}}),
    learner({consent:{...consent,adult:false}}),learner({consent:{...consent,anonymous_notes:false}}),
    learner({source:{...source,content_digest:"c".repeat(64)}}),learner({pack_digest:"c".repeat(64)}),
    learner({environment:{...learner().environment,input:"screen_reader"}}),learner({outcome:"skipped"}),
    learner({frictions:["navigation","navigation"],severity:"slows_progress"}),learner({severity:"blocks_completion"}),
  ];
  for(const row of invalid)rejected([row]);
  const missing=learner();delete (missing as Partial<typeof missing>).consent;rejected([missing]);
  rejected([learner(),learner()]);
  rejected([learner(),learner({task:"atlas",level:"intermediate"})]);
  assert.throws(()=>validateRecords(PACK,{...bundle([]),pack_digest:"c".repeat(64)}),/record_pack_mismatch/);
});

test("strict nested schemas reject email, secret, raw chat and profile field injection without echoing it",()=>{
  const sentinel="private-person@example.org sk_fictional_private_value";
  for(const row of [learner({email:sentinel}),learner({profile:{name:sentinel}}),learner({resume:sentinel}),learner({chat:sentinel}),learner({consent:{...consent,secret:sentinel}}),specialist({components:{...specialist().components,api_key:sentinel}}),learner({environment:{...learner().environment,browser_version:sentinel}})]) {
    assert.throws(()=>validateRecords(PACK,bundle([row])),(error:Error)=>{assert.ok(!error.message.includes(sentinel));assert.ok(!error.message.includes("example.org"));return true;});
  }
  assert.throws(()=>validateRecords(PACK,{...bundle([]),access_token:sentinel}));
});

test("specialist records reject stale cases, unreviewed rubrics, duplicates and unbound questions",()=>{
  for(const row of [
    specialist({case_id:"unknown-case"}),specialist({brief_digest:"c".repeat(64)}),specialist({expertise_attested:false}),specialist({rubric_checks:[]}),
    specialist({rubric_checks:[{criterion:0,judgement:"aligned"},{criterion:0,judgement:"aligned"}]}),
    specialist({rubric_checks:[{criterion:5,judgement:"aligned"}]}),specialist({components:{...specialist().components,task:"not_reviewed"}}),
    specialist({question_checks:[{question_id:"fictional-level-five",judgement:"aligned"}]}),specialist({question_checks:[{question_id:"fictional-foundation",judgement:"wrong_key"}]}),
    specialist({question_checks:[{question_id:"fictional-foundation",judgement:"aligned"},{question_id:"fictional-foundation",judgement:"aligned"}]}),
  ])rejected([row]);
  rejected([specialist(),specialist()]);
  assert.equal(validateRecords(PACK,bundle([specialist({disposition:"not_reviewed",rubric_checks:[],components:{task:"not_reviewed",inputs:"not_reviewed",deliverable:"not_reviewed",rubric:"not_reviewed",source_grounding:"not_reviewed"},question_checks:[]})])).records.length,1);
  assert.equal(validateRecords(PACK,bundle([specialist({question_checks:[{question_id:"fictional-lesson-only",judgement:"aligned"}]})])).records.length,1);
});

test("private paths refuse escape, overwrite, symlinks/junctions and hard-linked files",()=>{
  const temp=mkdtempSync(path.join(os.tmpdir(),"voidfill-pilot-test-"));
  try {
    assert.equal(spawnSync("git",["init","--quiet"],{cwd:temp,windowsHide:true}).status,0);
    writeFileSync(path.join(temp,".gitignore"),"ml/runtime/\n");
    createPrivateDirectory(temp,"ml/runtime/test-pack");
    writePrivateJson(temp,"ml/runtime/test-pack/records.json",{records:[]});
    assert.deepEqual(readPrivateJson(temp,"ml/runtime/test-pack/records.json"),{records:[]});
    for(const target of ["records.json","ml/runtime/../records.json","ml/runtime/test-pack/../escape.json","ml/runtime/test-pack/user@example.org.json","ml/runtime/test-pack/CON.json","ml\\runtime\\test.json"])assert.throws(()=>privatePath(temp,target));
    assert.throws(()=>writePrivateJson(temp,"ml/runtime/test-pack/records.json",{}),/overwrite_refused/);
    assert.throws(()=>createPrivateDirectory(temp,"ml/runtime/test-pack"),/overwrite_refused/);
    assert.throws(()=>readPrivateJson(temp,"ml/runtime/test-pack/records.json",1),/private_file_too_large/);
    const link=path.join(temp,"ml","runtime","test-pack","hard.json");linkSync(path.join(temp,"ml","runtime","test-pack","records.json"),link);
    assert.throws(()=>readPrivateJson(temp,"ml/runtime/test-pack/hard.json"),/linked_path_refused/);
    mkdirSync(path.join(temp,"outside"));symlinkSync(path.join(temp,"outside"),path.join(temp,"ml","runtime","alias"),process.platform==="win32"?"junction":"dir");
    assert.throws(()=>privatePath(temp,"ml/runtime/alias/new.json"),/linked_path_refused/);
  } finally {
    const resolved=path.resolve(temp);assert.ok(resolved.startsWith(path.resolve(os.tmpdir())+path.sep)&&path.basename(resolved).startsWith("voidfill-pilot-test-"));
    rmSync(resolved,{recursive:true,force:true});
  }
});

test("CLI help is offline and rejected record content never reaches stdout, stderr or a report",()=>{
  const root=fileURLToPath(new URL("../",import.meta.url));
  const help=spawnSync(process.execPath,["--import","tsx","scripts/pilot-validation.mjs","--help"],{cwd:root,encoding:"utf8",windowsHide:true});
  assert.equal(help.status,0);assert.match(help.stdout,/offline; no requests sent/);
  const relative=`ml/runtime/pilot-test-${process.pid}-${Date.now()}`;
  const absolute=createPrivateDirectory(root,relative);
  try {
    writePrivateJson(root,`${relative}/reviewer-pack.json`,PACK);
    writePrivateJson(root,`${relative}/bad-records.json`,bundle([learner({email:"private-person@example.org",secret:"sk_fictional_secret"})]));
    const run=(records:string,output:string)=>spawnSync(process.execPath,["--import","tsx","scripts/pilot-validation.mjs","summarize","--pack",`${relative}/reviewer-pack.json`,"--records",`${relative}/${records}`,"--output",`${relative}/${output}`],{cwd:root,encoding:"utf8",windowsHide:true});
    const bad=run("bad-records.json","bad-report.json");assert.equal(bad.status,1);assert.ok(!existsSync(path.join(absolute,"bad-report.json")));
    for(const sentinel of ["private-person","example.org","sk_fictional_secret","bad-records"])assert.ok(!(bad.stdout+bad.stderr).includes(sentinel));
    writePrivateJson(root,`${relative}/records.json`,emptyRecords(PACK));
    const okay=run("records.json","summary.json");assert.equal(okay.status,0);assert.equal(JSON.parse(okay.stdout).status,"pending");
    const repeated=run("records.json","summary.json");assert.equal(repeated.status,1);assert.match(repeated.stderr,/overwrite_refused/);
  } finally {
    const expected=path.resolve(root,"ml","runtime");assert.ok(absolute.startsWith(expected+path.sep)&&path.basename(absolute).startsWith("pilot-test-"));
    rmSync(absolute,{recursive:true,force:true});
  }
});

test("the task set explicitly excludes account recovery/deletion and actual mentor submission",()=>{
  assert.equal(TASK_CARDS.length,7);assert.ok(!TASK_CARDS.some(row=>/recovery|deletion/.test(row.id)));
  assert.match(TASK_CARDS.find(row=>row.id==="sharing_preview")!.prompt,/Stop before sharing/);
});
