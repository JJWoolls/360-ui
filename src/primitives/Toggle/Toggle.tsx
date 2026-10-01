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

/**
 * Same naming contract as Checkbox: a visible `label`, or — when the caller
 * already shows the name beside the switch (a settings row with its own title
 * and description) — `ariaLabel`, which names the switch for assistive tech and
 * draws nothing. Without it the row would either print the name twice or leave
 * a nameless switch. The union means a toggle with neither will not compile.
 *
 * Do NOT reach for ariaLabel to tidy up a form. If the label would be visible
 * anywhere else, it should be visible here.
 */
type ToggleLabel =
  | { label: string; ariaLabel?: never }
  | { label?: undefined; ariaLabel: string };

interface ToggleBase {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export type ToggleProps = ToggleBase & ToggleLabel;

export function Toggle({
  checked,
  onChange,
  label,
  ariaLabel,
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
      aria-labelledby={label == null ? undefined : labelId}
      aria-label={label == null ? ariaLabel : undefined}
      // No label: no gap, no optical pull-back — the track is the whole control.
      data-bare={label == null ? "" : undefined}
      disabled={disabled}
      onKeyDown={handleKeyDown}
      onClick={() => onChange(!checked)}
    >
      <span className="ui-toggle-track" aria-hidden="true">
        <span className="ui-toggle-thumb" />
      </span>
      {label != null && (
        <span className="ui-toggle-label" id={labelId}>
          {label}
        </span>
      )}
    </button>
  );
}
