// ToggleChip — the next state a press hands to onToggle.
import { test } from "node:test";
import assert from "node:assert/strict";
import { nextToggleState } from "../src/primitives/ToggleChip/logic.ts";

test("boolean: a press flips", () => {
  assert.equal(nextToggleState(false), true);
  assert.equal(nextToggleState(true), false);
});

test("mixed: a press completes to true", () => {
  assert.equal(nextToggleState("mixed"), true);
});
