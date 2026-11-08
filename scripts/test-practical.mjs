// Synthetic-only HTTP acceptance; never creates assignments or messages for live users.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { configure } from "./runtime.mjs";
configure();
const base = process.env.TEST_BASE_URL || "http://localhost:3000";
const jars = [];
async function call(jar, path, body, expected = 200, extraHeaders = {}) {
  const response = await fetch(base + path, {method: body === undefined ? "GET" : "POST", headers: {"Content-Type": "application/json", Cookie: jar.cookie || "", ...extraHeaders}, ...(body === undefined ? {} : {body: JSON.stringify(body)}), redirect: "manual"});
  const cookies = response.headers.getSetCookie();
  if (cookies.length) jar.cookie = cookies.map(value => value.split(";")[0]).join("; ");
  assert.equal(response.status, expected, `${path}: expected ${expected}, received ${response.status}`);
  return response.json();
}
try {
  await call({}, "/api/practical", undefined, 401);
  const a = {}, b = {}, mentor = {}; jars.push(a, b, mentor);
  for (const jar of [a, b]) {
    await call(jar, "/api/demo/start", {key: process.env.DEMO_ENTRY_KEY, role: 0});
    await call(jar, "/api/demo/lease", {tab: "practical-http-test"});
  }
  const profile = (await call(a, "/api/demo/db", {table: "profiles", single: "required"})).data;
  const before = (await call(a, "/api/demo/db", {table: "user_stats"})).data;
  const draft = {action: "save", expected_version: 0, role_id: profile.target_role_id, level: "foundation", content: "Synthetic HTTP evidence: I documented choices, created a fictional example and checked two independent cases before identifying a limitation.", links: ["https://example.com/synthetic-project"]};
  const saved = (await call(a, "/api/practical", draft)).project;
  assert.equal(saved.draft_version, 1);
  assert.ok(Array.isArray(saved.brief.case_inputs) && saved.brief.case_inputs.length >= 2, "Saved brief lost its synthetic case inputs");
  const reloaded = (await call(a, "/api/practical")).projects;
  assert.equal(reloaded.length, 1);
  assert.deepEqual(reloaded[0].brief, saved.brief, "Reload changed the saved case or rubric");
  assert.equal((await call(b, "/api/practical")).projects.length, 0, "Private draft leaked between sessions");
  await call(b, "/api/practical", {...draft, project_id: saved.id, expected_version: 1}, 403);
  await call(a, "/api/practical", {...draft, project_id: saved.id, expected_version: 0}, 409);
  await call(a, "/api/practical", {...draft, user_id: randomUUID()}, 400);
  await call(a, "/api/practical", {...draft, links: ["javascript:alert(1)"]}, 400);
  await call(a, "/api/practical", draft, 403, {Origin: "https://untrusted.invalid"});
  await call(a, "/api/practical", {action: "submit", project_id: saved.id, expected_version: 1, mentor_id: randomUUID(), consent: true, request_id: randomUUID()}, 409);
  await call(a, "/api/practical?mode=mentor", undefined, 403);
  const learnerPage = await fetch(base + "/practical", {headers: {Cookie: a.cookie}});
  assert.equal(learnerPage.status, 200);
  assert.ok((await learnerPage.text()).includes("Show your thinking."));
  assert.deepEqual((await call(a, "/api/demo/db", {table: "user_stats"})).data, before);

  await call(mentor, "/api/demo/start", {key: process.env.DEMO_ENTRY_KEY, staff: true, email: "mentor@demo.voidfill.local", password: process.env.DEMO_MENTOR_PASSWORD});
  await call(mentor, "/api/demo/lease", {tab: "practical-mentor-http-test"});
  const queue = await call(mentor, "/api/practical?mode=mentor");
  assert.equal(queue.submissions.length, 3);
  assert.equal(queue.projects.length, 0, "Mentor received private drafts");
  assert.ok(queue.submissions.every(row => Array.isArray(row.brief.case_inputs) && row.brief.case_inputs.length >= 2), "Mentor snapshots lost learner case inputs");
  const submission = queue.submissions[0];
  const review = {action: "review", submission_id: submission.id, verdict: "revise", feedback: "Good first example; document an independently checked second case and explain the difference.", criteria: submission.brief.rubric.map((_, criterion) => ({criterion, judgement: "developing", comment: ""}))};
  await call(a, "/api/practical", review, 403);
  await call(mentor, "/api/practical", {...review, verdict: "ready"}, 400);
  const reviewed = await call(mentor, "/api/practical", review);
  assert.equal(reviewed.review.verdict, "revise");
  await call(mentor, "/api/practical", review, 409);
  assert.equal((await call(mentor, "/api/practical?mode=mentor")).reviews.length, 1);
  const mentorPage = await fetch(base + "/admin/mentor/reviews", {headers: {Cookie: mentor.cookie}, redirect: "manual"});
  assert.equal(mentorPage.status, 200);
  assert.ok((await mentorPage.text()).includes("Help good work get better."));
  console.log("Practical HTTP acceptance passed: private drafts, strict inputs, origin checks, no XP changes, mentor isolation, criterion feedback, immutable review and both workspaces.");
} finally {
  for (const jar of jars) if (jar.cookie) await call(jar, "/api/demo/end", {}).catch(() => {});
}
