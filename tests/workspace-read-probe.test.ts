import test from "node:test";
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {workspaceReadPlan,runWorkspaceReadProbe} from "../lib/workspaceReadProbe.mjs";

const clients = () => ["one", "two"].map(id => ({cookie:`sb-synthetic-auth-token=synthetic-session-${id}-not-a-real-user`}));
const verify = async (client:{cookie:string}) => client.cookie.endsWith("one-not-a-real-user") ? "synthetic-id-one" : "synthetic-id-two";
const workspace = {available:true,demo:false,projects:[],submissions:[],reviews:[]};

test("read-only soak has its own immutable and explicit traffic envelope", () => {
  const plan=workspaceReadPlan();
  assert.equal(plan.clients,2);assert.equal(plan.requests,36);assert.equal(plan.deadline_ms,60000);assert.equal(plan.pause_ms,1000);
  assert.equal(Object.isFrozen(plan),true);assert.equal(Object.isFrozen(plan.stages),true);
  for(const origin of ["https://other.invalid","https://user:secret@void-fill.vercel.app","https://void-fill.vercel.app/path","https://void-fill.vercel.app?x=1","http://void-fill.vercel.app"])assert.throws(()=>workspaceReadPlan({origin}));
  assert.throws(()=>workspaceReadPlan({requests:1000} as any));
});

test("no workload starts without two separate server-verified real-mode sessions", async () => {
  let calls=0;
  const fetchImpl=async()=>{calls++;return new Response(JSON.stringify(workspace));};
  for(const options of [
    {clients:[clients()[0]],verifyIdentity:verify},
    {clients:[clients()[0],clients()[0]],verifyIdentity:verify},
    {clients:clients(),verifyIdentity:async()=>"same-user"},
    {clients:clients(),verifyIdentity:async()=>{throw new Error("private identity detail");}},
    {clients:clients(),verifyIdentity:undefined},
    {clients:[{cookie:"vf_demo_session=synthetic-private"},clients()[1]],verifyIdentity:verify},
  ])await assert.rejects(runWorkspaceReadProbe({...options,fetchImpl} as any));
  assert.equal(calls,0);
});

test("actual wire workload is thirty-six paced GETs with no response contents or sessions in metrics", async () => {
  let active=0,peak=0,pauses=0;
  const seen:{method:string;path:string;body:string}[]=[];
  const server=createServer(async(req,res)=>{
    active++;peak=Math.max(peak,active);
    let body="";for await(const chunk of req)body+=chunk;
    seen.push({method:req.method||"",path:req.url||"",body});
    await new Promise(resolve=>setTimeout(resolve,3));
    res.setHeader("Content-Type","application/json");res.setHeader("Server-Timing","app;dur=2.5");
    res.end(JSON.stringify({...workspace,projects:[{content:"private work must not appear in a report"}]}));active--;
  });
  await new Promise<void>(resolve=>server.listen(0,"127.0.0.1",resolve));
  try {
    const port=(server.address() as {port:number}).port;
    const report=await runWorkspaceReadProbe({origin:`http://127.0.0.1:${port}`,clients:clients(),verifyIdentity:verify,pause:async ms=>{assert.equal(ms,1000);pauses++;}});
    assert.equal(report.success,true);assert.equal(report.completed_requests,36);assert.equal(report.peak_in_flight,2);assert.equal(peak,2);
    assert.equal(pauses,33);assert.equal(seen.length,36);
    assert.ok(seen.every(row=>row.method==="GET"&&row.path==="/api/practical"&&row.body===""));
    assert.deepEqual(report.stages.map((row:any)=>row.samples),[12,24]);
    assert.ok(report.measurements.every((row:any)=>row.app_ms===2.5));
    const serialized=JSON.stringify(report);
    for(const forbidden of ["private work","synthetic-session","synthetic-id"])assert.ok(!serialized.includes(forbidden));
    assert.match(report.scope,/workspace-read evidence/);
  } finally {await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));}
});

test("first error or throttle stops the soak without silently accepting fast rejections", async () => {
  for(const [status,failure] of [[429,"rate_limit"],[401,"authentication"],[503,"server_error"],[302,"unexpected_status"]] as const){
    let calls=0;
    const report=await runWorkspaceReadProbe({clients:clients(),verifyIdentity:verify,pause:async()=>{},fetchImpl:async()=>{calls++;return new Response("private upstream detail",{status});}});
    assert.equal(calls,1);assert.equal(report.success,false);assert.equal(report.stopped_reason,failure);assert.equal(report.stages[0].successful,0);
    assert.ok(!JSON.stringify(report).includes("private upstream detail"));
  }
});

test("pauses and the final successful body still obey the global deadline", async () => {
  let clock=0,calls=0;
  const report=await runWorkspaceReadProbe({clients:clients(),verifyIdentity:verify,now:()=>clock,pause:async ms=>{clock+=ms;},fetchImpl:async()=>{
    clock+=(++calls===1?59500:1);return new Response(JSON.stringify(workspace));
  }});
  assert.equal(calls,1);assert.equal(report.success,false);assert.equal(report.stopped_reason,"probe_deadline");
  assert.equal(report.duration_ms,60500);assert.equal(report.stages[0].successful,1);
});

test("a slow last successful read cannot make an over-deadline soak pass", async () => {
  let clock=0,calls=0;
  const report=await runWorkspaceReadProbe({clients:clients(),verifyIdentity:verify,now:()=>clock,pause:async()=>{},fetchImpl:async()=>{
    clock=++calls===36?60001:clock+1;return new Response(JSON.stringify(workspace));
  }});
  assert.equal(calls,36);assert.equal(report.completed_requests,36);assert.equal(report.success,false);
  assert.equal(report.stopped_reason,"probe_deadline");assert.equal(report.stages[1].successful,24);
});

test("demo or malformed workspaces cannot masquerade as authenticated read acceptance", async () => {
  for(const body of [{...workspace,demo:true},{...workspace,available:false},{...workspace,reviews:null}]){
    const report=await runWorkspaceReadProbe({clients:clients(),verifyIdentity:verify,pause:async()=>{},fetchImpl:async()=>new Response(JSON.stringify(body))});
    assert.equal(report.success,false);assert.equal(report.completed_requests,1);assert.equal(report.stopped_reason,"unexpected_payload");
  }
});
