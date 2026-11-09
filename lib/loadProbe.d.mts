export type ProbePlan = {origin:string;local:boolean;mode:"demo"|"real";workload:"core"|"resume";clients:number;rounds:number;stages:number[];requests:number;pause_ms:number;timeout_ms:number;deadline_ms:number};
export type ProbeClient = {cookie:string;updateCookies?:(headers:string[])=>void};
export const PROBE_OPERATIONS: ReadonlyArray<{name:string;path:string;body:Record<string,string>|null}>;
export function probePlan(options?:{origin?:string;mode?:string;clients?:number;rounds?:number;live?:boolean;pauseMs?:number;workload?:string}):ProbePlan;
export function validateProbeSessions(value:unknown,plan:ProbePlan):string[];
export function latencySummary(rows:Array<{ok:boolean;duration_ms:number;status:number}>):Record<string,unknown>;
export function runLoadProbe(options:{plan:ProbePlan;clients:ProbeClient[];fetchImpl?:typeof fetch;verifyIdentity?:(client:ProbeClient)=>Promise<string>;renew?:(client:ProbeClient)=>Promise<void>;now?:()=>number;pause?:(ms:number)=>Promise<void>}):Promise<Record<string,any>>;
