// Synthetic public software evaluation. Never add learner narratives here.
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import fs from "node:fs";
import {resolve} from "node:path";
import {pathToFileURL} from "node:url";
import ts from "typescript";
import {careerCatalogue, matchCareers} from "../lib/careerCatalog";

const digest = (text: string) => createHash("sha256").update(text.replaceAll("\r\n", "\n")).digest("hex");
const matcherSource = fs.readFileSync("lib/careerCatalog.ts", "utf8");
const matcherJs = ts.transpileModule(matcherSource, {compilerOptions: {module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022}}).outputText;
const args = process.argv.slice(2);
let beforeModule: string | undefined, output = "ml/evaluation-career-matching-v2-current.json";
for (let index = 0; index < args.length; index++) {
  if (args[index] === "--before" && !beforeModule && args[index + 1]) beforeModule = args[++index];
  else if (args[index] === "--output" && args[index + 1]) output = args[++index];
  else throw new Error("Use --before ml/runtime/<baseline>.ts and/or --output ml/<report>.json");
}
assert.match(output, /^ml\/[a-z0-9-]+\.json$/);
const freeze = JSON.parse(fs.readFileSync("ml/evaluation-career-challenge-v2-freeze.json", "utf8"));
const challengeBytes = fs.readFileSync(freeze.fixture, "utf8");
assert.equal(digest(challengeBytes), freeze.sha256_utf8_lf, "The observed challenge must not be silently rewritten");

type Matcher = typeof matchCareers;
type Fixture = {scope: string; roles: string[][]; custom: (string | string[])[][]; unsupported: (string | string[])[]; ambiguous: (string | string[])[]};
function evaluate(fixture: Fixture, matcher: Matcher) {
  const roles = fixture.roles.map(row => {
    const [query, expected] = row.slice(-2);
    const names = matcher(query).map(item => item.role.name);
    return {query, expected, top_3: names.slice(0, 3), rank: names.indexOf(expected) + 1};
  });
  const rejected = [...fixture.unsupported, ...fixture.ambiguous].map(row => {
    const query = typeof row === "string" ? row : row[1];
    const names = matcher(query).map(item => item.role.name);
    return {query, abstained: names.length === 0, top_3: names.slice(0, 3)};
  });
  const custom = fixture.custom.map(row => {
    const [query, expected] = row.slice(-2) as [string, string[]];
    const names = matcher(query).slice(0, 3).map(item => item.role.name);
    return {query, expected, top_3: names, hit: expected.some(name => names.includes(name))};
  });
  return {scope: fixture.scope, metrics: {role_count: roles.length, role_first: roles.filter(row => row.rank === 1).length, role_top_3: roles.filter(row => row.rank > 0 && row.rank <= 3).length, abstentions: rejected.filter(row => row.abstained).length, abstention_count: rejected.length, custom_hits: custom.filter(row => row.hit).length, custom_count: custom.length}, roles, rejected, custom};
}

const fixturePaths = {golden: "tests/fixtures/career-matching-golden.json", adversarial: "tests/fixtures/career-matching-adversarial-v1.json", challenge: freeze.fixture};
const fixtures = Object.fromEntries(Object.entries(fixturePaths).map(([name, path]) => [name, JSON.parse(fs.readFileSync(path, "utf8")) as Fixture]));
let before: Record<string, ReturnType<typeof evaluate>> | undefined;
if (beforeModule) {
  assert.match(beforeModule, /^ml\/runtime\/[a-z0-9-]+\.ts$/);
  assert.equal(digest(fs.readFileSync(beforeModule, "utf8")), freeze.baseline_matcher_sha256_utf8_lf);
  const baseline = await import(pathToFileURL(resolve(beforeModule)).href);
  before = Object.fromEntries(Object.entries(fixtures).map(([name, fixture]) => [name, evaluate(fixture, baseline.matchCareers)]));
}
const after = Object.fromEntries(Object.entries(fixtures).map(([name, fixture]) => [name, evaluate(fixture, matchCareers)]));
const report = {
  version: "matching-v2-2026-11-10", evaluated_at: new Date().toISOString(),
  scope: "Agent-authored synthetic ranking/abstention regression evidence, not independent user research, expert validation, fit probabilities or a professional-readiness measure. Golden/adversarial cases were observed during development. The new challenge's first candidate was frozen before its predictions were inspected; later executions are regressions.",
  matcher_source_sha256_utf8_lf: digest(matcherSource), matcher_executable_sha256_utf8_lf: digest(matcherJs),
  challenge_fixture_sha256: digest(challengeBytes), candidate_matches_frozen_first_execution: digest(matcherJs) === freeze.first_candidate_executable_sha256_utf8_lf,
  role_count: careerCatalogue.roles.length, ...(before ? {before} : {}), after,
};
fs.writeFileSync(output, JSON.stringify(report, null, 2) + "\n", {flag: output.endsWith("-first.json") ? "wx" : "w"});
console.log(JSON.stringify({report: output, matcher_executable_sha256: report.matcher_executable_sha256_utf8_lf, ...(before ? {before: Object.fromEntries(Object.entries(before).map(([name, result]) => [name, result.metrics]))} : {}), after: Object.fromEntries(Object.entries(after).map(([name, result]) => [name, result.metrics]))}, null, 2));
console.log("Challenge misses", {roles: after.challenge.roles.filter(row => row.rank !== 1), rejected: after.challenge.rejected.filter(row => !row.abstained), custom: after.challenge.custom.filter(row => !row.hit)});
