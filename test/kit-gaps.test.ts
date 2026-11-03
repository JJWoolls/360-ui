// Kit gaps (2026-11-03): NumberInput, TimePicker and ColorSwatch arithmetic.
import { test } from "node:test";
import assert from "node:assert/strict";
import { clampNumber, formatNumberText, parseNumberText, stepNumber } from "../src/primitives/NumberInput/logic.ts";
import { formatTime12, timeOptions } from "../src/primitives/TimePicker/logic.ts";
import { parseSwatchValue, swatchCss, swatchLabel, swatchTint } from "../src/primitives/ColorSwatch/logic.ts";

test("NumberInput parses drafts, money text and refuses a minus when not allowed", () => {
  const o = { decimals: 2, negative: true };
  assert.equal(parseNumberText("", o), null);
  assert.equal(parseNumberText("-", o), null);
  assert.equal(parseNumberText("1.", o), 1);
  assert.equal(parseNumberText("1,200.5", o), 1200.5);
  assert.equal(parseNumberText("0.125", o), 0.13);
  assert.equal(parseNumberText("-3", { decimals: 0, negative: false }), null);
});

test("NumberInput clamps, rounds and steps", () => {
  assert.equal(clampNumber(0.1 + 0.2, { decimals: 2 }), 0.3);
  assert.equal(clampNumber(12, { min: 0, max: 10, decimals: 0 }), 10);
  assert.equal(stepNumber(null, 1, { min: 5, decimals: 0 }), 5);
  assert.equal(stepNumber(null, 1, { decimals: 0 }), 1);
  assert.equal(stepNumber(9.5, 1, { max: 10, decimals: 1 }), 10);
  assert.equal(formatNumberText(null, 2), "");
  assert.equal(formatNumberText(2.5, 2), "2.5");
});

test("TimePicker default list is 7:00 AM to 5:00 PM in 30-minute steps", () => {
  const t = timeOptions();
  assert.equal(t.length, 21);
  assert.equal(t[0], "07:00");
  assert.equal(t[t.length - 1], "17:00");
  assert.deepEqual(timeOptions(9, 10, 15), ["09:00", "09:15", "09:30", "09:45", "10:00"]);
  assert.equal(formatTime12("00:15"), "12:15 AM");
  assert.equal(formatTime12("13:30"), "1:30 PM");
  assert.equal(formatTime12("12:00"), "12:00 PM");
});

test("ColorSwatch stores tone names, resolves them to tokens, keeps custom hex", () => {
  assert.equal(parseSwatchValue("warn"), "warn");
  assert.equal(parseSwatchValue(" #7C3AED "), "#7c3aed");
  assert.equal(parseSwatchValue("purple"), null);
  assert.equal(swatchCss("warn"), "var(--warn)");
  assert.equal(swatchCss("muted"), "var(--text-tertiary)");
  assert.equal(swatchCss("#abc"), "#abc");
  assert.equal(swatchCss(null, "x"), "x");
  assert.equal(swatchTint("info", 0.15), "rgba(var(--info-rgb), 0.15)");
  assert.equal(swatchTint("#abc", 1), "#aabbccff");
  assert.equal(swatchLabel("danger"), "Red");
  assert.equal(swatchLabel(""), "Not Set");
});
