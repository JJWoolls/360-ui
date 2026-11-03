"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Button } from "../Button/Button";
import { Modal } from "../Modal/Modal";
import "./DatePicker.css";

/**
 * DatePicker + DateField — ported from the LMS (lab-portal).
 *
 * WHAT WAS PORTED FROM WHERE — the LMS has two calendar grids:
 *
 *   1. components/date-time-picker.tsx — the general-purpose picker, but its
 *      shell is an inline portal DROPDOWN, which the Workspace bans (Josh:
 *      modal pickers, never inline dropdowns).
 *   2. components/DeptDashboard/MiniCalendar.tsx — the grid the LMS's own
 *      MODAL picker (AppointmentPickerModal.tsx, Josh's ratified pattern)
 *      embeds. Since this primitive is a modal picker, THAT grid is the basis.
 *
 * The day-cell hover comes from date-time-picker.tsx:353 because MiniCalendar
 * defines none — it is the only day-cell hover value the LMS has.
 *
 * The preset row is the confirmed house picker's: Today / Tomorrow / 1 Week /
 * 2 Weeks, rendered with the house Button per the one-tint-recipe rule.
 *
 * The field pattern (grayed "Not Set" -> brand when set) is Josh's standing
 * field rule; the optional `warnPast` danger state ports the "overdue" tone
 * from components/follow-up-quick-set.tsx (classify() -> bold red). It is
 * opt-in because the LMS's general-purpose date field does NOT color past
 * dates — only follow-up-style fields do.
 *
 * BOUNDS. `min`/`max` ("YYYY-MM-DD", inclusive) are the general form of
 * disablePast/disableFuture: a date outside them cannot be clicked, reached by
 * arrow key, or set by a quick-set button, and month navigation stops at the
 * bounding month. Both kinds of limit apply together; the tighter one wins.
 * ISO strings compare correctly as plain strings, so no Date math is needed.
 *
 * ONE MONTH OR TWO (Josh 2026-11-03, the house picker ruling). The window
 * opens on one month, except in the last 7 days of a month, when it opens on
 * this month and next side by side so a date a few days out never needs a
 * page turn. The head's two-calendar toggle shows or hides the second month
 * at any time. With one month, the next month's days that fill the last row
 * are pickable (muted); with two, the panels carry no spill-over days.
 *
 * Value contract: ISO date string "YYYY-MM-DD" or null. No Date objects at
 * the boundary — same contract as the LMS pickers.
 */

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/** The quick-set row of the confirmed house picker (2026-11-03). */
const PRESETS: { label: string; days: number }[] = [
  { label: "Today", days: 0 },
  { label: "Tomorrow", days: 1 },
  { label: "1 Week", days: 7 },
  { label: "2 Weeks", days: 14 },
];

/** In the last N days of a month the picker opens on two months. */
const TWO_MONTH_WINDOW = 7;

const pad2 = (n: number) => String(n).padStart(2, "0");
const toIso = (y: number, m: number, d: number) => `${y}-${pad2(m + 1)}-${pad2(d)}`;

function fromIso(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m: m - 1, d };
}

function todayIso(): string {
  const t = new Date();
  return toIso(t.getFullYear(), t.getMonth(), t.getDate());
}

function shiftDays(iso: string, delta: number): string {
  const { y, m, d } = fromIso(iso);
  const dt = new Date(y, m, d + delta);
  return toIso(dt.getFullYear(), dt.getMonth(), dt.getDate());
}

/** Is `iso` in the last TWO_MONTH_WINDOW days of its month? */
export function inMonthEndWindow(iso: string): boolean {
  const { y, m, d } = fromIso(iso);
  const dim = new Date(y, m + 1, 0).getDate();
  return d > dim - TWO_MONTH_WINDOW;
}

type YM = { y: number; m: number };
const nextYM = (v: YM): YM => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 });
const prevYM = (v: YM): YM => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 });
const ymKey = (v: YM) => v.y * 12 + v.m;
const monthOf = (iso: string): YM => { const b = fromIso(iso); return { y: b.y, m: b.m }; };

/** Display format ported from date-time-picker.tsx:270 — "Jul 17, 2026". */
function formatDisplay(iso: string): string {
  const { y, m, d } = fromIso(iso);
  return new Date(y, m, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface Cell {
  /** null = a blank slot (two-month view: no spill-over days). */
  iso: string | null;
  day: number;
  current: boolean;
}

/**
 * One month panel. Single month: the previous month's days lead in and the
 * next month's days fill ONLY the last row, all pickable. Two months: those
 * slots are blank, since the neighbouring panel already shows those days.
 */
export function buildCells(year: number, month: number, blankAdjacent = false): Cell[] {
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const pm = month === 0 ? 11 : month - 1;
  const py = month === 0 ? year - 1 : year;
  const nm = month === 11 ? 0 : month + 1;
  const ny = month === 11 ? year + 1 : year;
  const cells: Cell[] = [];
  for (let i = firstDow - 1; i >= 0; i--) {
    cells.push(blankAdjacent
      ? { iso: null, day: 0, current: false }
      : { iso: toIso(py, pm, daysInPrev - i), day: daysInPrev - i, current: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ iso: toIso(year, month, d), day: d, current: true });
  }
  const remaining = (7 - (cells.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    cells.push(blankAdjacent
      ? { iso: null, day: 0, current: false }
      : { iso: toIso(ny, nm, d), day: d, current: false });
  }
  return cells;
}

/**
 * Which month the window opens on. Two months at month end open on THIS
 * month when the value is unset or within this month or next, so today and
 * the next few days sit side by side; otherwise the value's month, else today's.
 */
export function openingView(value: string | null, today: string, two: boolean, auto: boolean): YM {
  const base = monthOf(value ?? today);
  if (!(two && auto)) return base;
  const t = monthOf(today);
  const gap = ymKey(base) - ymKey(t);
  return gap === 0 || gap === 1 ? t : base;
}

/* Inert glyphs (Modal/Button expect currentColor <svg>; no icon lib here). */
const CalendarGlyph = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);
const TwoMonthsGlyph = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <rect x="1.5" y="5" width="10" height="15" rx="1.5" />
    <rect x="12.5" y="5" width="10" height="15" rx="1.5" />
    <path d="M1.5 9.5h10M12.5 9.5h10M4.5 3v3M8.5 3v3M15.5 3v3M19.5 3v3" />
  </svg>
);
const ChevronLeftGlyph = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d="m15 18-6-6 6-6" />
  </svg>
);
const ChevronRightGlyph = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d="m9 18 6-6-6-6" />
  </svg>
);
const XGlyph = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" focusable="false">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

export type DatePickerMonths = "auto" | "one" | "two";

export interface DatePickerProps {
  open: boolean;
  onClose: () => void;
  /** ISO date "YYYY-MM-DD", or null when unset. */
  value: string | null;
  onChange: (value: string | null) => void;
  /** Modal title. */
  title?: string;
  /** Quick-set row (Today / Tomorrow / 1 Week / 2 Weeks). On by default. */
  presets?: boolean;
  disablePast?: boolean;
  disableFuture?: boolean;
  /** Earliest selectable date, "YYYY-MM-DD", inclusive. */
  min?: string;
  /** Latest selectable date, "YYYY-MM-DD", inclusive. */
  max?: string;
  /**
   * "auto" (default): two months in the last 7 days of a month, else one.
   * "one" / "two" fix the opening view. The head toggle works in every mode.
   */
  months?: DatePickerMonths;
}

/** Clamp an ISO date into [min, max]; either bound may be absent. */
function clampIso(iso: string, min?: string, max?: string): string {
  if (min && iso < min) return min;
  if (max && iso > max) return max;
  return iso;
}

export function DatePicker({
  open,
  onClose,
  value,
  onChange,
  title = "Select Date",
  presets = true,
  disablePast = false,
  disableFuture = false,
  min,
  max,
  months = "auto",
}: DatePickerProps) {
  const today = todayIso();
  // Open on the value, else today — pulled inside the bounds so a picker
  // limited to last year does not open on an all-disabled month.
  const startIso = () => value ?? clampIso(todayIso(), min, max);
  const openTwo = () => (months === "auto" ? inMonthEndWindow(todayIso()) : months === "two");
  const startView = (two: boolean) =>
    openingView(value, clampIso(todayIso(), min, max), two, months === "auto");

  const [two, setTwo] = useState(openTwo);
  const [view, setView] = useState<YM>(() => startView(openTwo()));
  // Roving keyboard focus, as an ISO date. Arrows move it; Enter selects it.
  const [focusIso, setFocusIso] = useState<string>(startIso);
  const gridRef = useRef<HTMLDivElement>(null);
  const focusPending = useRef(false);

  // Re-sync to the value (or today) every time the picker opens.
  useEffect(() => {
    if (!open) return;
    const t = openTwo();
    setTwo(t);
    setView(startView(t));
    setFocusIso(startIso());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reads only value/min/max/months
  }, [open, value, min, max, months]);

  // After an arrow move, put real DOM focus on the newly focused day.
  useEffect(() => {
    if (!open || !focusPending.current) return;
    focusPending.current = false;
    gridRef.current
      ?.querySelector<HTMLButtonElement>(`[data-iso="${focusIso}"]`)
      ?.focus();
  }, [open, focusIso, view, two]);

  const isDisabled = (iso: string) =>
    (disablePast && iso < today) ||
    (disableFuture && iso > today) ||
    (min != null && iso < min) ||
    (max != null && iso > max);

  const pick = (iso: string) => {
    onChange(iso);
    onClose();
  };

  const panels: YM[] = two ? [view, nextYM(view)] : [view];
  const lastView = panels[panels.length - 1];
  const panelCells = panels.map(p => buildCells(p.y, p.m, two));
  const visible = new Set<string>();
  panelCells.forEach(cs => cs.forEach(c => { if (c.iso) visible.add(c.iso); }));

  // Ported nav clamping from MiniCalendar.tsx:50-51.
  // A bound stops navigation at the month that contains it.
  const prevDisabled =
    (disablePast && ymKey(view) <= ymKey(monthOf(today))) ||
    (min != null && ymKey(view) <= ymKey(monthOf(min)));
  const nextDisabled =
    (disableFuture && ymKey(lastView) >= ymKey(monthOf(today))) ||
    (max != null && ymKey(lastView) >= ymKey(monthOf(max)));

  const onGridKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const delta =
      e.key === "ArrowLeft" ? -1 :
      e.key === "ArrowRight" ? 1 :
      e.key === "ArrowUp" ? -7 :
      e.key === "ArrowDown" ? 7 : 0;
    if (delta === 0) return; // Enter/Space select natively; Escape is Modal's.
    if (!(e.target instanceof HTMLElement) || !e.target.classList.contains("ui-datepicker-day")) return;
    e.preventDefault();
    const next = shiftDays(focusIso, delta);
    if (isDisabled(next)) return; // clamp at a disabled boundary
    // Page only when the day is not already on screen.
    if (!visible.has(next)) {
      const f = monthOf(next);
      setView(ymKey(f) < ymKey(view) ? f : two ? prevYM(f) : f);
    }
    setFocusIso(next);
    focusPending.current = true;
  };

  const focusTarget = visible.has(focusIso) ? focusIso : toIso(view.y, view.m, 1);

  const visiblePresets = PRESETS.filter(
    p => !(disableFuture && p.days > 0) && !(disablePast && p.days < 0) &&
      !isDisabled(shiftDays(today, p.days)),
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      icon={CalendarGlyph}
      width={two ? 560 : undefined}
      headActions={
        <button
          type="button"
          aria-pressed={two}
          aria-label="Show two months"
          onClick={() => setTwo(t => !t)}
        >
          {TwoMonthsGlyph}
        </button>
      }
      footer={
        value != null ? (
          <Button variant="danger" size="sm" onClick={() => { onChange(null); onClose(); }}>
            Clear
          </Button>
        ) : undefined
      }
    >
      {presets && (
        <div className="ui-datepicker-presets">
          {visiblePresets.map(p => (
            <Button key={p.label} variant="secondary" size="sm" onClick={() => pick(shiftDays(today, p.days))}>
              {p.label}
            </Button>
          ))}
        </div>
      )}

      <div className="ui-datepicker-cals" ref={gridRef} onKeyDown={onGridKeyDown}>
        {panels.map((p, i) => (
          <div className="ui-datepicker-cal" key={`${p.y}-${p.m}`}>
            <div className="ui-datepicker-head">
              {i === 0 ? (
                <button
                  type="button"
                  className="ui-datepicker-nav"
                  aria-label="Previous Month"
                  onClick={() => setView(prevYM)}
                  disabled={prevDisabled}
                >
                  {ChevronLeftGlyph}
                </button>
              ) : (
                <span className="ui-datepicker-nav-spacer" aria-hidden="true" />
              )}
              <span className="ui-datepicker-month">
                {MONTHS[p.m]} {p.y}
              </span>
              {i === panels.length - 1 ? (
                <button
                  type="button"
                  className="ui-datepicker-nav"
                  aria-label="Next Month"
                  onClick={() => setView(nextYM)}
                  disabled={nextDisabled}
                >
                  {ChevronRightGlyph}
                </button>
              ) : (
                <span className="ui-datepicker-nav-spacer" aria-hidden="true" />
              )}
            </div>

            <div className="ui-datepicker-grid">
              {DAYS.map(d => (
                <span key={d} className="ui-datepicker-dow" aria-hidden="true">
                  {d}
                </span>
              ))}
              {panelCells[i].map((c, k) => {
                if (c.iso == null) return <span key={`blank-${k}`} aria-hidden="true" />;
                const iso = c.iso;
                const { y, m, d } = fromIso(iso);
                return (
                  <button
                    key={iso}
                    type="button"
                    className="ui-datepicker-day"
                    data-iso={iso}
                    data-adjacent={c.current ? undefined : true}
                    data-today={iso === today || undefined}
                    data-selected={iso === value || undefined}
                    aria-label={`${MONTHS[m]} ${d}, ${y}`}
                    aria-current={iso === today ? "date" : undefined}
                    tabIndex={iso === focusTarget ? 0 : -1}
                    disabled={isDisabled(iso)}
                    onClick={() => pick(iso)}
                  >
                    {c.day}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

export interface DateFieldProps {
  /** ISO date "YYYY-MM-DD", or null when unset. */
  value: string | null;
  onChange: (value: string | null) => void;
  /** Shown grayed while unset. */
  placeholder?: string;
  disabled?: boolean;
  /**
   * Danger tone when the set date is in the past — the "overdue" state from
   * follow-up-quick-set.tsx. Opt-in: the LMS's general date field doesn't do
   * this, only follow-up-style fields do.
   */
  warnPast?: boolean;
  /** Passed through to the picker modal. */
  pickerTitle?: string;
  presets?: boolean;
  disablePast?: boolean;
  disableFuture?: boolean;
  /** Earliest selectable date, "YYYY-MM-DD", inclusive. Passed to the picker. */
  min?: string;
  /** Latest selectable date, "YYYY-MM-DD", inclusive. Passed to the picker. */
  max?: string;
  /** Passed to the picker: one month, two, or "auto" (default). */
  months?: DatePickerMonths;
  /** id on the trigger button, so a FieldLabel htmlFor can point at it. */
  id?: string;
  /** Names the trigger when no FieldLabel points at it. */
  ariaLabel?: string;
  /** Opens the picker as soon as the field mounts (a grid cell editor). */
  defaultOpen?: boolean;
  /** Called after the picker closes, picked or not (a grid cell editor ends). */
  onClose?: () => void;
}

export function DateField({
  value,
  onChange,
  placeholder = "Not Set",
  disabled = false,
  warnPast = false,
  pickerTitle,
  presets,
  disablePast,
  disableFuture,
  min,
  max,
  months,
  id,
  ariaLabel,
  defaultOpen = false,
  onClose,
}: DateFieldProps) {
  const [open, setOpen] = useState(defaultOpen);
  const state: "empty" | "set" | "past" =
    value == null ? "empty" : warnPast && value < todayIso() ? "past" : "set";

  return (
    <>
      <button
        type="button"
        id={id}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        className="ui-datefield"
        data-state={state}
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        <span className="ui-datefield-icon" aria-hidden="true">
          {CalendarGlyph}
        </span>
        <span className="ui-datefield-text">
          {value != null ? formatDisplay(value) : placeholder}
        </span>
        {value != null && !disabled && (
          /* Inline clear, ported from the LMS trigger (date-time-picker.tsx:
             288-295 — a span, not a nested button; keyboard users clear via
             the modal's Clear button). */
          <span
            className="ui-datefield-x"
            role="button"
            aria-label="Clear Date"
            onClick={e => {
              e.stopPropagation();
              onChange(null);
            }}
          >
            {XGlyph}
          </span>
        )}
      </button>
      <DatePicker
        open={open}
        onClose={() => {
          setOpen(false);
          onClose?.();
        }}
        value={value}
        onChange={onChange}
        title={pickerTitle}
        presets={presets}
        disablePast={disablePast}
        disableFuture={disableFuture}
        min={min}
        max={max}
        months={months}
      />
    </>
  );
}
