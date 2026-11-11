#!/usr/bin/env node
// Fixed fictional files only. Actual snapshots remain in memory and never enter reports.
import fs from "node:fs";
import {resolve, relative, sep, dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {randomUUID, createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {configure, python, requirePython} from "./runtime.mjs";
import {documentProbePlan, runDocumentProbe} from "../lib/documentProbe.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
function options(argv) {
  const result = {};
  for (let i=0;i<argv.length;i++) {
    const key = argv[i];
    if (Object.hasOwn(result,key) || !["--base","--live","--output","--help"].includes(key)) throw new Error("Unknown or repeated document probe option.");
    if (["--base","--output"].includes(key)) {if (!argv[i+1] || argv[i+1].startsWith("--")) throw new Error("Missing document probe option value.");result[key]=argv[++i];}
    else result[key]=true;
  }
  return result;
}
function outputPath(value) {
  const path=resolve(root,value), inside=relative(resolve(root,"ml/runtime"),path);
  if (!inside || inside===".." || inside.startsWith(".."+sep) || inside.includes(":") || !path.endsWith(".json")) throw new Error("Reports must stay inside ignored ml/runtime.");
  let current=root;
  for (const part of relative(root,dirname(path)).split(sep)) {
    current=resolve(current,part);
    if (!fs.existsSync(current)) fs.mkdirSync(current,{mode:0o700});
    if (fs.lstatSync(current).isSymbolicLink() || !fs.statSync(current).isDirectory()) throw new Error("Report paths cannot traverse links.");
  }
  if (fs.existsSync(path)) throw new Error("A prior document report is never overwritten.");
  if (spawnSync("git",["check-ignore","--quiet","--no-index","--",relative(root,path)],{cwd:root,windowsHide:true,stdio:"ignore"}).status!==0) throw new Error("Reports must be ignored by Git.");
  return path;
}
const controlCounts={start:0,lease:0,db:0,end:0};
function client() {
  return {jar:new Map(),get cookie(){return [...this.jar].map(([k,v])=>`${k}=${v}`).join("; ");},updateCookies(headers){
    for(const header of headers){const pair=header.split(";",1)[0], separator=pair.indexOf("=");if(separator<1)continue;const key=pair.slice(0,separator);if(/;\s*max-age=0(?:;|$)/i.test(header))this.jar.delete(key);else this.jar.set(key,pair.slice(separator+1));}
  }};
}
try {
  const args=options(process.argv.slice(2));
  if(args["--help"]) {
    console.log("No requests sent. node scripts/test-document-matrix.mjs [--base http://localhost:3000] [--output ml/runtime/<new>.json]");
    console.log("Owned HTTPS deployments additionally need --live. Local: fourteen fixed positive/negative fixtures plus one paired light-PDF round. Hosted: only eight valid fixtures plus one paired round. At most two disposable clients, three minutes, ninety seconds/request. No Apply, profile, grade, account-export or chat operation.");
    process.exit(0);
  }
  const plan=documentProbePlan({origin:args["--base"],live:!!args["--live"]});
  const run=randomUUID();
  const output=outputPath(args["--output"] || `ml/runtime/performance/documents-${new Date().toISOString().replace(/[:.]/g,"-")}-${run.slice(0,8)}.json`);
  const fixtureDirectory=resolve(root,`ml/runtime/performance/document-fixtures-${run}`);
  configure();requirePython();
  if (!process.env.DEMO_ENTRY_KEY) throw new Error("Existing private disposable-demo access is required.");
  const generated=spawnSync(python,["-m","ml.document_probe_fixtures","--output",fixtureDirectory],{cwd:root,encoding:"utf8",windowsHide:true,timeout:30000,maxBuffer:65536});
  if (generated.status!==0) throw new Error("Could not generate the fixed fictional matrix.");
  const manifest=JSON.parse(fs.readFileSync(resolve(fixtureDirectory,"manifest.json"),"utf8"));
  if (manifest.version!==1 || !Array.isArray(manifest.cases) || manifest.cases.length!==14) throw new Error("Invalid generated fixture manifest.");
  const fixtures=manifest.cases.map(row=>{
    if (!/^[a-z0-9-]+\.(?:pdf|docx)$/.test(row.filename)) throw new Error("Invalid generated fixture filename.");
    const data=fs.readFileSync(resolve(fixtureDirectory,row.filename));
    if (data.length!==row.bytes || createHash("sha256").update(data).digest("hex")!==row.sha256) throw new Error("Generated fixture integrity failed.");
    return {...row,data};
  });
  const clients=[client(),client()], started=[];
  const overallDeadline=Date.now()+240000;
  async function control(who,action,body,cleanup=false) {
    const remaining=Math.min(cleanup?15000:30000,overallDeadline-Date.now()-(cleanup?0:30000));
    if(remaining<=0)throw new Error("Document control deadline exceeded.");
    controlCounts[action]++;
    const response=await fetch(plan.origin+"/api/demo/"+action,{method:"POST",headers:{Cookie:who.cookie,Origin:plan.origin,"Content-Type":"application/json"},body:JSON.stringify(body),redirect:"manual",signal:AbortSignal.timeout(remaining)});
    who.updateCookies(response.headers.getSetCookie());
    if(response.status!==200){await response.body?.cancel();throw new Error("Disposable document control failed; no response content is printed.");}
    return response.json();
  }
  let report,ended=0;
  try {
    for(const who of clients){await control(who,"start",{key:process.env.DEMO_ENTRY_KEY,role:0});started.push(who);await control(who,"lease",{tab:"document-matrix"});}
    report=await runDocumentProbe({origin:plan.origin,live:!!args["--live"],clients,fixtures,budgetMs:Math.min(plan.deadline_ms,overallDeadline-Date.now()-30000),
      renew:who=>control(who,"lease",{tab:"document-matrix"}),
      snapshot:async who=>({profile:(await control(who,"db",{table:"profiles",single:"required"})).data,stats:(await control(who,"db",{table:"user_stats",single:"required"})).data})});
  } catch {
    report={version:1,origin:plan.origin,mode:"demo",workload:"document-matrix",success:false,stopped_reason:"setup_or_snapshot_failed",configured_requests:plan.requests,completed_requests:0,measurements:[]};
  } finally {
    for(const who of started){try{await control(who,"end",{},true);ended++;}catch{}}
    for(const who of clients)who.jar.clear();
  }
  report.cleanup={created:started.length,ended};report.control_requests=controlCounts;
  if(ended!==started.length){report.success=false;report.stopped_reason="demo_cleanup_failed";}
  fs.writeFileSync(output,JSON.stringify(report,null,2)+"\n",{flag:"wx",mode:0o600});
  console.log(JSON.stringify({file:relative(root,output).replaceAll("\\","/"),...report},null,2));
  if(!report.success)process.exitCode=1;
} catch {console.error("Document matrix could not complete; no credentials,response content or original files were printed.");process.exitCode=1;}
