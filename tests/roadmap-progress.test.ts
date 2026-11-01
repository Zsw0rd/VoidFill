import test from "node:test";
import assert from "node:assert/strict";
import { roadmapProgress } from "../lib/roadmapProgress";

test("refreshing priorities retains the progress earned by completed learning resources", () => {
  const courses = [{ completed: true }, { completed: true }];
  assert.equal(roadmapProgress(50, courses), 66);
  assert.equal(roadmapProgress(100, courses), 100);
  assert.equal(roadmapProgress(50, [{ completed: true }, { completed: false }]), 50);
});
test("unstarted roadmaps and invalid mastery values remain bounded", () => {
  assert.equal(roadmapProgress(0, []), 0);
  assert.equal(roadmapProgress(100, []), 68);
  assert.equal(roadmapProgress(Number.NaN, [{ completed: true }]), 32);
  assert.equal(roadmapProgress(200, [{ completed: true }]), 100);
});
