import test from "node:test";
import assert from "node:assert/strict";
import { loadCourseAssessmentContext } from "../lib/assessmentSelection";
import { LearningError, RESOURCE_ASSESSMENT_UNAVAILABLE_MESSAGE } from "../lib/localMl";

const skill = {id: "configured-python", name: "Python Basics", score: null, target: 70, importance: 1};
const stored = {id: "saved-course", skill_id: skill.id, title: "Python data structures", url: "https://docs.python.org/3/tutorial/datastructures.html"};

function clientFor(data: unknown, error: unknown = null) {
  const observed: [string, unknown][] = [];
  const query: any = {
    select: (columns: string) => { observed.push(["select", columns]); return query; },
    eq: (column: string, value: unknown) => { observed.push([column, value]); return query; },
    maybeSingle: async () => ({data, error}),
  };
  return {client: {from: (table: string) => { assert.equal(table, "roadmap_courses"); return query; }} as any, observed};
}

test("course scope uses the owner's stored URL and configured skill", async () => {
  const {client, observed} = clientFor(stored);
  const result = await loadCourseAssessmentContext(client, "verified-owner", stored.id, [skill, {...skill, id: "other-skill"}]);
  assert.deepEqual(observed.filter(([column]) => column !== "select"), [["id", stored.id], ["user_id", "verified-owner"]]);
  assert.match(String(observed[0][1]), /\burl\b/);
  assert.deepEqual(result, {skills: [skill], courseId: stored.id, courseTitle: stored.title, resourceUrl: stored.url});
});

test("missing, unconfigured and URL-less legacy courses cannot launch a broader substitute", async () => {
  for (const [course, status] of [[null, 404], [{...stored, skill_id: "unconfigured"}, 400], [{...stored, url: null}, 422], [{...stored, url: ""}, 422], [{...stored, url: "https://user:secret@example.com"}, 422], [{...stored, url: "http://example.com"}, 422]] as const) {
    const {client} = clientFor(course);
    await assert.rejects(loadCourseAssessmentContext(client, "verified-owner", stored.id, [skill]), error => {
      assert.ok(error instanceof LearningError);
      assert.equal(error.status, status);
      if (status === 422) assert.equal(error.message, RESOURCE_ASSESSMENT_UNAVAILABLE_MESSAGE);
      return true;
    });
  }
  const {client} = clientFor(null, {message: "private storage failure"});
  await assert.rejects(loadCourseAssessmentContext(client, "verified-owner", stored.id, [skill]), /Could not load the course/);
});

test("a saved ungraded guide cannot open a proficiency session", async () => {
  const {client} = clientFor({...stored, url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide"});
  await assert.rejects(loadCourseAssessmentContext(client, "verified-owner", stored.id, [skill]), error => {
    assert.ok(error instanceof LearningError);
    assert.equal(error.status, 422);
    assert.match(error.message, /ungraded guide/);
    return true;
  });
});
