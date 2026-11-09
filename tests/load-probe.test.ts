import test from "node:test";
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {spawnSync} from "node:child_process";
import {probePlan,runLoadProbe,validateProbeSessions,latencySummary} from "../lib/loadProbe.mjs";
import {syntheticResumePdf} from "../lib/performanceFixtures.mjs";

const questions=Array.from({length:10},(_,index)=>({id:`q-${index}`,options:["One","Two"]}));
const assessment={questions,assessment_token:"synthetic-sealed-assessment-token-with-no-user-data"};

test("probe origins and live traffic are explicitly bounded before a request",()=>{
  for(const origin of ["https://other.invalid","https://void-fill.vercel.app?token=x","https://user:secret@void-fill.vercel.app","https://void-fill.vercel.app/path"])assert.throws(()=>probePlan({origin,live:true}));
  assert.throws(()=>probePlan({origin:"https://void-fill.vercel.app"}));
  assert.throws(()=>probePlan({origin:"https://void-fill.vercel.app",live:true,rounds:3}));
  assert.throws(()=>probePlan({origin:"https://void-fill.vercel.app",live:true,mode:"real",clients:3}));
  assert.throws(()=>probePlan({clients:0}));
  assert.throws(()=>probePlan({rounds:11}));
  assert.throws(()=>probePlan({clients:17}));
  assert.throws(()=>probePlan({origin:"https://void-fill.vercel.app",live:true,clients:8}));
  assert.throws(()=>probePlan({mode:"real",clients:8}));
  assert.deepEqual(probePlan({clients:16,rounds:4}).stages,[1,2,4,8,16]);
  assert.equal(probePlan({clients:16,rounds:4}).requests,372);
  assert.throws(()=>probePlan({pauseMs:2001}));
  assert.throws(()=>probePlan({origin:"https://void-fill.vercel.app",live:true,pauseMs:1}));
  assert.throws(()=>probePlan({mode:"real",pauseMs:1}));
  assert.equal(probePlan({clients:16,rounds:10,pauseMs:2000}).requests,930);
  const plan=probePlan({origin:"https://void-fill.vercel.app",live:true});
  assert.deepEqual(plan.stages,[1,2,4]);assert.equal(plan.requests,42);
  const help=spawnSync(process.execPath,["scripts/load-learning.mjs","--help"],{encoding:"utf8"});
  assert.equal(help.status,0);assert.match(help.stdout,/No requests sent/);
  const denied=spawnSync(process.execPath,["scripts/load-learning.mjs","--mode","real"],{encoding:"utf8"});
  assert.notEqual(denied.status,0);assert.match(denied.stderr,/explicit acknowledgement/);
});

test("expanded loopback demo stages overlap eight clients while retaining the read/generation-only workload",async()=>{
  let active=0,peak=0;
  const server=createServer(async(req,res)=>{
    active++;peak=Math.max(peak,active);
    await new Promise(resolve=>setTimeout(resolve,8));
    res.setHeader("Content-Type","application/json");
    res.end(JSON.stringify(req.url==="/api/practical"?{demo:true,available:true,projects:[],submissions:[],reviews:[]}:assessment));
    active--;
  });
  await new Promise<void>(resolve=>server.listen(0,"127.0.0.1",resolve));
  try {
    const port=(server.address() as {port:number}).port;
    const plan=probePlan({origin:`http://127.0.0.1:${port}`,clients:8,rounds:1});
    const report=await runLoadProbe({plan,clients:Array.from({length:8},(_,index)=>({cookie:`synthetic-local-session-${index}`}))});
    assert.equal(report.success,true);
    assert.equal(report.completed_requests,45);
    assert.equal(peak,8);
    assert.equal(report.peak_in_flight,8);
    assert.deepEqual(report.stages.map((stage:any)=>stage.clients),[1,2,4,8]);
    assert.ok(report.stages.every((stage:any)=>stage.server_errors===0 && stage.throttled===0));
  } finally {await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));}
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

test("local soak pacing is outside request latency and the overall deadline still stops the workload",async()=>{
  let clock=0,pauses=0,calls=0;
  const plan=probePlan({clients:1,rounds:3,pauseMs:2000});
  const report=await runLoadProbe({plan:{...plan,deadline_ms:3000},clients:[{cookie:"synthetic-private"}],now:()=>clock,pause:async ms=>{pauses++;clock+=ms;},fetchImpl:async url=>{
    calls++;clock+=10;
    return new Response(JSON.stringify(String(url).endsWith("/api/practical")?{demo:true,available:true,projects:[],submissions:[],reviews:[]}:assessment));
  }});
  assert.equal(pauses,2);
  assert.equal(calls,6);
  assert.equal(report.success,false);
  assert.equal(report.stopped_reason,"probe_deadline");
  assert.equal(report.round_pause_ms,2000);
  assert.ok(report.measurements.every((row:any)=>row.duration_ms===10));
  assert.equal(report.duration_ms,4060);
});

test("paced local stages keep idle future demo clients alive through ordinary renewals",async()=>{
  const plan=probePlan({clients:8,rounds:10,pauseMs:1});
  const clients=Array.from({length:8},(_,index)=>({cookie:`synthetic-demo-${index}`,leaseUntil:60000}));
  let clock=0,sent=0;
  const bounds=plan.stages.map((count,index)=>plan.stages.slice(0,index+1).reduce((sum,n)=>sum+n*plan.rounds*3,0));
  const report=await runLoadProbe({plan,clients,now:()=>clock,pause:async()=>{},renew:async client=>{
    const session=client as typeof clients[number];
    if(session.leaseUntil<=clock)throw new Error("Synthetic demo lease expired");
    session.leaseUntil=clock+60000;
  },fetchImpl:async url=>{
    const stage=plan.stages[bounds.findIndex(bound=>sent<bound)];
    clock+=30000/(stage*plan.rounds*3);sent++;
    return new Response(JSON.stringify(String(url).endsWith("/api/practical")?{demo:true,available:true,projects:[],submissions:[],reviews:[]}:assessment));
  }});
  assert.ok(clock>60000,"This workload must outlive an untouched demo lease");
  assert.equal(report.success,true);
  assert.equal(report.completed_requests,450);
  assert.equal(report.stages.length,4);
});

test("synthetic private-inference workload is explicitly selected, bounded and never applies extracted profile data",async()=>{
  assert.throws(()=>probePlan({workload:"unknown"}));
  assert.throws(()=>probePlan({workload:"resume",clients:4}));
  const plan=probePlan({workload:"resume",clients:2,rounds:2});
  assert.equal(plan.requests,24);
  const seen: {path:string;method:string;body:string}[]=[];
  const server=createServer(async(req,res)=>{
    let body="";for await(const chunk of req)body+=chunk.toString();
    seen.push({path:req.url||"",method:req.method||"",body});
    res.setHeader("Content-Type","application/json");
    if(req.url==="/api/resume") {
      assert.match(req.headers["content-type"]||"",/^multipart\/form-data; boundary=/);
      assert.match(body,/%PDF-1\.4/);
      assert.match(body,/filename="synthetic-probe.pdf"/);
      res.end(JSON.stringify({pages:1,methods:["pdf-text"],skills:[{name:"Python"},{name:"SQL"}],matched_app_skills:[{assessed:false}],text:"sensitive extracted fixture content never goes in metrics"}));
    } else res.end(JSON.stringify(req.url==="/api/practical"?{demo:true,available:true,projects:[],submissions:[],reviews:[]}:assessment));
  });
  await new Promise<void>(resolve=>server.listen(0,"127.0.0.1",resolve));
  try {
    const port=(server.address() as {port:number}).port;
    const report=await runLoadProbe({plan:{...plan,origin:`http://127.0.0.1:${port}`},clients:[{cookie:"synthetic-owner-a"},{cookie:"synthetic-owner-b"}]});
    assert.equal(report.success,true);assert.equal(report.completed_requests,24);
    const resumes=seen.filter(row=>row.path==="/api/resume");
    assert.equal(resumes.length,6);
    assert.equal(new Set(resumes.map(row=>row.body.match(/Synthetic performance case ([a-zA-Z0-9-]+);/)?.[1])).size,6,"every private encoder input must vary");
    assert.ok(seen.every(row=>row.method===(row.path==="/api/practical"?"GET":"POST")));
    assert.ok(!seen.some(row=>/apply|submit|profile/.test(row.path)));
    const serialized=JSON.stringify(report);
    for(const value of ["sensitive extracted fixture","synthetic-owner","probe@example.invalid","Fictional Probe","%PDF-"])assert.ok(!serialized.includes(value));
    assert.match(report.synthetic_resume_scope,/never applied/);
  } finally {await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));}
  assert.throws(()=>syntheticResumePdf("untrusted (pdf) input"));
});

test("private-inference probe stops at parser saturation rather than hiding a fast rejection as success",async()=>{
  let calls=0;
  const report=await runLoadProbe({plan:probePlan({workload:"resume",clients:1,rounds:2}),clients:[{cookie:"synthetic-only"}],fetchImpl:async()=>{calls++;return new Response("private parser details",{status:429});}});
  assert.equal(calls,1);assert.equal(report.success,false);
  assert.equal(report.stopped_reason,"rate_limit");assert.equal(report.stages[0].successful,0);
  assert.equal(report.stages[0].p50_ms,null);assert.equal(report.stages[0].throttled,1);
  assert.ok(!JSON.stringify(report).includes("private parser details"));
});

test("a slow final successful response cannot turn an over-deadline probe into a pass",async()=>{
  let clock=0,calls=0;
  const report=await runLoadProbe({plan:{...probePlan({clients:1,rounds:1}),deadline_ms:100},clients:[{cookie:"synthetic-only"}],now:()=>clock,fetchImpl:async url=>{
    clock+=(++calls===3?200:10);
    return new Response(JSON.stringify(String(url).endsWith("/api/practical")?{demo:true,available:true,projects:[],submissions:[],reviews:[]}:assessment));
  }});
  assert.equal(calls,3);assert.equal(report.completed_requests,3);
  assert.equal(report.success,false);assert.equal(report.stopped_reason,"probe_deadline");
  assert.equal(report.duration_ms,220);assert.equal(report.stages[0].successful,3);
});

test("request abort uses the remaining workload budget instead of the full per-request timeout",async()=>{
  let calls=0,aborted=false,clock=0;
  const report=await runLoadProbe({plan:{...probePlan({clients:1,rounds:1}),deadline_ms:10000,timeout_ms:5000},clients:[{cookie:"synthetic-only"}],now:()=>clock,fetchImpl:async (url,init)=>{
    if(++calls<3) {clock=calls===2?9900:10;return new Response(JSON.stringify(assessment));}
    return new Promise<Response>((resolve,reject)=>{
      const fallback=setTimeout(()=>resolve(new Response("this late response must never be a successful result")),1500);
      init!.signal!.addEventListener("abort",()=>{aborted=true;clock=10000;clearTimeout(fallback);reject(new Error("synthetic timeout"));},{once:true});
    });
  }});
  assert.equal(aborted,true);
  assert.equal(report.success,false);assert.equal(report.stopped_reason,"probe_deadline");
  assert.equal(report.completed_requests,3);assert.equal(report.stages[0].successful,2);
});
