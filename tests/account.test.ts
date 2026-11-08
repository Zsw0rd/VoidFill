import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { accountRequestInput, collectAccountExport, confirmedAccountEmail } from "../lib/account";
import { exchangeRecoveryAwareCode, hasRecentRecoveryClaim, issueRecoveryGrant, RECOVERY_LIFETIME_SECONDS, recoveryCookieOptions, sameOriginRequest, validNewPassword, validRecoveryGrant } from "../lib/auth/recovery";

const authUrl = "https://account-test.supabase.co";
const actor = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
const instant = Date.parse("2026-11-08T12:00:00Z");
const seconds = instant / 1000;
function token(patch: Record<string, unknown> = {}) {
  const claims = { sub: actor, iss: authUrl + "/auth/v1", role: "authenticated", aud: "authenticated", is_anonymous: false, iat: seconds, exp: seconds + 3600, session_id: "33333333-3333-4333-8333-333333333333", amr: [{ method: "recovery", timestamp: seconds }], ...patch };
  return "eyJhbGciOiJIUzI1NiJ9." + Buffer.from(JSON.stringify(claims)).toString("base64url") + ".synthetic-signature";
}

test("password recovery requires a recent recovery AMR from the exact provider-validated credential", () => {
  assert.equal(hasRecentRecoveryClaim(token(), actor, instant, authUrl), true);
  for (const patch of [
    { amr: [{ method: "oauth", timestamp: seconds }] }, { amr: [{ method: "password", timestamp: seconds }] },
    { amr: undefined }, { amr: ["recovery"] }, { amr: [{ method: "recovery", timestamp: seconds - 600 }] },
    { amr: [{ method: "recovery", timestamp: seconds + 100 }] }, { sub: other }, { iss: "https://foreign.supabase.co/auth/v1" },
    { aud: "anon" }, { role: "service_role" }, { is_anonymous: true }, { exp: seconds },
  ]) assert.equal(hasRecentRecoveryClaim(token(patch), actor, instant, authUrl), false);
  assert.equal(hasRecentRecoveryClaim("not-a-token", actor, instant, authUrl), false);
});

test("recovery grants use the existing service secret fallback and bind user, exact session, purpose and ten-minute expiry", () => {
  const oldSecret = process.env.ML_ASSESSMENT_SECRET, oldService = process.env.ML_SERVICE_TOKEN, oldUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  try {
    delete process.env.ML_ASSESSMENT_SECRET;
    process.env.ML_SERVICE_TOKEN = "synthetic-existing-service-secret-1234567890";
    process.env.NEXT_PUBLIC_SUPABASE_URL = authUrl;
    const session = token();
    const grant = issueRecoveryGrant(actor, session, instant);
    assert.equal(validRecoveryGrant(grant, actor, session, instant), true);
    assert.equal(validRecoveryGrant(grant, other, session, instant), false);
    assert.equal(validRecoveryGrant(grant, actor, token({ session_id: "44444444-4444-4444-8444-444444444444" }), instant), false);
    assert.equal(validRecoveryGrant(grant, actor, session, instant + RECOVERY_LIFETIME_SECONDS * 1000), false);
    assert.equal(validRecoveryGrant(grant + ".extra", actor, session, instant), false);
    const [body, signature] = grant.split(".");
    const wrongPurposeKey = createHmac("sha256", process.env.ML_SERVICE_TOKEN).update("voidfill/unrelated-purpose/v1").digest();
    const wrongPurposeGrant = body + "." + createHmac("sha256", wrongPurposeKey).update(body).digest("base64url");
    assert.equal(validRecoveryGrant(wrongPurposeGrant, actor, session, instant), false);
    const altered = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(body, "base64url").toString()), sub: other })).toString("base64url");
    assert.equal(validRecoveryGrant(altered + "." + signature, other, session, instant), false);
    process.env.ML_ASSESSMENT_SECRET = "different-purpose-synthetic-secret-1234567890";
    assert.equal(validRecoveryGrant(grant, actor, session, instant), false);
    assert.throws(() => issueRecoveryGrant(actor, token({ amr: [{ method: "oauth", timestamp: seconds }] }), instant));
    delete process.env.ML_ASSESSMENT_SECRET; delete process.env.ML_SERVICE_TOKEN;
    assert.equal(validRecoveryGrant(grant, actor, session, instant), false);
    assert.throws(() => issueRecoveryGrant(actor, session, instant));
  } finally {
    for (const [key, value] of [["ML_ASSESSMENT_SECRET", oldSecret], ["ML_SERVICE_TOKEN", oldService], ["NEXT_PUBLIC_SUPABASE_URL", oldUrl]]) value === undefined ? delete process.env[key!] : process.env[key!] = value;
  }
});

test("SDK recovery events only route the flow and subscriptions are always removed", async () => {
  for (const event of ["SIGNED_IN", "PASSWORD_RECOVERY"]) {
    let callback: (event: string) => void = () => {}, unsubscribed = false;
    const client = { auth: {
      onAuthStateChange(fn: typeof callback) { callback = fn; return { data: { subscription: { unsubscribe() { unsubscribed = true; } } } }; },
      async exchangeCodeForSession(code: string, options: any) { assert.equal(code, "synthetic-code"); assert.equal(options.flowId, "fixed-flow"); callback(event); return { data: { user: null, session: null }, error: null }; },
    } } as unknown as SupabaseClient;
    const result = await exchangeRecoveryAwareCode(client, "synthetic-code", "fixed-flow");
    assert.equal(result.recovery, event === "PASSWORD_RECOVERY"); assert.equal(unsubscribed, true);
    // The event never changes a normal OAuth token into server-issued recovery evidence.
    assert.equal(hasRecentRecoveryClaim(token({ amr: [{ method: "oauth", timestamp: seconds }] }), actor, instant, authUrl), false);
  }
});

test("account mutations reject absent/cross origin, weak or oversized passwords and forged action identities", () => {
  assert.equal(sameOriginRequest(new Request("https://voidfill.test/api/account/password", { headers: { Origin: "https://voidfill.test" } })), true);
  for (const origin of [null, "null", "https://attacker.test"]) assert.equal(sameOriginRequest(new Request("https://voidfill.test/api/account/password", { headers: origin ? { Origin: origin } : {} })), false);
  assert.equal(validNewPassword("a unique passphrase"), true);
  assert.equal(validNewPassword("short"), false); assert.equal(validNewPassword("🧑".repeat(128)), false);
  assert.equal(recoveryCookieOptions().httpOnly, true); assert.equal(recoveryCookieOptions().sameSite, "lax");
  assert.equal(confirmedAccountEmail(" User@Example.test ", "user@example.test"), true);
  assert.equal(confirmedAccountEmail("other@example.test", "user@example.test"), false);
  assert.deepEqual(accountRequestInput({ action: "request", confirmation: "user@example.test" }), { action: "request", confirmation: "user@example.test" });
  assert.equal(accountRequestInput({ action: "request", confirmation: "user@example.test", userId: other }), null);
  assert.equal(accountRequestInput({ action: "delete", requestId: actor }), null);
  assert.equal(accountRequestInput({ action: "close", requestId: actor, resolution: "A useful administrator response" }), null);
  assert.equal(accountRequestInput({ action: "close", requestId: actor, resolution: "short" }, true), null);
  assert.equal(accountRequestInput({ action: "cancel", requestId: "not-a-uuid" }), null);
  assert.deepEqual(accountRequestInput({ action: "close", requestId: actor, resolution: "Please contact support for identity review." }, true), { action: "close", requestId: actor, resolution: "Please contact support for identity review." });
});

function exportClient(tables: Record<string, Record<string, unknown>[]>, options: { fail?: string; unlimited?: boolean } = {}) {
  const scopes: { table: string; filters: [string, unknown][] }[] = [];
  const client = { from(table: string) {
    let columns = "*", start = 0, end = 0;
    const filters: [string, unknown][] = [];
    const query: any = {
      select(value: string) { columns = value; return query; },
      eq(key: string, value: unknown) { filters.push([key, value]); return query; },
      in(key: string, value: unknown[]) { filters.push([key, value]); return query; },
      order() { return query; }, range(left: number, right: number) { start = left; end = right; return query; }, abortSignal() { return query; },
      then(resolve: (value: any) => void) {
        scopes.push({ table, filters });
        if (options.fail === table) return Promise.resolve({ data: null, error: { message: "synthetic failure" } }).then(resolve);
        let data: Record<string, unknown>[] = options.unlimited ? Array.from({ length: 500 }, (_, index) => ({ id: index })) : (tables[table] || []).filter(row => filters.every(([key, value]) => Array.isArray(value) ? value.includes(row[key]) : row[key] === value)).slice(start, end + 1);
        if (columns !== "*") data = data.map(row => Object.fromEntries(columns.split(",").filter(key => key in row).map(key => [key, row[key]])));
        return Promise.resolve({ data, error: null }).then(resolve);
      },
    };
    return query;
  } } as unknown as SupabaseClient;
  return { client, scopes };
}

const user = { id: actor, email: "owner@example.test", created_at: "2026-01-01T00:00:00Z", email_confirmed_at: "2026-01-01T00:00:00Z", app_metadata: { role: "super_admin", providers: ["google"] }, user_metadata: {}, aud: "authenticated" } as User;

test("account export scopes even staff to own rows and excludes other learners, mentor messages, internal flags and authentication data", async () => {
  const { client, scopes } = exportClient({
    profiles: [{ id: actor, email: user.email, custom_target_role: "Personal direction", future_private_field: "do not export" }, { id: other, email: "foreign@example.test" }],
    user_skill_scores: [{ user_id: actor, skill_id: "skill1", score: 80 }, { user_id: other, skill_id: "skill2", score: 15 }],
    daily_attempts: [{ id: "owned-attempt", user_id: actor }, { id: "foreign-attempt", user_id: other }],
    attempt_answers: [{ id: "own-answer", attempt_id: "owned-attempt", selected_index: 1 }, { id: "foreign-answer", attempt_id: "foreign-attempt", selected_index: 3 }],
    chat_conversations: [{ id: "owned-conversation", user_id: actor, title: "Own chat", is_ai: true }, { id: "foreign-conversation", user_id: other }],
    chat_messages: [{ id: "own-message", conversation_id: "owned-conversation", sender_role: "user", content: "My own text", flag_reason: "private moderation" }, { id: "mentor-private", conversation_id: "owned-conversation", sender_role: "mentor", content: "Mentor private text" }, { id: "foreign-message", conversation_id: "foreign-conversation", sender_role: "user", content: "Foreign text" }],
  });
  const result = await collectAccountExport(client, user, new Date(instant));
  assert.equal(result.data.profile.length, 1); assert.equal(result.data.profile[0].custom_target_role, "Personal direction");
  assert.equal("future_private_field" in result.data.profile[0], false);
  assert.deepEqual(result.data.skill_scores.map(row => row.skill_id), ["skill1"]);
  assert.deepEqual(result.data.daily_answers.map(row => row.id), ["own-answer"]);
  assert.deepEqual(result.data.messages.map(row => row.id), ["own-message"]);
  assert.equal("flag_reason" in result.data.messages[0], false);
  assert.equal("app_metadata" in result.account, false);
  for (const scope of scopes.filter(scope => !["attempt_answers", "attempt_skill_scores", "chat_messages"].includes(scope.table))) assert.ok(scope.filters.some(([key, value]) => ["id", "user_id"].includes(key) && value === actor));
  assert.doesNotMatch(JSON.stringify(result), /foreign@example|Foreign text|Mentor private text|private moderation|future_private_field|access_token|refresh_token/);
});

test("account export paginates past 500 records and fails rather than emitting a partial or oversized archive", async () => {
  const rows = Array.from({ length: 501 }, (_, index) => ({ user_id: actor, id: String(index), score: 50 }));
  const paged = exportClient({ practice_attempts: rows });
  const result = await collectAccountExport(paged.client, user);
  assert.equal(result.data.practice_attempts.length, 501);
  assert.equal(paged.scopes.filter(scope => scope.table === "practice_attempts").length, 2);
  await assert.rejects(() => collectAccountExport(exportClient({}, { fail: "practical_projects" }).client, user), /complete export/);
  await assert.rejects(() => collectAccountExport(exportClient({}, { unlimited: true }).client, user), /larger assisted export/);
  const oversized = exportClient({ profiles: [{ id: actor, future_plans: "x".repeat(12 * 1024 * 1024 + 1) }] });
  await assert.rejects(() => collectAccountExport(oversized.client, user), /larger assisted export/);
  assert.equal(oversized.scopes.length, 1, "Oversized first page must stop before later tables are fetched");
});
