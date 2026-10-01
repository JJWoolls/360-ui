/* ============================================================================
   Date range presets — pure, no React, no CSS
   ----------------------------------------------------------------------------
   Kept apart from the component so the arithmetic can be unit-tested and used
   by code that never renders the bar (a server route building the same window
   a screen showed, a report that defaults to "This Month").

   Contract: dates are local-calendar "YYYY-MM-DD" strings, the same value
   contract as DatePicker. No Date objects cross the boundary, and nothing is
   computed in UTC — a UTC "today" is yesterday for an evening user west of
   Greenwich, which is exactly the bug a date bar must not have.

   Period semantics (ported from the app this was first written for):
     - A month, quarter or week preset is the WHOLE period, so its end may lie
       in the future. "This Month" on the 3rd still ends on the 30th/31st; a
       query over it simply finds nothing past today.
     - "This Year" is year-to-date: Jan 1 through today. It is the one
       to-date preset, because a whole-year window shows eleven empty months
       of forecast-looking nothing for most of the year.
     - Weeks start on Monday by default (ISO-8601, and how weekly reports
       bucket). Pass weekStartsOn: 0 for a Sunday week.
     - "Custom" has no range of its own; it means "the dates the user typed".
     - "All Time" is a real choice whose range is open at both ends
       ({from: null, to: null}). It is NOT in defaultPresets: an empty bar
       means "no filter" on most pages already, and adding it would relabel
       their empty state. Pages that want it pass allTimePreset explicitly.
   ========================================================================== */

export interface DateRange {
  /** Inclusive start, "YYYY-MM-DD", or null for open-ended. */
  from: string | null;
  /** Inclusive end, "YYYY-MM-DD", or null for open-ended. */
  to: string | null;
}

export type DateRangePresetKey =
  | "today"
  | "yesterday"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "this_quarter"
  | "this_year"
  | "last_year"
  | "all_time"
  | "custom";

export interface DateRangePreset {
  /** A built-in key, or any string of the caller's own. */
  key: string;
  /** Title Case, per house rule. */
  label: string;
  /**
   * The window this preset stands for. Omit it for a built-in key and
   * getPresetRange supplies it; give it for a key of your own. A preset with
   * neither (like "custom") selects nothing and leaves the dates alone.
   * A `range` that returns {from: null, to: null} is a real "no limit" choice:
   * picking it clears both dates.
   */
  range?: (now: Date) => DateRange;
}

export const defaultPresets: readonly DateRangePreset[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "this_week", label: "This Week" },
  { key: "last_week", label: "Last Week" },
  { key: "this_month", label: "This Month" },
  { key: "last_month", label: "Last Month" },
  { key: "this_quarter", label: "This Quarter" },
  { key: "this_year", label: "This Year" },
  { key: "last_year", label: "Last Year" },
  { key: "custom", label: "Custom" },
];

/** Opt-in "no limit" preset: both ends open. Append it to a preset list. */
export const allTimePreset: DateRangePreset = {
  key: "all_time",
  label: "All Time",
  range: () => ({ from: null, to: null }),
};

export interface PresetRangeOptions {
  /** 1 = Monday (default), 0 = Sunday. */
  weekStartsOn?: 0 | 1;
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/** A local-calendar date as "YYYY-MM-DD". Month is 0-based, like Date's. The
 *  Date constructor normalises overflow (day 0 = last day of previous month),
 *  which is what every branch below leans on. */
function ymd(y: number, m: number, d: number): string {
  const dt = new Date(y, m, d);
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
}

const EMPTY: DateRange = { from: null, to: null };

/**
 * The {from, to} a preset key stands for, as of `now` (default: the current
 * moment). Unknown keys and "custom" return an open range — the caller keeps
 * whatever dates it has.
 */
export function getPresetRange(
  key: string,
  now: Date = new Date(),
  opts: PresetRangeOptions = {},
): DateRange {
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const weekStart = opts.weekStartsOn ?? 1;

  switch (key) {
    case "today":
      return { from: ymd(y, m, d), to: ymd(y, m, d) };
    case "yesterday":
      return { from: ymd(y, m, d - 1), to: ymd(y, m, d - 1) };
    case "this_week":
    case "last_week": {
      // Days since the week began: 0..6 whichever day the week starts on.
      const back = (now.getDay() - weekStart + 7) % 7;
      const start = d - back - (key === "last_week" ? 7 : 0);
      return { from: ymd(y, m, start), to: ymd(y, m, start + 6) };
    }
    case "this_month":
      return { from: ymd(y, m, 1), to: ymd(y, m + 1, 0) };
    case "last_month":
      return { from: ymd(y, m - 1, 1), to: ymd(y, m, 0) };
    case "this_quarter": {
      const q = Math.floor(m / 3) * 3;
      return { from: ymd(y, q, 1), to: ymd(y, q + 3, 0) };
    }
    case "this_year":
      return { from: ymd(y, 0, 1), to: ymd(y, m, d) };
    case "last_year":
      return { from: ymd(y - 1, 0, 1), to: ymd(y - 1, 11, 31) };
    default:
      return { ...EMPTY };
  }
}

/** The range a preset stands for: its own `range` if it has one, else the
 *  built-in. Null only when the preset selects nothing (custom / unknown key
 *  with no `range`). An open range from an explicit `range`, or the built-in
 *  "all_time", is returned as is — that is a choice, not an absence. */
export function resolvePreset(
  preset: DateRangePreset,
  now: Date = new Date(),
  opts?: PresetRangeOptions,
): DateRange | null {
  if (preset.range) return preset.range(now);
  if (preset.key === "all_time") return { ...EMPTY };
  const r = getPresetRange(preset.key, now, opts);
  return r.from == null && r.to == null ? null : r;
}

const CUSTOM = "custom";

const sameRange = (a: DateRange, b: DateRange | null) =>
  !!b && a.from === b.from && a.to === b.to;

/**
 * Which preset key the bar's Select shows for `value` — derived from the dates,
 * never stored beside them, so it can never claim a preset the dates are not:
 *   - an explicit "custom" pick stays Custom;
 *   - else the preset last picked, while the dates still equal its range;
 *   - else the first preset whose range equals the dates;
 *   - else "custom" if any date is set, else "" (the placeholder).
 * An open-range preset (All Time) matches empty dates, so a page that offers it
 * shows "All Time" rather than the placeholder when nothing is set.
 */
export function shownPresetKey(
  presets: readonly DateRangePreset[],
  value: DateRange,
  picked: string | null,
  now: Date = new Date(),
  opts?: PresetRangeOptions,
): string {
  const hasCustom = presets.some((p) => p.key === CUSTOM);
  if (picked === CUSTOM && hasCustom) return CUSTOM;
  const pickedPreset = presets.find((p) => p.key === picked);
  if (pickedPreset && sameRange(value, resolvePreset(pickedPreset, now, opts))) {
    return pickedPreset.key;
  }
  const match = presets.find(
    (p) => p.key !== CUSTOM && sameRange(value, resolvePreset(p, now, opts)),
  );
  if (match) return match.key;
  if ((value.from != null || value.to != null) && hasCustom) return CUSTOM;
  return "";
}

/**
 * What picking `key` should emit: the preset's range when it differs from the
 * current dates, else null (nothing to change — custom, an unknown key, or the
 * dates already match).
 */
export function presetChange(
  presets: readonly DateRangePreset[],
  key: string,
  value: DateRange,
  now: Date = new Date(),
  opts?: PresetRangeOptions,
): DateRange | null {
  const preset = presets.find((p) => p.key === key);
  const range = preset ? resolvePreset(preset, now, opts) : null;
  return range && !sameRange(value, range) ? range : null;
}
