import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import { persistCloudSubmission } from "../lib/cloudSubmissions";
import { persistVerifiedAssessment, type VerifiedGrade } from "../lib/assessmentPersistence";

const previousFetch = globalThis.fetch;
const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
afterEach(() => {
  globalThis.fetch = previousFetch;
  for (const [name, value] of [["SUPABASE_SERVICE_ROLE_KEY", previousKey], ["NEXT_PUBLIC_SUPABASE_URL", previousUrl]]) {
    if (value === undefined) delete process.env[name!]; else process.env[name!] = value;
  }
});
const userId = "11111111-1111-4111-8111-111111111111";
const grade: VerifiedGrade = {
  assessmentId: "22222222-2222-4222-8222-222222222222", metadata: { purpose: "practice", difficulty: 2 },
  correct: 1, total: 1, score: 100,
  skills: [{ skill_id: "33333333-3333-4333-8333-333333333333", skill_name: "SQL", correct: 1, total: 1, score: 100 }], review: [],
};
function configure() {
  process.env.SUPABASE_SERVICE_ROLE_KEY = "synthetic-server-key";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
}

test("real grades use one service-authenticated transaction RPC in local and cloud environments", async () => {
  configure();
  let requests = 0, demoWrites = 0;
  globalThis.fetch = async (url, options) => {
    requests++;
    assert.equal(String(url), "https://example.supabase.co/rest/v1/rpc/vf_commit_assessment");
    assert.equal(new Headers(options?.headers).get("authorization"), "Bearer synthetic-server-key");
    assert.deepEqual(JSON.parse(String(options?.body)), { p_id: grade.assessmentId, p_user_id: userId, p_grade: grade, p_answers: { q: 0 } });
    return new Response(JSON.stringify({ xp_total: 33 }));
  };
  const result = await persistVerifiedAssessment({} as SupabaseClient, userId, grade, [{ question_id: "q", selected_index: 0 }], async () => { demoWrites++; return { xp_total: 999 }; });
  assert.deepEqual(result, { xp_total: 33 });
  assert.equal(requests, 1);
  assert.equal(demoWrites, 0);
});

test("transaction failure never runs partial demo/client writes and a retry can recover", async () => {
  configure();
  let writes = 0;
  globalThis.fetch = async () => new Response(JSON.stringify({ code: "23503", message: "synthetic failure" }), { status: 400 });
  await assert.rejects(persistVerifiedAssessment({} as SupabaseClient, userId, grade, [], async () => { writes++; return {}; }), /confirm your results/);
  assert.equal(writes, 0);
  globalThis.fetch = async () => new Response(JSON.stringify({ xp_total: 33 }));
  assert.deepEqual(await persistCloudSubmission(userId, grade, []), { xp_total: 33 });
});

test("missing server credentials cannot fall back to user-controlled progress writes", async () => {
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  globalThis.fetch = async () => { throw new Error("No network expected"); };
  await assert.rejects(persistCloudSubmission(userId, grade, []), /not configured/);
});

test("demo replay stays in its isolated ledger without a Supabase server key", async () => {
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  globalThis.fetch = async (url, options) => {
    assert.ok(String(url).endsWith("/guest/ledger"));
    assert.equal(JSON.parse(String(options?.body)).action, "claim");
    return new Response(JSON.stringify({ status: "completed", result: { xp_total: 33 } }));
  };
  let writes = 0;
  const demo = { __demoToken: "synthetic-demo" } as unknown as SupabaseClient;
  assert.deepEqual(await persistVerifiedAssessment(demo, userId, grade, [], async () => { writes++; return {}; }), { xp_total: 33 });
  assert.equal(writes, 0);
});
