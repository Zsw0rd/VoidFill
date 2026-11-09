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
  // Personal goals retain a supported track so lessons remain available.
  const originalProfile = (await call(a, "/api/demo/db", { table: "profiles", filters: [{ column: "id", op: "eq", value: userA.id }], single: "required" })).data;
  await call(a, "/api/demo/db", { table: "profiles", operation: "update", filters: [{ column: "id", op: "eq", value: userA.id }], values: { custom_target_role: "Accessible learning tools builder", target_role_id: originalProfile.target_role_id } });
  const personalProfile = (await call(a, "/api/demo/db", { table: "profiles", filters: [{ column: "id", op: "eq", value: userA.id }], single: "required" })).data;
  assert.equal(personalProfile.custom_target_role, "Accessible learning tools builder");
  assert.equal(personalProfile.target_role_id, originalProfile.target_role_id);
  for (const page of ["careers", "resume", "dashboard", "daily-test", "practice-test", "roadmap", "skill-graph", "ai-insights", "mentor-chat", "profile"]) {
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
  const courses = await call(a, "/api/demo/db", { table: "roadmap_courses", orders: [{ column: "sort_order", ascending: true }], limit: 100 });
  // Use a known author-linked lesson rather than whichever recommendation ranks
  // first. A concept reference without a lesson bank must not launch a substitute.
  const course = courses.data.find(row => row.url === "https://docs.python.org/3/tutorial/controlflow.html");
  const unavailableCourse = courses.data.find(row => row.url === "https://docs.python.org/3/tutorial/datastructures.html");
  assert.ok(course, "The Data Analyst roadmap must expose the explicitly linked Python control-flow lesson");
  assert.ok(unavailableCourse, "The Python data-structures resource must exercise honest missing-bank behavior");
  const unavailableResponse = await fetch(base + "/api/roadmap/assess", { method: "POST", headers: { Cookie: a.cookie, "Content-Type": "application/json" }, body: JSON.stringify({ purpose: "course", course_id: unavailableCourse.id }) });
  assert.equal(unavailableResponse.status, 422);
  const unavailable = await unavailableResponse.json();
  assert.match(unavailable.error, /No resource-specific check.*Choose a skill check/);
  assert.ok(!("assessment_token" in unavailable) && !("questions" in unavailable));
  assert.deepEqual((await call(a, "/api/demo/db", { table: "roadmap_courses", filters: [{ column: "id", op: "eq", value: unavailableCourse.id }], single: "required" })).data, unavailableCourse);
  const courseTest = await call(a, "/api/roadmap/assess", { purpose: "course", course_id: course.id });
  const bankRows = ["ml/data/questions.json", "ml/data/careers/questions.json"].flatMap(file => JSON.parse(readFileSync(join(root, file), "utf8")));
  const linkedFoundation = new Set(bankRows.filter(row => row.resource_id === "voidfill-python-0" && row.topics.includes("python") && row.difficulty <= 2).map(row => row.id));
  assert.equal(courseTest.questions.length, linkedFoundation.size, "The short lesson bank must not be padded with other Python lessons");
  assert.ok(courseTest.questions.every(question => linkedFoundation.has(question.id)));
  const restoredCourse = await call(a, "/api/assessments/resume", { purpose: "course", assessment_token: courseTest.assessment_token });
  assert.equal(restoredCourse.target.course.id, course.id);
  assert.deepEqual(restoredCourse.questions, courseTest.questions);
  assert.ok(!("correct_index" in restoredCourse.questions[0]) && !("explanation" in restoredCourse.questions[0]));
  const skillTest = await call(a, "/api/roadmap/assess", { purpose: "skill", skill_id: courseTest.questions[0].skill_id });
  const restoredSkill = await call(a, "/api/assessments/resume", { purpose: "skill", assessment_token: skillTest.assessment_token });
  assert.equal(restoredSkill.target.skillId, courseTest.questions[0].skill_id);
  assert.deepEqual(restoredSkill.questions, skillTest.questions);
  const bank = new Map(bankRows.map(q => [q.id, q.correct_index]));
  const courseResult = await call(a, "/api/roadmap/submit-assessment", { purpose: "course", assessment_token: courseTest.assessment_token, answers: courseTest.questions.map(q => ({ question_id: q.id, selected_index: bank.get(q.id) })) });
  assert.equal(courseResult.passed, true);
  assert.equal((await call(a, "/api/demo/db", { table: "roadmap_courses", filters: [{ column: "id", op: "eq", value: course.id }], single: "required" })).data.completed, true);
  await call(a, "/api/ai/analyze");
  const assessment = await call(a, "/api/ai/generate-questions");
  assert.equal(assessment.questions.length, 10);
  assert.ok(!("correct_index" in assessment.questions[0]));
  const restoredDaily = await call(a, "/api/assessments/resume", { purpose: "daily", assessment_token: assessment.assessment_token });
  assert.deepEqual(restoredDaily.questions, assessment.questions);
  assert.equal(restoredDaily.expires_at, assessment.expires_at);
  for (const [jar, purpose, token, status] of [
    [b, "daily", assessment.assessment_token, 400],
    [a, "practice", assessment.assessment_token, 400],
  ]) {
    const rejected = await fetch(base + "/api/assessments/resume", { method: "POST", headers: { Cookie: jar.cookie, "Content-Type": "application/json" }, body: JSON.stringify({ purpose, assessment_token: token }) });
    assert.equal(rejected.status, status);
  }
  const submission = { assessment_token: assessment.assessment_token, answers: assessment.questions.map(q => ({ question_id: q.id, selected_index: 0 })) };
  const result = await call(a, "/api/daily-test/submit", submission);
  const replay = await call(a, "/api/daily-test/submit", submission);
  assert.equal(result.xp_total, replay.xp_total);
  const practice = await call(a, "/api/roadmap/assess", { purpose: "practice" });
  assert.deepEqual((await call(a, "/api/assessments/resume", { purpose: "practice", assessment_token: practice.assessment_token })).questions, practice.questions);
  await call(a, "/api/practice-test/submit", { assessment_token: practice.assessment_token, answers: practice.questions.map(q => ({ question_id: q.id, selected_index: -1 })) });
  const statsA = await call(a, "/api/demo/db", { table: "user_stats", single: "required" });
  const statsB = await call(b, "/api/demo/db", { table: "user_stats", single: "required" });
  assert.ok(statsA.data.xp > 0); assert.equal(statsB.data.xp, 0);
  await call(a, "/api/careers/profile", { role_id: originalProfile.target_role_id, goal: "Accessible learning tools builder", level: "foundation", focus_skill_ids: [], context: "A new learning direction for this disposable fixture." });
  const changedDraft = await fetch(base + "/api/assessments/resume", { method: "POST", headers: { Cookie: a.cookie, "Content-Type": "application/json" }, body: JSON.stringify({ purpose: "practice", assessment_token: practice.assessment_token }) });
  assert.equal(changedDraft.status, 409);
  // Delete, then test the old capability directly (the end response clears cookies).
  const oldCookie = a.cookie;
  await call(a, "/api/demo/end");
  assert.equal((await fetch(base + "/api/demo/user", { method: "POST", headers: { Cookie: oldCookie } })).status, 401);
  assert.equal((await call(b, "/api/demo/user")).data.user.id, userB.id);
  await call(b, "/api/demo/lease", { tab: "http-test", release: true });
  // No service requests are made during this wait: expiry must run by itself.
  await new Promise(resolve => setTimeout(resolve, 15000));
  assert.equal((await fetch(base + "/api/demo/user", { method: "POST", headers: { Cookie: b.cookie } })).status, 401);
  console.log("Demo integration passed: 10 learner pages, personal goal with learning track, PDF ingestion, profile apply, recommendations, resource-linked course completion, honest missing resource bank without a token or course mutation, insights, daily/practice grading, all four context-bound assessment restores, replay, isolation, deletion and lease expiry.");
} finally {
  for (const jar of [a, b]) await fetch(base + "/api/demo/end", { method: "POST", headers: { Cookie: jar.cookie } }).catch(() => {});
}
