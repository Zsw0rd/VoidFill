import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { persistAssessmentOnce } from "../lib/submissions";

test("repeated and concurrent submissions cannot execute the save twice", async () => {
  const id = randomUUID();
  let saves = 0;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const first = persistAssessmentOnce(id, async () => { saves++; await gate; return { xp: 50 }; });
  // Wait for the save callback so the exclusive claim is definitely held.
  while (saves === 0) await new Promise(resolve => setTimeout(resolve, 5));
  try {
    await assert.rejects(persistAssessmentOnce(id, async () => ({ xp: 999 })));
    release();
    assert.deepEqual(await first, { xp: 50 });
    assert.deepEqual(await persistAssessmentOnce(id, async () => { saves++; return { xp: 999 }; }), { xp: 50 });
    assert.equal(saves, 1);
  } finally {
    release();
    await first;
    await unlink(path.join(process.cwd(), "ml/runtime/submissions", id + ".json"));
  }
});
