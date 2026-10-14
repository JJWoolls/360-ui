"use client";

import type { CSSProperties, KeyboardEvent, MouseEvent, ReactNode } from "react";
import { nextToggleState } from "./logic";
import type { ToggleChipState } from "./logic";
import "./ToggleChip.css";

export type { ToggleChipState } from "./logic";

/**
 * ToggleChip — one on/off pill. A real <button aria-pressed>, so Tab reaches
 * it and Space / Enter press it with no extra wiring.
 *
 * Same look as a FilterPills pill (see ToggleChip.css for the recipe). Use
 * FilterPills for a row that FILTERS a list — it owns the house multi-select
 * gestures (no "All", shift/double-click isolates). Use ToggleChip / ChipGroup
 * for every other on/off row: pick one handler, assign several stations, a
 * neutral "Use Default" chip beside coloured ones.
 *
 * COLOUR IS IDENTITY. `color` takes any CSS colour — a hex from the app's
 * data or a var(--token). When the chip is selected it tints the ground and
 * border and colours the label; unselected chips are neutral. No colour =
 * the brand hue, the same as an uncoloured FilterPill.
 *
 * PARTIAL. `selected="mixed"` is the third state, for a chip that stands for
 * a set which is only partly on (a parent over some selected children). It
 * renders aria-pressed="mixed" and a look between off and on — half-strength
 * tint behind a dashed border — and a press from it hands onToggle `true`.
 */

export type ToggleChipSize = "sm" | "md" | "touch" | "bench";

export interface ToggleChipProps {
  /**
   * Pressed state — drives aria-pressed and the tinted look. "mixed" is the
   * partial state: aria-pressed="mixed", a dashed half-tint look.
   */
  selected: ToggleChipState;
  /** Called with the NEXT state (true when pressed from "mixed"). Use this for a plain on/off chip. */
  onToggle?: (next: boolean) => void;
  /** The raw click, for callers that need the event (runs before onToggle). */
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
  /** Identity colour — any CSS colour string. Omitted = brand. */
  color?: string;
  /**
   * "md" (default) for ordinary screens, "sm" for modals and dense boards,
   * "touch" for a surface a FINGER uses (a kiosk or bench screen): 44px tall
   * (--touch-target, the Button's and Input's touch floor, so they line up),
   * 16px type, and a long label ends in an ellipsis instead of widening the
   * chip. A prop, not a `pointer: coarse` query, for the Input's reason: a
   * touch surface is a layout decision its page already makes.
   * "bench" is the step above touch for a full-screen workbench: 56px tall,
   * the Button's bench step, so a chip row and a bench button bar line up.
   */
  size?: ToggleChipSize;
  /**
   * Fill the container's width — for chips laid in a CSS grid of tiles. The
   * label packs to the leading edge and ends in an ellipsis when the cell is
   * narrower than the text, so every tile in the grid is the same size.
   */
  fill?: boolean;
  disabled?: boolean;
  /** Leading icon, drawn in the label colour. */
  icon?: ReactNode;
  title?: string;
  "aria-label"?: string;
}

export function ToggleChip({
  selected,
  onToggle,
  onClick,
  children,
  color,
  size = "md",
  fill = false,
  disabled = false,
  icon,
  title,
  "aria-label": ariaLabel,
}: ToggleChipProps) {
  // The colour travels as a custom property so the CSS owns the recipe.
  const style = color ? ({ "--ui-chip-color": color } as CSSProperties) : undefined;

  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === " ") e.preventDefault(); // Space presses, it must not scroll
  }

  return (
    <button
      type="button"
      className="ui-chip"
      aria-pressed={selected}
      aria-label={ariaLabel}
      title={title}
      data-size={size}
      data-fill={fill ? "" : undefined}
      data-coloured={color ? "" : undefined}
      disabled={disabled}
      style={style}
      onKeyDown={handleKeyDown}
      onClick={(e) => {
        onClick?.(e);
        onToggle?.(nextToggleState(selected));
      }}
    >
      {icon != null && (
        <span className="ui-chip__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="ui-chip__label">{children}</span>
    </button>
  );
}
