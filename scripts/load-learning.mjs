#!/usr/bin/env node
// Bounded, explicit diagnostics. No grade submission, profile edits or credential output.
import fs from "node:fs";
import { resolve,relative,sep,dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import nextEnv from "@next/env";
import { createServerClient,parseCookieHeader,serializeCookieHeader } from "@supabase/ssr";
import { probePlan,runLoadProbe,validateProbeSessions } from "../lib/loadProbe.mjs";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const values=new Set(["--base","--mode","--clients","--rounds","--sessions","--output"]), flags=new Set(["--live","--acknowledge-real-accounts","--help"]);
function options(argv) {
  const result={};
  for(let i=0;i<argv.length;i++) {
    const key=argv[i];
    if(Object.hasOwn(result,key)||(!values.has(key)&&!flags.has(key))) throw new Error("Unknown or repeated probe option.");
    if(values.has(key)) {if(!argv[i+1]||argv[i+1].startsWith("--"))throw new Error("Probe option needs a value.");result[key]=argv[++i];}
    else result[key]=true;
  }
  return result;
}
function privatePath(requested,{input=false}={}) {
  const path=resolve(root,requested), inside=relative(resolve(root,"ml/runtime"),path);
  if(!inside || inside.startsWith(".."+sep) || inside===".." || inside.includes(":")) throw new Error("Probe files must stay inside ignored ml/runtime.");
  if(!path.endsWith(".json"))throw new Error("Probe files must use JSON.");
  let current=root;
  const parts=relative(root,path).split(sep);
  for(const piece of parts.slice(0,-1)) {
    current=resolve(current,piece);
    if(!fs.existsSync(current)) {if(input)throw new Error("Private session file unavailable.");fs.mkdirSync(current,{mode:0o700});}
    if(fs.lstatSync(current).isSymbolicLink() || !fs.statSync(current).isDirectory())throw new Error("Probe paths cannot traverse links.");
  }
  if(fs.existsSync(path) && fs.lstatSync(path).isSymbolicLink()) throw new Error("Probe files cannot be links.");
  if(spawnSync("git",["check-ignore","--quiet","--no-index","--",relative(root,path)],{cwd:root,windowsHide:true,stdio:"ignore"}).status!==0) throw new Error("Probe files must be ignored by Git.");
  return path;
}
function clientWithCookie(cookie="") {
  return {cookie,updateCookies(headers) {
    const jar=new Map(this.cookie.split(";").map(value=>value.trim()).filter(Boolean).map(value=>{const split=value.indexOf("=");return [value.slice(0,split),value.slice(split+1)];}));
    for(const header of headers) {
      const pair=header.split(";",1)[0],split=pair.indexOf("="),name=pair.slice(0,split);
      if(split<1)continue;
      if(/;\s*max-age=0(?:;|$)/i.test(header))jar.delete(name);else jar.set(name,pair.slice(split+1));
    }
    this.cookie=[...jar].map(([name,value])=>`${name}=${value}`).join("; ");
  }};
}
async function control(plan,client,path,body) {
  const response=await fetch(plan.origin+path,{method:"POST",headers:{"Content-Type":"application/json",Origin:plan.origin,Cookie:client.cookie},body:JSON.stringify(body),redirect:"manual",signal:AbortSignal.timeout(30000)});
  client.updateCookies(response.headers.getSetCookie());
  await response.body?.cancel();
  if(response.status!==200)throw new Error("Disposable session control failed.");
}

try {
  const args=options(process.argv.slice(2));
  if(args["--help"]) {
    console.log("No requests sent. Bounded learning probe: node scripts/load-learning.mjs --base http://localhost:3000 --clients 4 --rounds 2");
    console.log("Production demos additionally require --live --base https://void-fill.vercel.app. They do not measure real-account capacity.");
    console.log("Real mode requires --mode real --sessions ml/runtime/<private>.json --acknowledge-real-accounts and controlled, separately authenticated test users. Never extract browser cookies or put sessions in command arguments/source/CI artifacts.");
    console.log("File format: version=1, exact origin, sessions array containing only cookie fields. Obtain sessions through an authorized API login/SDK workflow; Google-only browser login does not authorize cookie extraction.");
    console.log("Workload only generates unsubmitted daily/practice quizzes and reads practical workspaces. Real account generation budgets are consumed. Live runs are capped at two rounds and two real accounts; stop on the first failure/throttle. Output is private ignored JSON.");
    process.exit(0);
  }
  const plan=probePlan({origin:args["--base"],mode:args["--mode"]||"demo",clients:Number(args["--clients"]||(args["--mode"]==="real"?2:4)),rounds:Number(args["--rounds"]||2),live:!!args["--live"]});
  if(plan.mode==="real" && (!args["--acknowledge-real-accounts"] || !args["--sessions"])) throw new Error("Real mode requires explicit acknowledgement and private sessions from controlled users.");
  if(plan.mode==="demo" && (args["--sessions"] || args["--acknowledge-real-accounts"]))throw new Error("Real session options cannot be used in demo mode.");
  const output=privatePath(args["--output"]||`ml/runtime/performance/load-${new Date().toISOString().replace(/[:.]/g,"-")}-${randomUUID().slice(0,8)}.json`);
  if(fs.existsSync(output))throw new Error("Refusing to overwrite a previous probe report.");
  let clients;
  if(plan.mode==="real") {
    const input=privatePath(args["--sessions"],{input:true});
    if(!fs.statSync(input).isFile() || fs.statSync(input).size>150000)throw new Error("Private session file invalid or oversized.");
    let parsed;try{parsed=JSON.parse(fs.readFileSync(input,"utf8"));}catch{throw new Error("Private session file could not be parsed.");}
    clients=validateProbeSessions(parsed,plan).map(cookie=>clientWithCookie(cookie));
  } else clients=Array.from({length:plan.clients},()=>clientWithCookie());
  nextEnv.loadEnvConfig(root,false,{info(){},error(){}});
  if(plan.mode==="demo" && !process.env.DEMO_ENTRY_KEY)throw new Error("Existing private demo access is unavailable.");
  let verifyIdentity;
  if(plan.mode==="real") {
    let authOrigin;
    try {authOrigin=new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);}catch{throw new Error("Configured Supabase origin is unavailable.");}
    if((!plan.local && authOrigin.origin!=="https://duklscnzisneioiwgfao.supabase.co") || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)throw new Error("Production session verification requires the configured Supabase project.");
    if(plan.local && !(authOrigin.protocol==="https:" && authOrigin.hostname.endsWith(".supabase.co")) && !(authOrigin.protocol==="http:" && ["localhost","127.0.0.1","[::1]"].includes(authOrigin.hostname)))throw new Error("Unrecognized authentication destination.");
    verifyIdentity=async client=>{
      const supabase=createServerClient(authOrigin.origin,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{cookies:{getAll:()=>parseCookieHeader(client.cookie),setAll:items=>client.updateCookies(items.map(({name,value,options})=>serializeCookieHeader(name,value,options)))},auth:{autoRefreshToken:false},global:{fetch:(url,init)=>fetch(url,{...init,signal:AbortSignal.timeout(15000)})}});
      const {data,error}=await supabase.auth.getUser();
      if(error||!data?.user?.id)throw new Error("Unverified test session.");
      return data.user.id;
    };
  }
  let report,started=0,cleaned=0;
  try {
    if(plan.mode==="demo")for(const client of clients){await control(plan,client,"/api/demo/start",{key:process.env.DEMO_ENTRY_KEY,role:0});started++;}
    report=await runLoadProbe({plan,clients,verifyIdentity,...(plan.mode==="demo"?{renew:client=>control(plan,client,"/api/demo/lease",{tab:"bounded-concurrency-probe"})}:{})});
  } finally {
    if(plan.mode==="demo")for(const client of clients.slice(0,started))try{await control(plan,client,"/api/demo/end",{});cleaned++;}catch{}
    for(const client of clients)client.cookie="";
  }
  if(plan.mode==="demo") {report.cleanup={created:started,ended:cleaned};if(cleaned!==started){report.success=false;report.stopped_reason="demo_cleanup_failed";}}
  fs.writeFileSync(output,JSON.stringify(report,null,2)+"\n",{flag:"wx",mode:0o600});
  console.log(JSON.stringify({file:relative(root,output).replaceAll("\\","/"),...report},null,2));
  if(!report.success)process.exitCode=1;
} catch(error) {
  // Errors above are fixed operator diagnostics; never serialize SDK/network errors.
  console.error(error instanceof Error && !/supabase|fetch|json|token|cookie/i.test(error.message)?error.message:"Probe failed before completion; no credentials or response contents were printed.");
  process.exitCode=1;
}
