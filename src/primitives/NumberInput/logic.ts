/* NumberInput arithmetic — pure, so it is testable without a DOM. */

export interface NumberBounds {
  min?: number;
  max?: number;
  decimals: number;
}

/** Round to `decimals` places without float noise (0.1 + 0.2 -> 0.3). */
export function roundTo(n: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round((n + Number.EPSILON) * f) / f;
}

export function clampNumber(n: number, { min, max, decimals }: NumberBounds): number {
  let v = roundTo(n, decimals);
  if (min != null && v < min) v = min;
  if (max != null && v > max) v = max;
  return v;
}

/** The number a typed text means, or null for empty / not yet a number ("-", "."). */
export function parseNumberText(
  text: string,
  { decimals, negative }: { decimals: number; negative: boolean },
): number | null {
  const body = text.replace(/,/g, "").trim();
  if (body === "" || body === "-" || body === "." || body === "-.") return null;
  if (!negative && body.startsWith("-")) return null;
  const n = Number(body);
  if (!Number.isFinite(n)) return null;
  return roundTo(n, decimals);
}

/** The tidy text for a value: no trailing zeros forced, no grouping. */
export function formatNumberText(value: number | null, decimals: number): string {
  if (value == null || !Number.isFinite(value)) return "";
  return String(roundTo(value, decimals));
}

/** One arrow-key step from the current value (empty starts at min, else 0). */
export function stepNumber(value: number | null, delta: number, bounds: NumberBounds): number {
  const base = value ?? (bounds.min != null && bounds.min > 0 ? bounds.min - delta : 0);
  return clampNumber(base + delta, bounds);
}
