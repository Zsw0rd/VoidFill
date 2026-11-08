/** Public reachability only: this never authenticates or contacts private inference. */
import {performance} from "node:perf_hooks";

export const PUBLIC_CHECKS=Object.freeze([
  {name:"landing",path:"/",status:200,html:true},
  {name:"login",path:"/auth/login",status:200,html:true},
  {name:"signup",path:"/auth/signup",status:200,html:true},
  {name:"privacy",path:"/privacy",status:200,html:true},
  {name:"learner_auth_boundary",path:"/dashboard",status:307,redirect:"/auth/login"},
  {name:"assessment_auth_boundary",path:"/api/roadmap/assess",status:401,body:{purpose:"practice"}},
]);
export function publicProbeOrigin(origin,{live=false}={}) {
  let url;try{url=new URL(origin);}catch{throw new Error("Invalid public probe origin.");}
  if(url.username||url.password||url.search||url.hash||url.pathname!=="/")throw new Error("Use a bare origin.");
  const local=url.protocol==="http:"&&["127.0.0.1","localhost","[::1]"].includes(url.hostname);
  if(!local && (!live || url.origin!=="https://void-fill.vercel.app"))throw new Error("Production public checks require --live and the configured hostname.");
  return url.origin;
}
export async function checkPublicAvailability({origin,live=false,fetchImpl=fetch,now=()=>performance.now()}) {
  const base=publicProbeOrigin(origin,{live}),checks=[];
  for(const check of PUBLIC_CHECKS) {
    const attempts=[];
    for(let attempt=0;attempt<2;attempt++) {
      const start=now();let status=0,ok=false,failure=null,bytes=0;
      try {
        const response=await fetchImpl(base+check.path,{method:check.body?"POST":"GET",headers:{Origin:base,...(check.body?{"Content-Type":"application/json"}:{})},...(check.body?{body:JSON.stringify(check.body)}:{}),redirect:"manual",signal:AbortSignal.timeout(15000)});
        status=response.status;ok=status===check.status;
        if(!ok)failure="unexpected_status";
        if(ok&&check.redirect) {
          let destination;try{destination=new URL(response.headers.get("location"),base);}catch{}
          ok=!!destination&&destination.origin===base&&destination.pathname===check.redirect;
          if(!ok)failure="unsafe_or_missing_login_redirect";
        }
        if(ok&&check.html) {
          const reader=response.body?.getReader(),parts=[];
          if(!reader)throw new Error();
          try {
            while(true) {const chunk=await reader.read();if(chunk.done)break;bytes+=chunk.value.length;if(bytes>2097152){await reader.cancel();throw new Error();}parts.push(Buffer.from(chunk.value));}
          } finally {reader.releaseLock();}
          const html=Buffer.concat(parts).toString("utf8");
          ok=html.toLowerCase().includes("voidfill")&&!/application error:|internal server error/i.test(html);
          if(!ok)failure="unexpected_public_page";
        } else await response.body?.cancel();
      } catch {ok=false;failure="transport_or_response_error";}
      const duration_ms=Math.round((now()-start)*10)/10;
      attempts.push({status,ok,failure,duration_ms,bytes});
      if(ok)break;
    }
    checks.push({check:check.name,expected_status:check.status,ok:attempts.at(-1).ok,slow:attempts.at(-1).duration_ms>8000,attempts});
  }
  return {version:1,measured_at:new Date().toISOString(),origin:base,scope:"Unauthenticated public page and access-boundary checks only. A passing report does not prove Google sign-in, Supabase availability, signed-in learning, private inference health or capacity.",success:checks.every(check=>check.ok),checks};
}
