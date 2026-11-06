import test from "node:test";
import { learningContextKey } from "../lib/learningContextKey";
import assert from "node:assert/strict";
import { careerCatalogue, careerCoverage, careerForName, hasKnowledgeCoverage, matchCareers, requiredScore } from "../lib/careerCatalog";

test("technical and non-technical career aliases map to the intended profile", () => {
  for (const [query, expected] of [
    ["React developer", "Frontend Developer"], ["back-end engineer", "Backend Developer"],
    ["SOC analyst", "Cybersecurity Analyst"], ["HR recruiter", "Recruitment Associate"],
    ["digital marketer", "Digital Marketing Associate"], ["bookkeeper", "Accounting Associate"],
    ["customer success manager", "Customer Success Associate"], ["project administrator", "Project Coordinator"],
    ["payroll clerk", "Payroll Specialist"], ["mechanical drafter", "CAD Technician"],
  ]) assert.equal(matchCareers(query)[0]?.role.name, expected, query);
});

test("an unknown or underspecified title is not forced into a preset career", () => {
  assert.equal(matchCareers("Underwater basket weaving instructor").length, 0);
  assert.equal(matchCareers("analyst").length, 0);
  assert.equal(matchCareers("developer").length, 0);
  assert.equal(matchCareers("  ").length, 0);
});

test("suggestions are limited to careers actually available in the database", () => {
  const stored = [{id: "production-uuid", name: "Accounting Associate"}];
  assert.equal(matchCareers("bookkeeper", stored)[0].stored?.id, "production-uuid");
  assert.equal(matchCareers("React developer", stored).length, 0);
});

test("career coverage distinguishes objective knowledge from specialist practice", () => {
  const pilot = careerCatalogue.roles.filter(role => role.release_status === "pilot");
  assert.equal(careerCatalogue.roles.length, 60);
  assert.equal(pilot.length, 30);
  assert.equal(pilot.filter(role => careerCatalogue.families.find(family => family.key === role.family)?.kind === "technical").length, 13);
  assert.equal(new Set(pilot.map(role => role.family)).size, 10);
  for (const role of pilot) assert.equal(careerCoverage(role).review, 0, role.name);
  assert.equal(hasKnowledgeCoverage("Workplace Communication"), true);
  assert.equal(hasKnowledgeCoverage("UX Research & Interaction Design"), true);
  assert.ok(careerCoverage(careerForName("Payroll Specialist")!).review > 0);
});

test("learning targets are independent from priority and honor the selected level", () => {
  assert.equal(requiredScore({weight: 1, required_score: 65}), 65);
  assert.equal(requiredScore({weight: .1, required_score: 65}, "intermediate"), 75);
  assert.equal(requiredScore({required_score: 98}, "intermediate"), 100);
  assert.equal(requiredScore({weight: .8}), 80); // Legacy metadata fallback.
});
test("insight context follows career, level, focus and assessment evidence", () => {
  const base = {roleId: "career-a", role: "My direction", level: "foundation", goalContext: "", skills: [{id: "skill-a", name: "Accounting Foundations", score: null, target: 70, importance: 1}]};
  assert.equal(learningContextKey(base), learningContextKey({...base, skills: [...base.skills]}));
  for (const changed of [{...base, roleId: "career-b"}, {...base, role: "Another direction"}, {...base, level: "intermediate"}, {...base, skills: [{...base.skills[0], score: 80}]}, {...base, skills: [{...base.skills[0], id: "skill-b"}]}])
    assert.notEqual(learningContextKey(base), learningContextKey(changed));
});
