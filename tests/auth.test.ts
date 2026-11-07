import test from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { safeNextPath, signInDestination } from "../lib/auth/navigation";
import { completeSignIn, initialProfileFields, SignInError } from "../lib/auth/complete";

const user: User = { id: "learner-id", email: "learner@example.test", app_metadata: {}, aud: "authenticated", created_at: "2026-01-01T00:00:00Z", user_metadata: { full_name: "Google Learner", course: "Computer Science", phone: "123", role: "super_admin" } };

function database({ profile = null as Record<string, unknown> | null, role = null as string | null, stats = null as Record<string, unknown> | null, fail = "", racingInsert = false } = {}) {
  const state = { profile, role, stats, writes: [] as { table: string; operation: string; values: any; options: any }[] };
  const client = {
    from(table: string) {
      let operation = "select", values: any, options: any;
      const query: any = {
        select() { return query; }, eq() { return query; }, maybeSingle() { return query; },
        insert(row: any) { operation = "insert"; values = row; return query; },
        update(row: any) { operation = "update"; values = row; return query; },
        upsert(row: any, opts: any) { operation = "upsert"; values = row; options = opts; return query; },
        then(resolve: (result: any) => unknown, reject: (error: unknown) => unknown) {
          let result: any = { data: null, error: null };
          if (fail === table) result.error = { message: "Database unavailable" };
          else if (operation === "select") result.data = table === "admin_users" ? (state.role ? { admin_role: state.role } : null) : state.profile ? { ...state.profile } : null;
          else {
            state.writes.push({ table, operation, values, options });
            if (table === "profiles") {
              if (operation === "insert" && racingInsert) {
                state.profile = { id: user.id, onboarded: false, full_name: "Trigger name" };
                result.error = { code: "23505" };
              } else state.profile = { ...state.profile, ...values };
            } else if (table === "user_stats" && !state.stats) state.stats = { ...values, xp: 0, level: 1, streak: 0 };
          }
          return Promise.resolve(result).then(resolve, reject);
        },
      };
      return query;
    },
  } as unknown as SupabaseClient;
  return { client, state };
}

test("OAuth return destinations cannot escape the app or loop through authentication", () => {
  for (const value of ["https://evil.test", "//evil.test/dashboard", "/\\evil.test", "/%2F%2Fevil.test", "/auth/callback?code=secret", "/auth/login", "/dashboard\n", "javascript:alert(1)", null]) assert.equal(safeNextPath(value), "/dashboard");
  assert.equal(safeNextPath("/roadmap?view=list"), "/roadmap?view=list");
  assert.equal(safeNextPath("/admin/users"), "/admin/users");
});

test("return paths respect onboarding and the database staff role", () => {
  assert.equal(signInDestination({ onboarded: false, next: "/roadmap" }), "/onboarding");
  assert.equal(signInDestination({ onboarded: true, next: "/admin/users" }), "/dashboard");
  assert.equal(signInDestination({ role: "mentor", onboarded: true, next: "/admin/users" }), "/admin/mentor");
  assert.equal(signInDestination({ role: "mentor", onboarded: true, next: "/admin/mentor/chat" }), "/admin/mentor/chat");
  assert.equal(signInDestination({ role: "super_admin", onboarded: true, next: "/profile" }), "/admin/dashboard");
});

test("Google metadata supplies display fields, never a staff role or an unverified email", () => {
  const fields = initialProfileFields({ ...user, user_metadata: { ...user.user_metadata, email: "attacker@example.test" } });
  assert.equal(fields.full_name, "Google Learner");
  assert.equal(fields.email, user.email);
  assert.equal("role" in fields, false);
});

test("first Google signup completes the trigger-created profile instead of inserting a duplicate", async () => {
  const { client, state } = database({ profile: { id: user.id, full_name: null, email: null, onboarded: false } });
  assert.equal(await completeSignIn(client, user), "/onboarding");
  assert.equal(state.profile?.full_name, "Google Learner");
  assert.equal(state.profile?.email, user.email);
  assert.equal(state.writes.some(write => write.table === "profiles" && write.operation === "insert"), false);
  assert.equal(state.stats?.level, 1);
});

test("returning Google users retain their edited profile, onboarding and earned XP", async () => {
  const { client, state } = database({ profile: { id: user.id, full_name: "Edited Name", email: user.email, phone: "new phone", course: "new course", onboarded: true }, stats: { user_id: user.id, xp: 870, level: 2, streak: 5 } });
  assert.equal(await completeSignIn(client, user, { next: "/roadmap" }), "/roadmap");
  assert.equal(state.profile?.full_name, "Edited Name");
  assert.equal(state.profile?.course, "new course");
  assert.equal(state.stats?.xp, 870);
  assert.equal(state.writes.find(write => write.table === "user_stats")?.options.ignoreDuplicates, true);
});

test("profile bootstrap also works when a deployment has no automatic profile trigger", async () => {
  const { client, state } = database();
  assert.equal(await completeSignIn(client, user), "/onboarding");
  assert.equal(state.profile?.id, user.id);
  assert.equal(state.profile?.role, "student");
});

test("profile insertion tolerates a concurrent auth trigger without overwriting its data", async () => {
  const { client, state } = database({ racingInsert: true });
  assert.equal(await completeSignIn(client, user), "/onboarding");
  assert.equal(state.profile?.full_name, "Trigger name");
});

test("Google staff login requires an actual staff row and does not grant metadata-based access", async () => {
  const { client, state } = database();
  await assert.rejects(() => completeSignIn(client, user, { staffOnly: true }), (error: unknown) => error instanceof SignInError && error.code === "staff_required");
  assert.equal(state.writes.length, 0);
  const mentor = database({ role: "mentor" });
  assert.equal(await completeSignIn(mentor.client, user), "/admin/mentor");
  assert.equal(mentor.state.writes.length, 0);
});

test("profile or role lookup failures do not silently admit an incomplete account", async () => {
  for (const table of ["admin_users", "profiles", "user_stats"]) {
    const { client } = database({ fail: table });
    await assert.rejects(() => completeSignIn(client, user), SignInError);
  }
});
