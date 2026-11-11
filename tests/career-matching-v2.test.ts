import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import fs from "node:fs";
import test from "node:test";
import {careerCatalogue, matchCareers} from "../lib/careerCatalog";

const read = (path: string) => JSON.parse(fs.readFileSync(path, "utf8"));
const challengePath = "tests/fixtures/career-matching-challenge-v2.json";
const challenge = read(challengePath);
const freeze = read("ml/evaluation-career-challenge-v2-freeze.json");
const first = read("ml/evaluation-career-matching-v2-first.json");

test("new challenge labels and its actual first execution remain inspectable and frozen", () => {
  const fingerprint = createHash("sha256").update(fs.readFileSync(challengePath, "utf8").replaceAll("\r\n", "\n")).digest("hex");
  assert.equal(fingerprint, freeze.sha256_utf8_lf);
  assert.equal(first.challenge_fixture_sha256, fingerprint);
  assert.equal(first.matcher_executable_sha256_utf8_lf, freeze.first_candidate_executable_sha256_utf8_lf);
  assert.equal(first.candidate_matches_frozen_first_execution, true);
  assert.equal(freeze.frozen_before_first_matcher_execution, true);
  assert.equal(freeze.first_candidate_recorded_before_challenge_execution, true);
  assert.equal(challenge.roles.length + challenge.custom.length + challenge.unsupported.length + challenge.ambiguous.length, 24);
  assert.deepEqual(first.before.challenge.metrics, {role_count: 12, role_first: 7, role_top_3: 12, abstentions: 7, abstention_count: 8, custom_hits: 4, custom_count: 4});
  // The held-out ambiguities stay recorded; do not describe all labels as first.
  assert.equal(first.after.challenge.roles.filter((row: any) => row.rank !== 1).length, 2);
});

test("all old observed first-choice regressions and custom combinations are retained", () => {
  for (const fixture of [read("tests/fixtures/career-matching-golden.json"), read("tests/fixtures/career-matching-adversarial-v1.json")]) {
    for (const row of fixture.roles) {
      const [query, expected] = row.slice(-2);
      assert.equal(matchCareers(query)[0]?.role.name, expected, query);
    }
    for (const row of fixture.custom) {
      const [query, expected] = row.slice(-2);
      assert.ok(matchCareers(query).slice(0, 3).some(item => expected.includes(item.role.name)), query);
    }
    for (const row of [...fixture.unsupported, ...fixture.ambiguous]) {
      const query = typeof row === "string" ? row : row[1];
      assert.equal(matchCareers(query).length, 0, query);
    }
  }
});

test("the once-held-out challenge retains its honest first-result regression floors", () => {
  let firstCount = 0;
  for (const [query, expected] of challenge.roles) {
    const names = matchCareers(query).map(item => item.role.name);
    firstCount += Number(names[0] === expected);
    assert.ok(names.slice(0, 3).includes(expected), query);
  }
  assert.ok(firstCount >= 10);
  for (const query of [...challenge.unsupported, ...challenge.ambiguous]) assert.equal(matchCareers(query).length, 0, query);
  for (const [query, expected] of challenge.custom) assert.ok(matchCareers(query).slice(0, 3).some(item => expected.includes(item.role.name)), query);
});

test("exact career names and unique formal aliases keep their identity", () => {
  const aliases = new Map<string, number>();
  for (const role of careerCatalogue.roles) for (const name of [role.name, ...role.aliases]) aliases.set(name, (aliases.get(name) || 0) + 1);
  for (const role of careerCatalogue.roles) {
    assert.equal(matchCareers(role.name)[0]?.role.id, role.id, role.name);
    for (const alias of role.aliases) if (aliases.get(alias) === 1) assert.equal(matchCareers(alias)[0]?.role.id, role.id, alias);
  }
});

test("a stripped title or job-seeking meta-language cannot invent a name anchor", () => {
  for (const query of ["My goal is to become an analyst", "I would really like a useful role", "I want a technical career", "Help me choose a new opportunity"]) assert.equal(matchCareers(query).length, 0, query);
  const api = matchCareers("A browser interface will communicate with an API and persistent data");
  assert.equal(api.find(item => item.role.name === "Backend Developer")?.hasNameAnchor ?? false, false);
  const general = matchCareers("Software programming, algorithms and code review are my focus; testing matters too");
  assert.equal(general.find(item => item.role.name === "QA Engineer")?.hasNameAnchor ?? false, false);
});

test("excluded trailing alternatives are not restored as positive evidence", () => {
  for (const separator of ["rather than", "instead of"]) {
    assert.equal(matchCareers(`${separator} Data Analyst`).length, 0);
    const positive = matchCareers("Payroll Specialist").map(item => [item.role.id, item.score]);
    assert.deepEqual(matchCareers(`Payroll Specialist ${separator} Cloud Support Associate`).map(item => [item.role.id, item.score]), positive);
  }
});

test("matching explanations prioritize substantive evidence and stay database-scoped", () => {
  const rows = matchCareers("Help software customers adopt a product and publish useful troubleshooting guides");
  assert.ok(rows.slice(0, 3).some(item => item.role.name === "Customer Success Associate"));
  assert.ok(rows.slice(0, 3).some(item => item.role.name === "Technical Writer"));
  for (const item of rows) {
    assert.ok(Number.isFinite(item.score) && item.score > 0);
    assert.ok(item.evidence.length > 0 && item.evidence.length <= 5);
    assert.equal(new Set(item.evidence).size, item.evidence.length);
  }
  const available = [{id: "fixture-technical-writer", name: "Technical Writer"}];
  const scoped = matchCareers("Help software customers adopt a product and publish useful troubleshooting guides", available);
  assert.equal(scoped.length, 1); assert.equal(scoped[0].stored?.id, available[0].id);
});
