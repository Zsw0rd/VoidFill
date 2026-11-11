import test from "node:test";
import assert from "node:assert/strict";
import { roadmapProgress } from "../lib/roadmapProgress";
import scopes from "../ml/data/lessons/resource-scopes.json";

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

test("reviewed guides neither block nor inflate assessed-resource progress", () => {
  const guide = scopes[0].url;
  const courses = [
    { completed: true, url: "https://fixtures.invalid/lesson-one" },
    { completed: false, url: "https://fixtures.invalid/lesson-two" },
    { completed: true, url: guide },
    { completed: false, url: guide },
  ];
  const before = structuredClone(courses);
  assert.equal(roadmapProgress(70, courses), 64);
  assert.deepEqual(courses, before, "Projection must not mark guides complete or modify history");
  assert.equal(roadmapProgress(100, [courses[0], courses[3]]), 100);
  assert.equal(roadmapProgress(0, [courses[1], courses[2]]), 0);
});

test("all-guide roadmaps retain the existing zero-assessed-resource mastery semantics", () => {
  const guide = scopes[0].url;
  assert.equal(roadmapProgress(100, [{ completed: true, url: guide }]), 68);
  assert.equal(roadmapProgress(50, [{ completed: false, url: guide }]), 34);
  assert.equal(roadmapProgress(0, [{ completed: true, url: guide }]), 0);
});

test("scope membership trims whitespace without broad URL canonicalisation or legacy exclusion", () => {
  const guide = scopes[0].url;
  assert.equal(roadmapProgress(100, [{ completed: true, url: `\t\u00a0${guide}\uFEFF\n` }]), 68);
  assert.equal(roadmapProgress(100, [{ completed: true, url: `${guide}#independent-example` }]), 100);
  assert.equal(roadmapProgress(100, [{ completed: true, url: null }]), 100);
  assert.equal(roadmapProgress(100, [{ completed: true }]), 100);
});
