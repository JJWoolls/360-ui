/**
 * Scale presets — the pure arithmetic behind <Scale>. No React, no DOM, so the
 * tests (and any server code) can import it on its own.
 *
 * THREE AXES, NOT ONE. A screen read from across a room needs bigger type far
 * more than it needs bigger gaps; a dense back-office screen wants tighter
 * padding before it wants smaller text. One multiplier would force those to
 * move together, so type, space and icons each get their own:
 *
 *   --ui-type-scale   every font size a primitive sets
 *   --ui-space-scale  padding, gaps, margins, control heights, container widths
 *   --ui-icon-scale   icon boxes, the svg sizes the kit sets, dots, check boxes,
 *                     toggles, spinners, avatars, thumbnails
 *
 * Every primitive's stylesheet multiplies by these with a fallback of 1, so a
 * screen that never mounts a <Scale> computes exactly what it did before.
 *
 * SPACE GROWS SLOWER THAN TYPE in the larger presets: the point of scaling up
 * is legibility, and growing the gaps at the same rate as the letters spends
 * screen width on air. Icons track type so a glyph stays the size of the words
 * beside it.
 */

export type ScaleSize = "compact" | "default" | "large" | "wall";

export interface ScaleFactors {
  /** Multiplier on font sizes. */
  type: number;
  /** Multiplier on padding, gaps, margins, control heights and container widths. */
  space: number;
  /** Multiplier on icon boxes, kit-set svg sizes and other graphic marks. */
  icon: number;
}

/** The active scale: which preset, and the multipliers actually in force. */
export interface ScaleValue extends ScaleFactors {
  size: ScaleSize;
}

export const SCALE_PRESETS: Readonly<Record<ScaleSize, Readonly<ScaleFactors>>> = {
  compact: { type: 0.9, space: 0.85, icon: 0.9 },
  default: { type: 1, space: 1, icon: 1 },
  large: { type: 1.2, space: 1.15, icon: 1.2 },
  wall: { type: 1.5, space: 1.35, icon: 1.5 },
};

export interface ScaleOverrides {
  typeScale?: number;
  spaceScale?: number;
  iconScale?: number;
}

/** A usable multiplier: a finite number above zero. Anything else falls back. */
const usable = (n: number | undefined): n is number =>
  typeof n === "number" && Number.isFinite(n) && n > 0;

/** The preset for `size`, with any per-axis override laid over it. */
export function resolveScale(size: ScaleSize = "default", overrides: ScaleOverrides = {}): ScaleValue {
  const base = SCALE_PRESETS[size] ?? SCALE_PRESETS.default;
  return {
    size: SCALE_PRESETS[size] ? size : "default",
    type: usable(overrides.typeScale) ? overrides.typeScale : base.type,
    space: usable(overrides.spaceScale) ? overrides.spaceScale : base.space,
    icon: usable(overrides.iconScale) ? overrides.iconScale : base.icon,
  };
}

/** The three custom properties for an element's inline style. */
export function scaleVars(scale: ScaleFactors): Record<"--ui-type-scale" | "--ui-space-scale" | "--ui-icon-scale", string> {
  return {
    "--ui-type-scale": String(scale.type),
    "--ui-space-scale": String(scale.space),
    "--ui-icon-scale": String(scale.icon),
  };
}
