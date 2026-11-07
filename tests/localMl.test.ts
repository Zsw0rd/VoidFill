import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { callLocalMl, LearningError } from "../lib/localMl";

const originalFetch = globalThis.fetch;
const originalToken = process.env.ML_SERVICE_TOKEN;
afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalToken === undefined) delete process.env.ML_SERVICE_TOKEN;
  else process.env.ML_SERVICE_TOKEN = originalToken;
});

test("local inference sends server authentication and validates the response", async () => {
  process.env.ML_SERVICE_TOKEN = "test-only-service-token";
  globalThis.fetch = async (url, options) => {
    assert.ok(String(url).endsWith("/recommend"));
    assert.equal((options?.headers as Record<string, string>)["X-ML-Token"], "test-only-service-token");
    return new Response(JSON.stringify({ model: "local" }));
  };
  assert.deepEqual(await callLocalMl("/recommend", {}, z.object({ model: z.string() })), { model: "local" });
});

test("missing configuration fails without contacting a remote provider", async () => {
  delete process.env.ML_SERVICE_TOKEN;
  globalThis.fetch = async () => { throw new Error("must not be called"); };
  await assert.rejects(callLocalMl("/recommend", {}, z.object({})), LearningError);
});

test("malformed and unavailable upstream responses fail closed", async () => {
  process.env.ML_SERVICE_TOKEN = "test-only-service-token";
  globalThis.fetch = async () => new Response(JSON.stringify({ invalid: true }));
  await assert.rejects(callLocalMl("/recommend", {}, z.object({ model: z.string() })), LearningError);
  globalThis.fetch = async () => { throw new Error("connection refused"); };
  await assert.rejects(callLocalMl("/recommend", {}, z.object({})), LearningError);
});
