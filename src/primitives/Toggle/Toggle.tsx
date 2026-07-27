"use client";

import { useId } from "react";
import type { KeyboardEvent } from "react";
import "./Toggle.css";

/**
 * Toggle — a switch. role="switch" (not "checkbox"): a switch takes effect
 * immediately, a checkbox is a value you submit later. Screen readers say
 * "on/off" for one and "checked" for the other, which is the actual difference.
 *
 * Josh: "Definitely a check box and a toggle standard. We use those regularly
 * and I hate the fact that we've diverged."
 */

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
}: ToggleProps) {
  const labelId = useId();

  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === " ") e.preventDefault(); // Space must toggle, not scroll
  }

  return (
    <button
      type="button"
      role="switch"
      className="ui-toggle"
      aria-checked={checked}
      aria-labelledby={labelId}
      disabled={disabled}
      onKeyDown={handleKeyDown}
      onClick={() => onChange(!checked)}
    >
      <span className="ui-toggle-track" aria-hidden="true">
        <span className="ui-toggle-thumb" />
      </span>
      <span className="ui-toggle-label" id={labelId}>
        {label}
      </span>
    </button>
  );
}
