/** Offline, anonymous pilot records. No network, accounts or participant collection. */
import {createHash} from "node:crypto";
import {constants, fstatSync, lstatSync, mkdirSync, openSync, closeSync, readFileSync, realpathSync, writeFileSync} from "node:fs";
import path from "node:path";
import {spawnSync} from "node:child_process";
import {z} from "zod";

export const PILOT_VERSION = "voidfill-pilot-1";
export const LEVELS = ["foundation", "intermediate"];
export const OUTCOMES = ["independent", "helped", "abandoned", "skipped"];
export const SEVERITIES = ["none", "preference", "slows_progress", "causes_mistake", "blocks_completion"];
export const FRICTIONS = ["navigation", "coverage_boundary", "unclear_label", "focus_lost", "keyboard_trap", "layout_overflow", "error_recovery", "work_lost", "sharing_expectation", "announcement_missing", "motion_discomfort", "target_size", "slow_response"];
export const TASK_CARDS = [
  {id:"goal", prompt:"Choose a career or enter a fictional personal goal. Explain which skills are supported and any coverage boundary.", observe:"Distinguish suggestions, chosen direction and unsupported skills."},
  {id:"atlas", prompt:"Find the next learning step and open its resource. Explain what comes before it.", observe:"Starting point, prerequisites and resource destination."},
  {id:"assessment_resume", prompt:"In a disposable demo, begin a check, select answers, refresh and return to the same check.", observe:"Same attempt and answers; recovery without duplicate work."},
  {id:"feedback", prompt:"Finish that demo check and explain its feedback and what to do next.", observe:"Distinguish knowledge feedback and XP from unvalidated professional readiness."},
  {id:"practical_private", prompt:"Save a private practical draft using only the supplied fictional case. Return to it.", observe:"Save status, recovery and understanding of private draft visibility."},
  {id:"sharing_preview", prompt:"Inspect how mentor sharing works and explain who would see a submission. Stop before sharing.", observe:"Consent, assigned mentor and private-versus-shared expectations; no real submission."},
  {id:"signout_return", prompt:"Sign out of the disposable demo and return. Explain which saved work remains.", observe:"Saved progress and removal of the prior session's private surface."},
];

// Messages deliberately never interpolate an invalid field, path, record or upstream error.
export class PilotError extends Error {
  constructor(code) { super(`Pilot validation stopped (${code}). No record content logged.`); this.name="PilotError"; this.code=code; }
}
const fail = code => { throw new PilotError(code); };
const strict = shape => z.object(shape).strict();
const hash = z.string().regex(/^[a-f0-9]{64}$/);
const key = z.string().regex(/^[a-z0-9][a-z0-9_-]{0,99}$/);
const publicText = z.string().min(1).max(20000);
const version = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9./_-]{0,159}$/);
const publicUrl = z.string().max(2000).refine(value => {
  try {const url=new URL(value); return url.protocol==="https:" && !url.username && !url.password && !/[\s@]/.test(url.hostname) && url.hostname.includes(".");} catch {return false;}
});
const sourceSchema = strict({
  revision:z.string().regex(/^[a-f0-9]{40}$/), content_digest:hash,
  state:z.enum(["committed", "working_tree"]),
  environment:z.enum(["local_demo", "preview_demo", "production_own_account"]),
  deployment:z.union([z.literal("local"), z.string().regex(/^dpl_[A-Za-z0-9]{12,80}$/)]),
  deployment_binding:z.enum(["local_source", "operator_attested"]),
});
const briefSchema = strict({
  version, role_id:z.string().uuid(), role_name:publicText, role_key:key, level:z.enum(LEVELS),
  title:publicText, instructions:publicText, deliverable:publicText, rubric:z.array(publicText).min(1).max(20), note:publicText,
  case_inputs:z.array(publicText).min(1).max(50), case_sources:z.array(strict({title:publicText,url:publicUrl})).min(1).max(30),
});
const bankSchema = strict({topic:key, foundation_ids:z.array(key).max(5000), intermediate_ids:z.array(key).max(5000)});
const resourceSchema = strict({id:key,title:publicText,url:publicUrl,provider:z.string().max(500),topics:z.array(key).min(1).max(30),selection_status:z.enum(["both_stages","foundation_only","intermediate_only","partial_topics","missing","ungraded_guide"]),banks:z.array(bankSchema).max(30)});
const questionSchema = strict({id:key,prompt:publicText,options:z.array(publicText).min(2).max(10),correct_index:z.number().int().min(0).max(9),explanation:publicText,difficulty:z.number().int().min(1).max(5),topics:z.array(key).min(1).max(30),resource_ids:z.array(key).max(50),source_url:publicUrl.nullable(),source:z.string().max(2000),objective_id:key.nullable(),lesson_scope:z.string().max(20000).nullable()});
const caseSchema = strict({id:key,role_id:z.string().uuid(),role_key:key,family:key,level:z.enum(LEVELS),brief:briefSchema,brief_digest:hash,requirements:z.array(strict({skill:key,name:publicText,topic:key.nullable(),assessment_mode:z.enum(["objective","review"])})).min(1).max(100),topic_banks:z.array(strict({topic:key,question_ids:z.array(key).max(5000),resource_ids:z.array(key).max(5000)})).max(100),lesson_question_ids:z.array(key).max(10000),eligible_question_ids:z.array(key).max(10000)});
const packSchema = strict({
  protocol:z.literal(PILOT_VERSION), status:z.literal("human_validation_pending"), source:sourceSchema,
  catalogue_version:version, cases:z.array(caseSchema).length(120),
  tasks:z.array(strict({id:key,prompt:publicText,observe:publicText})).length(TASK_CARDS.length),
  questions:z.array(questionSchema).max(20000), resources:z.array(resourceSchema).max(5000),
  excluded_question_ids:z.array(key).max(1000), pack_digest:hash,
});
const consent = strict({adult:z.literal(true),voluntary:z.literal(true),anonymous_notes:z.literal(true),no_recording:z.literal(true)});
const environment = strict({
  browser:z.enum(["chrome","edge","firefox","safari","other"]), browser_version:z.string().regex(/^\d{1,4}(\.\d{1,6}){0,3}$/),
  os:z.enum(["windows","macos","linux","android","ios","other"]), os_version:z.string().regex(/^\d{1,4}(\.\d{1,6}){0,3}$/).nullable(), input:z.enum(["keyboard","pointer","touch","screen_reader"]),
  screen_reader:z.enum(["none","nvda","jaws","voiceover","talkback","other"]),
  screen_reader_version:z.string().regex(/^\d{1,4}(\.\d{1,6}){0,3}$/).nullable(),
  viewport:z.enum(["narrow","medium","wide"]), zoom_percent:z.number().int().min(50).max(500),
});
const binding = {source:sourceSchema,pack_digest:hash,origin:z.enum(["human_observation","synthetic_fixture"]),consent};
const learnerSchema = strict({
  kind:z.literal("learner"),...binding,participant:z.string().regex(/^(P|F)\d{3}$/),session:z.string().regex(/^S\d{3}$/),environment,
  role_key:key,level:z.enum(LEVELS),task:z.enum(TASK_CARDS.map(task=>task.id)),outcome:z.enum(OUTCOMES),
  duration_seconds:z.number().int().min(0).max(7200).nullable(),confidence:z.number().int().min(1).max(5).nullable(),
  severity:z.enum(SEVERITIES),frictions:z.array(z.enum(FRICTIONS)).max(FRICTIONS.length),
});
const judgement = z.enum(["aligned","needs_revision","not_reviewed"]);
const reviewSchema = strict({
  kind:z.literal("specialist"),...binding,reviewer:z.string().regex(/^(R|FR)\d{3}$/),expertise_attested:z.literal(true),
  case_id:key,brief_digest:hash,
  components:strict({task:judgement,inputs:judgement,deliverable:judgement,rubric:judgement,source_grounding:judgement}),
  rubric_checks:z.array(strict({criterion:z.number().int().min(0).max(19),judgement})).max(20),
  question_checks:z.array(strict({question_id:key,judgement:z.enum(["aligned","wrong_key","ambiguous","out_of_scope","needs_revision","not_reviewed"])})).max(10000),
  disposition:z.enum(["usable_for_pilot","revise","not_reviewed"]),severity:z.enum(SEVERITIES),
});
const bundleSchema = strict({protocol:z.literal(PILOT_VERSION),pack_digest:hash,records:z.array(z.discriminatedUnion("kind",[learnerSchema,reviewSchema])).max(10000)});
const parse = (schema,value,code="invalid_schema") => {const parsed=schema.safeParse(value); if(!parsed.success)fail(code); return parsed.data;};
const unique = values => new Set(values).size === values.length;
export function canonical(value) {
  if(Array.isArray(value))return `[${value.map(canonical).join(",")}]`;
  if(value!==null && typeof value==="object")return `{${Object.keys(value).sort().map(k=>JSON.stringify(k)+":"+canonical(value[k])).join(",")}}`;
  return JSON.stringify(value);
}
export function digest(value) {return createHash("sha256").update(canonical(value)).digest("hex");}

export function validatePack(value) {
  // Fixed section codes aid source maintenance without echoing invalid keys or values.
  if(value && typeof value==="object") {
    parse(z.array(questionSchema).max(20000),value.questions,"invalid_pack_questions");
    parse(z.array(resourceSchema).max(5000),value.resources,"invalid_pack_resources");
    parse(z.array(caseSchema).length(120),value.cases,"invalid_pack_cases");
  }
  const pack=parse(packSchema,value,"invalid_pack");
  const {pack_digest,...body}=pack;
  if(digest(body)!==pack_digest)fail("pack_digest_mismatch");
  if(pack.source.environment==="local_demo"?(pack.source.deployment!=="local"||pack.source.deployment_binding!=="local_source"):(pack.source.deployment==="local"||pack.source.deployment_binding!=="operator_attested"||pack.source.state!=="committed"))fail("invalid_deployment_binding");
  if(!unique(pack.cases.map(row=>row.id)) || new Set(pack.cases.map(row=>row.role_key)).size!==60 || !unique(pack.questions.map(row=>row.id)) || !unique(pack.resources.map(row=>row.id)))fail("duplicate_pack_ids");
  if(canonical(pack.tasks)!==canonical(TASK_CARDS))fail("task_binding_mismatch");
  const questions=new Map(pack.questions.map(row=>[row.id,row]));
  const resources=new Map(pack.resources.map(row=>[row.id,row]));
  const excluded=new Set(pack.excluded_question_ids);
  if(!unique(pack.excluded_question_ids)||pack.excluded_question_ids.some(id=>!questions.has(id)))fail("invalid_exclusions");
  for(const question of pack.questions)if(question.correct_index>=question.options.length || question.resource_ids.some(id=>!resources.has(id)))fail("invalid_question_evidence");
  for(const resource of pack.resources) {
    if(!unique(resource.banks.map(bank=>bank.topic)) || canonical([...resource.topics].sort())!==canonical(resource.banks.map(bank=>bank.topic).sort()))fail("invalid_resource_topics");
    for(const bank of resource.banks)for(const level of LEVELS) {
      const ids=bank[`${level}_ids`];
      if(!unique(ids))fail("duplicate_lesson_question_ids");
      const linkedResources=new Set(pack.resources.filter(row=>row.url===resource.url&&row.topics.includes(bank.topic)).map(row=>row.id));
      for(const id of ids) {
        const question=questions.get(id);
        if(!question||excluded.has(id)||!question.topics.includes(bank.topic)||!question.resource_ids.some(ref=>linkedResources.has(ref))||(level==="foundation"?question.difficulty>2:question.difficulty!==3))fail("invalid_lesson_evidence");
      }
      const linked = resource.selection_status === "ungraded_guide" ? [] : pack.questions.filter(question => question.topics.includes(bank.topic) && question.resource_ids.some(ref => linkedResources.has(ref)));
      const reviewed = linked.filter(question => question.id.startsWith("lesson-"));
      const expected = (reviewed.length ? reviewed : linked)
        .filter(question => !excluded.has(question.id) && (level === "foundation" ? question.difficulty <= 2 : question.difficulty === 3))
        .map(question => question.id).sort();
      if(canonical(expected)!==canonical([...ids].sort()))fail("incomplete_lesson_evidence");
    }
  }
  for(const row of pack.cases) {
    if(row.id!==`${row.role_key}-${row.level}` || row.role_key!==row.brief.role_key || row.role_id!==row.brief.role_id || row.level!==row.brief.level || row.brief_digest!==digest(row.brief))fail("case_binding_mismatch");
    if(!unique(row.eligible_question_ids) || row.eligible_question_ids.some(id=>!questions.has(id)||excluded.has(id)))fail("invalid_case_questions");
    if(!unique(row.topic_banks.map(bank=>bank.topic)))fail("duplicate_topic_banks");
    if(canonical([...new Set(row.requirements.map(item=>item.topic).filter(Boolean))].sort())!==canonical(row.topic_banks.map(bank=>bank.topic).sort()))fail("case_topic_mismatch");
    for(const bank of row.topic_banks) {
      if(!unique(bank.question_ids) || !unique(bank.resource_ids))fail("duplicate_bank_ids");
      for(const id of bank.question_ids) {
        const question=questions.get(id);
        if(!question || excluded.has(id) || !question.topics.includes(bank.topic) || (row.level==="intermediate"?question.difficulty!==3:question.difficulty>2))fail("invalid_topic_evidence");
      }
      if(bank.resource_ids.some(id=>!resources.get(id)?.topics.includes(bank.topic)))fail("invalid_resource_evidence");
      if(canonical([...bank.resource_ids].sort())!==canonical(pack.resources.filter(item=>item.topics.includes(bank.topic)).map(item=>item.id).sort()))fail("incomplete_resource_evidence");
    }
    const topics=new Set(row.topic_banks.map(bank=>bank.topic));
    const lessonIds=[...new Set(pack.resources.flatMap(resource=>resource.banks.filter(bank=>topics.has(bank.topic)).flatMap(bank=>bank[`${row.level}_ids`])))].sort();
    if(canonical(lessonIds)!==canonical([...row.lesson_question_ids].sort()))fail("case_lesson_union_mismatch");
    if(canonical([...new Set([...row.topic_banks.flatMap(bank=>bank.question_ids),...lessonIds])].sort())!==canonical([...row.eligible_question_ids].sort()))fail("case_question_union_mismatch");
  }
  const roleIds=new Set();
  for(const role of new Set(pack.cases.map(row=>row.role_key))) {
    const rows=pack.cases.filter(row=>row.role_key===role);
    if(LEVELS.some(level=>!rows.some(row=>row.level===level)))fail("missing_case_level");
    if(new Set(rows.map(row=>row.role_id)).size!==1||new Set(rows.map(row=>row.family)).size!==1||new Set(rows.map(row=>row.brief.role_name)).size!==1||roleIds.has(rows[0].role_id))fail("role_binding_mismatch");
    roleIds.add(rows[0].role_id);
  }
  return pack;
}

/** Briefs come from the app's practicalBrief(), banks from the Python serving helpers. */
export function buildReviewPack({source,catalogue,briefs,evidence}) {
  parse(sourceSchema,source);
  if(catalogue.roles?.length!==60 || briefs.length!==120)fail("career_count_mismatch");
  const skills=new Map(catalogue.skills.map(row=>[row.key,row]));
  const cases=briefs.map(brief=>{
    const role=catalogue.roles.find(row=>row.id===brief.role_id);
    if(!role)fail("unknown_brief_role");
    const requirements=role.requirements.map(row=>{const skill=skills.get(row.skill);if(!skill)fail("unknown_skill");return {skill:skill.key,name:skill.name,topic:skill.topic,assessment_mode:skill.assessment_mode};});
    const topics=[...new Set(requirements.map(row=>row.topic).filter(Boolean))];
    const topic_banks=topics.map(topic=>({topic,question_ids:evidence.skill_banks[topic]?.[brief.level]||[],resource_ids:evidence.resources.filter(row=>row.topics.includes(topic)).map(row=>row.id)}));
    const lesson_question_ids=[...new Set(evidence.resources.flatMap(resource=>resource.banks.filter(bank=>topics.includes(bank.topic)).flatMap(bank=>bank[`${brief.level}_ids`])))].sort();
    return {id:`${role.key}-${brief.level}`,role_id:role.id,role_key:role.key,family:role.family,level:brief.level,brief,brief_digest:digest(brief),requirements,topic_banks,lesson_question_ids,eligible_question_ids:[...new Set([...topic_banks.flatMap(row=>row.question_ids),...lesson_question_ids])].sort()};
  });
  const body={protocol:PILOT_VERSION,status:"human_validation_pending",source,catalogue_version:catalogue.version,cases,tasks:TASK_CARDS,questions:evidence.questions,resources:evidence.resources,excluded_question_ids:evidence.excluded_question_ids};
  return validatePack({...body,pack_digest:digest(body)});
}

export function validateRecords(packValue,value) {
  const pack=validatePack(packValue);
  const bundle=parse(bundleSchema,value);
  if(bundle.pack_digest!==pack.pack_digest)fail("record_pack_mismatch");
  const cases=new Map(pack.cases.map(row=>[row.id,row]));
  const roles=new Set(pack.cases.map(row=>row.role_key));
  const seen=new Set();
  const sessions=new Map();
  for(const row of bundle.records) {
    if(row.pack_digest!==pack.pack_digest || canonical(row.source)!==canonical(pack.source))fail("record_source_mismatch");
    const human=row.origin==="human_observation";
    if(row.kind==="learner") {
      if(!row.participant.startsWith(human?"P":"F"))fail("origin_id_mismatch");
      if(row.role_key!=="personal_goal"&&!roles.has(row.role_key))fail("unknown_role");
      if(!unique(row.frictions) || (row.severity==="none")!==(row.frictions.length===0))fail("friction_severity_mismatch");
      if(row.outcome==="skipped"&&(row.duration_seconds!==null||row.confidence!==null))fail("skipped_measurement");
      if(row.environment.input==="screen_reader" && row.environment.screen_reader==="none")fail("missing_assistive_environment");
      if((row.environment.screen_reader==="none")!==(row.environment.screen_reader_version===null))fail("assistive_version_mismatch");
      const session=`${row.participant}:${row.session}`;
      const context=canonical({environment:row.environment,role_key:row.role_key,level:row.level,origin:row.origin});
      if(sessions.has(session)&&sessions.get(session)!==context)fail("session_context_mismatch");
      sessions.set(session,context);
      const id=`learner:${session}:${row.task}`;
      if(seen.has(id))fail("duplicate_observation");seen.add(id);
    } else {
      if(!row.reviewer.startsWith(human?"R":"FR"))fail("origin_id_mismatch");
      const target=cases.get(row.case_id);
      if(!target || target.brief_digest!==row.brief_digest)fail("unknown_or_stale_case");
      if(!unique(row.rubric_checks.map(check=>check.criterion)) || row.rubric_checks.some(check=>check.criterion>=target.brief.rubric.length))fail("invalid_rubric_reference");
      if(!unique(row.question_checks.map(check=>check.question_id)) || row.question_checks.some(check=>!target.eligible_question_ids.includes(check.question_id)))fail("invalid_question_reference");
      if(row.disposition==="usable_for_pilot" && (Object.values(row.components).some(item=>item!=="aligned") || row.rubric_checks.length!==target.brief.rubric.length || row.rubric_checks.some(check=>check.judgement!=="aligned") || row.question_checks.some(check=>!["aligned","not_reviewed"].includes(check.judgement)) || row.severity!=="none"))fail("unsupported_review_disposition");
      const id=`specialist:${row.reviewer}:${row.case_id}`;
      if(seen.has(id))fail("duplicate_review");seen.add(id);
    }
  }
  return bundle;
}

export function aggregateRecords(packValue,value) {
  const pack=validatePack(packValue),bundle=validateRecords(pack,value);
  const human=bundle.records.filter(row=>row.origin==="human_observation");
  const learners=human.filter(row=>row.kind==="learner"), reviewers=human.filter(row=>row.kind==="specialist");
  const count=(rows,field,keys)=>Object.fromEntries(keys.map(key=>[key,rows.filter(row=>row[field]===key).length]));
  const reviewedQuestions=new Set(reviewers.flatMap(row=>row.question_checks.filter(check=>check.judgement!=="not_reviewed").map(check=>check.question_id)));
  const reviewedCases=new Set(reviewers.filter(row=>row.disposition!=="not_reviewed"&&Object.values(row.components).every(value=>value!=="not_reviewed")&&row.rubric_checks.length===pack.cases.find(item=>item.id===row.case_id).brief.rubric.length&&row.rubric_checks.every(check=>check.judgement!=="not_reviewed")).map(row=>row.case_id));
  return {
    protocol:PILOT_VERSION,source:pack.source,pack_digest:pack.pack_digest,
    status:human.length?"observations_recorded_human_validation_incomplete":"pending",
    limitations:"Supplied anonymous IDs and operator-attested observations only; identity, expertise, deployment and consent are not independently verified. Counts are not representative statistics, difficulty calibration, professional-readiness validation or accessibility certification. Fictional fixtures never count as participants. No study was run by this tool.",
    human_records:human.length,fictional_records_excluded:bundle.records.length-human.length,
    learner_ids_supplied:new Set(learners.map(row=>row.participant)).size,learner_sessions:new Set(learners.map(row=>`${row.participant}:${row.session}`)).size,
    learner_outcomes:count(learners,"outcome",OUTCOMES),learner_severity:count(learners,"severity",SEVERITIES),
    friction_counts:Object.fromEntries(FRICTIONS.map(code=>[code,learners.filter(row=>row.frictions.includes(code)).length])),
    tasks:TASK_CARDS.map(task=>({task:task.id,records:learners.filter(row=>row.task===task.id).length,outcomes:count(learners.filter(row=>row.task===task.id),"outcome",OUTCOMES)})),
    specialist_ids_supplied:new Set(reviewers.map(row=>row.reviewer)).size,specialist_records:reviewers.length,
    specialist_severity:count(reviewers,"severity",SEVERITIES),specialist_dispositions:count(reviewers,"disposition",["usable_for_pilot","revise","not_reviewed"]),
    complete_case_reviews:reviewedCases.size,total_case_packs:pack.cases.length,pending_case_reviews:pack.cases.length-reviewedCases.size,
    questions_reviewed:reviewedQuestions.size,eligible_questions:new Set(pack.cases.flatMap(row=>row.eligible_question_ids)).size,
    question_findings:count(reviewers.flatMap(row=>row.question_checks),"judgement",["aligned","wrong_key","ambiguous","out_of_scope","needs_revision","not_reviewed"]),
  };
}

export function emptyRecords(pack) {return {protocol:PILOT_VERSION,pack_digest:validatePack(pack).pack_digest,records:[]};}
export function recordTemplates(packValue) {
  const pack=validatePack(packValue),target=pack.cases[0];
  const base={source:pack.source,pack_digest:pack.pack_digest,origin:"human_observation",consent:{adult:false,voluntary:false,anonymous_notes:false,no_recording:true}};
  return {notice:"UNCOMPLETED TEMPLATES, NOT OBSERVATIONS. False consent and placeholder IDs intentionally fail ingestion. Copy only after voluntary adult consent; do not add private free text.",
    learner:{kind:"learner",...base,participant:"P___",session:"S___",environment:{browser:"chrome",browser_version:"REPLACE",os:"windows",os_version:null,input:"keyboard",screen_reader:"none",screen_reader_version:null,viewport:"wide",zoom_percent:100},role_key:target.role_key,level:target.level,task:"goal",outcome:"REPLACE",duration_seconds:null,confidence:null,severity:"none",frictions:[]},
    specialist:{kind:"specialist",...base,reviewer:"R___",expertise_attested:false,case_id:target.id,brief_digest:target.brief_digest,components:{task:"not_reviewed",inputs:"not_reviewed",deliverable:"not_reviewed",rubric:"not_reviewed",source_grounding:"not_reviewed"},rubric_checks:[],question_checks:[],disposition:"not_reviewed",severity:"none"},
  };
}

/** Every path stays below git-ignored ml/runtime. Refuse links, aliases and overwrites. */
export function privatePath(root,relative,{existing=false,directory=false}={}) {
  if(typeof relative!=="string" || path.isAbsolute(relative) || relative.includes("\\") || !/^ml\/runtime\/[a-zA-Z0-9_-][a-zA-Z0-9_./-]*$/.test(relative))fail("private_path_required");
  const segments=relative.split("/");
  if(segments.some(part=>!part||part==="."||part===".."||part.endsWith(".")||/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i.test(part)))fail("unsafe_path_segment");
  const base=realpathSync(root),target=path.resolve(base,...segments);
  if(!target.startsWith(path.join(base,"ml","runtime")+path.sep))fail("private_path_required");
  let cursor=base;
  for(let i=0;i<segments.length;i++) {
    cursor=path.join(cursor,segments[i]);
    let stat;try{stat=lstatSync(cursor);}catch(error){if(error.code!=="ENOENT")fail("path_unavailable");continue;}
    if(stat.isSymbolicLink() || (!stat.isDirectory()&&stat.nlink!==1) || realpathSync(cursor)!==cursor)fail("linked_path_refused");
    if(i<segments.length-1&&!stat.isDirectory())fail("invalid_path_parent");
    if(i===segments.length-1) {
      if(!existing)fail("overwrite_refused");
      if(directory?!stat.isDirectory():!stat.isFile())fail("invalid_path_type");
    }
  }
  // Git can reject paths through symlinks before applying ignore rules.
  // Inspect the path first so links have the same diagnostic on both platforms.
  const ignored=spawnSync("git",["check-ignore","--quiet","--",relative],{cwd:base,windowsHide:true,encoding:"utf8"});
  if(ignored.status!==0)fail("path_not_git_ignored");
  if(existing) {try{lstatSync(target);}catch{fail("private_file_missing");}}
  return target;
}
export function readPrivateJson(root,relative,maxBytes=16*1024*1024) {
  const target=privatePath(root,relative,{existing:true});
  if(lstatSync(target).size>maxBytes)fail("private_file_too_large");
  let descriptor;
  try {
    descriptor=openSync(target,constants.O_RDONLY|(constants.O_NOFOLLOW||0));
    const stat=fstatSync(descriptor);
    if(!stat.isFile()||stat.nlink!==1||stat.size>maxBytes)fail("private_file_unavailable");
    const raw=readFileSync(descriptor,"utf8");
    if(Buffer.byteLength(raw,"utf8")>maxBytes)fail("private_file_too_large");
    return JSON.parse(raw);
  }catch(error){if(error instanceof PilotError)throw error;fail("invalid_private_json");}finally{if(descriptor!==undefined)closeSync(descriptor);}
}
export function writePrivateJson(root,relative,value) {
  const target=privatePath(root,relative);
  // Parents must already be provisioned by prepare; never recurse through unknown paths.
  privatePath(root,relative.slice(0,relative.lastIndexOf("/")),{existing:true,directory:true});
  try{writeFileSync(target,JSON.stringify(value,null,2)+"\n",{flag:"wx",mode:0o600});}catch{fail("private_write_refused");}
  return target;
}
export function createPrivateDirectory(root,relative) {
  const target=privatePath(root,relative);
  const base=realpathSync(root);
  let cursor=base;
  const segments=relative.split("/");
  for(let i=0;i<segments.length;i++) {
    cursor=path.join(cursor,segments[i]);
    try{mkdirSync(cursor,{mode:0o700});}catch(error){if(error.code!=="EEXIST"||i===segments.length-1)fail("directory_create_refused");}
    const stat=lstatSync(cursor);
    if(stat.isSymbolicLink()||!stat.isDirectory()||realpathSync(cursor)!==cursor)fail("linked_path_refused");
  }
  return target;
}

export function reviewerMarkdown(packValue) {
  const pack=validatePack(packValue);
  const lines=["# VoidFill specialist review pack", "", "HUMAN VALIDATION PENDING. This is an inventory of actual app briefs and serving banks, not expert approval. Review both levels independently. Knowledge-bank coverage never establishes case quality or professional readiness.", "", `Source: ${pack.source.revision}; content digest: ${pack.source.content_digest}; pack: ${pack.pack_digest}.`, `Environment: ${pack.source.environment}; source state: ${pack.source.state}; deployment binding: ${pack.source.deployment_binding}. The tool does not verify a hosted deployment.`, "", "For every case: assess task authenticity, sufficiency of inputs, observable deliverable, each rubric criterion and source grounding. Inspect the referenced question rows and their correct key/explanation in reviewer-pack.json, follow the public sources yourself, and record wrong keys/ambiguity/scope problems. Availability of a URL is not source verification. A usable-for-pilot case disposition does not approve unreviewed questions.", "", "Use only coded anonymous records; no quotations, personal work, resumes, chats, names or contacts. See record-templates.json. Each rubric criterion uses its zero-based index. All case, criterion and question references are validated against this immutable pack.", ""];
  for(const row of pack.cases) {
    lines.push(`## ${row.brief.role_name} — ${row.level}`, "", `Case ID: ${row.id}; brief version: ${row.brief.version}; brief digest: ${row.brief_digest}.`, "", `**Task: ${row.brief.title}**`, "", row.brief.instructions, "", "**Supplied fictional inputs**", "", ...row.brief.case_inputs.map(item=>`- ${item}`), "", "**Deliverable**", "", row.brief.deliverable, "", "**Rubric**", "", ...row.brief.rubric.map((item,index)=>`${index}. ${item}`), "", "**Case source references — not automatically verified**", "", ...row.brief.case_sources.map(item=>`- [${item.title}](${item.url})`), "", "**Current knowledge evidence**", "", ...row.requirements.map(item=>`- ${item.name}: ${item.topic||"no objective bank; specialist review required"} (${item.assessment_mode}).`), ...row.topic_banks.map(bank=>`- ${bank.topic}: ${bank.question_ids.length} stage-eligible broad-skill question IDs; ${bank.resource_ids.length} resource IDs. Full IDs and each resource's exact lesson bindings are in reviewer-pack.json.`), "", `Scope note: ${row.brief.note}`, "", "Review status: pending; no reviewer result has been supplied.", "");
  }
  lines.push("## Complete public lesson-link inventory", "", "Foundation means difficulties 1–2; intermediate means difficulty 3. Same URL plus same topic and explicit resource ID(s) determine a lesson bank. source_url alone is a reference. Globally quarantined questions are excluded. The JSON includes current prompts, options, answer keys, explanations and provenance once, not repeated per case.", "");
  for(const row of pack.resources)lines.push(`- ${row.id}: [${row.title}](${row.url}) — ${row.selection_status}; ${row.banks.map(bank=>`${bank.topic} ${bank.foundation_ids.length}/${bank.intermediate_ids.length}`).join("; ")}.`);
  return lines.join("\n")+"\n";
}
