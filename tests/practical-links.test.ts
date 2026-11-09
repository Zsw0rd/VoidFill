import assert from "node:assert/strict";
import test from "node:test";
import { normalizePracticalLink, parsePracticalLinks } from "../lib/practicalLinks";
import { practicalLinkSchema } from "../lib/practical";

test("the editor rejects unsafe or private project links before saving, without weakening the server boundary", () => {
  for (const value of ["not a link", "javascript:alert(1)", "http://example.com/work", "https://name:password@example.com", "https://localhost/work", "https://127.1/work", "https://10.0.0.1/work", "https://192.168.1.2/work", "https://169.254.1.2/work", "https://172.16.0.1/work", "https://[::1]/work"]) {
    assert.equal(normalizePracticalLink(value), null, value);
    assert.equal(practicalLinkSchema.safeParse(value).success, false, value);
    const parsed = parsePracticalLinks(`https://example.com/valid\n${value}`);
    assert.ok(parsed.error?.startsWith("Project link 2:"), value);
    assert.deepEqual(parsed.links, [], "A failed list must not offer a partial save");
  }
});

test("project-link preparation keeps URL normalization, empty drafts and limits consistent", () => {
  assert.deepEqual(parsePracticalLinks(" \n \n"), {links: [], error: null});
  const values = [" HTTPS://EXAMPLE.COM/work ", "https://example.org/a?x=1#evidence", "https://example.net"];
  const parsed = parsePracticalLinks(values.join("\n\n"));
  assert.equal(parsed.error, null);
  assert.deepEqual(parsed.links, ["https://example.com/work", "https://example.org/a?x=1#evidence", "https://example.net/"]);
  assert.deepEqual(parsed.links, values.map(value => practicalLinkSchema.parse(value)));
  assert.match(parsePracticalLinks([...values, "https://example.edu"].join("\n")).error || "", /up to 3/);
  const tooLong = "https://example.com/" + "x".repeat(2000);
  assert.match(parsePracticalLinks(tooLong).error || "", /2,000/);
  assert.equal(practicalLinkSchema.safeParse(tooLong).success, false);
});
