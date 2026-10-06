"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";
import { createPortal } from "react-dom";
import { scaleRootProps, useScale } from "../Scale/Scale";
import "../Select/Select.css";
import "./MultiSelect.css";
import { chipSummary, makePrimary, rankByQuery, spokenValue, toggleValue } from "./logic";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * MultiSelect — THE house pick-several dropdown. The Select's sibling: the same
 * field shape, the same portaled panel, the same rows and check mark, the same
 * search ranking. What differs is that a pick toggles and the list stays open.
 *
 * WHEN TO USE IT. A form field that holds a SET (the places someone works, the
 * teams they belong to). Not for filtering a list on screen — that is
 * FilterPills, which shows every choice at once. A dropdown earns its place
 * when the set of choices is too long to lay out as pills inside a form.
 *
 * PRIMARY STAR (`withPrimary`). Some sets have one member that counts most —
 * the main one of several. The star marks it; the rules live in ./logic: the
 * primary is always one of the selected values, the first pick becomes it, and
 * removing it hands it on. onChange always reports the settled primary, so a
 * caller storing "the list" and "the main one" can never store them apart.
 *
 * THE CLOSED FIELD shows chips — the primary first, then the rest up to
 * `maxChips` — and "+N" for what does not fit. It never grows taller than the
 * single Select: a form of mixed fields keeps one row height.
 *
 * KEYBOARD. On the field: Down/Up, Enter or Space open; typing opens with the
 * search holding that key. In the list: Up/Down/Home/End/PageUp/PageDown move,
 * Enter toggles the highlighted row, Space toggles it while the search box is
 * empty (otherwise it types a space), Shift+Enter stars it, Escape closes the
 * list only, Tab closes and moves on.
 *
 * SCREEN READERS. A listbox marked multi-selectable; each row is an option
 * whose aria-selected tells the truth and whose name says "primary" when it is.
 * The field's name carries the chosen values in words, since chips and a "+N"
 * are pictures. The search box is 16px everywhere so iOS does not zoom on it.
 */

export interface MultiSelectOption {
  value: string;
  /** Title Case, per house rule. */
  label: string;
  /** Section header the option renders under. */
  group?: string;
  /** A dimmer second line. Searched. */
  sublabel?: string;
  /** Extra text the search matches but the list never shows. */
  searchText?: string;
  /** Drawn before the label — a swatch, an icon. */
  leading?: ReactNode;
}

export type MultiSelectSize = "sm" | "md";

export interface MultiSelectProps {
  options: MultiSelectOption[];
  /** The selected values, in the order they were picked. */
  value: string[];
  /** The next selection, and the settled primary (null without `withPrimary`). */
  onChange: (value: string[], primary: string | null) => void;
  /** Turns on the star. The caller holds the primary; the kit keeps it valid. */
  withPrimary?: boolean;
  primary?: string | null;
  /** What the closed field says when nothing is chosen. */
  placeholder?: string;
  disabled?: boolean;
  /** On the outer wrapper — layout only. */
  className?: string;
  /** On the trigger, so a <label htmlFor> points at the control. */
  id?: string;
  /** Names the field when there is no visible label. */
  ariaLabel?: string;
  size?: MultiSelectSize;
  searchPlaceholder?: string;
  /** Chips drawn in the closed field before "+N". Default 2. */
  maxChips?: number;
  /** The panel is at least this wide (px), never narrower than the field. */
  dropdownMinWidth?: number;
}

const GAP = 4;
const EDGE = 8;
const FLIP_BELOW = 280;
const DEFAULT_MIN_WIDTH = 200;
const MAX_WIDTH = 480;

const HIDDEN: CSSProperties = { position: "fixed", top: 0, left: 0, visibility: "hidden" };

function isPrintable(e: ReactKeyboardEvent): boolean {
  return e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
}

function Star({ filled }: { filled: boolean }) {
  return (
    <svg className="ui-multiselect-star-glyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MultiSelect({
  options,
  value,
  onChange,
  withPrimary = false,
  primary = null,
  placeholder = "Select...",
  disabled = false,
  className,
  id,
  ariaLabel,
  size = "md",
  searchPlaceholder = "Search...",
  maxChips = 2,
  dropdownMinWidth,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState(0);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>(HIDDEN);
  const scale = useScale();
  const spaceScale = scale ? scale.space : 1;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const baseId = useId();
  const listId = `${baseId}-list`;
  const hintId = `${baseId}-hint`;
  const optionId = (i: number) => `${baseId}-opt-${i}`;

  const star = withPrimary ? primary : null;
  const byValue = useMemo(() => new Map(options.map((o) => [o.value, o])), [options]);
  // The chosen options in pick order; a value no option carries is skipped.
  const selected = useMemo(
    () => value.map((v) => byValue.get(v)).filter((o): o is MultiSelectOption => !!o),
    [value, byValue],
  );
  const chips = chipSummary(selected, star, maxChips);
  const spoken = spokenValue(selected, star, placeholder);

  // Display order (grouped), so the keyboard index and the picture agree.
  const { flat, sections } = useMemo(() => {
    const ranked = rankByQuery(options, search);
    if (!ranked.some((o) => o.group)) return { flat: ranked, sections: null };
    const order: string[] = [];
    for (const o of options) {
      const g = o.group ?? "";
      if (!order.includes(g)) order.push(g);
    }
    const byGroup = new Map<string, MultiSelectOption[]>(order.map((g) => [g, []]));
    for (const o of ranked) byGroup.get(o.group ?? "")!.push(o);
    const secs = order.map((group) => ({ group, items: byGroup.get(group)! })).filter((s) => s.items.length > 0);
    return { flat: secs.flatMap((s) => s.items), sections: secs };
  }, [options, search]);

  const emit = (next: { values: string[]; primary: string | null }) =>
    onChange(next.values, withPrimary ? next.primary : null);

  const toggle = (v: string) => emit(toggleValue({ values: value, primary: star }, v));
  const starIt = (v: string) => {
    if (withPrimary) emit(makePrimary({ values: value, primary: star }, v));
  };

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

  useEffect(() => {
    if (!open) return;
    setActive(0);
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
    const k = spaceScale;
    const minWidth = Math.min(Math.max(r.width, (dropdownMinWidth ?? DEFAULT_MIN_WIDTH) * k), vw - 2 * EDGE);
    const left = Math.max(EDGE, Math.min(r.left, vw - EDGE - minWidth));
    setPanelStyle({
      position: "fixed",
      left,
      minWidth,
      maxWidth: Math.max(minWidth, Math.min(MAX_WIDTH * k, vw - left - EDGE)),
      maxHeight: Math.max(up ? above : below, 160),
      ...(up ? { bottom: vh - r.top + GAP } : { top: r.bottom + GAP }),
    });
  }, [dropdownMinWidth, spaceScale]);

  // Place before paint, then chase the field on any ancestor scroll and on
  // resize. The trigger can change height-free width as chips change, so a
  // selection change re-places too.
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
  }, [open, place, value.length]);

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

  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => {
      const input = searchRef.current;
      if (!input) return;
      input.focus({ preventScroll: true });
      const end = input.value.length;
      input.setSelectionRange(end, end);
    });
    return () => cancelAnimationFrame(raf);
  }, [open]);

  useEffect(() => {
    if (disabled && open) closeList(false);
  }, [disabled, open, closeList]);

  useIsoLayoutEffect(() => {
    if (!open) return;
    const list = listRef.current;
    const row = list?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    if (!list || !row) return;
    if (row.offsetTop < list.scrollTop) list.scrollTop = row.offsetTop;
    else if (row.offsetTop + row.offsetHeight > list.scrollTop + list.clientHeight)
      list.scrollTop = row.offsetTop + row.offsetHeight - list.clientHeight;
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
      } else if (isPrintable(e) && e.key !== " ") {
        e.preventDefault();
        openList(e.key);
      }
      return;
    }

    const inPanel = !!panelRef.current?.contains(e.target as Node);
    const current = Math.min(active, flat.length - 1);
    const row = flat[current];

    switch (e.key) {
      case "Escape":
        e.preventDefault();
        e.stopPropagation();
        closeList(true);
        return;
      case "Tab":
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
        if (!row) return;
        if (e.shiftKey) starIt(row.value);
        else toggle(row.value);
        return;
      case " ":
        // A space is a toggle until the person has started typing a search.
        if (search === "" && row) {
          e.preventDefault();
          toggle(row.value);
        }
        return;
    }
  };

  const renderOption = (option: MultiSelectOption, index: number) => {
    const isSelected = value.includes(option.value);
    const isPrimary = star === option.value;
    return (
      <div
        key={option.value}
        id={optionId(index)}
        role="option"
        aria-selected={isSelected}
        aria-label={isPrimary ? `${option.label} (primary)` : undefined}
        data-index={index}
        data-selected={isSelected || undefined}
        data-active={index === active || undefined}
        className="ui-select-row ui-multiselect-row"
        onMouseDown={(e) => e.preventDefault()}
        onMouseMove={() => {
          if (index !== active) setActive(index);
        }}
        onClick={() => toggle(option.value)}
      >
        <svg className="ui-select-check" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M20 6 9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {option.leading != null && (
          <span className="ui-select-leading" aria-hidden="true">
            {option.leading}
          </span>
        )}
        <span className="ui-select-row-text ui-multiselect-row-text">
          <span className="ui-select-row-label">{option.label}</span>
          {option.sublabel && <span className="ui-select-row-sublabel">{option.sublabel}</span>}
        </span>
        {withPrimary && (
          // The star is a mouse shortcut; the keyboard has Shift+Enter, so it
          // stays out of the Tab order and the row's own name says "primary".
          <button
            type="button"
            tabIndex={-1}
            className="ui-multiselect-star"
            data-on={isPrimary || undefined}
            aria-hidden="true"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.stopPropagation();
              starIt(option.value);
            }}
          >
            <Star filled={isPrimary} />
          </button>
        )}
      </div>
    );
  };

  const activeId = open && flat.length > 0 ? optionId(Math.min(active, flat.length - 1)) : undefined;

  const panel = open ? (
    <div ref={panelRef} className="ui-select-panel" {...scaleRootProps(scale, panelStyle)}>
      <div className="ui-select-searchwrap">
        <input
          ref={searchRef}
          type="text"
          className="ui-select-search ui-multiselect-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholder}
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeId}
          aria-describedby={hintId}
          aria-label="Filter options"
          autoComplete="off"
          spellCheck={false}
        />
      </div>
      <span id={hintId} className="ui-multiselect-sr">
        {withPrimary
          ? "Enter selects or clears an option. Shift and Enter makes it the primary."
          : "Enter selects or clears an option."}
      </span>
      <div
        ref={listRef}
        id={listId}
        role="listbox"
        aria-multiselectable="true"
        aria-label={ariaLabel ?? placeholder}
        className="ui-select-list"
      >
        {flat.length === 0 ? (
          <div className="ui-select-empty">{search.trim() ? "No Matches" : "No Options"}</div>
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
      {value.length > 0 && (
        <div className="ui-multiselect-foot">
          <span>{value.length} selected</span>
          <button
            type="button"
            className="ui-multiselect-clear"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onChange([], null)}
          >
            Clear
          </button>
        </div>
      )}
    </div>
  ) : null;

  return (
    <div ref={rootRef} className={className ? `ui-select ${className}` : "ui-select"} onKeyDown={onKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        className="ui-select-trigger"
        data-size={size}
        data-placeholder={selected.length === 0 || undefined}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel ? `${ariaLabel}: ${spoken}` : undefined}
        disabled={disabled}
        onClick={() => (open ? closeList(false) : openList())}
      >
        <span className="ui-select-trigger-value ui-multiselect-value">
          {selected.length === 0 ? (
            <span className="ui-select-trigger-label">{placeholder}</span>
          ) : (
            <>
              {chips.shown.map((o) => (
                <span key={o.value} className="ui-multiselect-chip" data-size={size} data-primary={o.value === star || undefined}>
                  {o.value === star && <Star filled />}
                  <span className="ui-multiselect-chip-label">{o.label}</span>
                </span>
              ))}
              {chips.more > 0 && (
                <span className="ui-multiselect-more" data-size={size}>
                  +{chips.more}
                </span>
              )}
            </>
          )}
        </span>
        <svg className="ui-select-chevron" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {typeof window !== "undefined" && createPortal(panel, document.body)}
    </div>
  );
}
