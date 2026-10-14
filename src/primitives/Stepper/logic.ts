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

export type StepperGlyph =
  | { kind: "digit"; digit: number; key: string }
  | { kind: "char"; char: string; key: string };

/**
 * The value as glyphs for the rolling display. Digits are keyed by their place
 * from the right (p0 = ones), so 9 -> 10 rolls the ones column 9 -> 0 and adds
 * a tens column, instead of every column re-mounting.
 */
export function stepperGlyphs(value: number, step = 1): StepperGlyph[] {
  const d = decimalsOf(step);
  const text = d === 0 ? String(Math.round(value)) : value.toFixed(d);
  const chars = [...text];
  return chars.map((ch, i) => {
    const key = `p${chars.length - 1 - i}`;
    return ch >= "0" && ch <= "9"
      ? { kind: "digit", digit: Number(ch), key }
      : { kind: "char", char: ch === "-" ? "−" : ch, key };
  });
}
