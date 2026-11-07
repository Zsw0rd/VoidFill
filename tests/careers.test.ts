import test from "node:test";
import { learningContextKey } from "../lib/learningContextKey";
import assert from "node:assert/strict";
import { careerAssessmentDifficulty, careerCatalogue, careerCoverage, careerForName, hasKnowledgeCoverage, matchCareers, requiredScore } from "../lib/careerCatalog";
import fs from "node:fs";

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
  assert.equal(pilot.length, 60);
  assert.equal(pilot.filter(role => careerCatalogue.families.find(family => family.key === role.family)?.kind === "technical").length, 24);
  assert.equal(new Set(pilot.map(role => role.family)).size, 10);
  for (const role of pilot) assert.equal(careerCoverage(role).review, 0, role.name);
  assert.equal(hasKnowledgeCoverage("Workplace Communication"), true);
  assert.equal(hasKnowledgeCoverage("UX Research & Interaction Design"), true);
  assert.equal(careerCoverage(careerForName("Payroll Specialist")!).review, 0);
  assert.equal(hasKnowledgeCoverage("Payroll Operations"), true);
  assert.equal(hasKnowledgeCoverage("Underwater basket weaving"), false);
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

test("career level selects an authored bank rather than relabelling foundation questions", () => {
  assert.equal(careerAssessmentDifficulty("foundation", 5), 2);
  assert.equal(careerAssessmentDifficulty("foundation", 1), 1);
  assert.equal(careerAssessmentDifficulty("intermediate", 1), 3);
  assert.equal(careerAssessmentDifficulty("intermediate", 5), 3);
});

test("career suggestions handle task narratives, custom combinations and unsupported boundaries", () => {
  const fixture = JSON.parse(fs.readFileSync("tests/fixtures/career-matching-golden.json", "utf8"));
  let first = 0, topThree = 0;
  for (const [query, expected] of fixture.roles) {
    const names = matchCareers(query).map(row => row.role.name);
    first += Number(names[0] === expected);
    topThree += Number(names.slice(0, 3).includes(expected));
  }
  assert.ok(first / fixture.roles.length >= .95);
  assert.equal(topThree, 60);
  for (const query of [...fixture.unsupported, ...fixture.ambiguous]) assert.equal(matchCareers(query).length, 0, query);
  for (const [query, expected] of fixture.custom) assert.ok(matchCareers(query).slice(0,3).some(row => expected.includes(row.role.name)), query);
});
