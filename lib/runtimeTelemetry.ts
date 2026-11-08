import { randomUUID } from "node:crypto";

type ProcessState = { id:string; started:number; requests:number };
const stateKey=Symbol.for("voidfill.private-runtime-observation.v1");
const registry=globalThis as typeof globalThis & {[key:symbol]:ProcessState|undefined};
const processState=registry[stateKey] ||= {id:randomUUID(),started:performance.now(),requests:0};

export function beginRuntimeObservation() {
  const first=processState.requests++===0;
  return {first,cpu:process.cpuUsage()};
}

/** Process-wide snapshots only: concurrent requests share RSS and CPU deltas. */
export function privateRuntimeObservation(start:ReturnType<typeof beginRuntimeObservation>) {
  const memory=process.memoryUsage(),cpu=process.cpuUsage(start.cpu);
  return {
    runtime_id:processState.id,
    first_request_in_process:start.first,
    runtime_age_ms:Math.round(performance.now()-processState.started),
    process_uptime_ms:Math.round(process.uptime()*1000),
    rss_bytes:memory.rss,
    heap_used_bytes:memory.heapUsed,
    process_cpu_delta_us:cpu.user+cpu.system,
  };
}
