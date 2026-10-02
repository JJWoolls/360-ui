// StatCard zero rule — which tiles hide, dim or stay.
import { test } from "node:test";
import assert from "node:assert/strict";
import { isZeroValue, zeroState } from "../src/primitives/StatCard/zero.ts";

test("numbers and all-zero formatted strings are zero", () => {
  assert.equal(isZeroValue(0), true);
  assert.equal(isZeroValue("0"), true);
  assert.equal(isZeroValue("$0.00"), true);
  assert.equal(isZeroValue("0.0%"), true);
  assert.equal(isZeroValue("0 / 0"), true);
});

test("anything with a non-zero digit, or no digit at all, is not zero", () => {
  assert.equal(isZeroValue(3), false);
  assert.equal(isZeroValue("$10.00"), false);
  assert.equal(isZeroValue("0 / 5"), false);
  assert.equal(isZeroValue("—"), false);
  assert.equal(isZeroValue(""), false);
  assert.equal(isZeroValue(null), false);
});

test("zero hides by default, dims or shows on request", () => {
  assert.equal(zeroState({ value: 0 }), "hidden");
  assert.equal(zeroState({ value: 0, zero: "dim" }), "dim");
  assert.equal(zeroState({ value: 0, zero: "show" }), "normal");
  assert.equal(zeroState({ value: 4 }), "normal");
});

test("never hidden while loading or selected", () => {
  assert.equal(zeroState({ value: 0, loading: true }), "normal");
  assert.equal(zeroState({ value: 0, selected: true }), "dim");
});

test("explicit empty overrides detection either way", () => {
  assert.equal(zeroState({ value: "—", empty: true }), "hidden");
  assert.equal(zeroState({ value: "—", empty: true, zero: "dim" }), "dim");
  assert.equal(zeroState({ value: 0, empty: false }), "normal");
});
