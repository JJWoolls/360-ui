/**
 * Which frame a Modal draws — pure arithmetic, kept apart from the component
 * so it can be tested without a DOM.
 *
 * Three sizes:
 *   "default" — content-sized, top-anchored, capped at `width` (or the house 460)
 *   "full"    — the window less a small inset; `width` is ignored
 *   "screen"  — the whole window, edge to edge; `width` is ignored
 *
 * A window-sized frame is as wide as the window, so a `width` passed alongside
 * it is dropped here rather than fighting the stylesheet.
 */

export type ModalSize = "default" | "full" | "screen";

export interface ModalFrame {
  /** The data-size attribute on overlay and dialog; absent for "default". */
  dataSize?: "full" | "screen";
  /** Inline max-width, only when the caller asked for one on a default frame. */
  maxWidth?: number | string;
}

export function modalFrame(size: ModalSize, width: number | undefined, scaled: boolean): ModalFrame {
  if (size === "full" || size === "screen") return { dataSize: size };
  if (width == null) return {};
  // Under a Scale the caller's width scales with the house 460.
  return { maxWidth: scaled ? `calc(${width}px * var(--ui-space-scale, 1))` : width };
}

/**
 * The overlay's z-index for a modal `depth` deep in the stack (0 = the first
 * one open). Every overlay already shares --z-modal and is portalled to the
 * end of <body>, so a modal opened later paints later and lands on top. That
 * holds only while DOM order matches open order; a depth step makes "the one
 * opened from inside sits above" true by construction — in particular above a
 * screen-size modal, which covers everything and would hide a nested dialog
 * completely if it ever won the tie. One step per level stays far below
 * --z-toast and --z-tooltip, so menus and toasts still clear every dialog.
 */
export function modalLayer(depth: number): string | undefined {
  if (!(depth > 0)) return undefined;
  return `calc(var(--z-modal) + ${Math.floor(depth)})`;
}
