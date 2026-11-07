// Small synthetic end-to-end probe. Never logs session capabilities or input bodies.
import { performance } from "node:perf_hooks";
import { writeFileSync } from "node:fs";
import { configure } from "./runtime.mjs";

configure();
const args = process.argv.slice(2);
const value = (name, fallback) => { const index = args.indexOf(name); return index < 0 ? fallback : args[index + 1]; };
const target = new URL(value("--base", "http://localhost:3000"));
if (target.username || target.password || target.search || target.hash || target.pathname !== "/") throw new Error("Use an origin without credentials, query or path.");
const local = ["localhost", "127.0.0.1", "[::1]"].includes(target.hostname);
if (!local && (!args.includes("--live") || target.origin !== "https://void-fill.vercel.app")) throw new Error("Remote probing requires --live and the configured production origin.");
if (!process.env.DEMO_ENTRY_KEY) throw new Error("Configure the server-only demo entry key first.");
const samples = Number(value("--samples", "3"));
if (!Number.isInteger(samples) || samples < 2 || samples > 8) throw new Error("Use 2–8 samples per endpoint.");
const measurements = [];
const jar = new Map();
async function call(path, body = {}, measure = false) {
  const start = performance.now();
  const response = await fetch(target.origin + path, { method: "POST", headers: { "Content-Type": "application/json", Cookie: [...jar].map(([key, value]) => `${key}=${value}`).join("; "), Origin: target.origin }, body: JSON.stringify(body), signal: AbortSignal.timeout(90000), redirect: "manual" });
  for (const cookie of response.headers.getSetCookie()) { const pair = cookie.split(";",1)[0]; const split = pair.indexOf("="); jar.set(pair.slice(0,split),pair.slice(split+1)); }
  const raw = await response.text();
  if (measure) measurements.push({ operation: path, status: response.status, duration_ms: Math.round((performance.now()-start)*10)/10, bytes: Buffer.byteLength(raw), app_timing: response.headers.get("server-timing") });
  if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}`);
  return JSON.parse(raw);
}
let failed = false;
try {
  await call("/api/demo/start", {key: process.env.DEMO_ENTRY_KEY, role: 0});
  for (let i=0;i<samples;i++) {
    await call("/api/demo/lease", {tab:"bounded-latency-probe"});
    await call("/api/ai/recommend-courses", {}, true);
    await call("/api/ai/generate-questions", {}, true);
    await call("/api/ai/analyze", {}, true);
  }
} catch (error) { failed = true; console.error(error.message); }
finally { if (jar.size) await call("/api/demo/end").catch(()=>{ failed=true; console.error("Synthetic session cleanup failed; it will expire under its existing lease."); }); }
const quantile = (values, q) => [...values].sort((a,b)=>a-b)[Math.max(0,Math.ceil(values.length*q)-1)];
const routes = [...new Set(measurements.map(item=>item.operation))].map(operation=>{
  const rows=measurements.filter(item=>item.operation===operation), timings=rows.map(item=>item.duration_ms);
  return {operation,samples:rows.length,first_observed_ms:timings[0],p50_ms:quantile(timings,.5),p95_ms:quantile(timings,.95),statuses:rows.map(item=>item.status)};
});
const report={measured_at:new Date().toISOString(),origin:target.origin,scope:"Small sequential synthetic-demo probe from the caller's network. First observed is not a proven cold start. This is not a real-user capacity test or latency SLA; real-account DB/auth costs differ.",success:!failed,routes,measurements};
if (value("--output")) writeFileSync(value("--output"),JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify(report,null,2));
if(failed) process.exitCode=1;
