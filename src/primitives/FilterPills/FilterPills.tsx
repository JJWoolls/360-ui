"use client";

import type { CSSProperties, MouseEvent, ReactNode } from "react";
import "./FilterPills.css";

/**
 * FilterPills — a row of toggle pills that filter a list.
 *
 * This is the "clickable, on/off, heavier than a label" control the Badge file
 * points at: a Badge is a word on a ground and does nothing; a filter pill is
 * pressable, so it carries a border (the house affordance) and a pressed state.
 *
 * THE BEHAVIOUR IS THE HOUSE MULTI-SELECT, not a choice per screen:
 *
 *   - There is NO "All" pill. Every option starts selected; the row itself is
 *     the "all" state. An "All" pill is a second way of saying the same thing
 *     and the two drift out of sync.
 *   - A plain click toggles one pill.
 *   - Double-click or shift-click ISOLATES a pill — only it stays selected.
 *     Isolating the pill that is already the only one selected restores the
 *     full set, so the gesture undoes itself and nobody has to click every
 *     pill back on.
 *
 * A double-click delivers two clicks before the dblclick event. Each click
 * toggles, so the pair cancels out and the isolate lands on the original
 * state — which is why no timer or click-suppression is needed here.
 *
 * COLOUR IS IDENTITY. Each option may carry its own `color` — any CSS colour
 * string: a hex from the app's data, or a `var(--token)`. A selected pill wears
 * that colour clearly (tinted ground, coloured border, coloured label); an
 * unselected pill goes neutral and keeps only a small dot, so the row still
 * says which pill is which at a glance while showing plainly what is off.
 * Without a colour a pill uses the brand hue.
 *
 * `selection="single"` turns the same row into exclusive tabs: a click selects
 * that one pill and nothing else. It exists so a status-tab row beside a
 * filter row looks and sizes identically rather than being a second control.
 * For a new status-tab row prefer StatusTabs, which is a real tablist (arrow
 * keys, aria-selected); this mode remains for the rows already built on it.
 */

export type FilterPillsSize = "sm" | "md";

export interface FilterPillOption<K extends string = string> {
  value: K;
  label: ReactNode;
  /** Identity colour — any CSS colour string. Omitted = brand. */
  color?: string;
  /** Optional count drawn after the label. */
  count?: number;
}

export interface FilterPillsProps<K extends string = string> {
  options: readonly FilterPillOption<K>[];
  /** What is selected now. */
  selected: ReadonlySet<K> | readonly K[];
  /** The whole next selection — the component never mutates what it was given. */
  onChange: (next: Set<K>) => void;
  /**
   * The set an un-isolate restores. Defaults to every option shown. Pass the
   * full key list when the row hides some options (e.g. empty ones) but the
   * filter still means "everything" when all are on.
   */
  allValues?: readonly K[];
  /** "multiple" (default) — the house multi-select. "single" — exclusive tabs. */
  selection?: "multiple" | "single";
  /** "sm" for dense boards, "md" (default) for ordinary screens. */
  size?: FilterPillsSize;
  /** Names the group for assistive tech — the row has no visible heading. */
  ariaLabel: string;
  disabled?: boolean;
}

export function FilterPills<K extends string = string>({
  options,
  selected,
  onChange,
  allValues,
  selection = "multiple",
  size = "md",
  ariaLabel,
  disabled = false,
}: FilterPillsProps<K>) {
  const current = new Set<K>(selected as Iterable<K>);
  const all = allValues ?? options.map((o) => o.value);

  function toggle(value: K) {
    const next = new Set(current);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange(next);
  }

  function isolate(value: K) {
    if (current.size === 1 && current.has(value)) onChange(new Set(all));
    else onChange(new Set([value]));
  }

  function handleClick(e: MouseEvent<HTMLButtonElement>, value: K) {
    // Single: always report, even a click on the tab already selected — a
    // caller may hang a side effect on the click itself (re-running a pick),
    // and swallowing it here would silently change that screen's behaviour.
    if (selection === "single") {
      onChange(new Set([value]));
      return;
    }
    if (e.shiftKey) isolate(value);
    else toggle(value);
  }

  return (
    <div className="ui-pills" role="group" aria-label={ariaLabel} data-size={size}>
      {options.map((o) => {
        const on = current.has(o.value);
        // The colour arrives as a custom property so the CSS owns the recipe
        // (ground, border, label) and a call site can only choose the hue.
        const style = o.color
          ? ({ "--ui-pill-color": o.color } as CSSProperties)
          : undefined;
        return (
          <button
            key={o.value}
            type="button"
            className="ui-pill"
            aria-pressed={on}
            data-coloured={o.color ? "" : undefined}
            disabled={disabled}
            style={style}
            onClick={(e) => handleClick(e, o.value)}
            onDoubleClick={selection === "multiple" ? () => isolate(o.value) : undefined}
          >
            {o.color && <span className="ui-pill__dot" aria-hidden="true" />}
            <span className="ui-pill__label">{o.label}</span>
            {o.count != null && <span className="ui-pill__count">{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
