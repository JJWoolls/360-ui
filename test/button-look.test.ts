// Button look — which colour attributes a Button draws from its props.
import { test } from "node:test";
import assert from "node:assert/strict";
import { buttonLook } from "../src/primitives/Button/look.ts";

test("hierarchy and tone name the variant; secondary is the default", () => {
  assert.deepEqual(buttonLook({}), { "data-variant": "secondary" });
  assert.deepEqual(buttonLook({ variant: "primary" }), { "data-variant": "primary" });
  assert.deepEqual(buttonLook({ tone: "warn" }), { "data-variant": "warn" });
});

test("an identity colour tints by default and travels as a property", () => {
  assert.deepEqual(buttonLook({ color: "var(--x)" }), {
    "data-variant": "color",
    "data-fill": "tint",
    colorVar: { "--ui-btn-color": "var(--x)" },
  });
  assert.equal(buttonLook({ color: "#123456", variant: "secondary" })["data-fill"], "tint");
});

test("variant sets how loudly the colour is worn", () => {
  assert.equal(buttonLook({ color: "red", variant: "primary" })["data-fill"], "solid");
  assert.equal(buttonLook({ color: "red", variant: "ghost" })["data-fill"], "ghost");
});

test("an empty colour falls back to the plain button", () => {
  assert.deepEqual(buttonLook({ color: "" }), { "data-variant": "secondary" });
  assert.deepEqual(buttonLook({ color: "", variant: "primary" }), { "data-variant": "primary" });
});
