import type { ProbeClient } from "./loadProbe.mjs";
export type WorkspaceReadPlan = {origin:string;local:boolean;mode:"real";workload:"workspace-read";clients:2;stages:ReadonlyArray<number>;reads_per_client_per_stage:12;requests:36;pause_ms:1000;timeout_ms:15000;deadline_ms:60000};
export function workspaceReadPlan(options?:{origin?:string}):WorkspaceReadPlan;
export function runWorkspaceReadProbe(options:{origin?:string;clients:ProbeClient[];verifyIdentity:(client:ProbeClient)=>Promise<string>;fetchImpl?:typeof fetch;now?:()=>number;pause?:(ms:number)=>Promise<void>}):Promise<Record<string,any>>;
