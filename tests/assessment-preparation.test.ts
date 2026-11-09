import test from "node:test";
import assert from "node:assert/strict";
import { prepareAssessmentContext } from "../lib/learningContext";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(accept => { resolve = accept; });
  return { promise, resolve };
}

function learnerClient(profile: Promise<any>, history: Promise<any>, observed: string[]) {
  return { from(table: string) {
    const filters: [string, unknown][] = [];
    const query: any = {
      select: () => query, maybeSingle: () => query, not: () => query,
      order: () => query, limit: () => query,
      eq: (column: string, value: unknown) => { filters.push([column, value]); return query; },
      then: (accept: (value: any) => unknown, reject: (error: unknown) => unknown) => {
        observed.push(table);
        assert.ok(filters.some(([column, value]) => column === (table === "profiles" ? "id" : table === "role_skills" ? "role_id" : "user_id") && value === (table === "role_skills" ? "selected-role" : "verified-owner")), table + " must retain its owner/role predicate");
        const result = table === "profiles" ? profile
          : table.endsWith("attempts") ? history
          : Promise.resolve({ data: table === "user_skill_scores" ? [{ skill_id: "sql", score: 62 }] : [{ skill_id: "sql", weight: 1, required_score: 70, skills: { name: "SQL Fundamentals" } }], error: null });
        return result.then(accept, reject);
      },
    };
    return query;
  } } as any;
}

for (const kind of ["daily", "practice"] as const) {
  test(`${kind} history starts while learner profile is blocked, with level and owner preserved`, async () => {
    const profile = deferred<any>(), history = deferred<any>(), observed: string[] = [];
    const pending = prepareAssessmentContext(learnerClient(profile.promise, history.promise, observed), "verified-owner", kind);
    await new Promise(resolve => setImmediate(resolve));
    assert.ok(observed.includes(kind === "daily" ? "daily_attempts" : "practice_attempts"), "history must start before the profile is released");
    assert.ok(!observed.includes("role_skills"), "this is a genuine blocked profile, not an already completed context");
    history.resolve({ data: [{ correct_count: 9, total_count: 10, difficulty_level: 3 }], error: null });
    profile.resolve({ data: { target_role_id: "selected-role", roles: { name: "Data Analyst" }, career_level: "foundation", career_focus_skill_ids: [] }, error: null });
    const context = await pending;
    assert.equal(context.difficulty, 2, "foundation retains the existing cap of two despite strong recent scores");
    assert.equal(context.skills[0].score, 62);
    assert.equal(context.roleId, "selected-role");
    assert.match(context.assessmentContext, /^[a-f0-9]{64}$/);
  });
}

test("parallel preparation still fails closed for a history error and does not downgrade intermediate", async () => {
  const profile = Promise.resolve({ data: { target_role_id: "selected-role", roles: { name: "Data Analyst" }, career_level: "intermediate", career_focus_skill_ids: [] }, error: null });
  const context = await prepareAssessmentContext(learnerClient(profile, Promise.resolve({ data: [], error: null }), []), "verified-owner", "practice");
  assert.equal(context.difficulty, 3);
  await assert.rejects(() => prepareAssessmentContext(learnerClient(profile, Promise.resolve({ data: null, error: { message: "private database detail" } }), []), "verified-owner", "daily"), /Could not load assessment history/);
});
