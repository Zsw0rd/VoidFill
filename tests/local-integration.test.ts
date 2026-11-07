import test from "node:test";
import assert from "node:assert/strict";
import nextEnv from "@next/env";
import { callLocalMl, assessmentResponseSchema, recommendationResponseSchema } from "../lib/localMl";
import { createAssessment, gradeAssessment } from "../lib/assessments";

nextEnv.loadEnvConfig(process.cwd());
const user = "00000000-0000-4000-8000-000000000001";
const skills = [
  { id: "00000000-0000-4000-8000-000000000002", name: "SQL Fundamentals", score: 20, target: 75, importance: 1 },
  { id: "00000000-0000-4000-8000-000000000003", name: "Python Basics", score: 50, target: 75, importance: 1 },
];

test("real local model connects to the Next.js assessment contract and server grader", async () => {
  const response = await callLocalMl("/assessment", { skills, count: 10, difficulty: 2 }, assessmentResponseSchema);
  assert.equal(response.questions.length, 10);
  const session = createAssessment(user, response.questions, { purpose: "practice", difficulty: response.difficulty });
  assert.equal("correct_index" in session.questions[0], false);
  const grade = gradeAssessment(user, { assessment_token: session.assessment_token, answers: response.questions.map(q => ({ question_id: q.id, selected_index: q.correct_index })) }, "practice");
  assert.equal(grade.score, 100);
  assert.equal(grade.skills.length, 2);
  assert.equal(grade.review.length, 10);
});

test("real model recommendations conform to the database insertion contract", async () => {
  const response = await callLocalMl("/recommend", { skills, limit: 3 }, recommendationResponseSchema);
  assert.equal(response.recommendations.length, 2);
  assert.ok(response.recommendations.every(r => r.resources.length >= 2));
});
