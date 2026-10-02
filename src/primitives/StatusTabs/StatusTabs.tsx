"use client";

import { useRef } from "react";
import type { CSSProperties, KeyboardEvent, ReactNode } from "react";
import "./StatusTabs.css";

/**
 * StatusTabs — one segmented row of tabs, each with an optional count, that
 * picks which slice of a list is shown ("Open 12 · Waiting 3 · Done 40").
 *
 * WHY IT IS NOT FilterPills selection="single": a pill row is a set of
 * switches (role="group", aria-pressed), and a screen reader announces each
 * pill as an independent toggle. Picking exactly one view of a list is a
 * TABLIST — one tab is selected, the arrow keys move between them, and Tab
 * leaves the row in one press. The semantics differ, so the control differs;
 * the look is a segmented track so the row reads as "one of these" at a glance
 * rather than "any of these".
 *
 * KEYBOARD — automatic activation. Left/Right move and select, wrapping at the
 * ends; Home/End jump to the first/last. Only the selected tab is in the Tab
 * order (roving tabindex). Selecting is cheap here (a list filter), which is
 * when the WAI-ARIA pattern recommends selecting on focus.
 *
 * THE COUNT is a small muted number after the label. On the selected tab it
 * takes the selected colour with the label, so the pair reads as one unit.
 * Omit `count` and nothing is drawn — no placeholder zero.
 *
 * NO PANELS. The tabs filter a list that sits below them; they do not own a
 * panel, so there is no aria-controls. A caller with a real panel can still
 * label it from the row with aria-labelledby.
 *
 * WRAPS, never scrolls sideways: on a narrow screen the track grows a second
 * line rather than hiding tabs off the edge.
 *
 * COLOUR IS OPTIONAL IDENTITY. An item may carry its own `color` — any CSS
 * colour, a hex or a var(--token). When that tab is selected it wears that
 * hue (ground, border, label and count) instead of the brand green, so a row
 * whose tabs ARE identities (one per site, team, category) reads by colour the
 * way their badges do elsewhere. Items without a colour keep the brand recipe,
 * so a mixed row ("All" plus coloured entries) works without extra props. The
 * colour only shows on the selected tab; unselected tabs stay neutral so the
 * track still reads as one control with one answer.
 */

export type StatusTabsSize = "sm" | "md";

export interface StatusTabItem<T extends string = string> {
  value: T;
  label: ReactNode;
  /** Drawn after the label as a small muted number. Omitted = no count. */
  count?: number;
  /** Any CSS colour (hex or var(--token)) worn by this tab when selected.
   *  Omitted = the brand green. */
  color?: string;
}

export interface StatusTabsProps<T extends string = string> {
  items: readonly StatusTabItem<T>[];
  /** The selected tab's value. */
  value: T;
  onChange: (value: T) => void;
  /** "sm" for dense boards, "md" (default) for ordinary screens. */
  size?: StatusTabsSize;
  /** Names the row for assistive tech — the tabs have no visible heading. */
  "aria-label"?: string;
}

export function StatusTabs<T extends string = string>({
  items,
  value,
  onChange,
  size = "md",
  "aria-label": ariaLabel,
}: StatusTabsProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  // If the value matches no item, the first tab takes the Tab stop so the row
  // is never unreachable from the keyboard.
  const selectedIndex = Math.max(
    0,
    items.findIndex((i) => i.value === value),
  );

  function select(index: number) {
    const item = items[index];
    if (!item) return;
    refs.current[index]?.focus();
    if (item.value !== value) onChange(item.value);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = items.length - 1;
    let next: number | null = null;
    if (e.key === "ArrowRight") next = index === last ? 0 : index + 1;
    else if (e.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    if (next === null) return;
    e.preventDefault();
    select(next);
  }

  return (
    <div className="ui-status-tabs" role="tablist" aria-label={ariaLabel} data-size={size}>
      {items.map((item, index) => {
        const selected = index === selectedIndex && item.value === value;
        // The colour arrives as a custom property so the CSS owns the recipe
        // and a call site can only choose the hue.
        const style = item.color
          ? ({ "--ui-status-tab-color": item.color } as CSSProperties)
          : undefined;
        return (
          <button
            key={item.value}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            role="tab"
            className="ui-status-tab"
            aria-selected={selected}
            data-coloured={item.color ? "" : undefined}
            style={style}
            tabIndex={index === selectedIndex ? 0 : -1}
            onClick={() => select(index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            <span className="ui-status-tab__label">{item.label}</span>
            {item.count != null && <span className="ui-status-tab__count">{item.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
