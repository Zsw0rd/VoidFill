import test from "node:test";
import assert from "node:assert/strict";
import {privateRuntimeEvent,summarizeRuntimeEvents} from "../lib/runtimeSummary.mjs";

test("runtime parsing whitelists metadata and drops all raw platform/user fields",()=>{
  const event={event:"api_request",operation:"roadmap_assessment",status:200,duration_ms:12.5,email:"private@example.invalid",cookie:"private-session",body:"private evidence",runtime:{runtime_id:"11111111-1111-4111-8111-111111111111",first_request_in_process:true,rss_bytes:100,heap_used_bytes:50,process_cpu_delta_us:20,secret:"hidden"}};
  const parsed=privateRuntimeEvent(JSON.stringify({message:JSON.stringify(event),authorization:"hidden"}));
  assert.ok(parsed);const output=JSON.stringify(parsed);
  for(const text of ["private@example","private-session","private evidence","hidden","authorization","email","cookie"])assert.ok(!output.includes(text));
  assert.equal(parsed?.rss_bytes,100);assert.equal(parsed?.first_request_in_process,true);
  const cli=privateRuntimeEvent(JSON.stringify({type:"log",data:{message:JSON.stringify(event),requestPath:"/private-secret",attributes:{secret:"hidden"}}}));
  assert.deepEqual(cli,parsed);
  assert.equal(privateRuntimeEvent(JSON.stringify({type:"summary",recordsReturned:1})),null);
  assert.equal(privateRuntimeEvent("not JSON private secret"),null);
  assert.equal(privateRuntimeEvent(JSON.stringify({...event,operation:"private-session"})),null);
});

test("runtime summaries separate throttling, slow failures, process initialization and memory pressure",()=>{
  const rows=Array.from({length:20},(_,index)=>privateRuntimeEvent(JSON.stringify({event:"ml_request",operation:"assessment",status:index<3?503:index===3?429:200,duration_ms:7000,runtime:{rss_bytes:950*1048576,first_request_in_process:index===0,runtime_id:"11111111-1111-4111-8111-111111111111"}}))!);
  rows.push(privateRuntimeEvent(JSON.stringify({event:"ml_initialization",component:"onnx_session",succeeded:true,duration_ms:200,rss_bytes:900}))!);
  const report=summarizeRuntimeEvents(rows,{memoryMiB:1024});
  assert.equal(report.valid_request_events,20);assert.equal(report.initializations[0].component,"onnx_session");
  assert.equal(report.operations[0].server_errors,3);assert.equal(report.operations[0].throttled,1);assert.equal(report.operations[0].observed_runtime_count,1);
  assert.deepEqual(report.operations[0].alerts,["sample_5xx_rate_at_least_5_percent","observed_process_memory_at_least_85_percent_of_configured_limit"]);
  assert.equal(report.alert_count,2);assert.throws(()=>summarizeRuntimeEvents(rows,{memoryMiB:0}));
  const small=summarizeRuntimeEvents(rows.slice(0,2));assert.equal(small.alert_count,0);
});
