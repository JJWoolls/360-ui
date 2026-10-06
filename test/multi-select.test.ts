// MultiSelect — selection, primary star, trigger chips, search.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  chipSummary,
  makePrimary,
  rankByQuery,
  settlePrimary,
  spokenValue,
  toggleValue,
} from "../src/primitives/MultiSelect/logic.ts";

test("the first value picked becomes primary", () => {
  assert.deepEqual(toggleValue({ values: [], primary: null }, "a"), { values: ["a"], primary: "a" });
});

test("adding keeps the primary and appends in pick order", () => {
  assert.deepEqual(toggleValue({ values: ["a"], primary: "a" }, "b"), { values: ["a", "b"], primary: "a" });
});

test("removing the primary hands it to the first remaining value", () => {
  assert.deepEqual(toggleValue({ values: ["a", "b", "c"], primary: "a" }, "a"), {
    values: ["b", "c"],
    primary: "b",
  });
});

test("removing the last value clears the primary", () => {
  assert.deepEqual(toggleValue({ values: ["a"], primary: "a" }, "a"), { values: [], primary: null });
});

test("starring an unselected value selects it", () => {
  assert.deepEqual(makePrimary({ values: ["a"], primary: "a" }, "b"), { values: ["a", "b"], primary: "b" });
});

test("a primary outside the selection settles to the first value", () => {
  assert.equal(settlePrimary(["x", "y"], "z"), "x");
  assert.equal(settlePrimary(["x", "y"], "y"), "y");
  assert.equal(settlePrimary([], "y"), null);
});

test("chips put the primary first and count the rest", () => {
  const sel = [{ value: "a" }, { value: "b" }, { value: "c" }, { value: "d" }];
  const r = chipSummary(sel, "c", 2);
  assert.deepEqual(r.shown.map((s) => s.value), ["c", "a"]);
  assert.equal(r.more, 2);
  assert.deepEqual(chipSummary(sel, null, 10).more, 0);
  assert.deepEqual(chipSummary([], null, 2), { shown: [], more: 0 });
});

test("search matches every word and ranks the obvious match first", () => {
  const opts = [
    { label: "North Monroe" },
    { label: "Monroe" },
    { label: "Ann Arbor", searchText: "monroe road" },
    { label: "Toledo" },
  ];
  assert.deepEqual(rankByQuery(opts, "monroe").map((o) => o.label), ["Monroe", "North Monroe", "Ann Arbor"]);
  assert.deepEqual(rankByQuery(opts, "  ").length, 4);
  assert.deepEqual(rankByQuery(opts, "ann road").map((o) => o.label), ["Ann Arbor"]);
});

test("the spoken value names the primary", () => {
  assert.equal(
    spokenValue([{ value: "a", label: "Monroe" }, { value: "b", label: "Toledo" }], "a", "None"),
    "Monroe (primary), Toledo",
  );
  assert.equal(spokenValue([], null, "None"), "None");
});
