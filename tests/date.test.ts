import test from "node:test";
import assert from "node:assert/strict";
import { isoDate, daysBetween } from "../lib/date";

test("daily activity uses UTC dates on both sides of the local midnight boundary", () => {
  assert.equal(isoDate(new Date("2026-11-07T00:15:00+05:30")), "2026-11-06");
  assert.equal(isoDate(new Date("2026-11-06T23:45:00-08:00")), "2026-11-07");
  assert.equal(daysBetween("2026-11-06", "2026-11-07"), 1);
});
