import test from "node:test";
import assert from "node:assert/strict";
import { careerCatalogue } from "../lib/careerCatalog";
import { canReviewPractical, practicalBrief, practicalBriefForStoredRole, practicalLinkSchema, practicalMutationSchema, validatePracticalReview } from "../lib/practical";

const user = "11111111-1111-4111-8111-111111111111";
const mentor = "22222222-2222-4222-8222-222222222222";
const submission = "33333333-3333-4333-8333-333333333333";

test("all sixty career activities have immutable level-specific practical briefs", () => {
  assert.equal(careerCatalogue.roles.length, 60);
  for (const role of careerCatalogue.roles) for (const level of ["foundation", "intermediate"] as const) {
    const brief = practicalBrief(role.id, level)!;
    assert.equal(brief.role_id, role.id);
    assert.equal(brief.level, level);
    assert.ok(brief.deliverable.trim().length > 0);
    assert.ok(brief.rubric.length > 0 && brief.rubric.length <= 20);
    const first = brief.rubric[0];
    brief.rubric[0] = "A caller changed its local snapshot";
    assert.equal(practicalBrief(role.id, level)!.rubric[0], first);
  }
  assert.equal(practicalBrief(user, "foundation"), undefined);
});

test("every new practical brief snapshots role-specific synthetic inputs and a level-specific verification", () => {
  const foundationInputs = new Set<string>();
  for (const role of careerCatalogue.roles) {
    const foundation = practicalBrief(role.id, "foundation")!;
    const intermediate = practicalBrief(role.id, "intermediate")!;
    assert.equal(foundation.case_inputs?.length, 2, role.name);
    assert.equal(intermediate.case_inputs?.length, 3, role.name);
    assert.deepEqual(intermediate.case_inputs?.slice(0, 2), foundation.case_inputs);
    assert.match(foundation.version, /case-packs-3$/);
    assert.equal(foundation.rubric.at(-1), role.curriculum.foundation.case_verification);
    assert.equal(intermediate.rubric.at(-1), role.curriculum.intermediate.case_verification);
    assert.notEqual(foundation.rubric.at(-1), intermediate.rubric.at(-1));
    assert.equal(foundation.title, role.curriculum.foundation.case_title);
    assert.equal(foundation.instructions, role.curriculum.foundation.case_task);
    assert.equal(foundation.deliverable, role.curriculum.foundation.case_deliverable);
    assert.deepEqual(foundation.rubric, role.curriculum.foundation.case_acceptance);
    assert.notEqual(foundation.instructions, intermediate.instructions, role.name);
    assert.notEqual(foundation.deliverable, intermediate.deliverable, role.name);
    assert.ok(foundation.case_sources?.length, role.name);
    const originalUrl = foundation.case_sources![0].url;
    foundation.case_sources![0].url = "https://example.com/caller-change";
    assert.equal(practicalBrief(role.id, "foundation")!.case_sources![0].url, originalUrl);
    foundationInputs.add(JSON.stringify(foundation.case_inputs));
    const original = foundation.case_inputs![0];
    foundation.case_inputs![0] = "Untrusted caller edit";
    assert.equal(practicalBrief(role.id, "foundation")!.case_inputs![0], original);
  }
  assert.equal(foundationInputs.size, 60);
});

test("new briefs bind equipment, notes and finance tasks to supplied inputs instead of unrelated broad activities", () => {
  const brief = (name: string, level: "foundation" | "intermediate" = "foundation") => practicalBrief(careerCatalogue.roles.find(role => role.name === name)!.id, level)!;
  assert.match(brief("Full-Stack Developer").instructions, /returning equipment E1/);
  assert.doesNotMatch(brief("Full-Stack Developer").instructions, /booking/);
  assert.match(brief("Mobile Developer").instructions, /offline note N1/i);
  assert.doesNotMatch(brief("Mobile Developer").instructions, /appointment/);
  assert.match(brief("Financial Analyst").rubric.join(" "), /cannot be calculated/);
  assert.match(brief("Financial Analyst", "intermediate").instructions, /conditional cash sensitivity/);
  assert.match(brief("Credit Analyst").rubric.join(" "), /53.3% of current assets/);
});

test("legacy catalogue metadata still produces a readable brief without inventing source references", () => {
  const role = careerCatalogue.roles[0];
  const original = role.curriculum.foundation;
  const {case_title, case_task, case_deliverable, case_acceptance, case_sources, ...legacy} = original;
  try {
    role.curriculum.foundation = legacy;
    const brief = practicalBrief(role.id, "foundation")!;
    assert.equal(brief.title, role.activity.title);
    assert.equal(brief.instructions, role.activity.instructions);
    assert.equal(brief.deliverable, legacy.milestones.at(-1)!.deliverable);
    assert.equal(brief.case_sources, undefined);
    assert.equal(brief.rubric.at(-1), legacy.case_verification);
  } finally { role.curriculum.foundation = original; }
});

test("evidence links accept only public HTTPS and never credentials or executable URLs", () => {
  assert.equal(practicalLinkSchema.parse("https://example.com/work?version=2"), "https://example.com/work?version=2");
  for (const url of ["javascript:alert(1)", "data:text/html,hello", "http://example.com", "https://name:password@example.com/work", "https://localhost", "https://127.0.0.1/", "https://10.0.0.1/", "https://192.168.0.1", "https://172.16.0.1/"]) assert.equal(practicalLinkSchema.safeParse(url).success, false, url);
});

test("real stored legacy role UUIDs resolve by name without migrating learner identities", () => {
  for (const name of ["Data Analyst", "Frontend Developer", "AI Applications Developer"]) {
    const role = careerCatalogue.roles.find(item => item.name === name)!;
    const legacy = {id: user, name};
    assert.notEqual(legacy.id, role.id);
    const brief = practicalBriefForStoredRole(legacy, "intermediate")!;
    assert.equal(brief.role_id, legacy.id);
    assert.equal(brief.role_key, role.key);
    assert.equal(brief.role_name, name);
    assert.equal(practicalBrief(role.id, "intermediate")!.role_id, role.id);
  }
  assert.equal(practicalBriefForStoredRole({id: user, name: "Unsupported specialist"}, "foundation"), undefined);
});

test("the real practical write path binds its brief and foreign key to the stored legacy UUID", async () => {
  const {mutatePractical} = await import("../lib/practicalServer");
  const prior = {fetch: globalThis.fetch, key: process.env.SUPABASE_SERVICE_ROLE_KEY, url: process.env.NEXT_PUBLIC_SUPABASE_URL};
  process.env.SUPABASE_SERVICE_ROLE_KEY = "synthetic-server-key";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  const storedRole = {id: submission, name: "Frontend Developer"};
  const client: any = {from(table: string) {
    assert.equal(table, "roles");
    const query: any = {select: () => query, eq(column: string, id: string) {assert.equal(column, "id"); assert.equal(id, storedRole.id); return query;}, maybeSingle: async () => ({data: storedRole, error: null})};
    return query;
  }};
  try {
    globalThis.fetch = async (url, options) => {
      assert.ok(String(url).endsWith("/rpc/vf_practical_mutate"));
      const input = JSON.parse(String(options?.body));
      assert.equal(input.p_actor, user);
      assert.equal(input.p_payload.role_id, storedRole.id);
      assert.equal(input.p_payload.brief.role_id, storedRole.id);
      assert.equal(input.p_payload.brief.role_name, storedRole.name);
      assert.notEqual(storedRole.id, careerCatalogue.roles.find(role => role.name === storedRole.name)!.id);
      return new Response(JSON.stringify({ok: true}));
    };
    const input = practicalMutationSchema.parse({action: "save", expected_version: 0, role_id: storedRole.id, level: "foundation", content: "A synthetic draft", links: []});
    assert.deepEqual(await mutatePractical(client, user, input), {ok: true});
  } finally {
    globalThis.fetch = prior.fetch;
    for (const [name, value] of [["SUPABASE_SERVICE_ROLE_KEY", prior.key], ["NEXT_PUBLIC_SUPABASE_URL", prior.url]]) {
      if (value === undefined) delete process.env[name!]; else process.env[name!] = value;
    }
  }
});

test("the public mutation contract rejects forged identity, rubrics, missing consent and oversized work", () => {
  const draft = {action: "save", expected_version: 0, role_id: careerCatalogue.roles[0].id, level: "foundation", content: "my work", links: []};
  assert.equal(practicalMutationSchema.safeParse(draft).success, true);
  for (const addition of [{user_id: mentor}, {brief: {rubric: ["mark me ready"]}}, {draft_version: 99}]) assert.equal(practicalMutationSchema.safeParse({...draft, ...addition}).success, false);
  assert.equal(practicalMutationSchema.safeParse({...draft, content: "x".repeat(12001)}).success, false);
  assert.equal(practicalMutationSchema.safeParse({...draft, links: Array(4).fill("https://example.com")}).success, false);
  const share = {action: "submit", project_id: submission, expected_version: 1, mentor_id: mentor, request_id: user};
  assert.equal(practicalMutationSchema.safeParse(share).success, false);
  assert.equal(practicalMutationSchema.safeParse({...share, consent: false}).success, false);
  assert.equal(practicalMutationSchema.safeParse({...share, consent: true}).success, true);
});

test("a review must cover every saved criterion exactly once and ready means all demonstrated", () => {
  const review = {action: "review" as const, submission_id: submission, verdict: "revise" as "ready" | "revise", feedback: "Explain the check against the second example.", criteria: [{criterion: 0, judgement: "demonstrated" as const, comment: ""}, {criterion: 1, judgement: "developing" as const, comment: ""}]};
  assert.equal(validatePracticalReview(review, ["Check A", "Check B"]), null);
  assert.match(validatePracticalReview({...review, criteria: [review.criteria[0]]}, ["Check A", "Check B"])!, /every criterion/);
  assert.match(validatePracticalReview({...review, criteria: [review.criteria[0], review.criteria[0]]}, ["Check A", "Check B"])!, /every criterion/);
  assert.match(validatePracticalReview({...review, verdict: "ready"}, ["Check A", "Check B"])!, /every criterion is demonstrated/);
  assert.equal(validatePracticalReview({...review, verdict: "ready", criteria: review.criteria.map(item => ({...item, judgement: "demonstrated"}))}, ["Check A", "Check B"]), null);
});

test("assignment-specific consent denies other mentors, unassigned admins, stale assignments and withdrawals", () => {
  const work = {user_id: user, mentor_id: mentor, assignment_id: submission, withdrawn_at: null};
  const assignment = {id: submission, mentor_id: mentor, user_id: user};
  assert.equal(canReviewPractical(work, {id: mentor, role: "mentor"}, assignment), true);
  assert.equal(canReviewPractical(work, {id: mentor, role: "admin"}, assignment), true);
  assert.equal(canReviewPractical(work, {id: user, role: "super_admin"}, assignment), false);
  assert.equal(canReviewPractical(work, {id: mentor, role: "student"}, assignment), false);
  assert.equal(canReviewPractical(work, {id: mentor, role: "mentor"}, null), false);
  assert.equal(canReviewPractical(work, {id: mentor, role: "mentor"}, {...assignment, id: user}), false);
  assert.equal(canReviewPractical({...work, withdrawn_at: new Date().toISOString()}, {id: mentor, role: "mentor"}, assignment), false);
});
