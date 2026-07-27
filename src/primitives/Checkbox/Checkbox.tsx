"use client";

import { useId } from "react";
import type { KeyboardEvent } from "react";
import "./Checkbox.css";

/**
 * Checkbox — NEVER a native <input type="checkbox">.
 *
 * House rule: the native box can't be styled to match, and it diverges per
 * platform. This is a button that IS a checkbox: role="checkbox" + aria-checked
 * gives assistive tech the same thing the native control would, and Space
 * toggles because <button> does that for free.
 *
 * `indeterminate` is a real third state ("some of these are checked"), not a
 * visual — aria-checked="mixed" is what tells a screen reader that.
 */

/**
 * A checkbox says what it is toggling, or it is a mystery box. Usually that is
 * a visible `label`. In a table cell it is not: the column header already says
 * "Sent" and repeating it in every row is noise on screen — but a screen reader
 * moving cell to cell does not carry the header along, so the name still has to
 * exist. That is `ariaLabel`.
 *
 * The union is what enforces it — a checkbox with neither will not compile.
 * Josh, 2026-07-27: "it should have an invisible variant".
 *
 * Do NOT reach for ariaLabel to tidy up a form. If the label would be visible
 * anywhere else, it should be visible here.
 */
type CheckboxLabel =
  | { label: string; ariaLabel?: never }
  | { label?: undefined; ariaLabel: string };

interface CheckboxBase {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** "Some, not all" — renders a dash and reports aria-checked="mixed". */
  indeterminate?: boolean;
  disabled?: boolean;
}

export type CheckboxProps = CheckboxBase & CheckboxLabel;

export function Checkbox({
  checked,
  onChange,
  label,
  ariaLabel,
  indeterminate = false,
  disabled = false,
}: CheckboxProps) {
  const labelId = useId();

  // Space is the native checkbox toggle. <button> already fires onClick for
  // Space and Enter, so onClick covers both mouse and keyboard.
  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === " ") e.preventDefault(); // stop the page scrolling under us
  }

  return (
    <button
      type="button"
      role="checkbox"
      className="ui-check"
      aria-checked={indeterminate ? "mixed" : checked}
      // Point at the visible label when there is one; fall back to the name the
      // type system insisted on when there isn't.
      aria-labelledby={label == null ? undefined : labelId}
      aria-label={label == null ? ariaLabel : undefined}
      // No label means no gap and no text — the control is the whole thing, so
      // it can sit centred in a table cell without a phantom column of padding.
      data-bare={label == null ? "" : undefined}
      disabled={disabled}
      onKeyDown={handleKeyDown}
      onClick={() => onChange(!checked)}
    >
      <span
        className="ui-check-box"
        data-state={indeterminate ? "mixed" : checked ? "on" : "off"}
        aria-hidden="true"
      >
        {indeterminate ? (
          <span className="ui-check-dash" />
        ) : checked ? (
          <svg viewBox="0 0 16 16" className="ui-check-tick" focusable="false">
            <path
              d="M3.5 8.5 L6.5 11.5 L12.5 4.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </span>
      {label != null && (
        <span className="ui-check-label" id={labelId}>
          {label}
        </span>
      )}
    </button>
  );
}
