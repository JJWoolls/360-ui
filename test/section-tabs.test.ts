// SectionTabs matching — pure path arithmetic deciding which tab is lit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { activeSectionHref, sectionTabMatches } from "../src/primitives/SectionTabs/match.ts";

const ITEMS = [
  { href: "/reports/intake" },
  { href: "/reports/cleanup" },
  { href: "/reports", match: "exact" as const },
  { href: "/reports/compare" },
];

test("exact matches only its own path", () => {
  assert.equal(sectionTabMatches("/reports", "/reports", "exact"), true);
  assert.equal(sectionTabMatches("/reports", "/reports/", "exact"), true);
  assert.equal(sectionTabMatches("/reports", "/reports/x", "exact"), false);
});

test("prefix matches its path and whole segments beneath it", () => {
  assert.equal(sectionTabMatches("/reports/intake", "/reports/intake"), true);
  assert.equal(sectionTabMatches("/reports/intake", "/reports/intake/42"), true);
  assert.equal(sectionTabMatches("/reports/intake", "/reports/intake-old"), false);
  assert.equal(sectionTabMatches("/", "/anything"), true);
});

test("active tab per route", () => {
  assert.equal(activeSectionHref(ITEMS, "/reports"), "/reports");
  assert.equal(activeSectionHref(ITEMS, "/reports/intake"), "/reports/intake");
  assert.equal(activeSectionHref(ITEMS, "/reports/intake/abc"), "/reports/intake");
  assert.equal(activeSectionHref(ITEMS, "/reports/compare"), "/reports/compare");
  // A sub-page no tab claims lights none — the exact landing tab does not.
  assert.equal(activeSectionHref(ITEMS, "/reports/office/7"), undefined);
  assert.equal(activeSectionHref(ITEMS, "/elsewhere"), undefined);
});

test("longest matching href wins", () => {
  const nested = [{ href: "/a" }, { href: "/a/b" }];
  assert.equal(activeSectionHref(nested, "/a/b/c"), "/a/b");
  assert.equal(activeSectionHref(nested, "/a/c"), "/a");
});
