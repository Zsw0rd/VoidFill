import assert from "node:assert/strict";

// Public access-boundary checks only: no email request, real sign-in, export or
// privacy mutation is performed. Suitable for the isolated production-mode CI app.
const base = process.env.TEST_BASE_URL || "http://localhost:3000";
const origin = new URL(base).origin;
for (const path of ["/auth/forgot-password", "/auth/reset-password"]) {
  const response = await fetch(base + path, { redirect: "manual" });
  assert.equal(response.status, 200, path);
  assert.doesNotMatch(await response.text(), /vf_password_recovery=|refresh_token|service_role_key/);
}
for (const [path, target] of [["/account", "/auth/login"], ["/admin/account-requests", "/auth/admin-login"]]) {
  const response = await fetch(base + path, { redirect: "manual" });
  assert.equal(response.status, 307, path);
  assert.equal(new URL(response.headers.get("location"), base).pathname, target);
}
for (const path of ["/api/account/password", "/api/account/export", "/api/account/deletion-request", "/api/account/requests"]) {
  assert.equal((await fetch(base + path, { redirect: "manual" })).status, 405, path);
  for (const headers of [{}, { Origin: "https://untrusted.example" }, { Origin: "null" }]) {
    const response = await fetch(base + path, { method: "POST", headers, body: "{}" });
    assert.equal(response.status, 403, path + " origin guard");
    assert.match(response.headers.get("cache-control"), /no-store/);
    assert.deepEqual(await response.json(), { error: "Invalid origin." });
  }
  const response = await fetch(base + path, { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: "{}" });
  assert.equal(response.status, 401, path + " authentication guard");
  assert.match(response.headers.get("cache-control"), /no-store/);
  const body = await response.json();
  assert.equal(typeof body.error, "string");
  assert.doesNotMatch(JSON.stringify(body), /token|service_role|secret|@/);
}
const failedCallback = await fetch(base + "/auth/callback?intent=recovery&code=invalid", { redirect: "manual" });
assert.equal(failedCallback.status, 307);
assert.equal(new URL(failedCallback.headers.get("location"), base).pathname, "/auth/login");
assert.doesNotMatch(failedCallback.headers.get("set-cookie") || "", /vf_password_recovery=[^;]/);
console.log("Account HTTP boundaries passed: public recovery pages, protected account/inbox, strict origins, POST-only authenticated APIs and no invalid-code recovery grant. No emails or account data were changed.");
