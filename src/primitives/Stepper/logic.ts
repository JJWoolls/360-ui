// Stepper — the pure arithmetic behind the control, kept out of the component
// so the tests can reach it without React.

export interface StepperBounds {
  min: number;
  /** Infinity when there is no ceiling. */
  max: number;
  step: number;
}

/** Decimal places in a step, so 0.1 + 0.2 lands on 0.3, not 0.30000000000000004. */
function decimalsOf(step: number): number {
  const s = String(step);
  const dot = s.indexOf(".");
  return dot < 0 ? 0 : s.length - dot - 1;
}

/** Keep a value inside [min, max]. */
export function clampStepperValue(value: number, { min, max }: Pick<StepperBounds, "min" | "max">): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/**
 * The value after `times` presses (negative = down), clamped to the bounds and
 * rounded to the step's precision.
 */
export function stepStepperValue(value: number, times: number, bounds: StepperBounds): number {
  const next = clampStepperValue(value + times * bounds.step, bounds);
  const d = decimalsOf(bounds.step);
  return d === 0 ? next : Number(next.toFixed(d));
}

/** The value as plain text at the step's precision ("3", "2.5"). */
export function formatStepperValue(value: number, step = 1): string {
  const d = decimalsOf(step);
  return d === 0 ? String(Math.round(value)) : value.toFixed(d);
}

/**
 * Snap a typed value onto the step grid (counted from min, or 0 with no
 * floor), then clamp it. 7 with step 5 from 0 -> 5; 8 -> 10.
 */
export function snapStepperValue(value: number, bounds: StepperBounds): number {
  const base = Number.isFinite(bounds.min) ? bounds.min : 0;
  const snapped = bounds.step > 0 ? base + Math.round((value - base) / bounds.step) * bounds.step : value;
  const next = clampStepperValue(snapped, bounds);
  const d = decimalsOf(bounds.step);
  return d === 0 ? next : Number(next.toFixed(d));
}

/**
 * What the typed text commits to, or null when it is not a number (blank, a
 * lone "-" or "."), in which case the field reverts to the value it had.
 * Accepts a real minus sign and thousands commas.
 */
export function parseStepperText(text: string, bounds: StepperBounds): number | null {
  const t = text.trim().replace(/[−–]/g, "-").replace(/,/g, "");
  if (t === "" || t === "-" || t === "." || t === "-.") return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return snapStepperValue(n, bounds);
}

/**
 * Keep only what could be part of a number while typing: digits, a "-" when
 * the floor is below zero, a "." when the step is fractional.
 */
export function filterStepperText(text: string, bounds: Pick<StepperBounds, "min" | "step">): string {
  const allowMinus = bounds.min < 0;
  const allowDot = decimalsOf(bounds.step) > 0;
  let out = "";
  for (const ch of text.replace(/[−–]/g, "-")) {
    if (ch >= "0" && ch <= "9") out += ch;
    else if (ch === "-" && allowMinus && out === "") out += ch;
    else if (ch === "." && allowDot && !out.includes(".")) out += ch;
  }
  return out;
}

export type StepperGlyph =
  | { kind: "digit"; digit: number; key: string }
  | { kind: "char"; char: string; key: string };

/**
 * The value as glyphs for the rolling display. Digits are keyed by their place
 * from the right (p0 = ones), so 9 -> 10 rolls the ones column 9 -> 0 and adds
 * a tens column, instead of every column re-mounting.
 */
export function stepperGlyphs(value: number, step = 1): StepperGlyph[] {
  const chars = [...formatStepperValue(value, step)];
  return chars.map((ch, i) => {
    const key = `p${chars.length - 1 - i}`;
    return ch >= "0" && ch <= "9"
      ? { kind: "digit", digit: Number(ch), key }
      : { kind: "char", char: ch === "-" ? "−" : ch, key };
  });
}
