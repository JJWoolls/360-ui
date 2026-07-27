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
 * The preset row is ported from the follow-up picker popover shared by
 * cs-dash/jb-dash (app/cs-dash/page.tsx:986): Today / Tomorrow / 3 Days /
 * 1 Week / 2 Weeks, rendered with the house Button per the one-tint-recipe
 * rule rather than the popover's inline styles.
 *
 * The field pattern (grayed "Not Set" -> brand when set) is Josh's standing
 * field rule; the optional `warnPast` danger state ports the "overdue" tone
 * from components/follow-up-quick-set.tsx (classify() -> bold red). It is
 * opt-in because the LMS's general-purpose date field does NOT color past
 * dates — only follow-up-style fields do.
 *
 * Value contract: ISO date string "YYYY-MM-DD" or null. No Date objects at
 * the boundary — same contract as the LMS pickers.
 */

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/** Presets ported verbatim from cs-dash/jb-dash "Set follow-up" popover. */
const PRESETS: { label: string; days: number }[] = [
  { label: "Today", days: 0 },
  { label: "Tomorrow", days: 1 },
  { label: "3 Days", days: 3 },
  { label: "1 Week", days: 7 },
  { label: "2 Weeks", days: 14 },
];

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
  iso: string;
  day: number;
  current: boolean;
}

/** 42-cell month grid — ported logic from MiniCalendar / date-time-picker. */
function buildCells(year: number, month: number): Cell[] {
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const cells: Cell[] = [];
  for (let i = firstDow - 1; i >= 0; i--) {
    const pm = month === 0 ? 11 : month - 1;
    const py = month === 0 ? year - 1 : year;
    cells.push({ iso: toIso(py, pm, daysInPrev - i), day: daysInPrev - i, current: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ iso: toIso(year, month, d), day: d, current: true });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const nm = month === 11 ? 0 : month + 1;
    const ny = month === 11 ? year + 1 : year;
    cells.push({ iso: toIso(ny, nm, d), day: d, current: false });
  }
  return cells;
}

/* Inert glyphs (Modal/Button expect currentColor <svg>; no icon lib here). */
const CalendarGlyph = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
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

export interface DatePickerProps {
  open: boolean;
  onClose: () => void;
  /** ISO date "YYYY-MM-DD", or null when unset. */
  value: string | null;
  onChange: (value: string | null) => void;
  /** Modal title. */
  title?: string;
  /** Quick-set row (Today / Tomorrow / ...). Ported from cs-dash; on by default. */
  presets?: boolean;
  disablePast?: boolean;
  disableFuture?: boolean;
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
}: DatePickerProps) {
  const today = todayIso();
  const [view, setView] = useState(() => {
    const b = fromIso(value ?? today);
    return { y: b.y, m: b.m };
  });
  // Roving keyboard focus, as an ISO date. Arrows move it; Enter selects it.
  const [focusIso, setFocusIso] = useState<string>(value ?? today);
  const gridRef = useRef<HTMLDivElement>(null);
  const focusPending = useRef(false);

  // Re-sync to the value (or today) every time the picker opens.
  useEffect(() => {
    if (!open) return;
    const base = value ?? todayIso();
    const b = fromIso(base);
    setView({ y: b.y, m: b.m });
    setFocusIso(base);
  }, [open, value]);

  // After an arrow move, put real DOM focus on the newly focused day.
  useEffect(() => {
    if (!open || !focusPending.current) return;
    focusPending.current = false;
    gridRef.current
      ?.querySelector<HTMLButtonElement>(`[data-iso="${focusIso}"]`)
      ?.focus();
  }, [open, focusIso, view]);

  const isDisabled = (iso: string) =>
    (disablePast && iso < today) || (disableFuture && iso > today);

  const pick = (iso: string) => {
    onChange(iso);
    onClose();
  };

  const prevMonth = () =>
    setView(v => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }));
  const nextMonth = () =>
    setView(v => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }));

  // Ported nav clamping from MiniCalendar.tsx:50-51.
  const t = fromIso(today);
  const prevDisabled =
    disablePast && (view.y < t.y || (view.y === t.y && view.m <= t.m));
  const nextDisabled =
    disableFuture && (view.y > t.y || (view.y === t.y && view.m >= t.m));

  const onGridKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const delta =
      e.key === "ArrowLeft" ? -1 :
      e.key === "ArrowRight" ? 1 :
      e.key === "ArrowUp" ? -7 :
      e.key === "ArrowDown" ? 7 : 0;
    if (delta === 0) return; // Enter/Space select natively; Escape is Modal's.
    e.preventDefault();
    const next = shiftDays(focusIso, delta);
    if (isDisabled(next)) return; // clamp at a disabled boundary
    const b = fromIso(next);
    setView({ y: b.y, m: b.m });
    setFocusIso(next);
    focusPending.current = true;
  };

  const cells = buildCells(view.y, view.m);
  const focusTarget = cells.some(c => c.iso === focusIso)
    ? focusIso
    : toIso(view.y, view.m, 1);

  const visiblePresets = PRESETS.filter(
    p => !(disableFuture && p.days > 0) && !(disablePast && p.days < 0),
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      icon={CalendarGlyph}
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

      <div className="ui-datepicker-cal">
        <div className="ui-datepicker-head">
          <button
            type="button"
            className="ui-datepicker-nav"
            aria-label="Previous Month"
            onClick={prevMonth}
            disabled={prevDisabled}
          >
            {ChevronLeftGlyph}
          </button>
          <span className="ui-datepicker-month">
            {MONTHS[view.m]} {view.y}
          </span>
          <button
            type="button"
            className="ui-datepicker-nav"
            aria-label="Next Month"
            onClick={nextMonth}
            disabled={nextDisabled}
          >
            {ChevronRightGlyph}
          </button>
        </div>

        <div className="ui-datepicker-grid" ref={gridRef} onKeyDown={onGridKeyDown}>
          {DAYS.map(d => (
            <span key={d} className="ui-datepicker-dow" aria-hidden="true">
              {d}
            </span>
          ))}
          {cells.map(c => {
            const disabled = isDisabled(c.iso);
            const { y, m, d } = fromIso(c.iso);
            return (
              <button
                key={c.iso}
                type="button"
                className="ui-datepicker-day"
                data-iso={c.iso}
                data-adjacent={c.current ? undefined : true}
                data-today={c.iso === today || undefined}
                data-selected={c.iso === value || undefined}
                aria-label={`${MONTHS[m]} ${d}, ${y}`}
                aria-current={c.iso === today ? "date" : undefined}
                tabIndex={c.iso === focusTarget ? 0 : -1}
                disabled={disabled}
                onClick={() => pick(c.iso)}
              >
                {c.day}
              </button>
            );
          })}
        </div>
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
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const state: "empty" | "set" | "past" =
    value == null ? "empty" : warnPast && value < todayIso() ? "past" : "set";

  return (
    <>
      <button
        type="button"
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
        onClose={() => setOpen(false)}
        value={value}
        onChange={onChange}
        title={pickerTitle}
        presets={presets}
        disablePast={disablePast}
        disableFuture={disableFuture}
      />
    </>
  );
}
