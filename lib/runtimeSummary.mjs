/** Copy only known numeric metadata out of potentially sensitive platform logs. */
const requestEvents=new Set(["api_request","ml_request"]),initialization=new Set(["learning_engine","onnx_session"]);
const operations=new Set(["assessment","daily_assessment","roadmap_assessment","daily_submission","practice_submission","roadmap_submission","recommendation","insight","resume","chat","practical","health","guest","other"]);
const number=(value,max=1e15)=>typeof value==="number"&&Number.isFinite(value)&&value>=0&&value<=max?value:null;
const uuid=value=>typeof value==="string"&&/^[a-f0-9-]{36}$/.test(value)?value:null;
export function privateRuntimeEvent(line) {
  if(typeof line!=="string"||line.length>65536)return null;
  let value;try{value=JSON.parse(line);}catch{return null;}
  if(value?.type==="log"&&value.data&&typeof value.data==="object")value=value.data;
  if(value&&typeof value.message==="string")try{value=JSON.parse(value.message);}catch{return null;}
  if(!value||typeof value!=="object"||Array.isArray(value))return null;
  if(requestEvents.has(value.event)) {
    if(!operations.has(value.operation)||!Number.isInteger(value.status)||value.status<100||value.status>599||number(value.duration_ms,3600000)===null)return null;
    const r=value.runtime||{};
    return {event:value.event,operation:value.operation,status:value.status,duration_ms:value.duration_ms,runtime_id:uuid(r.runtime_id),first_request_in_process:r.first_request_in_process===true,
      runtime_age_ms:number(r.runtime_age_ms),process_uptime_ms:number(r.process_uptime_ms),rss_bytes:number(r.rss_bytes),peak_rss_bytes:number(r.peak_rss_bytes),heap_used_bytes:number(r.heap_used_bytes),process_cpu_delta_us:number(r.process_cpu_delta_us)};
  }
  if(value.event==="ml_initialization"&&initialization.has(value.component)&&typeof value.succeeded==="boolean"&&number(value.duration_ms,3600000)!==null)return {event:value.event,component:value.component,succeeded:value.succeeded,duration_ms:value.duration_ms,runtime_id:uuid(value.runtime_id),rss_bytes:number(value.rss_bytes),peak_rss_bytes:number(value.peak_rss_bytes)};
  return null;
}
const percentile=(values,q)=>values.length?[...values].sort((a,b)=>a-b)[Math.max(0,Math.ceil(values.length*q)-1)]:null;
export function summarizeRuntimeEvents(events,{memoryMiB=null}={}) {
  if(memoryMiB!==null&&(!Number.isInteger(memoryMiB)||memoryMiB<128||memoryMiB>32768))throw new Error("Use a known provisioned memory limit from 128 to 32768 MiB.");
  const requests=events.filter(row=>requestEvents.has(row.event)),initializations=events.filter(row=>row.event==="ml_initialization");
  const summaries=[...new Set(requests.map(row=>`${row.event}:${row.operation}`))].sort().map(key=>{
    const rows=requests.filter(row=>`${row.event}:${row.operation}`===key),durations=rows.filter(row=>row.status>=200&&row.status<300).map(row=>row.duration_ms),memory=rows.map(row=>row.rss_bytes??row.peak_rss_bytes).filter(value=>value!==null),errors=rows.filter(row=>row.status>=500).length;
    return {service:key.startsWith("ml_")?"learning":"web",operation:rows[0].operation,observed:rows.length,successful:durations.length,server_errors:errors,throttled:rows.filter(row=>row.status===429).length,
      sample_p50_ms:percentile(durations,.5),sample_p95_ms:percentile(durations,.95),max_observed_rss_bytes:memory.length?Math.max(...memory):null,
      first_requests_observed:rows.filter(row=>row.first_request_in_process).length,
      observed_runtime_count:new Set(rows.map(row=>row.runtime_id).filter(Boolean)).size,
      alerts:[...(rows.length>=20&&errors>=3&&errors/rows.length>=.05?["sample_5xx_rate_at_least_5_percent"]:[]),...(durations.length>=20&&percentile(durations,.95)>5000?["sample_p95_exceeds_5_seconds"]:[]),...(memoryMiB&&memory.some(value=>value>=memoryMiB*1048576*.85)?["observed_process_memory_at_least_85_percent_of_configured_limit"]:[])]};
  });
  return {version:1,scope:"Aggregate of supplied private metadata only. Platform sampling, retention, route/process sharing and the selected log window limit interpretation. Process CPU/RSS are shared across concurrent requests. First-process observations and explicit initialization events are not a complete platform cold-start count.",valid_request_events:requests.length,initializations:initializations.map(row=>({component:row.component,succeeded:row.succeeded,duration_ms:row.duration_ms,rss_bytes:row.rss_bytes,peak_rss_bytes:row.peak_rss_bytes})),operations:summaries,alert_count:summaries.reduce((sum,row)=>sum+row.alerts.length,0),provisioned_memory_mib:memoryMiB};
}
