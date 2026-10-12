// ChipGroup — multi and single selection arithmetic.
import { test } from "node:test";
import assert from "node:assert/strict";
import { nextMultiValue, nextSingleValue } from "../src/primitives/ChipGroup/logic.ts";

test("multi: a press adds, a second press removes", () => {
  assert.deepEqual(nextMultiValue(["a", "b", "c"], [], "b"), ["b"]);
  assert.deepEqual(nextMultiValue(["a", "b", "c"], ["b"], "b"), []);
});

test("multi: the result follows option order, not click order", () => {
  assert.deepEqual(nextMultiValue(["a", "b", "c"], ["c"], "a"), ["a", "c"]);
});

test("multi: values not shown as options are kept", () => {
  assert.deepEqual(nextMultiValue([1, 2], [9, 1], 2), [1, 2, 9]);
});

test("single: a press selects, pressing the selected one clears", () => {
  assert.equal(nextSingleValue(null, "a"), "a");
  assert.equal(nextSingleValue("a", "b"), "b");
  assert.equal(nextSingleValue("a", "a"), null);
});

test("single required: pressing the selected one keeps it", () => {
  assert.equal(nextSingleValue("a", "a", true), "a");
});
