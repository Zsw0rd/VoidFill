import test from "node:test";
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {spawnSync} from "node:child_process";
import {probePlan,runLoadProbe,validateProbeSessions,latencySummary} from "../lib/loadProbe.mjs";

const questions=Array.from({length:10},(_,index)=>({id:`q-${index}`,options:["One","Two"]}));
const assessment={questions,assessment_token:"synthetic-sealed-assessment-token-with-no-user-data"};

test("probe origins and live traffic are explicitly bounded before a request",()=>{
  for(const origin of ["https://other.invalid","https://void-fill.vercel.app?token=x","https://user:secret@void-fill.vercel.app","https://void-fill.vercel.app/path"])assert.throws(()=>probePlan({origin,live:true}));
  assert.throws(()=>probePlan({origin:"https://void-fill.vercel.app"}));
  assert.throws(()=>probePlan({origin:"https://void-fill.vercel.app",live:true,rounds:3}));
  assert.throws(()=>probePlan({origin:"https://void-fill.vercel.app",live:true,mode:"real",clients:3}));
  assert.throws(()=>probePlan({clients:0}));
  assert.throws(()=>probePlan({rounds:11}));
  const plan=probePlan({origin:"https://void-fill.vercel.app",live:true});
  assert.deepEqual(plan.stages,[1,2,4]);assert.equal(plan.requests,42);
  const help=spawnSync(process.execPath,["scripts/load-learning.mjs","--help"],{encoding:"utf8"});
  assert.equal(help.status,0);assert.match(help.stdout,/No requests sent/);
  const denied=spawnSync(process.execPath,["scripts/load-learning.mjs","--mode","real"],{encoding:"utf8"});
  assert.notEqual(denied.status,0);assert.match(denied.stderr,/explicit acknowledgement/);
});

test("real sessions stay origin-bound, cannot be demos or header injection, and authenticate as different users",async()=>{
  const plan=probePlan({mode:"real",clients:2});
  const valid={version:1,origin:plan.origin,sessions:[{cookie:"sb-local-auth-token=first-controlled-session"},{cookie:"sb-local-auth-token=second-controlled-session"}]};
  assert.equal(validateProbeSessions(valid,plan).length,2);
  for(const bad of [
    {...valid,origin:"https://other.invalid"},
    {...valid,sessions:[valid.sessions[0],valid.sessions[0]]},
    {...valid,sessions:[{cookie:valid.sessions[0].cookie+"; vf_demo_session=not-real"},valid.sessions[1]]},
    {...valid,sessions:[{cookie:valid.sessions[0].cookie+"\r\nAuthorization: secret"},valid.sessions[1]]},
    {...valid,sessions:[{cookie:valid.sessions[0].cookie,email:"private@example.invalid"},valid.sessions[1]]},
  ])assert.throws(()=>validateProbeSessions(bad,plan));
  let requested=0;
  await assert.rejects(()=>runLoadProbe({plan,clients:valid.sessions,fetchImpl:async()=>{requested++;return new Response();}}),/verified identities/);
  await assert.rejects(()=>runLoadProbe({plan,clients:valid.sessions,verifyIdentity:async()=>"same-real-user",fetchImpl:async()=>{requested++;return new Response();}}),/different controlled users/);
  assert.equal(requested,0);
});

test("the HTTP workload really overlaps distinct clients and never submits earned progress or serializes sensitive content",async()=>{
  let active=0,peak=0;
  const paths:string[]=[];
  const server=createServer(async(req,res)=>{
    active++;peak=Math.max(peak,active);paths.push(req.url||"");
    assert.match(req.headers.cookie||"",/^private-session-/);
    await new Promise(resolve=>setTimeout(resolve,8));
    res.setHeader("Content-Type","application/json");res.setHeader("Server-Timing","app;dur=4.5");
    res.end(JSON.stringify(req.url==="/api/practical"?{demo:true,available:true,projects:[{content:"private evidence must never appear in report"}],submissions:[],reviews:[]}:assessment));active--;
  });
  await new Promise<void>(resolve=>server.listen(0,"127.0.0.1",resolve));
  try {
    const port=(server.address() as {port:number}).port;
    const plan=probePlan({origin:`http://127.0.0.1:${port}`,clients:4,rounds:2});
    const report=await runLoadProbe({plan,clients:Array.from({length:4},(_,index)=>({cookie:`private-session-${index}=hidden-session-capability`}))});
    assert.equal(report.success,true);assert.equal(report.completed_requests,42);assert.equal(report.peak_in_flight,4);assert.equal(peak,4);
    assert.deepEqual(report.stages.map((stage:any)=>stage.clients),[1,2,4]);
    assert.ok(report.measurements.every((row:any)=>row.app_ms===4.5 && row.status===200));
    assert.ok(paths.every(path=>["/api/roadmap/assess","/api/ai/generate-questions","/api/practical"].includes(path)));
    assert.ok(!paths.some(path=>/submit|profile|recommend/.test(path)));
    const output=JSON.stringify(report);
    for(const sensitive of ["hidden-session-capability","private-session-","private evidence","synthetic-sealed-assessment-token","q-0"])assert.ok(!output.includes(sensitive));
    assert.match(report.scope,/not real-user capacity evidence/);
  } finally {await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));}
});

test("throttle, auth, upstream failure and invalid payload stop further load and remain separate classifications",async()=>{
  for(const status of [429,401,503,302,200]) {
    let calls=0;
    const report=await runLoadProbe({plan:probePlan({clients:1,rounds:2}),clients:[{cookie:"private-cookie"}],fetchImpl:async()=>{calls++;return new Response(status===200?JSON.stringify({questions:[],assessment_token:"private-secret"}):"sensitive upstream error body",{status,headers:{"Server-Timing":"app;dur=3, secret;desc=private"}});}});
    assert.equal(calls,1);assert.equal(report.success,false);assert.equal(report.completed_requests,1);
    assert.equal(report.stages[0].throttled,status===429?1:0);assert.equal(report.stages[0].server_errors,status===503?1:0);
    assert.ok(!JSON.stringify(report).includes("sensitive upstream")&&!JSON.stringify(report).includes("private-secret"));
  }
});

test("observed latency quantiles describe only successful samples and do not treat throttling as a fast success",()=>{
  const summary=latencySummary([{ok:true,status:200,duration_ms:8},{ok:true,status:200,duration_ms:20},{ok:false,status:429,duration_ms:1},{ok:false,status:503,duration_ms:2}]);
  assert.equal(summary.p50_ms,8);assert.equal(summary.sample_p95_ms,20);assert.equal(summary.successful,2);assert.equal(summary.throttled,1);assert.equal(summary.server_errors,1);assert.equal(summary.p95_evidence,"fewer_than_20_successful_samples");
});
