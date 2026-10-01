"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  CSSProperties,
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
} from "react";
import { createPortal } from "react-dom";
import "./Select.css";

// useLayoutEffect warns during server render; there is nothing to place there.
const useIsoLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Select — THE house dropdown. One primitive; never a native <select>.
 *
 * WHY ONE. The LMS grew two inline dropdowns: StyledSelect (plain, groups,
 * optional filter box) and SearchableSelect (always a filter box, sublabels,
 * images, ranked multi-word search). Each fixed things the other did not, so a
 * fix in one left half the app wrong. This is the superset of both; each of
 * them is now a thin adapter over it, and every change lands here once.
 *
 * Anatomy: a <button> trigger the same shape as Input (36px md / 28px sm — one
 * field shape, the trigger just opens a list), and a portaled, fixed-position
 * panel. Portaled because a Modal body scrolls and clips; fixed so it chases
 * its trigger on every scroll and resize. It opens downward unless the room
 * below is short and the room above is larger, and its height is capped to the
 * room it has, so it never runs off-screen.
 *
 * KEYBOARD. Up/Down/Home/End/PageUp/PageDown move the highlight, Enter picks,
 * Escape closes the list ONLY (and goes no further), Tab closes and moves on.
 * On a searchable Select, typing on the closed trigger opens it with the
 * search already holding that key — so a long list still feels search-first.
 * On a plain Select, typing while open jumps to the first label that starts
 * with what was typed.
 *
 * ESCAPE INSIDE A MODAL. The house Modal steps aside for a trigger carrying
 * aria-haspopup + aria-expanded="true", so the first Escape closes the list and
 * the next one closes the window. The search box is also a combobox with
 * aria-expanded, which the Modal recognises even when the list is portaled
 * outside the dialog. The Escape is stopped here, so a dialog listening on
 * document below us does not hear it either.
 *
 * SEARCH matches every word typed, anywhere in label + sublabel + searchText,
 * then ranks: exact label, label starts with the query, label contains it,
 * the rest — stable within each tier. Ranking was earned: a long alphabetical
 * list buried the obvious match under everything that merely contained it.
 */

export interface SelectOption {
  value: string;
  /** Human-readable. Title Case, per house rule. */
  label: string;
  /** Optional section header this option renders under. */
  group?: string;
  /** A second, dimmer line under the label. Searched. */
  sublabel?: string;
  /** Extra text the search matches but the list never shows. */
  searchText?: string;
  /** Anything drawn before the label — an icon, a swatch, an avatar. */
  leading?: ReactNode;
  /**
   * A small square thumbnail before the label — the common case of `leading`.
   * A string draws the image; null draws the empty-image mark (so a list where
   * some rows have no picture still lines up); undefined draws no slot.
   */
  imageUrl?: string | null;
}

/** Named as Input's and Button's are, so a form asks for one size in one word. */
export type SelectSize = "sm" | "md";

export interface SelectProps {
  options: SelectOption[];
  /** Controlled value; a value no option carries shows the placeholder. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** On the outer wrapper — for layout (width, margin), never for looks. */
  className?: string;
  /** On the trigger, so a <label htmlFor> points at the control. */
  id?: string;
  /** For a Select with no visible label. */
  ariaLabel?: string;
  /** "md" is a form field; "sm" is the inline size, matching Input's. */
  size?: SelectSize;
  /** Adds the filter box. Reach for it on any list too long to scan. */
  searchable?: boolean;
  searchPlaceholder?: string;
  /** The panel is at least this wide (px), and never narrower than the trigger. */
  dropdownMinWidth?: number;
  /** Keep labels' spacing as typed (indented trees, aligned columns). */
  preserveWhitespace?: boolean;
}

/** Gap between trigger and panel, and the margin kept from the viewport edge. */
const GAP = 4;
const EDGE = 8;
/** Open upward when less than this remains below (and more is above). */
const FLIP_BELOW = 280;
const DEFAULT_MIN_WIDTH = 140;
/** Long labels wrap past this rather than stretch the panel across the screen. */
const MAX_WIDTH = 480;
const TYPEAHEAD_MS = 600;

const HIDDEN: CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  visibility: "hidden",
};

function isPrintable(e: ReactKeyboardEvent): boolean {
  return e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
}

function rankOptions(options: SelectOption[], query: string): SelectOption[] {
  const q = query.toLowerCase().trim();
  const terms = q.split(/\s+/).filter(Boolean);
  if (terms.length === 0) return options;
  const matched = options.filter((o) => {
    const text =
      `${o.label} ${o.sublabel ?? ""} ${o.searchText ?? ""}`.toLowerCase();
    return terms.every((t) => text.includes(t));
  });
  const rank = (label: string) =>
    label === q ? 0 : label.startsWith(q) ? 1 : label.includes(q) ? 2 : 3;
  return matched
    .map((o, i) => ({ o, i, r: rank(o.label.toLowerCase()) }))
    .sort((a, b) => a.r - b.r || a.i - b.i)
    .map((x) => x.o);
}

export function Select({
  options,
  value,
  onChange,
  placeholder = "Select...",
  disabled = false,
  className,
  id,
  ariaLabel,
  size = "md",
  searchable = false,
  searchPlaceholder = "Search...",
  dropdownMinWidth,
  preserveWhitespace = false,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState(0);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>(HIDDEN);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const typeahead = useRef({ text: "", at: 0 });
  const baseId = useId();
  const listId = `${baseId}-list`;
  const optionId = (i: number) => `${baseId}-opt-${i}`;

  const selected = options.find((o) => o.value === value);

  // Visible options in DISPLAY order (grouped), so the keyboard index and the
  // picture agree. Groups keep the order they first appear in `options`; a
  // search reorders rows within a group, never the groups themselves.
  const { flat, sections } = useMemo(() => {
    const ranked = searchable ? rankOptions(options, search) : options;
    if (!ranked.some((o) => o.group)) {
      return { flat: ranked, sections: null };
    }
    const order: string[] = [];
    for (const o of options) {
      const g = o.group ?? "";
      if (!order.includes(g)) order.push(g);
    }
    const byGroup = new Map<string, SelectOption[]>(order.map((g) => [g, []]));
    for (const o of ranked) byGroup.get(o.group ?? "")!.push(o);
    const secs = order
      .map((group) => ({ group, items: byGroup.get(group)! }))
      .filter((s) => s.items.length > 0);
    return { flat: secs.flatMap((s) => s.items), sections: secs };
  }, [options, search, searchable]);

  const openList = (seed = "") => {
    if (disabled) return;
    setSearch(seed);
    setOpen(true);
  };

  const closeList = useCallback((refocus: boolean) => {
    setOpen(false);
    setSearch("");
    setPanelStyle(HIDDEN);
    if (refocus) triggerRef.current?.focus();
  }, []);

  const pick = (v: string) => {
    onChange(v);
    closeList(true);
  };

  // Highlight: the current value on open, the best match while searching.
  useEffect(() => {
    if (!open) return;
    const sel = flat.findIndex((o) => o.value === value);
    setActive(search.trim() ? 0 : Math.max(sel, 0));
    // Only on open and on a new query — not on every options/value change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, search]);

  const place = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const r = trigger.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const below = vh - r.bottom - GAP - EDGE;
    const above = r.top - GAP - EDGE;
    const up = below < FLIP_BELOW && above > below;
    const minWidth = Math.min(
      Math.max(r.width, dropdownMinWidth ?? DEFAULT_MIN_WIDTH),
      vw - 2 * EDGE,
    );
    const left = Math.max(EDGE, Math.min(r.left, vw - EDGE - minWidth));
    setPanelStyle({
      position: "fixed",
      left,
      minWidth,
      maxWidth: Math.max(minWidth, Math.min(MAX_WIDTH, vw - left - EDGE)),
      maxHeight: Math.max(up ? above : below, 120),
      ...(up ? { bottom: vh - r.top + GAP } : { top: r.bottom + GAP }),
    });
  }, [dropdownMinWidth]);

  // Place before paint, then chase the trigger on any ancestor scroll (capture
  // catches a scrolling Modal body) and on resize. The list's own scroll is
  // ignored — it moves nothing.
  useIsoLayoutEffect(() => {
    if (!open) return;
    place();
    const onScroll = (e: Event) => {
      if (panelRef.current?.contains(e.target as Node)) return;
      place();
    };
    const onResize = () => place();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, place]);

  // Outside mousedown closes — checked against BOTH the trigger and the
  // portaled panel, since they live in different DOM branches.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      closeList(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, closeList]);

  // Focus the search box on open, caret after any seeded key.
  useEffect(() => {
    if (!open || !searchable) return;
    const raf = requestAnimationFrame(() => {
      const input = searchRef.current;
      if (!input) return;
      input.focus({ preventScroll: true });
      const end = input.value.length;
      input.setSelectionRange(end, end);
    });
    return () => cancelAnimationFrame(raf);
  }, [open, searchable]);

  // A Select disabled while open closes.
  useEffect(() => {
    if (disabled && open) closeList(false);
  }, [disabled, open, closeList]);

  // Keep the highlighted row in view. scrollTop, not scrollIntoView: the
  // latter may scroll the page as well as the list.
  useIsoLayoutEffect(() => {
    if (!open) return;
    const list = listRef.current;
    const row = list?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    if (!list || !row) return;
    if (row.offsetTop < list.scrollTop) {
      list.scrollTop = row.offsetTop;
    } else if (
      row.offsetTop + row.offsetHeight >
      list.scrollTop + list.clientHeight
    ) {
      list.scrollTop = row.offsetTop + row.offsetHeight - list.clientHeight;
    }
  }, [open, active, panelStyle]);

  const move = (to: number) => {
    if (flat.length === 0) return;
    setActive(Math.max(0, Math.min(flat.length - 1, to)));
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;

    if (!open) {
      if (e.target !== triggerRef.current) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        openList();
      } else if (searchable && isPrintable(e) && e.key !== " ") {
        e.preventDefault();
        openList(e.key);
      }
      return;
    }

    const inPanel = !!panelRef.current?.contains(e.target as Node);
    const current = Math.min(active, flat.length - 1);

    switch (e.key) {
      case "Escape":
        e.preventDefault();
        e.stopPropagation();
        closeList(true);
        return;
      case "Tab":
        // Focus back on the trigger first, so the Tab moves on from there
        // rather than from the end of the document where the panel lives.
        closeList(inPanel);
        return;
      case "ArrowDown":
        e.preventDefault();
        move(current + 1);
        return;
      case "ArrowUp":
        e.preventDefault();
        move(current - 1);
        return;
      case "Home":
        e.preventDefault();
        move(0);
        return;
      case "End":
        e.preventDefault();
        move(flat.length - 1);
        return;
      case "PageDown":
        e.preventDefault();
        move(current + 10);
        return;
      case "PageUp":
        e.preventDefault();
        move(current - 10);
        return;
      case "Enter":
        e.preventDefault();
        if (flat[current]) pick(flat[current].value);
        return;
    }

    if (searchable) return;

    if (e.key === " ") {
      e.preventDefault();
      if (flat[current]) pick(flat[current].value);
      return;
    }

    if (isPrintable(e)) {
      const now = Date.now();
      const t = typeahead.current;
      t.text = now - t.at > TYPEAHEAD_MS ? e.key : t.text + e.key;
      t.at = now;
      const needle = t.text.toLowerCase();
      const hit = flat.findIndex((o) =>
        o.label.trimStart().toLowerCase().startsWith(needle),
      );
      if (hit !== -1) setActive(hit);
    }
  };

  const renderOption = (option: SelectOption, index: number) => {
    const isSelected = option.value === value;
    return (
      <div
        key={option.value}
        id={optionId(index)}
        role="option"
        aria-selected={isSelected}
        data-index={index}
        data-selected={isSelected || undefined}
        data-active={index === active || undefined}
        className="ui-select-row"
        // Keep focus where it is (the search box or the trigger).
        onMouseDown={(e) => e.preventDefault()}
        onMouseMove={() => {
          if (index !== active) setActive(index);
        }}
        onClick={() => pick(option.value)}
      >
        <svg
          className="ui-select-check"
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M20 6 9 17l-5-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {option.leading != null && (
          <span className="ui-select-leading" aria-hidden="true">
            {option.leading}
          </span>
        )}
        {option.imageUrl !== undefined && (
          <span className="ui-select-thumb" aria-hidden="true">
            {option.imageUrl ? (
              <img src={option.imageUrl} alt="" />
            ) : (
              <svg viewBox="0 0 24 24" focusable="false">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            )}
          </span>
        )}
        <span className="ui-select-row-text">
          <span
            className="ui-select-row-label"
            data-preserve={preserveWhitespace || undefined}
          >
            {option.label}
          </span>
          {option.sublabel && (
            <span className="ui-select-row-sublabel">{option.sublabel}</span>
          )}
        </span>
      </div>
    );
  };

  const activeId =
    open && flat.length > 0 ? optionId(Math.min(active, flat.length - 1)) : undefined;

  const panel = open ? (
    <div ref={panelRef} className="ui-select-panel" style={panelStyle}>
      {searchable && (
        <div className="ui-select-searchwrap">
          <input
            ref={searchRef}
            type="text"
            className="ui-select-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={activeId}
            aria-label="Filter options"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      )}
      <div
        ref={listRef}
        id={listId}
        role="listbox"
        aria-label={ariaLabel ?? placeholder}
        className="ui-select-list"
      >
        {flat.length === 0 ? (
          <div className="ui-select-empty">
            {searchable && search.trim() ? "No Matches" : "No Options"}
          </div>
        ) : sections ? (
          (() => {
            let i = 0;
            return sections.map(({ group, items }) => (
              <div key={group} role="group" aria-label={group || undefined}>
                {group && (
                  <div className="ui-select-group" aria-hidden="true">
                    {group}
                  </div>
                )}
                {items.map((o) => renderOption(o, i++))}
              </div>
            ));
          })()
        ) : (
          flat.map(renderOption)
        )}
      </div>
    </div>
  ) : null;

  return (
    // The wrapper hears keys from the trigger AND the portaled panel (React
    // bubbles portal events through the component tree), so one handler.
    <div
      ref={rootRef}
      className={className ? `ui-select ${className}` : "ui-select"}
      onKeyDown={onKeyDown}
    >
      <button
        ref={triggerRef}
        type="button"
        id={id}
        className="ui-select-trigger"
        data-size={size}
        data-placeholder={selected ? undefined : true}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={!searchable ? activeId : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (open ? closeList(false) : openList())}
      >
        <span
          className="ui-select-trigger-label"
          data-preserve={preserveWhitespace || undefined}
        >
          {selected ? selected.label : placeholder}
        </span>
        <svg
          className="ui-select-chevron"
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="m6 9 6 6 6-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {typeof window !== "undefined" && createPortal(panel, document.body)}
    </div>
  );
}
