import test from "node:test";
import assert from "node:assert/strict";
import { ASSESSMENT_DRAFT_PREFIX, bindAssessmentDraftOwner, clearAssessmentDrafts, pruneExpiredAssessmentDrafts, readAssessmentDraft, recoveredAssessmentAnswers, saveAssessmentDraft, type AssessmentDraft, type DraftStorage } from "../lib/assessmentDrafts";
import { assessmentContextKey } from "../lib/assessmentContext";
import { createAssessment, gradeAssessment, resumeAssessment } from "../lib/assessments";
import type { LocalQuestion } from "../lib/localMl";

process.env.ML_ASSESSMENT_SECRET = "test-only-draft-assessment-secret-with-32-characters";
const owner = "00000000-0000-4000-8000-000000000001";
const other = "00000000-0000-4000-8000-000000000002";
const skill = "00000000-0000-4000-8000-000000000003";
const context = assessmentContextKey({ target_role_id: skill, career_level: "foundation" });
const questions: LocalQuestion[] = [{ id: "sql-one", prompt: "Which clause filters rows?", options: ["WHERE", "HAVING", "ORDER BY"], correct_index: 0, explanation: "WHERE filters rows before grouping.", skill_id: skill, skill_name: "SQL Fundamentals", difficulty: 1, source_url: "https://www.postgresql.org/docs/current/tutorial-select.html" }];

function storage() {
  const values = new Map<string, string>();
  return { values, getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
}
function session() {
  const created = createAssessment(owner, questions, { purpose: "practice", difficulty: 1, contextKey: context });
  const draft: AssessmentDraft = { version: 1, ownerId: owner, contextKey: context, purpose: "practice", token: created.assessment_token, expiresAt: created.expires_at, index: 0, answers: { "sql-one": 0 } };
  return { created, draft };
}

test("reload restores original sealed assessment and selections without persisting prompts, keys, explanations or auth sessions", () => {
  const store = storage(); const { created, draft } = session();
  assert.equal(saveAssessmentDraft(store, "practice", draft), true);
  const raw = store.getItem(ASSESSMENT_DRAFT_PREFIX + "practice")!;
  assert.ok(!raw.includes(questions[0].prompt)); assert.ok(!raw.includes(questions[0].explanation));
  assert.ok(!raw.includes("correct_index")); assert.ok(!raw.includes("access_token"));
  const read = readAssessmentDraft(store, "practice", owner, context);
  assert.deepEqual(read, { draft, discarded: false });
  const restored = resumeAssessment(owner, read.draft!.token, "practice", context);
  assert.deepEqual(restored.questions, created.questions);
  assert.equal(restored.expires_at, created.expires_at);
  assert.ok(!("correct_index" in restored.questions[0])); assert.ok(!("explanation" in restored.questions[0]));
  const submission = { assessment_token: read.draft!.token, answers: [{ question_id: "sql-one", selected_index: read.draft!.answers["sql-one"] }] };
  const before = gradeAssessment(owner, submission, "practice"), after = gradeAssessment(owner, submission, "practice");
  assert.equal(before.assessmentId, after.assessmentId); assert.equal(before.score, 100); assert.equal(after.score, 100);
});

test("account switch removes every old assessment slot without touching unrelated browser data", () => {
  const store = storage(); const { draft } = session();
  store.setItem("unrelated", "keep");
  saveAssessmentDraft(store, "practice", draft);
  saveAssessmentDraft(store, "daily", { ...draft, purpose: "daily" });
  assert.equal(bindAssessmentDraftOwner(store, other), true);
  assert.equal(readAssessmentDraft(store, "practice", other, context).draft, null);
  assert.equal(store.getItem(ASSESSMENT_DRAFT_PREFIX + "daily"), null);
  assert.equal(store.getItem("unrelated"), "keep");
  clearAssessmentDrafts(store); assert.equal(store.getItem("unrelated"), "keep");
});

test("changing career, level, goal or focus retires browser draft and sealed-session resume", () => {
  for (const changed of [
    { target_role_id: other, career_level: "foundation" },
    { target_role_id: skill, career_level: "intermediate" },
    { target_role_id: skill, career_level: "foundation", custom_target_role: "Own direction" },
    { target_role_id: skill, career_level: "foundation", career_focus_skill_ids: [other] },
    { target_role_id: skill, career_level: "foundation", career_goal_context: "New responsibilities" },
  ]) {
    const store = storage(); const { draft } = session(); const next = assessmentContextKey(changed);
    saveAssessmentDraft(store, "practice", draft);
    assert.deepEqual(readAssessmentDraft(store, "practice", owner, next), { draft: null, discarded: true });
    assert.throws(() => resumeAssessment(owner, draft.token, "practice", next), /learning direction/);
  }
  assert.equal(assessmentContextKey({ career_focus_skill_ids: [skill, other, skill] }), assessmentContextKey({ career_focus_skill_ids: [other, skill] }));
});

test("forged local expiry cannot extend sealed expiry; cross-user, purpose and ciphertext tampering fail", t => {
  const { draft } = session();
  assert.throws(() => resumeAssessment(other, draft.token, "practice", context));
  assert.throws(() => resumeAssessment(owner, draft.token, "daily", context));
  const bytes = Buffer.from(draft.token, "base64url"); bytes[45] ^= 1;
  assert.throws(() => resumeAssessment(owner, bytes.toString("base64url"), "practice", context));
  const now = Date.now(); t.mock.method(Date, "now", () => now + 3 * 60 * 60 * 1000);
  const store = storage();
  assert.equal(saveAssessmentDraft(store, "practice", { ...draft, expiresAt: Date.now() + 60000 }), true);
  assert.ok(readAssessmentDraft(store, "practice", owner, context).draft);
  assert.throws(() => resumeAssessment(owner, draft.token, "practice", context), /expired/);
  assert.throws(() => gradeAssessment(owner, { assessment_token: draft.token, answers: [{ question_id: "sql-one", selected_index: 0 }] }, "practice"), /expired/);
});

test("malformed, oversized, unknown-version and wrong-purpose drafts are removed rather than restored", () => {
  const { draft } = session();
  for (const raw of ["not json", "x".repeat(310001), JSON.stringify({ ...draft, version: 2 }), JSON.stringify({ ...draft, purpose: "course" }), JSON.stringify({ ...draft, answers: { "sql-one": 6 } }), JSON.stringify({ ...draft, correct_index: 0 }), JSON.stringify({ ...draft, index: 100 })]) {
    const store = storage(); bindAssessmentDraftOwner(store, owner); store.setItem(ASSESSMENT_DRAFT_PREFIX + "practice", raw);
    assert.deepEqual(readAssessmentDraft(store, "practice", owner, context), { draft: null, discarded: true });
    assert.equal(store.getItem(ASSESSMENT_DRAFT_PREFIX + "practice"), null);
  }
});

test("expired local drafts and implausibly extended lifetimes do not remain available", () => {
  const store = storage(); const { draft } = session();
  saveAssessmentDraft(store, "practice", draft);
  assert.deepEqual(readAssessmentDraft(store, "practice", owner, context, draft.expiresAt), { draft: null, discarded: true });
  assert.equal(saveAssessmentDraft(store, "practice", { ...draft, expiresAt: Date.now() + 3 * 60 * 60 * 1000 }), false);
});

test("restored selections are intersected with authoritative question ids and option ranges", () => {
  assert.deepEqual(recoveredAssessmentAnswers({ "sql-one": 1, foreign: 0 }, questions), { "sql-one": 1 });
  assert.deepEqual(recoveredAssessmentAnswers({ "sql-one": 5 }, questions), {});
  assert.deepEqual(recoveredAssessmentAnswers({ "sql-one": -1 }, questions), {});
  assert.deepEqual(recoveredAssessmentAnswers({ "sql-one": 1.5 }, questions), {});
});

test("background expiry cleanup removes expired slots without deleting an unexpired check or unrelated browser data", () => {
  const store = storage(); const { draft } = session(); const now = Date.now();
  store.setItem("unrelated", "keep");
  saveAssessmentDraft(store, "practice", { ...draft, expiresAt: now + 1000 });
  saveAssessmentDraft(store, "daily", { ...draft, purpose: "daily", expiresAt: now + 5000 });
  pruneExpiredAssessmentDrafts(store, now + 1001);
  assert.equal(store.getItem(ASSESSMENT_DRAFT_PREFIX + "practice"), null);
  assert.ok(store.getItem(ASSESSMENT_DRAFT_PREFIX + "daily")); assert.equal(store.getItem("unrelated"), "keep");
});

test("blocked browser storage never prevents keeping and grading an in-memory assessment", () => {
  const unavailable: DraftStorage = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); }, removeItem() { throw new Error("blocked"); } };
  const { draft } = session();
  assert.equal(saveAssessmentDraft(unavailable, "practice", draft), false);
  assert.equal(readAssessmentDraft(unavailable, "practice", owner, context).draft, null);
  assert.equal(clearAssessmentDrafts(unavailable), false);
  assert.equal(gradeAssessment(owner, { assessment_token: draft.token, answers: [{ question_id: "sql-one", selected_index: 0 }] }, "practice").score, 100);
});

test("older valid tokens remain gradeable but cannot bypass the new context-bound restore contract", () => {
  const old = createAssessment(owner, questions, { purpose: "practice", difficulty: 1 });
  assert.throws(() => resumeAssessment(owner, old.assessment_token, "practice", context), /older assessment/);
  assert.equal(gradeAssessment(owner, { assessment_token: old.assessment_token, answers: [{ question_id: "sql-one", selected_index: 0 }] }, "practice").score, 100);
});
