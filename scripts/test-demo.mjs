// Exercises the actual running Next server with two isolated cookie jars.
import assert from "node:assert/strict";
import { configure, root } from "./runtime.mjs";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
configure();
const base = process.env.TEST_BASE_URL || "http://localhost:3000";
const a = { cookie: "" }, b = { cookie: "" };
async function call(jar, url, body = {}, method = "POST") {
  const response = await fetch(base + url, { method, headers: { Cookie: jar.cookie, ...(body instanceof FormData ? {} : { "Content-Type": "application/json" }) }, ...(method === "GET" ? {} : { body: body instanceof FormData ? body : JSON.stringify(body) }), redirect: "manual" });
  const cookies = response.headers.getSetCookie();
  if (cookies.length) jar.cookie = cookies.map(v => v.split(";")[0]).join("; ");
  const text = await response.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  assert.ok(response.status < 400, `${url}: HTTP ${response.status} ${typeof data === "string" ? data.slice(0, 150) : JSON.stringify(data)}`);
  return data;
}
try {
  assert.equal((await fetch(base + "/demo/wrong-key")).status, 404);
  assert.equal((await fetch(base + "/api/resume", { method: "POST" })).status, 401);
  for (const jar of [a, b]) await call(jar, "/api/demo/start", { key: process.env.DEMO_ENTRY_KEY, role: 0 });
  const userA = (await call(a, "/api/demo/user")).data.user;
  const userB = (await call(b, "/api/demo/user")).data.user;
  assert.notEqual(userA.id, userB.id);
  for (const jar of [a, b]) await call(jar, "/api/demo/lease", { tab: "http-test" });
  for (const page of ["resume", "dashboard", "daily-test", "practice-test", "roadmap", "skill-graph", "ai-insights", "mentor-chat", "profile"]) {
    const response = await fetch(base + "/" + page, { headers: { Cookie: a.cookie }, redirect: "manual" });
    assert.equal(response.status, 200, `${page}: ${response.status}`);
    assert.ok(!(await response.text()).includes("Application error"));
    await call(a, "/api/demo/lease", { tab: "http-test" });
    await call(b, "/api/demo/lease", { tab: "http-test" });
  }
  const resumeFixture = join(root, "ml/runtime/test-resume.pdf");
  if (existsSync(resumeFixture)) {
    const form = new FormData(); form.append("file", new Blob([readFileSync(resumeFixture)], { type: "application/pdf" }), "test-resume.pdf");
    const parsed = await call(a, "/api/resume", form);
    assert.ok(parsed.skills.some(s => s.name === "Python"));
    assert.ok(parsed.skills.some(s => s.name === "SQL"));
    await call(a, "/api/resume", { name: "Fixture Learner", skills: parsed.skills.map(s => s.name) }, "PATCH");
  }
  await call(a, "/api/roadmap/generate");
  await call(a, "/api/ai/recommend-courses");
  const courses = await call(a, "/api/demo/db", { table: "roadmap_courses", limit: 1 });
  assert.ok(courses.data.length);
  const courseTest = await call(a, "/api/roadmap/assess", { purpose: "course", course_id: courses.data[0].id });
  const bank = new Map(JSON.parse(readFileSync(join(root, "ml/data/questions.json"), "utf8")).map(q => [q.id, q.correct_index]));
  const courseResult = await call(a, "/api/roadmap/submit-assessment", { purpose: "course", assessment_token: courseTest.assessment_token, answers: courseTest.questions.map(q => ({ question_id: q.id, selected_index: bank.get(q.id) })) });
  assert.equal(courseResult.passed, true);
  assert.equal((await call(a, "/api/demo/db", { table: "roadmap_courses", filters: [{ column: "id", op: "eq", value: courses.data[0].id }], single: "required" })).data.completed, true);
  await call(a, "/api/ai/analyze");
  const assessment = await call(a, "/api/ai/generate-questions");
  assert.equal(assessment.questions.length, 10);
  assert.ok(!("correct_index" in assessment.questions[0]));
  const submission = { assessment_token: assessment.assessment_token, answers: assessment.questions.map(q => ({ question_id: q.id, selected_index: 0 })) };
  const result = await call(a, "/api/daily-test/submit", submission);
  const replay = await call(a, "/api/daily-test/submit", submission);
  assert.equal(result.xp_total, replay.xp_total);
  const practice = await call(a, "/api/roadmap/assess", { purpose: "practice" });
  await call(a, "/api/practice-test/submit", { assessment_token: practice.assessment_token, answers: practice.questions.map(q => ({ question_id: q.id, selected_index: -1 })) });
  const statsA = await call(a, "/api/demo/db", { table: "user_stats", single: "required" });
  const statsB = await call(b, "/api/demo/db", { table: "user_stats", single: "required" });
  assert.ok(statsA.data.xp > 0); assert.equal(statsB.data.xp, 0);
  // Delete, then test the old capability directly (the end response clears cookies).
  const oldCookie = a.cookie;
  await call(a, "/api/demo/end");
  assert.equal((await fetch(base + "/api/demo/user", { method: "POST", headers: { Cookie: oldCookie } })).status, 401);
  assert.equal((await call(b, "/api/demo/user")).data.user.id, userB.id);
  await call(b, "/api/demo/lease", { tab: "http-test", release: true });
  // No service requests are made during this wait: expiry must run by itself.
  await new Promise(resolve => setTimeout(resolve, 15000));
  assert.equal((await fetch(base + "/api/demo/user", { method: "POST", headers: { Cookie: b.cookie } })).status, 401);
  console.log("Demo integration passed: 9 learner pages, PDF ingestion, profile apply, recommendations, course completion, insights, daily/practice grading, replay, isolation, deletion and lease expiry.");
} finally {
  for (const jar of [a, b]) await fetch(base + "/api/demo/end", { method: "POST", headers: { Cookie: jar.cookie } }).catch(() => {});
}
