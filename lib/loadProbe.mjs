/** Bounded diagnostics only. Never serialize clients, cookies or response bodies. */
import { performance } from "node:perf_hooks";

export const PROBE_OPERATIONS = Object.freeze([
  { name: "practice_generation", path: "/api/roadmap/assess", body: { purpose: "practice" } },
  { name: "daily_generation", path: "/api/ai/generate-questions", body: {} },
  { name: "practical_read", path: "/api/practical", body: null },
]);

export function probePlan({ origin="http://localhost:3000", mode="demo", clients=4, rounds=2, live=false, pauseMs=0 }={}) {
  let base;
  try { base=new URL(origin); } catch { throw new Error("Use a valid application origin."); }
  if (base.username || base.password || base.search || base.hash || base.pathname!=="/") throw new Error("Use an origin without credentials, query or path.");
  const local=["localhost","127.0.0.1","[::1]"].includes(base.hostname) && base.protocol==="http:";
  if (!local && (!live || base.origin!=="https://void-fill.vercel.app")) throw new Error("Remote probes require --live and the configured production origin.");
  if (!["demo","real"].includes(mode) || !Number.isInteger(clients) || clients<1 || !Number.isInteger(rounds) || rounds<1 || rounds>10) throw new Error("Use demo/real mode, a valid client count and one to ten rounds.");
  // Larger probes belong only on an operator's loopback demo server. Keep the
  // production traffic envelope and real-account limits unchanged.
  const maxClients=local && mode==="demo" ? 16 : 4;
  if(clients>maxClients) throw new Error("Up to sixteen clients are available only for local disposable demos; other modes allow at most four.");
  if(!Number.isInteger(pauseMs) || pauseMs<0 || pauseMs>2000 || (pauseMs>0 && (!local || mode!=="demo"))) throw new Error("Round pauses of up to two seconds are available only for local disposable demos.");
  if (!local && (rounds>2 || (mode==="real" && clients>2))) throw new Error("Live traffic is limited to two rounds and at most two real accounts.");
  const stages=[1,2,4,8,16].filter(value=>value<=clients);
  if (!stages.includes(clients)) stages.push(clients);
  const requests=stages.reduce((sum,value)=>sum+value*rounds*PROBE_OPERATIONS.length,0);
  return Object.freeze({origin:base.origin,local,mode,clients,rounds,stages,requests,pause_ms:pauseMs,timeout_ms:90000,deadline_ms:180000});
}

export function validateProbeSessions(value, plan) {
  if (!value || typeof value!=="object" || Array.isArray(value) || Object.keys(value).sort().join(",")!=="origin,sessions,version" || value.version!==1 || value.origin!==plan.origin || !Array.isArray(value.sessions) || value.sessions.length!==plan.clients) throw new Error("Session file must match the exact origin and client count.");
  const cookies=value.sessions.map(session=>{
    if (!session || typeof session!=="object" || Array.isArray(session) || Object.keys(session).join(",")!=="cookie" || typeof session.cookie!=="string" || session.cookie.length<16 || session.cookie.length>32768 || /[\r\n\0]/.test(session.cookie) || /(?:^|;)\s*vf_demo_(?:session|active)\s*=/i.test(session.cookie) || !/(?:^|;)\s*sb-[a-z0-9-]+-auth-token(?:\.\d+)?=/.test(session.cookie)) throw new Error("Use only fresh Supabase application sessions for controlled test accounts.");
    return session.cookie;
  });
  if (new Set(cookies).size!==cookies.length) throw new Error("Each configured client must have a separate session.");
  return cookies;
}

function quantile(values,q) {
  if (!values.length) return null;
  const sorted=[...values].sort((a,b)=>a-b);
  return sorted[Math.max(0,Math.ceil(sorted.length*q)-1)];
}
function oneDecimal(value) { return Math.round(value*10)/10; }
export function latencySummary(rows) {
  const values=rows.filter(row=>row.ok).map(row=>row.duration_ms);
  return {samples:rows.length,successful:values.length,p50_ms:quantile(values,.5),sample_p95_ms:quantile(values,.95),max_ms:values.length?Math.max(...values):null,
    p95_evidence:values.length<20?"fewer_than_20_successful_samples":"observed_sample_only_not_an_sla",
    throttled:rows.filter(row=>row.status===429).length,server_errors:rows.filter(row=>row.status>=500).length,
    auth_errors:rows.filter(row=>[401,403].includes(row.status)).length,transport_errors:rows.filter(row=>row.status===0).length};
}

async function readJson(response) {
  const reader=response.body?.getReader();
  if (!reader) throw new Error("invalid_response");
  const chunks=[]; let bytes=0;
  try {
    while (true) {
      const {value,done}=await reader.read();
      if(done) break;
      bytes+=value.length;
      if(bytes>524288) { await reader.cancel(); throw new Error("response_size"); }
      chunks.push(value);
    }
    const raw=Buffer.concat(chunks.map(value=>Buffer.from(value)));
    return {data:JSON.parse(new TextDecoder("utf8",{fatal:true}).decode(raw)),bytes};
  } finally {reader.releaseLock();}
}

function expectedPayload(data,operation,mode) {
  if(operation.name==="practical_read") return data?.available===true && data?.demo===(mode==="demo") && ["projects","submissions","reviews"].every(key=>Array.isArray(data[key]));
  return Array.isArray(data?.questions) && data.questions.length===10 && typeof data.assessment_token==="string" && data.assessment_token.length>20 && data.questions.every(question=>typeof question?.id==="string" && Array.isArray(question.options) && question.options.length>=2 && !["correct_index","explanation","answer"].some(key=>Object.hasOwn(question,key)));
}

export async function runLoadProbe({plan,clients,fetchImpl=fetch,verifyIdentity,renew,now=()=>performance.now(),pause=ms=>new Promise(resolve=>setTimeout(resolve,ms))}) {
  if (!Array.isArray(clients) || clients.length!==plan.clients || clients.some(client=>typeof client.cookie!=="string")) throw new Error("Authenticated clients are required.");
  if(plan.mode==="real") {
    if(typeof verifyIdentity!=="function") throw new Error("Real sessions require server-verified identities.");
    const identities=[];
    for(const client of clients) {
      let identity;
      try {identity=await verifyIdentity(client);} catch {throw new Error("Real-account authentication failed before load; no workload was sent.");}
      if(typeof identity!=="string" || !identity || identities.includes(identity)) throw new Error("Real clients must authenticate as different controlled users.");
      identities.push(identity);
    }
  }
  const started=now(), measurements=[], stages=[];
  let inFlight=0,peak=0,stopped=null;
  for(const count of plan.stages) {
    if(stopped) break;
    // Paced local runs can leave the later-stage demo clients idle for over a
    // minute. Renew their ordinary leases while waiting, like an open UI tab.
    // Never lengthen application sessions or add this traffic to live probes.
    if(plan.local && plan.mode==="demo" && plan.pause_ms && renew) {
      try {await Promise.all(clients.map(client=>renew(client)));}
      catch {stopped="session_renewal_failed";break;}
    }
    const start=now(), first=measurements.length;
    await Promise.all(clients.slice(0,count).map(async(client,index)=>{
      for(let round=0;round<plan.rounds;round++) {
        if(stopped) return;
        if(round && plan.pause_ms) {
          await pause(plan.pause_ms);
          if(stopped) return;
        }
        if(renew) {
          try {await renew(client);} catch {stopped="session_renewal_failed";return;}
        }
        for(const operation of PROBE_OPERATIONS) {
          if(stopped) return;
          if(now()-started>plan.deadline_ms) {stopped="probe_deadline";return;}
          const begin=now(); inFlight++; peak=Math.max(peak,inFlight);
          let row={stage_clients:count,client:index+1,round:round+1,operation:operation.name,status:0,ok:false,duration_ms:0,bytes:0,app_ms:null,failure:null};
          try {
            const response=await fetchImpl(plan.origin+operation.path,{method:operation.body===null?"GET":"POST",headers:{Cookie:client.cookie,Origin:plan.origin,"Content-Type":"application/json"},...(operation.body===null?{}:{body:JSON.stringify(operation.body)}),redirect:"manual",signal:AbortSignal.timeout(plan.timeout_ms)});
            row.status=response.status;
            const timing=response.headers.get("Server-Timing")?.match(/(?:^|,)\s*app;dur=(\d+(?:\.\d+)?)(?:\s|,|$)/);
            if(timing) row.app_ms=Number(timing[1]);
            const cookies=response.headers.getSetCookie?.() || [];
            if(cookies.length && typeof client.updateCookies==="function") client.updateCookies(cookies);
            if(response.status===200) {
              const parsed=await readJson(response); row.bytes=parsed.bytes;
              row.ok=expectedPayload(parsed.data,operation,plan.mode);
              if(!row.ok) row.failure="unexpected_payload";
            } else {
              await response.body?.cancel();
              row.failure=response.status===429?"rate_limit":[401,403].includes(response.status)?"authentication":response.status>=500?"server_error":"unexpected_status";
            }
          } catch {row.failure="transport_or_response_error";}
          finally {inFlight--;row.duration_ms=oneDecimal(now()-begin);measurements.push(row);}
          if(!row.ok) {stopped=row.failure;return;}
        }
      }
    }));
    const rows=measurements.slice(first), duration=oneDecimal(now()-start);
    stages.push({clients:count,duration_ms:duration,throughput_rps:duration?oneDecimal(rows.filter(row=>row.ok).length/(duration/1000)):0,...latencySummary(rows),operations:PROBE_OPERATIONS.map(operation=>({operation:operation.name,...latencySummary(rows.filter(row=>row.operation===operation.name))}))});
  }
  return {version:1,measured_at:new Date().toISOString(),origin:plan.origin,mode:plan.mode,round_pause_ms:plan.pause_ms,
    scope:plan.mode==="real"?"Controlled authenticated application sessions; generation and private-workspace reads only. Budgets are consumed; no quiz is submitted and no XP is awarded.":"Disposable demo sessions. Their authentication/storage and quota bypass differ from real accounts; this is not real-user capacity evidence.",
    cold_start:"Not inferred from request order. Correlate first_request_in_process/runtime-age metadata with Vercel instance starts; first observed requests alone do not prove cold starts.",
    percentile_method:"Nearest-rank observed sample percentiles, separated by concurrency stage and operation. Small samples and short bounded runs do not establish an SLA or maximum capacity.",
    configured_requests:plan.requests,completed_requests:measurements.length,peak_in_flight:peak,duration_ms:oneDecimal(now()-started),success:!stopped,stopped_reason:stopped,stages,measurements};
}
