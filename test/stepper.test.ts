// Stepper — the step arithmetic, the rolling-digit glyphs, and the bench rules.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  clampStepperValue,
  filterStepperText,
  formatStepperValue,
  parseStepperText,
  snapStepperValue,
  stepStepperValue,
  stepperGlyphs,
} from "../src/primitives/Stepper/logic.ts";

const B = { min: 0, max: Infinity, step: 1 };

test("a press moves one step and stops at the floor", () => {
  assert.equal(stepStepperValue(3, 1, B), 4);
  assert.equal(stepStepperValue(3, -1, B), 2);
  assert.equal(stepStepperValue(0, -1, B), 0);
  assert.equal(stepStepperValue(1, -10, B), 0);
});

test("the ceiling holds, and Page Up lands on it rather than past it", () => {
  const b = { min: 0, max: 12, step: 1 };
  assert.equal(stepStepperValue(12, 1, b), 12);
  assert.equal(stepStepperValue(5, 10, b), 12);
});

test("a fractional step lands on clean values", () => {
  const b = { min: 0, max: 5, step: 0.1 };
  assert.equal(stepStepperValue(0.2, 1, b), 0.3);
  assert.equal(stepStepperValue(0.3, -1, b), 0.2);
});

test("an out-of-range or non-finite value is pulled back inside", () => {
  assert.equal(clampStepperValue(-4, B), 0);
  assert.equal(clampStepperValue(Number.NaN, B), 0);
  assert.equal(clampStepperValue(40, { min: 0, max: 20 }), 20);
});

test("digits are keyed by place value from the right", () => {
  assert.deepEqual(
    stepperGlyphs(9).map((g) => g.key),
    ["p0"],
  );
  const ten = stepperGlyphs(10);
  assert.deepEqual(ten.map((g) => g.key), ["p1", "p0"]);
  assert.deepEqual(
    ten.map((g) => (g.kind === "digit" ? g.digit : g.char)),
    [1, 0],
  );
});

test("a sign or decimal point is a still glyph, the minus a real minus sign", () => {
  const g = stepperGlyphs(-2.5, 0.5);
  assert.deepEqual(
    g.map((x) => (x.kind === "digit" ? x.digit : x.char)),
    ["−", 2, ".", 5],
  );
});

const css = readFileSync(
  fileURLToPath(new URL("../src/primitives/Stepper/Stepper.css", import.meta.url)),
  "utf8",
).replace(/\/\*[\s\S]*?\*\//g, "");

test("the number box is bench height (56px, grown with Scale)", () => {
  assert.ok(
    css.includes(
      "--ui-stepper-h: calc(var(--bench-target, 56px) * max(1, var(--ui-space-scale, 1), var(--ui-type-scale, 1)))",
    ),
  );
});

test("the strip rolls with a transform transition, and not under reduced motion", () => {
  assert.match(css, /\.ui-stepper-strip \{[^}]*transition: transform/);
  assert.match(css, /prefers-reduced-motion: reduce\)\s*\{\s*\.ui-stepper-strip \{\s*transition: none;/);
});

const tsx = readFileSync(
  fileURLToPath(new URL("../src/primitives/Stepper/Stepper.tsx", import.meta.url)),
  "utf8",
);

test("bench buttons, a spinbutton, and a text input only behind typeable", () => {
  assert.equal((tsx.match(/<Button\s+size="bench"/g) || []).length, 2);
  // Both branches carry the role (the docblock names it too).
  assert.ok((tsx.match(/^\s+role="spinbutton"\r?$/gm) || []).length === 2);
  // One <input>, inside the `if (typeable)` branch; the default branch has none.
  assert.equal((tsx.match(/<input/g) || []).length, 1);
  const typeableAt = tsx.indexOf("if (typeable) {");
  assert.ok(typeableAt > 0);
  // The default control is the last return in the file, after the typeable branch.
  const defaultBranch = tsx.slice(tsx.lastIndexOf("return ("));
  assert.ok(tsx.lastIndexOf("return (") > typeableAt);
  assert.doesNotMatch(defaultBranch, /<input/);
  assert.match(tsx, /typeable = false/);
  assert.match(tsx, /inputMode=\{Number\.isInteger\(step\) \? "numeric" : "decimal"\}/);
});

test("typed text: blank or junk reverts, numbers snap to the step and clamp", () => {
  const b = { min: 0, max: 50, step: 1 };
  assert.equal(parseStepperText("", b), null);
  assert.equal(parseStepperText("  ", b), null);
  assert.equal(parseStepperText("-", b), null);
  assert.equal(parseStepperText("12", b), 12);
  assert.equal(parseStepperText(" 07 ", b), 7);
  assert.equal(parseStepperText("99", b), 50);
  assert.equal(parseStepperText("-3", b), 0);
  assert.equal(parseStepperText("1,200", { min: 0, max: Infinity, step: 1 }), 1200);
  assert.equal(parseStepperText("2.6", b), 3);
  assert.equal(snapStepperValue(7, { min: 0, max: Infinity, step: 5 }), 5);
  assert.equal(snapStepperValue(8, { min: 0, max: Infinity, step: 5 }), 10);
  assert.equal(parseStepperText("0.25", { min: 0, max: 5, step: 0.1 }), 0.3);
  assert.equal(parseStepperText("−2", { min: -5, max: 5, step: 1 }), -2);
});

test("typing keeps only what can be part of a number", () => {
  assert.equal(filterStepperText("1a2.5-", { min: 0, step: 1 }), "125");
  assert.equal(filterStepperText("-1.5.2", { min: -10, step: 0.5 }), "-1.52");
  assert.equal(filterStepperText("4-2", { min: -10, step: 1 }), "42");
});

test("plain text matches the rolling digits", () => {
  assert.equal(formatStepperValue(3), "3");
  assert.equal(formatStepperValue(2.5, 0.5), "2.5");
  assert.equal(formatStepperValue(2, 0.1), "2.0");
});

test("typeable CSS: the field sits over the digits and shows its text only while editing", () => {
  assert.match(css, /\.ui-stepper-input \{[^}]*position: absolute;[^}]*color: transparent;/);
  assert.match(css, /\.ui-stepper-value\[data-editing\] \.ui-stepper-input \{\s*color: var\(--text-primary\);/);
  assert.match(css, /\.ui-stepper-input \{[^}]*font-size: max\(28px/);
});
