import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { persistCloudSubmission } from "../lib/cloudSubmissions";

const previousFetch = globalThis.fetch;
const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
afterEach(() => {
  globalThis.fetch = previousFetch;
  for (const [name, value] of [["SUPABASE_SERVICE_ROLE_KEY", previousKey], ["NEXT_PUBLIC_SUPABASE_URL", previousUrl]]) {
    if (value === undefined) delete process.env[name!];
    else process.env[name!] = value;
  }
});
function configure() {
  process.env.SUPABASE_SERVICE_ROLE_KEY = "synthetic-server-key";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
}
test("cloud replay returns the stored result without awarding progress again", async () => {
  configure();
  globalThis.fetch = async () => new Response(JSON.stringify({ status: "completed", result: { xp: 50 } }));
  let saves = 0;
  const result = await persistCloudSubmission("id", "user", async () => { saves++; return { xp: 999 }; });
  assert.deepEqual(result, { xp: 50 });
  assert.equal(saves, 0);
});
test("cloud storage failure or another active assessment cannot execute grading writes", async () => {
  configure();
  for (const response of [new Response("{}", { status: 503 }), new Response(JSON.stringify({ status: "pending" })), new Response(JSON.stringify({ status: "failed" }))]) {
    globalThis.fetch = async () => response;
    let writes = 0;
    await assert.rejects(persistCloudSubmission("id", "user", async () => { writes++; }));
    assert.equal(writes, 0);
  }
});
test("a failed cloud save is marked failed and never recorded as a completed award", async () => {
  configure();
  const writes: any[] = [];
  globalThis.fetch = async (url, options) => {
    if (String(url).includes("/rpc/")) return new Response(JSON.stringify({ status: "claimed" }));
    writes.push(JSON.parse(String(options?.body)));
    return new Response(null, { status: 204 });
  };
  await assert.rejects(persistCloudSubmission("id", "user", async () => { throw new Error("Partial database save failed"); }));
  assert.deepEqual(writes, [{ status: "failed" }]);
});
