// Actual app/ML acceptance using fictional documents in two disposable workspaces.
import assert from "node:assert/strict";
import { configure } from "./runtime.mjs";
import { syntheticResumePdf } from "../lib/performanceFixtures.mjs";

const origin = new URL(process.env.TEST_BASE_URL || "http://localhost:3000");
const local = origin.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname);
const hosted = origin.protocol === "https:" && (origin.hostname === "void-fill.vercel.app" || /^void-fill-[a-z0-9-]+-zsw0rds-projects\.vercel\.app$/.test(origin.hostname));
assert.ok((local || hosted) && !origin.username && !origin.password && !origin.search && !origin.hash && origin.pathname === "/", "Use the configured VoidFill application or its owned preview origin.");
configure();
assert.ok(process.env.DEMO_ENTRY_KEY, "Existing private demo access is required.");
const jars = [{ cookies: new Map() }, { cookies: new Map() }];
const started = [], deadline = Date.now() + 180000;
async function call(jar, path, body = {}, cleanup = false) {
  const remaining = cleanup ? 15000 : deadline - Date.now();
  assert.ok(remaining > 0, "Resume acceptance exceeded its three-minute workload budget.");
  const multipart = body instanceof FormData;
  const response = await fetch(origin.origin + path, {
    method: "POST", headers: { Origin: origin.origin, Cookie: [...jar.cookies].map(([key,value]) => `${key}=${value}`).join("; "), ...(multipart ? {} : { "Content-Type": "application/json" }) },
    body: multipart ? body : JSON.stringify(body), redirect: "manual", signal: AbortSignal.timeout(Math.min(90000, remaining)),
  });
  for (const cookie of response.headers.getSetCookie()) {
    const pair = cookie.split(";",1)[0], separator = pair.indexOf("=");
    const name = pair.slice(0,separator);
    if (/;\s*max-age=0(?:;|$)/i.test(cookie)) jar.cookies.delete(name);
    else jar.cookies.set(name,pair.slice(separator+1));
  }
  assert.equal(response.status,200,`${path}: expected HTTP 200; no response content is printed.`);
  return response.json();
}
const snapshot = async jar => ({
  profile: (await call(jar,"/api/demo/db",{table:"profiles",single:"required"})).data,
  stats: (await call(jar,"/api/demo/db",{table:"user_stats",single:"required"})).data,
});
let ended = 0;
try {
  for (const jar of jars) {
    await call(jar,"/api/demo/start",{key:process.env.DEMO_ENTRY_KEY,role:0});
    started.push(jar);
    await call(jar,"/api/demo/lease",{tab:"resume-concurrency-acceptance"});
  }
  const before = await Promise.all(jars.map(snapshot));
  for (let round=0;round<4;round++) {
    await Promise.all(jars.map(jar=>call(jar,"/api/demo/lease",{tab:"resume-concurrency-acceptance"})));
    await Promise.all(jars.map(async (jar,index) => {
      const marker=`paired-${round}-${index}`;
      const form=new FormData();
      form.append("file",new Blob([syntheticResumePdf(marker)],{type:"application/pdf"}),"fictional-concurrency.pdf");
      const result=await call(jar,"/api/resume",form);
      assert.equal(result.pages,1);assert.deepEqual(result.methods,["pdf-text"]);
      assert.ok(typeof result.text === "string" && result.text.includes(`Synthetic performance case ${marker};`), "Each parsed PDF must retain its own synthetic text.");
      assert.ok(["Python","SQL"].every(name=>result.skills.some(skill=>skill.name===name)));
      assert.ok(result.matched_app_skills.every(skill=>skill.assessed===false));
    }));
  }
  assert.deepEqual(await Promise.all(jars.map(snapshot)),before,"Parsing must not change either profile or saved progress.");
  assert.ok(Date.now() < deadline,"Resume acceptance exceeded its workload deadline.");
} finally {
  for (const jar of started) {
    try { await call(jar,"/api/demo/end",{},true); ended++; } catch {}
    jar.cookies.clear();
  }
}
assert.equal(ended,started.length,"Every disposable resume workspace must be ended.");
console.log("Resume concurrency acceptance passed: eight actual text-PDF parses in four paired rounds, own-document isolation, unchanged profiles/scores/XP and two workspaces ended. No original PDF, extracted content or credentials were recorded.");
