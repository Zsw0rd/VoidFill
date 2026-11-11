import type {ProbeClient} from "./loadProbe.mjs";
export const DOCUMENT_CASES:ReadonlyArray<{id:string;status:number;error:string|null}>;
export function documentProbePlan(options?:{origin?:string;live?:boolean}):{origin:string;local:boolean;clients:number;cases:ReadonlyArray<string>;requests:number;timeout_ms:number;deadline_ms:number;max_upload_bytes:number};
export type DocumentProbeFixture={id:string;filename:string;bytes:number;data:Buffer;app_status:number;pages:number|null;methods:string[];required_text:string[]};
export function runDocumentProbe(options:{origin?:string;live?:boolean;clients:ProbeClient[];fixtures:DocumentProbeFixture[];renew:(client:ProbeClient)=>Promise<unknown>;snapshot:(client:ProbeClient)=>Promise<unknown>;fetchImpl?:typeof fetch;now?:()=>number;budgetMs?:number}):Promise<Record<string,any>>;
