import type { ReactNode } from "react";

/**
 * What a StatCard does when its number is zero.
 *
 *   "hide" — the default. A tile that says "0" is usually noise: the row is
 *            shorter and the tiles that remain are the ones with something in
 *            them. (Ruling 2026-10-02, reversing the earlier "dim, never hide".)
 *   "dim"  — keep the tile, dimmed. For dashboards, where a fixed set of tiles
 *            in a fixed order IS the layout and a missing one reads as broken.
 *   "show" — no zero treatment at all: the zero is the news.
 */
export type StatCardZero = "hide" | "dim" | "show";

/**
 * Is this value a zero? A number 0, or a formatted string whose digits are all
 * zeros ("0", "$0.00", "0.0%", "0 / 0"). Anything without a digit ("—", "",
 * a node) is NOT a zero: no number is not the same claim as a zero number, and
 * a tile must never vanish because its caller passed something we cannot read.
 */
export function isZeroValue(value: ReactNode): boolean {
  if (typeof value === "number") return value === 0;
  if (typeof value === "string") return /\d/.test(value) && !/[1-9]/.test(value);
  return false;
}

/**
 * The tile's fate, given its value and its caller's choices.
 *
 * `empty` is the older explicit flag ("nothing here"); it still counts as a
 * zero, so call sites written before the zero rule keep their meaning under
 * whichever `zero` mode they now carry.
 *
 * Never hidden while loading (the number is not known yet), and never hidden
 * while `selected` — a filter tile that is ON must stay reachable to turn off.
 */
export function zeroState(opts: {
  value: ReactNode;
  zero?: StatCardZero;
  empty?: boolean;
  loading?: boolean;
  selected?: boolean;
}): "hidden" | "dim" | "normal" {
  const { value, zero = "hide", empty, loading, selected } = opts;
  if (loading) return "normal";
  const isZero = empty ?? isZeroValue(value);
  if (!isZero || zero === "show") return "normal";
  if (zero === "dim" || selected) return "dim";
  return "hidden";
}
