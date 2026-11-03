/* ColorSwatch logic — what a stored colour value means. Pure, DOM-free, so a
   server, a PDF or a chart can resolve the same stored value the picker wrote. */

/** The swatches, in picker order: the six house tones, then the accent hues. */
export const SWATCH_TONES = [
  "brand",
  "info",
  "violet",
  "warn",
  "danger",
  "muted",
  "cyan",
  "pink",
  "orange",
  "lime",
] as const;

export type SwatchTone = (typeof SWATCH_TONES)[number];

/** Title Case names for the swatches (tooltips, aria-labels, read-outs). */
export const SWATCH_TONE_LABELS: Record<SwatchTone, string> = {
  brand: "Green",
  info: "Blue",
  violet: "Violet",
  warn: "Amber",
  danger: "Red",
  muted: "Gray",
  cyan: "Cyan",
  pink: "Pink",
  orange: "Orange",
  lime: "Lime",
};

/**
 * A stored colour is a TONE NAME ("warn") or, as the escape hatch, a custom
 * hex ("#7c3aed"). A tone follows the person's palette and theme; a hex is
 * the same everywhere. Anything else (empty, a typo) is null.
 */
export type SwatchValue = SwatchTone | `#${string}`;

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

export function isSwatchTone(v: unknown): v is SwatchTone {
  return typeof v === "string" && (SWATCH_TONES as readonly string[]).includes(v);
}

export function isHexColor(v: unknown): v is `#${string}` {
  return typeof v === "string" && HEX.test(v.trim());
}

/** Normalise a stored value: a known tone, a hex, or null. */
export function parseSwatchValue(v: string | null | undefined): SwatchValue | null {
  if (v == null) return null;
  const s = v.trim();
  if (isSwatchTone(s)) return s;
  if (isHexColor(s)) return s.toLowerCase() as `#${string}`;
  return null;
}

/** The token a tone draws with. `muted` has no single hue token: it is the tertiary text grey. */
function toneVar(t: SwatchTone): string {
  return t === "muted" ? "--text-tertiary" : `--${t}`;
}

/** The rgb-triplet token for tints: rgba(var(--x-rgb), a). */
function toneRgbVar(t: SwatchTone): string {
  return `--${t}-rgb`;
}

/**
 * A CSS colour for a stored value — `var(--warn)` for a tone, the hex for a
 * custom colour, `fallback` when unset. Use it for text, borders, dots.
 */
export function swatchCss(v: string | null | undefined, fallback = "var(--text-tertiary)"): string {
  const p = parseSwatchValue(v);
  if (p == null) return fallback;
  return isSwatchTone(p) ? `var(${toneVar(p)})` : p;
}

/**
 * The same colour as a faint tint (a chip ground): `rgba(var(--warn-rgb), a)`
 * for a tone, the hex with an alpha byte for a custom colour.
 */
export function swatchTint(v: string | null | undefined, alpha = 0.12, fallback = "transparent"): string {
  const p = parseSwatchValue(v);
  if (p == null) return fallback;
  if (isSwatchTone(p)) return `rgba(var(${toneRgbVar(p)}), ${alpha})`;
  const hex = p.length === 4 ? `#${p[1]}${p[1]}${p[2]}${p[2]}${p[3]}${p[3]}` : p;
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255).toString(16).padStart(2, "0");
  return `${hex}${a}`;
}

/** Human name for a stored value: "Amber", "Custom #7c3aed", or "Not Set". */
export function swatchLabel(v: string | null | undefined): string {
  const p = parseSwatchValue(v);
  if (p == null) return "Not Set";
  return isSwatchTone(p) ? SWATCH_TONE_LABELS[p] : `Custom ${p}`;
}
