import test from "node:test";
import assert from "node:assert/strict";
import { mlServiceUrl } from "../lib/mlServiceUrl";

test("private Vercel service URLs keep their deployment binding path", () => {
  const previous = process.env.ML_SERVICE_URL;
  try {
    process.env.ML_SERVICE_URL = "https://private.example/binding/deployment";
    assert.equal(String(mlServiceUrl("/recommend")), "https://private.example/binding/deployment/recommend");
    assert.equal(String(mlServiceUrl("/guest/user")), "https://private.example/binding/deployment/guest/user");
  } finally {
    if (previous === undefined) delete process.env.ML_SERVICE_URL;
    else process.env.ML_SERVICE_URL = previous;
  }
});
