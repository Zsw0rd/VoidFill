import test from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {DOCUMENT_CASES, documentProbePlan, runDocumentProbe} from "../lib/documentProbe.mjs";

const clients=()=>[0,1].map(index=>({cookie:`vf_demo_session=fictional-session-${index}`}));
const fixtures=()=>DOCUMENT_CASES.map(row=>({id:row.id,filename:row.id+(row.id.startsWith("docx-")?".docx":".pdf"),bytes:10,data:Buffer.alloc(10),app_status:row.status,pages:row.id.startsWith("docx-")?null:1,methods:row.id.startsWith("docx-")?["docx-paragraphs-tables-textboxes"]:["pdf-text"],required_text:["Python","SQL"]}));
const payload=(text="Python SQL fictional content",pages:number|null=1,methods=["pdf-text"])=>({pages,page_count_known:pages!==null,methods,text,skills:[{name:"Python"},{name:"SQL"}],matched_app_skills:[{assessed:false}]});
const hooks={renew:async()=>{},snapshot:async()=>({profile:{direction:"fictional"},stats:{xp:0}})};

test("document matrix confines origins, negative cases and total upload count",()=>{
  const local=documentProbePlan();assert.equal(local.requests,16);assert.equal(local.clients,2);assert.equal(local.deadline_ms,180000);
  const hosted=documentProbePlan({origin:"https://void-fill.vercel.app",live:true});assert.equal(hosted.requests,10);assert.equal(hosted.cases.length,8);assert.ok(hosted.cases.every(id=>!id.startsWith("reject-")));
  for(const origin of ["https://other.invalid","https://void-fill.vercel.app/path","https://user:secret@void-fill.vercel.app","https://void-fill.vercel.app?x=1"])assert.throws(()=>documentProbePlan({origin,live:true}));
  assert.throws(()=>documentProbePlan({origin:"https://void-fill.vercel.app"}));
  const help=spawnSync(process.execPath,["scripts/test-document-matrix.mjs","--help"],{encoding:"utf8"});assert.equal(help.status,0);assert.match(help.stdout,/No requests sent/);
});

test("all fixed cases plus one paired round retain isolation without serializing documents or workspaces",async()=>{
  let active=0,peak=0;
  const seen:{method:string;url:string}[]=[];
  const rows=fixtures();
  const report=await runDocumentProbe({clients:clients(),fixtures:rows,...hooks,fetchImpl:async(url,init)=>{
    active++;peak=Math.max(peak,active);seen.push({method:init?.method||"",url:String(url)});
    await new Promise(resolve=>setTimeout(resolve,1));
    const file=(init!.body as FormData).get("file") as File;
    let response;
    if(file.name==="paired-fictional.pdf"){
      const pdf=await file.text();const marker=pdf.match(/Synthetic performance case ([a-zA-Z0-9-]+);/)![1];response=new Response(JSON.stringify(payload(`Python SQL ${marker}`)));
    }else{const fixture=rows.find(row=>file.name===row.filename)!;const spec=DOCUMENT_CASES.find(row=>row.id===fixture.id)!;response=new Response(JSON.stringify(spec.status===200?payload(undefined,fixture.pages,fixture.methods):{error:spec.error}),{status:spec.status});}
    active--;return response;
  }});
  assert.equal(report.success,true);assert.equal(report.completed_requests,16);assert.equal(report.peak_in_flight,2);assert.equal(peak,2);
  assert.equal(report.profiles_scores_xp_unchanged,true);assert.ok(seen.every(row=>row.method==="POST"&&row.url==="http://localhost:3000/api/resume"));
  const encoded=JSON.stringify(report);for(const text of ["fictional-session","fictional content","direction","%PDF-","Synthetic performance case"])assert.ok(!encoded.includes(text));
});

test("an error from the wrong guard and unexpected server failures stop immediately",async()=>{
  for(const response of [new Response("private upstream failure",{status:503}),new Response(JSON.stringify({error:"unrelated limit"}),{status:422}),new Response(JSON.stringify({...payload(),matched_app_skills:[{assessed:true}]}))]){
    let calls=0;
    const report=await runDocumentProbe({clients:clients(),fixtures:fixtures(),...hooks,fetchImpl:async()=>{calls++;return response;}});
    assert.equal(report.success,false);assert.equal(calls,1);assert.equal(report.completed_requests,1);assert.ok(!JSON.stringify(report).includes("private upstream failure"));
  }
});

test("a matching rejection status must still identify the intended document limit",async()=>{
  const rows=fixtures();let calls=0;
  const report=await runDocumentProbe({clients:clients(),fixtures:rows,...hooks,fetchImpl:async(_url,init)=>{
    calls++;const file=(init!.body as FormData).get("file") as File;
    const fixture=rows.find(row=>row.filename===file.name)!;
    const spec=DOCUMENT_CASES.find(row=>row.id===fixture.id)!;
    return new Response(JSON.stringify(spec.status===200?payload(undefined,fixture.pages,fixture.methods):{error:"A different guard rejected this input"}),{status:spec.status});
  }});
  assert.equal(calls,DOCUMENT_CASES.findIndex(row=>row.id==="reject-page-limit")+1);
  assert.equal(report.success,false);assert.equal(report.stopped_reason,"unexpected_payload");
});

test("paired responses containing the other document's marker fail isolation even when their own marker is present",async()=>{
  const rows=fixtures();
  const pending:{marker:string;resolve:(response:Response)=>void}[]=[];
  const report=await runDocumentProbe({clients:clients(),fixtures:rows,...hooks,fetchImpl:async(_url,init)=>{
    const file=(init!.body as FormData).get("file") as File;
    if(file.name==="paired-fictional.pdf"){
      const marker=(await file.text()).match(/Synthetic performance case ([a-zA-Z0-9-]+);/)![1];
      return new Promise<Response>(resolve=>{pending.push({marker,resolve});if(pending.length===2){const leaked=pending.map(row=>row.marker).join(" ");for(const row of pending)row.resolve(new Response(JSON.stringify(payload(`Python SQL ${leaked}`))));}});
    }
    const fixture=rows.find(row=>row.filename===file.name)!;const spec=DOCUMENT_CASES.find(row=>row.id===fixture.id)!;
    return new Response(JSON.stringify(spec.status===200?payload(undefined,fixture.pages,fixture.methods):{error:spec.error}),{status:spec.status});
  }});
  assert.equal(report.success,false);assert.equal(report.stopped_reason,"unexpected_payload");
  assert.equal(report.measurements.filter((row:any)=>row.case==="paired-text-single"&&row.ok===false).length,2);
});

test("real sessions and malformed or missing fixture banks are rejected before uploads",async()=>{
  let calls=0;
  const fetchImpl=async()=>{calls++;return new Response(JSON.stringify(payload()));};
  for(const options of [
    {clients:[{cookie:"sb-project-auth-token=real-mode-cookie"},clients()[1]],fixtures:fixtures()},
    {clients:clients(),fixtures:fixtures().slice(1)},
    {clients:clients(),fixtures:fixtures().map(row=>({...row,filename:"../private.pdf"}))},
  ])await assert.rejects(runDocumentProbe({...options,...hooks,fetchImpl}));
  assert.equal(calls,0);
});

test("snapshots cannot hide an over-deadline run or unexpected progress mutation",async()=>{
  let clock=0,snapshots=0;
  const report=await runDocumentProbe({clients:clients(),fixtures:fixtures(),renew:async()=>{},now:()=>clock,
    snapshot:async()=>{snapshots++;if(snapshots>2)clock=180001;return {xp:snapshots>2?50:0};},
    fetchImpl:async()=>{clock=180000;return new Response(JSON.stringify(payload()));}});
  assert.equal(report.success,false);assert.equal(report.stopped_reason,"probe_deadline");assert.equal(report.profiles_scores_xp_unchanged,false);assert.equal(report.completed_requests,1);
});

test("an outer operator budget can shorten but never extend the matrix deadline",async()=>{
  let clock=0;
  const report=await runDocumentProbe({clients:clients(),fixtures:fixtures(),...hooks,budgetMs:1000,now:()=>clock,fetchImpl:async()=>{clock=1001;return new Response(JSON.stringify(payload()));}});
  assert.equal(report.success,false);assert.equal(report.stopped_reason,"probe_deadline");assert.equal(report.completed_requests,1);assert.equal(report.deadline_ms,1000);
  for(const budgetMs of [0,-1,Infinity,180001])await assert.rejects(runDocumentProbe({clients:clients(),fixtures:fixtures(),...hooks,budgetMs}));
});
