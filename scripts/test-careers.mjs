// Disposable demo accounts exercise the same authenticated app routes as real learners.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {configure, root} from "./runtime.mjs";
configure();
const base = process.env.TEST_BASE_URL || "http://localhost:3000";
const catalogue = JSON.parse(readFileSync(join(root, "ml/data/careers/catalogue.json"), "utf8"));
const questions = new Map(["ml/data/questions.json", "ml/data/careers/questions.json"].flatMap(file => JSON.parse(readFileSync(join(root, file), "utf8"))).map(row => [row.id, row]));
const jars = [{cookie: ""}, {cookie: ""}];
async function call(jar, path, body = {}, expected = 200, method = "POST") {
  const res = await fetch(base + path, {method, headers: {Cookie: jar.cookie, "Content-Type": "application/json"}, ...(method === "GET" ? {} : {body: JSON.stringify(body)}), redirect: "manual"});
  const cookies = res.headers.getSetCookie();
  if (cookies.length) jar.cookie = cookies.map(cookie => cookie.split(";")[0]).join("; ");
  assert.equal(res.status, expected, `${path}: unexpected HTTP ${res.status}`);
  return res.json();
}
const db = (jar, table, extra = {}) => call(jar, "/api/demo/db", {table, ...extra});
const pilot = catalogue.roles.filter(role => role.release_status === "pilot");
try {
  for (const jar of jars) {
    await call(jar, "/api/demo/start", {key: process.env.DEMO_ENTRY_KEY, role: 0});
    await call(jar, "/api/demo/lease", {tab: "career-test"});
  }
  const [a, b] = jars;
  const uid = (await call(a, "/api/demo/user")).data.user.id;
  await call(a, "/api/chat/mentor-send", {targetUserId: uid, message: "Synthetic forged mentor reply"}, 403);
  const roles = (await db(a, "roles")).data;
  const skills = (await db(a, "skills")).data;
  assert.equal(roles.length, 61); assert.equal(skills.length, 55);
  const remembered = skills.find(skill => skill.name === "Python Basics");
  await db(a, "user_skill_scores", {operation: "upsert", onConflict: "user_id,skill_id", values: {user_id: uid, skill_id: remembered.id, score: 77}});
  await db(a, "user_stats", {operation: "update", values: {xp: 123, level: 1}});
  for (const career of pilot) {
    // Cloud runs with 30 careers outlive the 60-second demo lease. Renew both
    // isolated workspaces just as an open browser does; keep expiry unchanged.
    for (const jar of jars) await call(jar, "/api/demo/lease", {tab: "career-test"});
    const stored = roles.find(role => role.name === career.name);
    await call(a, "/api/careers/profile", {role_id: stored.id, goal: "", level: "foundation", focus_skill_ids: [], context: ""});
    const map = await call(a, "/api/roadmap/generate");
    assert.equal(map.count, career.requirements.length);
    const quiz = await call(a, "/api/roadmap/assess", {purpose: "practice"});
    assert.equal(quiz.questions.length, 10);
    const allowed = new Set(career.requirements.map(item => catalogue.skills.find(skill => skill.key === item.skill).name));
    assert.ok(quiz.questions.every(question => allowed.has(question.skill_name)));
    assert.ok(quiz.questions.every(question => !("correct_index" in question) && !("explanation" in question)));
    // SEO legitimately includes web fundamentals. Check the exact selected skill
    // instead of assuming that a non-technical family can contain no web topics.
    assert.ok(quiz.questions.every(question => {
      const expected = catalogue.skills.find(skill => skill.name === question.skill_name)?.topic;
      return expected && questions.get(question.id)?.topics.includes(expected);
    }), `${career.name}: each question must belong to its declared skill bank`);
    await call(a, "/api/ai/recommend-courses");
    console.log(`Career contract passed: ${career.name}`);
  }
  const recruiter = roles.find(role => role.name === "Recruitment Associate");
  const focus = skills.find(skill => skill.name === "Digital Marketing");
  await call(a, "/api/careers/profile", {role_id: recruiter.id, goal: "Recruitment in clean energy", level: "intermediate", focus_skill_ids: [focus.id], context: "Coordinate candidate communication and outreach."});
  assert.equal((await call(a, "/api/roadmap/generate")).count, 5);
  const scores = (await db(a, "user_skill_scores")).data;
  assert.equal(scores.find(row => row.skill_id === remembered.id).score, 77);
  assert.equal((await db(a, "user_stats", {single: "required"})).data.xp, 123);
  await call(a, "/api/careers/reflection", {role_id: recruiter.id, content: "Synthetic private reflection."});
  assert.equal((await db(a, "career_reflections")).data.length, 1);
  assert.equal((await db(b, "career_reflections")).data.length, 0);
  const personal = roles.find(role => role.name === catalogue.personal_goal_role.name);
  await call(a, "/api/careers/profile", {role_id: personal.id, goal: "Museum visitor experience", focus_skill_ids: []}, 400);
  await call(a, "/api/careers/profile", {role_id: personal.id, goal: "Museum visitor experience", focus_skill_ids: [focus.id]});
  assert.equal((await call(a, "/api/roadmap/generate")).count, 1);
  const specialist = skills.find(skill => skill.name === "Payroll Operations");
  await call(a, "/api/careers/profile", {role_id: personal.id, goal: "Museum payroll coordination", focus_skill_ids: [specialist.id]});
  await call(a, "/api/roadmap/generate");
  const analysis = await call(a, "/api/ai/analyze");
  assert.ok(JSON.stringify(analysis).includes("Payroll Operations"));
  assert.ok(!JSON.stringify(analysis).includes("knowledge check is not available"));
  assert.equal((await call(a, "/api/ai/insights", {}, 200, "GET")).cached, true);
  const focusedQuiz = await call(a, "/api/roadmap/assess", {purpose: "skill", skill_id: specialist.id});
  assert.equal(focusedQuiz.questions.length, 10);
  assert.ok(focusedQuiz.questions.every(question => question.skill_name === specialist.name));
  await call(a, "/api/careers/profile", {role_id: personal.id, goal: "Museum visitor outreach", focus_skill_ids: [focus.id]});
  assert.equal((await call(a, "/api/ai/insights", {}, 200, "GET")).cached, false);
  const dashboard = await fetch(base + "/dashboard", {headers: {Cookie: a.cookie}});
  assert.equal(dashboard.status, 200);
  assert.ok(!(await dashboard.text()).includes("Payroll Operations"), "Removed focus must not remain in the current dashboard path");
  await call(a, "/api/careers/profile", {role_id: "00000000-0000-4000-8000-000000000099"}, 400);
  await call(a, "/api/careers/profile", {role_id: recruiter.id, focus_skill_ids: [specialist.id, specialist.id, specialist.id, specialist.id, specialist.id]}, 400);
  console.log(`Career integration passed: all ${pilot.length} pilots, non-technical question isolation, personal goals, focus skills, level, private reflections, validation, preserved scores/XP and stale-view invalidation.`);
} finally {for (const jar of jars) if (jar.cookie) await fetch(base + "/api/demo/end", {method: "POST", headers: {Cookie: jar.cookie}}).catch(() => {});}
