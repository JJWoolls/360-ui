"use client";

import { useState } from "react";
import { Select } from "../Select/Select";
import { DateField } from "../DatePicker/DatePicker";
import {
  defaultPresets,
  resolvePreset,
  type DateRange,
  type DateRangePreset,
  type PresetRangeOptions,
} from "./presets";
import "./DateRangeFilter.css";

/**
 * DateRangeFilter — the house from/to date bar: a preset Select, then two
 * DateFields.
 *
 * WHY A SELECT AND NOT StatusTabs. Ten presets in a segmented track run wider
 * than most toolbars and wrap onto a second line, which a filter bar above a
 * table cannot afford. StatusTabs is for a handful of views with counts; a
 * long list of mutually exclusive choices with no counts is a Select.
 *
 * WHY DateField. The kit bans the native date input (its look and keyboard
 * differ per browser and it ignores the tokens). DateField is the house
 * trigger + modal calendar, and it already speaks "YYYY-MM-DD" | null, which
 * is this component's value contract too.
 *
 * WHICH PRESET SHOWS. The Select is derived from the dates, not stored beside
 * them, so it can never claim "This Month" over dates that are not this month:
 *   - the preset last picked here, while the dates still equal its range;
 *   - else the first preset whose range equals the dates (so a value set by
 *     the caller — a URL param, a saved view — still lights the right one);
 *   - else "custom" if any date is set, else nothing (the placeholder).
 * Editing a date by hand counts as picking Custom.
 *
 * Picking "custom" keeps the current dates — it only says "I will type them" —
 * and the Select stays on Custom until another preset is picked.
 *
 * ORDERING. If a hand edit puts From after To, the other end moves to meet
 * it, so the bar never holds an inverted (always-empty) range.
 */

export interface DateRangeFilterProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
  /** Defaults to defaultPresets. Pass a subset, or presets with own ranges. */
  presets?: readonly DateRangePreset[];
  /** Forwarded to the built-in preset arithmetic. Monday by default. */
  weekStartsOn?: PresetRangeOptions["weekStartsOn"];
  /** Shown in the Select when no preset or date is set. */
  placeholder?: string;
  /** "sm" for dense toolbars; "md" (default) matches DateField's height. */
  size?: "sm" | "md";
  disabled?: boolean;
  /** Names the group for assistive tech. */
  "aria-label"?: string;
}

const CUSTOM = "custom";

const same = (a: DateRange, b: DateRange | null) =>
  !!b && a.from === b.from && a.to === b.to;

export function DateRangeFilter({
  value,
  onChange,
  presets = defaultPresets,
  weekStartsOn,
  placeholder = "Date Range",
  size = "md",
  disabled = false,
  "aria-label": ariaLabel = "Date Range",
}: DateRangeFilterProps) {
  const [picked, setPicked] = useState<string | null>(null);
  const opts = { weekStartsOn };
  const now = new Date();

  const hasCustom = presets.some((p) => p.key === CUSTOM);
  const pickedPreset = presets.find((p) => p.key === picked);

  let shown = "";
  if (picked === CUSTOM && hasCustom) {
    // An explicit "Custom" stays Custom even over dates a preset would match.
    shown = CUSTOM;
  } else if (pickedPreset && same(value, resolvePreset(pickedPreset, now, opts))) {
    shown = pickedPreset.key;
  } else {
    const match = presets.find((p) => p.key !== CUSTOM && same(value, resolvePreset(p, now, opts)));
    if (match) shown = match.key;
    else if ((value.from != null || value.to != null) && hasCustom) shown = CUSTOM;
  }

  const choose = (key: string) => {
    setPicked(key);
    const preset = presets.find((p) => p.key === key);
    const range = preset ? resolvePreset(preset, new Date(), opts) : null;
    if (range && !same(value, range)) onChange(range);
  };

  const setFrom = (from: string | null) => {
    setPicked(CUSTOM);
    const to = from && value.to && value.to < from ? from : value.to;
    onChange({ from, to });
  };

  const setTo = (to: string | null) => {
    setPicked(CUSTOM);
    const from = to && value.from && value.from > to ? to : value.from;
    onChange({ from, to });
  };

  return (
    <div className="ui-daterange" role="group" aria-label={ariaLabel} data-size={size}>
      <Select
        className="ui-daterange-preset"
        options={presets.map((p) => ({ value: p.key, label: p.label }))}
        value={shown}
        onChange={choose}
        placeholder={placeholder}
        ariaLabel="Date Range Preset"
        size={size}
        disabled={disabled}
      />
      <div className="ui-daterange-dates">
        <span className="ui-daterange-field">
          <DateField
            value={value.from}
            onChange={setFrom}
            placeholder="From"
            pickerTitle="From Date"
            presets={false}
            disabled={disabled}
          />
        </span>
        <span className="ui-daterange-sep" aria-hidden="true">
          to
        </span>
        <span className="ui-daterange-field">
          <DateField
            value={value.to}
            onChange={setTo}
            placeholder="To"
            pickerTitle="To Date"
            presets={false}
            disabled={disabled}
          />
        </span>
      </div>
    </div>
  );
}
