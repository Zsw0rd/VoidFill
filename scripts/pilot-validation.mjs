#!/usr/bin/env node
/** Offline only. Invoke with node --import tsx; never imports a model or loads .env. */
import {createHash} from "node:crypto";
import {lstatSync, readFileSync, realpathSync, writeFileSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {spawnSync} from "node:child_process";
import {PilotError, LEVELS, TASK_CARDS, buildReviewPack, digest, emptyRecords, recordTemplates, aggregateRecords, createPrivateDirectory, privatePath, readPrivateJson, writePrivateJson, reviewerMarkdown, validatePack} from "../lib/pilotValidation.mjs";

const ROOT=realpathSync(fileURLToPath(new URL("../",import.meta.url)));
const HELP=`VoidFill anonymous pilot tools (offline; no requests sent)

node --import tsx scripts/pilot-validation.mjs prepare --output ml/runtime/pilot/<new-name>
  [--environment local_demo|preview_demo|production_own_account]
  [--deployment dpl_<id> --deployment-confirmed]
node --import tsx scripts/pilot-validation.mjs summarize
  --pack ml/runtime/pilot/<name>/reviewer-pack.json
  --records ml/runtime/pilot/<name>/records.json
  --output ml/runtime/pilot/<name>/<new-summary>.json

prepare generates the actual 60-career/two-level reviewer inventory, task cards,
empty records and intentionally incomplete templates. Human validation stays pending.
Hosted packs require clean source plus an operator-attested deployment ID; this tool
does not verify Vercel. All inputs/outputs must be git-ignored beneath ml/runtime.
Existing outputs, symlinks, hard-linked input files and unknown fields are refused.
summarize logs counts only. No contacts, accounts, production writes or analytics.
`;
const fail=code=>{throw new PilotError(code);};
function args(argv) {
  if(argv.length===1&&["--help","-h"].includes(argv[0]))return {command:"help"};
  const [command,...tail]=argv;
  if(!["prepare","summarize"].includes(command))fail("invalid_command");
  const permitted=command==="prepare"?["output","environment","deployment","deployment-confirmed"]:["pack","records","output"];
  const result={command};
  for(let i=0;i<tail.length;i++) {
    const flag=tail[i];
    if(!flag.startsWith("--")||!permitted.includes(flag.slice(2))||Object.hasOwn(result,flag.slice(2)))fail("invalid_arguments");
    if(flag==="--deployment-confirmed")result[flag.slice(2)]=true;
    else {if(!tail[i+1]||tail[i+1].startsWith("--"))fail("invalid_arguments");result[flag.slice(2)]=tail[++i];}
  }
  if(!result.output || (command==="summarize"&&(!result.pack||!result.records)))fail("missing_arguments");
  return result;
}
function git(argv) {
  const result=spawnSync("git",argv,{cwd:ROOT,encoding:"utf8",windowsHide:true,maxBuffer:4*1024*1024});
  if(result.status!==0)fail("source_git_unavailable");
  return result.stdout;
}
// Fixed public source scope. No .env, runtime, downloads, auth data or backup/ reads.
const SCOPE=["app","components","lib","public","ml/data","ml/lessons","ml/service.py","ml/career_catalogue.py","ml/assessment_selection.py","ml/resource_scopes.py","ml/lesson_coverage.py","ml/lesson_validation.py","ml/lesson_questions.py","ml/cloud-release.json","supabase/migration-manifest.json","supabase/migrations/20261110130000_resource_progress_scope.sql","supabase/migrations/20261110130100_ungraded_resource_seed.sql","package.json","package-lock.json","tsconfig.json","scripts/pilot-validation.mjs","docs/LEARNER_PILOT.md"];
function sourceBinding(options) {
  const revision=git(["rev-parse","HEAD"]).trim();
  const paths=[...new Set(git(["ls-files","-z","--cached","--others","--exclude-standard","--",...SCOPE]).split("\0").filter(Boolean))].sort();
  const tree=createHash("sha256");
  for(const relative of paths) {
    if(relative.split("/").some(part=>part===".."||part.startsWith(".env"))||relative.includes("runtime/"))fail("invalid_source_path");
    const absolute=path.resolve(ROOT,relative),stat=lstatSync(absolute);
    if(!stat.isFile()||stat.isSymbolicLink()||stat.nlink!==1||realpathSync(absolute)!==absolute)fail("linked_source_refused");
    const raw=readFileSync(absolute);
    // JSON content, text LF and binary bytes bind the actual served source, across CRLF checkouts.
    const bytes=relative.endsWith(".json")?Buffer.from(digest(JSON.parse(raw.toString("utf8")))):/\.(ts|tsx|js|mjs|mts|py|css|svg|md)$/.test(relative)?Buffer.from(raw.toString("utf8").replace(/\r\n/g,"\n")):raw;
    tree.update(relative+"\0").update(createHash("sha256").update(bytes).digest()).update("\n");
  }
  const dirty=git(["status","--porcelain","--untracked-files=all","--",...SCOPE]).trim().length>0;
  const environment=options.environment||"local_demo";
  if(!["local_demo","preview_demo","production_own_account"].includes(environment))fail("invalid_environment");
  if(environment==="local_demo"&&(options.deployment||options["deployment-confirmed"]))fail("invalid_local_binding");
  if(environment!=="local_demo"&&(dirty||!/^dpl_[A-Za-z0-9]{12,80}$/.test(options.deployment||"")||!options["deployment-confirmed"]))fail("hosted_binding_requires_clean_attestation");
  return {revision,content_digest:tree.digest("hex"),state:dirty?"working_tree":"committed",environment,deployment:options.deployment||"local",deployment_binding:environment==="local_demo"?"local_source":"operator_attested"};
}

// This invokes selection/coverage metadata only; no model, embeddings, network or .env.
const PYTHON_EVIDENCE=String.raw`
import json
from ml.career_catalogue import load_learning_content, CATALOGUE
from ml.assessment_selection import question_in_skill_scope, question_resource_ids
from ml.lesson_coverage import audit_coverage
from ml.resource_scopes import guide_only_question_ids
from ml.service import load_question_exclusions
resources, questions = load_learning_content()
excluded = load_question_exclusions(questions) | guide_only_question_ids(resources, questions)
report = audit_coverage(resources, questions, excluded)
topics = sorted({skill['topic'] for skill in CATALOGUE['skills'] if skill.get('topic')})
skill_banks = {}
for topic in topics:
    rows = [q for q in questions if q['id'] not in excluded and topic in q['topics'] and question_in_skill_scope(q, topic)]
    skill_banks[topic] = {'foundation': [q['id'] for q in rows if q['difficulty'] <= 2], 'intermediate': [q['id'] for q in rows if q['difficulty'] == 3]}
public_questions = []
for q in questions:
    public_questions.append({'id': q['id'], 'prompt': q['prompt'], 'options': q['options'], 'correct_index': q['correct_index'], 'explanation': q['explanation'], 'difficulty': q['difficulty'], 'topics': q['topics'], 'resource_ids': sorted(question_resource_ids(q)), 'source_url': q.get('source_url') or None, 'source': q.get('source', ''), 'objective_id': q.get('objective_id'), 'lesson_scope': q.get('lesson_scope')})
public_resources = []
for r in report['resources']:
    public_resources.append({key:r[key] for key in ['id','title','url','provider','topics','selection_status']} | {'banks': [{key:bank[key] for key in ['topic','foundation_ids','intermediate_ids']} for bank in r['banks']]})
print(json.dumps({'questions':public_questions,'resources':public_resources,'skill_banks':skill_banks,'excluded_question_ids':sorted(excluded)}, ensure_ascii=True))
`;
function evidence() {
  const python=path.join(ROOT,process.platform==="win32"?".venv-ml/Scripts/python.exe":".venv-ml/bin/python");
  let stat;try{stat=lstatSync(python);}catch{fail("project_python_required");}
  if(!stat.isFile())fail("project_python_required");
  const result=spawnSync(python,["-c",PYTHON_EVIDENCE],{cwd:ROOT,encoding:"utf8",windowsHide:true,maxBuffer:32*1024*1024,timeout:60000,env:{...process.env,PYTHONDONTWRITEBYTECODE:"1"}});
  if(result.status!==0)fail("content_evidence_unavailable");
  try{return JSON.parse(result.stdout);}catch{fail("content_evidence_invalid");}
}
function writeText(relative,text) {
  const target=privatePath(ROOT,relative);
  try{writeFileSync(target,text,{flag:"wx",mode:0o600});}catch{fail("private_write_refused");}
}
async function main() {
  const options=args(process.argv.slice(2));
  if(options.command==="help"){process.stdout.write(HELP);return;}
  if(options.command==="prepare") {
    // Preflight output before source imports or directory creation.
    privatePath(ROOT,options.output);
    const before=sourceBinding(options);
    const {careerCatalogue}=await import("../lib/careerCatalog.ts");
    const {practicalBrief}=await import("../lib/practical.ts");
    const briefs=careerCatalogue.roles.flatMap(role=>LEVELS.map(level=>practicalBrief(role.id,level)));
    const pack=buildReviewPack({source:before,catalogue:careerCatalogue,briefs,evidence:evidence()});
    if(digest(before)!==digest(sourceBinding(options)))fail("source_changed_during_prepare");
    const markdown=reviewerMarkdown(pack);
    createPrivateDirectory(ROOT,options.output);
    const output=name=>`${options.output}/${name}`;
    writePrivateJson(ROOT,output("reviewer-pack.json"),pack);
    writePrivateJson(ROOT,output("records.json"),emptyRecords(pack));
    writePrivateJson(ROOT,output("record-templates.json"),recordTemplates(pack));
    writePrivateJson(ROOT,output("summary-pending.json"),aggregateRecords(pack,emptyRecords(pack)));
    writeText(output("reviewer-pack.md"),markdown);
    writeText(output("task-cards.md"),[
      "# Anonymous learner task cards", "", "Human validation pending. No sessions run. Use consenting adults and fictional case content, preferably in a disposable demo. No account recovery/deletion tasks. No actual mentor submission. Pause observation during authentication; do not capture names, emails, passwords, resumes, chat, contact details or private work. No recordings are needed or accepted by these records.", "", `Source ${pack.source.revision}; content ${pack.source.content_digest}; pack ${pack.pack_digest}.`, "", "Before starting: explain voluntary participation, stopping/skipping rights and anonymous coded notes. Record consent only after it is given. Verify the environment matches the pack; hosted deployment binding is operator-attested, not checked by the tool. Never use production for intentional refresh/network failure tests; use disposable demos. Production own-account tasks can save a normal assessment only after separate informed agreement; this protocol does not grant account or data permissions.", "", ...TASK_CARDS.flatMap(task=>[`## ${task.id}`, "", task.prompt, "", `Observe: ${task.observe}`, ""]),
      "Record one coded observation per participant/session/task. P001 etc. are anonymous labels, not account identifiers. Use independent/helped/abandoned/skipped. A skipped task has no duration/confidence. Durations exclude authentication and voluntary breaks. Record coded friction/severity; omit all private quotations or free text. If a field does not fit, leave the observation out and revise the protocol separately instead of inserting private content.", "", "Specialist review: R001 etc.; attest relevant field expertise without collecting a CV/name/contact. Each career and level has its actual task, inputs, deliverable, rubric and source links in the reviewer pack. Record pending/not_reviewed honestly. Neither this template nor a fixture is a review result.", "",
    ].join("\n"));
    process.stdout.write(JSON.stringify({status:"pending",case_packs:pack.cases.length,careers:new Set(pack.cases.map(row=>row.role_key)).size,questions:pack.questions.length,resources:pack.resources.length,human_records:0})+"\n");
  } else {
    privatePath(ROOT,options.output);
    const pack=validatePack(readPrivateJson(ROOT,options.pack));
    const summary=aggregateRecords(pack,readPrivateJson(ROOT,options.records,4*1024*1024));
    writePrivateJson(ROOT,options.output,summary);
    process.stdout.write(JSON.stringify({status:summary.status,human_records:summary.human_records,fictional_records_excluded:summary.fictional_records_excluded,pending_case_reviews:summary.pending_case_reviews})+"\n");
  }
}
main().catch(error=>{
  const code=error instanceof PilotError?error.code:"internal_error";
  process.stderr.write(`Pilot validation stopped (${code}). No record content logged.\n`);
  process.exitCode=1;
});
