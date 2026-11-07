import test from "node:test";
import assert from "node:assert/strict";
import { operationBudget, withApiTelemetry } from "../lib/apiOperations";

test("missing shared budget fails closed while verified synthetic sessions avoid real-account counters", async () => {
  const saved = process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  try {
    const denied = await operationBudget({}, "00000000-0000-0000-0000-000000000001", "resume");
    assert.equal(denied?.status,503);
    assert.equal(denied?.headers.get("Retry-After"),"30");
    assert.equal(await operationBudget({__demoToken:"verified-synthetic-session"},"synthetic-user","resume"),null);
  } finally { if(saved === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY=saved; }
});

test("request timing records metadata and generates its own id without logging private query or body", async () => {
  const original = console.info;
  const entries: string[]=[];
  console.info=(value)=>{entries.push(String(value));};
  try {
    const run=withApiTelemetry("assessment",async()=>new Response("{}",{status:200}));
    const response=await run(new Request("https://voidfill.invalid/api/test?private=secret",{method:"POST",body:"private resume text",headers:{"X-Request-Id":"untrusted-input"}}));
    assert.equal(response.status,200);
    assert.match(response.headers.get("X-Request-Id")||"",/^[a-f0-9-]{36}$/);
    assert.match(response.headers.get("Server-Timing")||"",/app;dur=/);
    assert.equal(response.headers.get("Cache-Control"),"private, no-store");
    const logged=JSON.parse(entries[0]);
    assert.deepEqual(Object.keys(logged).sort(),["duration_ms","event","operation","request_id","status"]);
    assert.ok(!entries.join().includes("secret") && !entries.join().includes("resume text"));
    const failed=await withApiTelemetry("assessment",async()=>{throw new Error("sensitive upstream data");})(new Request("https://voidfill.invalid/api/test"));
    assert.equal(failed.status,500);
    assert.ok(!(await failed.text()).includes("sensitive"));
    let called=false;
    const crossOrigin=await withApiTelemetry("resume",async()=>{called=true; return new Response("{}");})(new Request("https://voidfill.invalid/api/test",{method:"POST",headers:{Origin:"https://unrelated.invalid"}}));
    assert.equal(crossOrigin.status,403);
    assert.equal(called,false);
  } finally {console.info=original;}
});

test("planned release pause prevents learning handlers from mutating progress",async()=>{
  const saved=process.env.LEARNING_MAINTENANCE;
  const original=console.info;
  console.info=()=>{};
  process.env.LEARNING_MAINTENANCE="1";
  let called=false;
  try {
    const response=await withApiTelemetry("daily_submission",async()=>{called=true;return new Response("{}");})(new Request("http://localhost/api/daily-test/submit",{method:"POST"}));
    assert.equal(response.status,503); assert.equal(called,false); assert.equal(response.headers.get("Retry-After"),"60");
  } finally {
    if(saved===undefined) delete process.env.LEARNING_MAINTENANCE; else process.env.LEARNING_MAINTENANCE=saved;
    console.info=original;
  }
});

test("shared practical budgets send only the verified identity and return a private retry response", async () => {
  const prior = {fetch: globalThis.fetch, key: process.env.SUPABASE_SERVICE_ROLE_KEY, url: process.env.NEXT_PUBLIC_SUPABASE_URL};
  process.env.SUPABASE_SERVICE_ROLE_KEY = "synthetic-server-key";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  try {
    globalThis.fetch = async (url, options) => {
      assert.equal(String(url), "https://example.supabase.co/rest/v1/rpc/vf_consume_operation_budget");
      assert.equal(new Headers(options?.headers).get("Authorization"), "Bearer synthetic-server-key");
      assert.deepEqual(JSON.parse(String(options?.body)), {p_user_id: "verified-user", p_operation: "practical"});
      return new Response(JSON.stringify({allowed: false, retry_after: 42}));
    };
    const response = await operationBudget({}, "verified-user", "practical");
    assert.equal(response?.status, 429);
    assert.equal(response?.headers.get("Retry-After"), "42");
    assert.equal(response?.headers.get("Cache-Control"), "private, no-store");
  } finally {
    globalThis.fetch = prior.fetch;
    for (const [name, value] of [["SUPABASE_SERVICE_ROLE_KEY", prior.key], ["NEXT_PUBLIC_SUPABASE_URL", prior.url]]) {
      if (value === undefined) delete process.env[name!]; else process.env[name!] = value;
    }
  }
});

test("cross-origin operations are rejected before touching an authenticated handler", async () => {
  let calls = 0;
  const info = console.info;
  console.info = () => {};
  try {
    const run = withApiTelemetry("practical", async () => {calls++; return new Response("{}");});
    const response = await run(new Request("https://voidfill.invalid/api/practical", {method: "POST", headers: {Origin: "https://unrelated.invalid"}}));
    assert.equal(response.status, 403);
    assert.equal(calls, 0);
    assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  } finally {console.info = info;}
});
