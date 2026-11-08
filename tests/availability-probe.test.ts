import test from "node:test";
import assert from "node:assert/strict";
import {checkPublicAvailability,publicProbeOrigin,PUBLIC_CHECKS} from "../lib/availabilityProbe.mjs";

test("scheduled smoke sends no credentials and checks public contracts without claiming private model health",async()=>{
  let requests=0;
  const report=await checkPublicAvailability({origin:"http://localhost:3000",fetchImpl:async(url,init)=>{
    requests++;const request=new URL(String(url)),check=PUBLIC_CHECKS.find(item=>item.path===request.pathname)!;
    assert.equal(new Headers(init?.headers).get("Cookie"),null);assert.equal(new Headers(init?.headers).get("Authorization"),null);
    assert.equal(init?.redirect,"manual");
    return new Response(check.html?"<!doctype html><title>VoidFill</title>":null,{status:check.status,headers:check.redirect?{location:"/auth/login?next=/dashboard"}:{}});
  }});
  assert.equal(requests,6);assert.equal(report.success,true);assert.match(report.scope,/does not prove/);
});

test("unsafe login redirects, private bodies and transient failures never leak and only failed contracts retry",async()=>{
  let calls=0;
  const report=await checkPublicAvailability({origin:"http://localhost:3000",fetchImpl:async(url)=>{
    calls++;const path=new URL(String(url)).pathname;
    if(path==="/dashboard")return new Response(null,{status:307,headers:{location:"https://private.example.invalid/token=secret"}});
    if(path==="/api/roadmap/assess")return new Response("secret backend failure",{status:503});
    return new Response("<title>VoidFill</title>");
  }});
  assert.equal(report.success,false);assert.equal(calls,8);assert.equal(report.checks.filter(row=>!row.ok).length,2);
  assert.ok(!JSON.stringify(report).includes("secret")&&!JSON.stringify(report).includes("private.example"));
  assert.throws(()=>publicProbeOrigin("https://other.invalid",{live:true}));assert.throws(()=>publicProbeOrigin("https://void-fill.vercel.app"));
});
