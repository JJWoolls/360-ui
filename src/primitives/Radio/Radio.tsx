"use client";

import { useId, useRef } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import "./Radio.css";

/**
 * RadioGroup — NEVER a native <input type="radio">.
 *
 * The Checkbox's sibling: one choice out of a short, always-visible list
 * ("Ship", "Pick Up", "Courier"). A long or searchable list is a Select; a row
 * of pills that filters a view is StatusTabs. Use this when every option
 * should stay on screen and each one may need a line of explanation.
 *
 * It is a real radiogroup: role="radiogroup" around role="radio" buttons with
 * one roving tab stop. Tab enters on the checked option (or the first), the
 * arrow keys move AND select (the WAI-ARIA radio pattern), Space selects the
 * focused one. A disabled option is skipped by the arrows.
 *
 * The group says what it is choosing: a visible `label` or an `ariaLabel`, and
 * the union below makes one of them compulsory, as on the Checkbox.
 */

export interface RadioOption<T extends string> {
  value: T;
  label: string;
  /** One quiet line under the label. */
  description?: ReactNode;
  disabled?: boolean;
}

type RadioGroupLabel =
  | { label: string; ariaLabel?: never }
  | { label?: undefined; ariaLabel: string };

interface RadioGroupBase<T extends string> {
  options: RadioOption<T>[];
  /** The checked value, or null when nothing is chosen yet. */
  value: T | null;
  onChange: (value: T) => void;
  /** "column" (default) stacks the options; "row" lays them side by side. */
  direction?: "column" | "row";
  disabled?: boolean;
}

export type RadioGroupProps<T extends string> = RadioGroupBase<T> & RadioGroupLabel;

export function RadioGroup<T extends string>({
  options,
  value,
  onChange,
  label,
  ariaLabel,
  direction = "column",
  disabled = false,
}: RadioGroupProps<T>) {
  const labelId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const enabled = (i: number) => !disabled && !options[i]?.disabled;
  const checkedIndex = options.findIndex(o => o.value === value);
  const firstEnabled = options.findIndex((_, i) => enabled(i));
  const tabIndexOf = (i: number) =>
    i === (checkedIndex >= 0 && enabled(checkedIndex) ? checkedIndex : firstEnabled) ? 0 : -1;

  function move(from: number, step: 1 | -1) {
    const n = options.length;
    for (let k = 1; k <= n; k++) {
      const i = (from + step * k + n) % n;
      if (enabled(i)) {
        onChange(options[i].value);
        refs.current[i]?.focus();
        return;
      }
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      move(i, 1);
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      move(i, -1);
    } else if (e.key === " ") {
      e.preventDefault(); // the button clicks on keyup; stop the page scrolling
    }
  }

  return (
    <div className="ui-radio-group" data-direction={direction}>
      {label != null && (
        <span className="ui-radio-group-label" id={labelId}>
          {label}
        </span>
      )}
      <div
        role="radiogroup"
        className="ui-radio-options"
        aria-labelledby={label != null ? labelId : undefined}
        aria-label={label == null ? ariaLabel : undefined}
        aria-disabled={disabled || undefined}
      >
        {options.map((o, i) => {
          const checked = o.value === value;
          return (
            <button
              key={o.value}
              ref={el => { refs.current[i] = el; }}
              type="button"
              role="radio"
              className="ui-radio"
              aria-checked={checked}
              disabled={!enabled(i)}
              tabIndex={tabIndexOf(i)}
              onKeyDown={e => onKeyDown(e, i)}
              onClick={() => onChange(o.value)}
            >
              <span className="ui-radio-dot" data-state={checked ? "on" : "off"} aria-hidden="true" />
              <span className="ui-radio-text">
                <span className="ui-radio-label">{o.label}</span>
                {o.description != null && <span className="ui-radio-desc">{o.description}</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
