// Select trigger mark — when the closed field repeats the chosen row's mark.
import { test } from "node:test";
import assert from "node:assert/strict";
import { triggerMarks } from "../src/primitives/Select/trigger-mark.ts";

const none = { leading: false, thumb: false };

test("no selection draws no mark", () => {
  assert.deepEqual(triggerMarks({ selected: undefined, searchable: false, open: false }), none);
});

test("a selection with no leading or image draws no mark", () => {
  assert.deepEqual(triggerMarks({ selected: {}, searchable: false, open: false }), none);
  assert.deepEqual(
    triggerMarks({ selected: { leading: null }, searchable: false, open: false }),
    none,
  );
});

test("leading and image show on the closed trigger", () => {
  assert.deepEqual(
    triggerMarks({ selected: { leading: "dot" }, searchable: false, open: false }),
    { leading: true, thumb: false },
  );
  assert.deepEqual(
    triggerMarks({ selected: { imageUrl: "x.png" }, searchable: true, open: false }),
    { leading: false, thumb: true },
  );
  // null image keeps the empty-image slot, as in the list.
  assert.deepEqual(
    triggerMarks({ selected: { imageUrl: null }, searchable: false, open: false }),
    { leading: false, thumb: true },
  );
});

test("a plain Select keeps the mark while open", () => {
  assert.deepEqual(
    triggerMarks({ selected: { leading: "dot" }, searchable: false, open: true }),
    { leading: true, thumb: false },
  );
});

test("a searchable Select hides the mark while typing", () => {
  assert.deepEqual(
    triggerMarks({ selected: { leading: "dot", imageUrl: "x.png" }, searchable: true, open: true }),
    none,
  );
});
