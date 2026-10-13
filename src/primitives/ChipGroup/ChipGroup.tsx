"use client";

import type { ReactNode } from "react";
import { ToggleChip } from "../ToggleChip/ToggleChip";
import type { ToggleChipSize } from "../ToggleChip/ToggleChip";
import { nextMultiValue, nextSingleValue } from "./logic";
import "./ChipGroup.css";

/**
 * ChipGroup — a wrapping row of ToggleChips over a list of options.
 *
 * `multiple` (default true): value is T[], each press adds or removes one.
 * `multiple={false}`: value is T | null, a press selects that chip; pressing
 * the selected chip clears it unless `required`.
 *
 * Chips are ordinary buttons: Tab moves between them, Space / Enter presses.
 * Not a radiogroup with arrow keys on purpose — a chip row is a set of
 * independent switches, and StatusTabs is the house control when a row is a
 * real one-of-N view picker.
 *
 * For a row that FILTERS a list use FilterPills (it owns the isolate gestures).
 */

export interface ChipGroupOption<T> {
  value: T;
  label: ReactNode;
  /** Identity colour — any CSS colour string. Omitted = brand. */
  color?: string;
  disabled?: boolean;
  icon?: ReactNode;
  title?: string;
}

interface ChipGroupBase<T> {
  options: readonly ChipGroupOption<T>[];
  /** Every chip's size; "touch" also widens the gap between chips for fingers. */
  size?: ToggleChipSize;
  /** Names the row for assistive tech (role="group"). */
  ariaLabel?: string;
  /** Disables every chip. */
  disabled?: boolean;
  /**
   * Extra content at the START of the row, before the options — e.g. a
   * "Use Default" / inherit chip that should read first, ahead of the specific
   * choices it stands in for. Rendered as-is, like `children`.
   */
  leading?: ReactNode;
  /** Extra content at the end of the row — e.g. a neutral "Use Default" chip. */
  children?: ReactNode;
}

export interface ChipGroupMultiProps<T> extends ChipGroupBase<T> {
  multiple?: true;
  value: readonly T[];
  onChange: (next: T[]) => void;
  required?: never;
}

export interface ChipGroupSingleProps<T> extends ChipGroupBase<T> {
  multiple: false;
  value: T | null;
  onChange: (next: T | null) => void;
  /** Pressing the selected chip keeps it instead of clearing the row. */
  required?: boolean;
}

export type ChipGroupProps<T> = ChipGroupMultiProps<T> | ChipGroupSingleProps<T>;

export function ChipGroup<T extends string | number>(props: ChipGroupProps<T>) {
  const { options, size = "md", ariaLabel, disabled = false, leading, children } = props;
  const values = options.map((o) => o.value);

  function isOn(v: T): boolean {
    return props.multiple === false ? props.value === v : props.value.includes(v);
  }

  function press(v: T) {
    if (props.multiple === false) props.onChange(nextSingleValue(props.value, v, props.required));
    else props.onChange(nextMultiValue(values, props.value, v));
  }

  return (
    <div className="ui-chips" role="group" aria-label={ariaLabel} data-size={size}>
      {leading}
      {options.map((o) => (
        <ToggleChip
          key={String(o.value)}
          selected={isOn(o.value)}
          onToggle={() => press(o.value)}
          color={o.color}
          size={size}
          icon={o.icon}
          title={o.title}
          disabled={disabled || o.disabled}
        >
          {o.label}
        </ToggleChip>
      ))}
      {children}
    </div>
  );
}
