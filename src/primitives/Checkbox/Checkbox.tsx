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

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  /** "Some, not all" — renders a dash and reports aria-checked="mixed". */
  indeterminate?: boolean;
  disabled?: boolean;
}

export function Checkbox({
  checked,
  onChange,
  label,
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
      aria-labelledby={labelId}
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
      <span className="ui-check-label" id={labelId}>
        {label}
      </span>
    </button>
  );
}
