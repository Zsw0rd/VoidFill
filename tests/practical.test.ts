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
