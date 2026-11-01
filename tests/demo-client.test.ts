import test from "node:test";
import assert from "node:assert/strict";
import { demoBrowserClient } from "../lib/demo/client";

test("demo client stays stable across renders without caching the current user", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  let user = "first-session";
  globalThis.fetch = async () => {
    calls++;
    return Response.json({ data: { user: { id: user } }, error: null });
  };
  try {
    const first = demoBrowserClient();
    for (let render = 0; render < 10; render++) assert.equal(demoBrowserClient(), first);
    assert.equal(calls, 0);
    assert.equal((await first.auth.getUser()).data.user.id, "first-session");
    user = "new-session";
    assert.equal((await demoBrowserClient().auth.getUser()).data.user.id, "new-session");
    assert.equal(calls, 2);
  } finally { globalThis.fetch = original; }
});

test("unavailable demo service returns one failure without a retry loop", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw new TypeError("Failed to fetch"); };
  try {
    const result = await demoBrowserClient().auth.getUser();
    assert.equal(result.data.user, null);
    assert.ok(result.error);
    await new Promise(resolve => setTimeout(resolve, 30));
    assert.equal(calls, 1);
  } finally { globalThis.fetch = original; }
});
