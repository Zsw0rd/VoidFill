import test from "node:test";
import assert from "node:assert/strict";
import { rankLearningSkills, weeklyLearningRoute } from "../lib/learningPlan";

test("planning distinguishes unassessed skills from measured zero and explains real prerequisites", () => {
  const skills = [
    { id: "sql", name: "SQL", score: 0, target: 70, importance: 1 },
    { id: "python", name: "Python", score: null, target: 70, importance: 1 },
    { id: "charts", name: "Visualization", score: 85, target: 75, importance: 1 },
  ];
  const ranked = rankLearningSkills(skills, [{ prerequisite_skill_id: "sql", dependent_skill_id: "python" }, { prerequisite_skill_id: "sql", dependent_skill_id: "unrelated" }]);
  assert.equal(ranked[0].id, "sql");
  assert.match(ranked[0].reason, /0\/100/);
  assert.deepEqual(ranked[0].prerequisiteFor, ["Python"]);
  assert.match(ranked[1].reason, /No knowledge baseline/);
  assert.equal(ranked[2].id, "charts");
  assert.deepEqual(skills.map(skill => skill.score), [0, null, 85]);
});

test("completed daily check changes the next action without claiming practical completion", () => {
  const ranked = rankLearningSkills([{ id: "skill with spaces", name: "Customer service", score: 55, target: 75, importance: .9 }]);
  const actions = weeklyLearningRoute(ranked, true);
  assert.equal(actions[0].href, "/practice-test");
  assert.equal(actions[1].href, "/roadmap?skill=skill%20with%20spaces#learning-map");
  assert.equal(actions[2].href, "/practical");
  assert.equal(actions.length, 4);
  assert.equal(weeklyLearningRoute([], false)[0].href, "/careers");
});
