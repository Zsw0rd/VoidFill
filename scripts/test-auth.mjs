import assert from "node:assert/strict";

const base = process.env.TEST_BASE_URL || "http://localhost:3000";
for (const [path, expected] of [
  ["/auth/callback?next=https%3A%2F%2Fevil.example", "invalid_callback"],
  ["/auth/callback?error=access_denied", "oauth_cancelled"],
  ["/auth/callback?code=invalid", "invalid_callback"],
]) {
  const response = await fetch(base + path, { redirect: "manual" });
  assert.equal(response.status, 307);
  const target = new URL(response.headers.get("location"), base);
  assert.equal(target.origin, new URL(base).origin);
  assert.equal(target.pathname, "/auth/login");
  assert.equal(target.searchParams.get("error"), expected);
  assert.equal(target.searchParams.get("next"), "/dashboard");
}
for (const path of ["/dashboard", "/profile", "/admin/dashboard"]) {
  const response = await fetch(base + path, { redirect: "manual" });
  assert.equal(response.status, 307, path);
  const target = new URL(response.headers.get("location"), base);
  assert.equal(
    target.pathname,
    path.startsWith("/admin") ? "/auth/admin-login" : "/auth/login",
  );
  assert.equal(target.searchParams.get("next"), path);
}
assert.equal(
  (await fetch(base + "/auth/logout", { redirect: "manual" })).status,
  405,
);
console.log(
  "Auth callback errors, cancellation, redirect safety, protected pages and POST-only logout passed.",
);
