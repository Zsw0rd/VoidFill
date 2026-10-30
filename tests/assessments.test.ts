import test from "node:test";
import assert from "node:assert/strict";
import { createAssessment, gradeAssessment, submissionSchema } from "../lib/assessments";
import type { LocalQuestion } from "../lib/localMl";

process.env.ML_ASSESSMENT_SECRET = "test-only-assessment-secret-32-characters-long";
const user = "00000000-0000-4000-8000-000000000001";
const otherUser = "00000000-0000-4000-8000-000000000002";
const questions: LocalQuestion[] = [
  { id: "sql-one", prompt: "Which clause filters rows?", options: ["WHERE", "HAVING", "ORDER BY"], correct_index: 0, explanation: "WHERE filters rows before grouping.", skill_id: "00000000-0000-4000-8000-000000000003", skill_name: "SQL Fundamentals", difficulty: 1, source_url: "https://www.postgresql.org/docs/current/tutorial-select.html" },
  { id: "python-one", prompt: "What is len([1, 2])?", options: ["1", "2", "3"], correct_index: 1, explanation: "There are two elements.", skill_id: "00000000-0000-4000-8000-000000000004", skill_name: "Python Basics", difficulty: 1, source_url: "https://docs.python.org/3/tutorial/" },
];
function setup() {
  const session = createAssessment(user, questions, { purpose: "practice", difficulty: 1 });
  return { session, submission: { assessment_token: session.assessment_token, answers: [{ question_id: "sql-one", selected_index: 0 }, { question_id: "python-one", selected_index: 0 }] } };
}

test("quiz responses hide answer keys and explanations until grading", () => {
  const { session } = setup();
  assert.equal("correct_index" in session.questions[0], false);
  assert.equal("explanation" in session.questions[0], false);
  assert.equal(Buffer.from(session.assessment_token, "base64url").includes(Buffer.from("WHERE filters")), false);
});

test("server grades using sealed keys and keeps each question's skill", () => {
  const { submission } = setup();
  const grade = gradeAssessment(user, submission, "practice");
  assert.equal(grade.correct, 1);
  assert.equal(grade.total, 2);
  assert.equal(grade.score, 50);
  assert.deepEqual(grade.skills.map((s) => [s.skill_name, s.score]), [["SQL Fundamentals", 100], ["Python Basics", 0]]);
  assert.equal(grade.review[1].correct_index, 1);
});

test("client-supplied answer keys are ignored", () => {
  const { submission } = setup();
  const parsed = submissionSchema.parse({ ...submission, ai_questions: [{ id: "python-one", correct_index: 0 }] });
  assert.equal(gradeAssessment(user, parsed, "practice").correct, 1);
});

test("tampered ciphertext, another user and another purpose are rejected", () => {
  const { submission } = setup();
  const bytes = Buffer.from(submission.assessment_token, "base64url");
  bytes[40] ^= 1;
  assert.throws(() => gradeAssessment(user, { ...submission, assessment_token: bytes.toString("base64url") }, "practice"));
  assert.throws(() => gradeAssessment(otherUser, submission, "practice"));
  assert.throws(() => gradeAssessment(user, submission, "daily"));
});

test("partial, duplicate and foreign question submissions are rejected", () => {
  const { submission } = setup();
  assert.throws(() => gradeAssessment(user, { ...submission, answers: submission.answers.slice(0, 1) }, "practice"));
  assert.throws(() => gradeAssessment(user, { ...submission, answers: [submission.answers[0], submission.answers[0]] }, "practice"));
  assert.throws(() => gradeAssessment(user, { ...submission, answers: [submission.answers[0], { question_id: "foreign", selected_index: 0 }] }, "practice"));
});

test("out-of-range options are rejected and unanswered questions count as wrong", () => {
  const { submission } = setup();
  assert.throws(() => gradeAssessment(user, { ...submission, answers: [submission.answers[0], { question_id: "python-one", selected_index: 5 }] }, "practice"));
  assert.equal(gradeAssessment(user, { ...submission, answers: submission.answers.map((a) => ({ ...a, selected_index: -1 })) }, "practice").score, 0);
});

test("expired assessments cannot be submitted", (t) => {
  const { submission } = setup();
  const now = Date.now();
  t.mock.method(Date, "now", () => now + 3 * 60 * 60 * 1000);
  assert.throws(() => gradeAssessment(user, submission, "practice"));
});
