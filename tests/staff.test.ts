import test from "node:test";
import assert from "node:assert/strict";
import { canMentor, isAdministrator, mentorRequestMode } from "../lib/auth/staff";
import { safeNextPath, signInDestination } from "../lib/auth/navigation";

test("administrator accounts can mentor without losing their administrator role", () => {
  for (const role of ["admin", "super_admin"]) {
    assert.equal(isAdministrator(role), true);
    assert.equal(canMentor(role), true);
    assert.equal(mentorRequestMode(role, "assigned-learner"), "mentor");
    assert.equal(mentorRequestMode(role), "learner");
    assert.equal(signInDestination({role, onboarded: true, next: "/admin/mentor"}), "/admin/mentor");
  }
});

test("a learner cannot impersonate a mentor by adding a target user", () => {
  for (const role of [undefined, null, "student", "unknown"]) {
    assert.equal(canMentor(role), false);
    assert.equal(mentorRequestMode(role, "another-user"), "forbidden");
    assert.equal(mentorRequestMode(role), "learner");
  }
  assert.equal(mentorRequestMode("mentor"), "missing-target");
  assert.equal(mentorRequestMode("mentor", "assigned-learner"), "mentor");
  assert.equal(isAdministrator("mentor"), false);
});

test("career discovery is a protected, valid learner return destination", () => {
  assert.equal(safeNextPath("/careers"), "/careers");
  assert.equal(signInDestination({onboarded: true, next: "/careers"}), "/careers");
  assert.equal(signInDestination({onboarded: false, next: "/careers"}), "/onboarding");
});
