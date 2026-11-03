"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Button } from "../Button/Button";
import { Modal } from "../Modal/Modal";
import { formatTime12, timeOptions } from "./logic";
import "../DatePicker/DatePicker.css";
import "./TimePicker.css";

/**
 * TimePicker + TimeField — the DatePicker's sibling, in the same pop-up style
 * (Josh 2026-11-03, the house picker ruling): a field that reads "Not Set"
 * grayed or the time in brand, opening a small window with one scrolling list
 * of times. 7:00 AM to 5:00 PM in 30-minute steps by default — the list the
 * LMS time picker already used; `startHour` / `endHour` / `interval` change it.
 *
 * Value contract: "HH:MM" (24-hour) or null. A stored time that is not on the
 * list (10:20 on a 30-minute list) is still shown on the field, and the list
 * opens scrolled to the nearest slot.
 *
 * Keyboard: the selected (or first) time takes focus when the window opens;
 * ArrowUp / ArrowDown move, Home / End jump, Enter or Space picks, Escape
 * closes (the Modal's).
 */

const ClockGlyph = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);
const XGlyph = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" focusable="false">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

export interface TimePickerProps {
  open: boolean;
  onClose: () => void;
  /** "HH:MM" 24-hour, or null when unset. */
  value: string | null;
  onChange: (value: string | null) => void;
  title?: string;
  /** First hour on the list (0-23). Default 7. */
  startHour?: number;
  /** Last hour on the list (0-23), inclusive of its :00. Default 17. */
  endHour?: number;
  /** Minutes between options. Default 30. */
  interval?: number;
}

export function TimePicker({
  open,
  onClose,
  value,
  onChange,
  title = "Select Time",
  startHour = 7,
  endHour = 17,
  interval = 30,
}: TimePickerProps) {
  const options = timeOptions(startHour, endHour, interval);
  const listRef = useRef<HTMLDivElement>(null);
  const nearest = nearestOption(options, value);
  const [focusIdx, setFocusIdx] = useState(nearest);

  // On open: focus and centre the selected (or nearest) time.
  useEffect(() => {
    if (!open) return;
    setFocusIdx(nearest);
    const id = requestAnimationFrame(() => {
      const list = listRef.current;
      const el = list?.querySelector<HTMLButtonElement>(`[data-idx="${nearest}"]`);
      if (list && el) {
        list.scrollTop = el.offsetTop - list.clientHeight / 2 + el.offsetHeight / 2;
        el.focus({ preventScroll: true });
      }
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-centre on open only
  }, [open]);

  const pick = (t: string) => {
    onChange(t);
    onClose();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const last = options.length - 1;
    const to =
      e.key === "ArrowDown" ? Math.min(last, focusIdx + 1) :
      e.key === "ArrowUp" ? Math.max(0, focusIdx - 1) :
      e.key === "Home" ? 0 :
      e.key === "End" ? last : null;
    if (to == null) return;
    e.preventDefault();
    setFocusIdx(to);
    listRef.current?.querySelector<HTMLButtonElement>(`[data-idx="${to}"]`)?.focus();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      icon={ClockGlyph}
      width={300}
      padded={false}
      footer={
        value != null ? (
          <Button variant="danger" size="sm" onClick={() => { onChange(null); onClose(); }}>
            Clear
          </Button>
        ) : undefined
      }
    >
      <div className="ui-timepicker-list" ref={listRef} role="listbox" aria-label={title} onKeyDown={onKeyDown}>
        {options.map((t, i) => (
          <button
            key={t}
            type="button"
            role="option"
            className="ui-timepicker-item"
            data-idx={i}
            data-selected={t === value || undefined}
            aria-selected={t === value}
            tabIndex={i === focusIdx ? 0 : -1}
            onClick={() => pick(t)}
          >
            {formatTime12(t)}
          </button>
        ))}
      </div>
    </Modal>
  );
}

/** Index of the option equal to, else nearest to, the value; 0 when unset. */
function nearestOption(options: string[], value: string | null): number {
  if (value == null || options.length === 0) return 0;
  const mins = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const v = mins(value);
  let best = 0;
  options.forEach((o, i) => { if (Math.abs(mins(o) - v) < Math.abs(mins(options[best]) - v)) best = i; });
  return best;
}

export interface TimeFieldProps {
  /** "HH:MM" 24-hour, or null when unset. */
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  pickerTitle?: string;
  startHour?: number;
  endHour?: number;
  interval?: number;
  /** id on the trigger button, so a FieldLabel htmlFor can point at it. */
  id?: string;
  /** Names the trigger when no FieldLabel points at it. */
  ariaLabel?: string;
  /** Opens the picker as soon as the field mounts (a grid cell editor). */
  defaultOpen?: boolean;
  /** Called after the picker closes, picked or not. */
  onClose?: () => void;
}

export function TimeField({
  value,
  onChange,
  placeholder = "Not Set",
  disabled = false,
  pickerTitle,
  startHour,
  endHour,
  interval,
  id,
  ariaLabel,
  defaultOpen = false,
  onClose,
}: TimeFieldProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <>
      <button
        type="button"
        id={id}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        className="ui-datefield"
        data-state={value == null ? "empty" : "set"}
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        <span className="ui-datefield-icon" aria-hidden="true">
          {ClockGlyph}
        </span>
        <span className="ui-datefield-text">
          {value != null ? formatTime12(value) : placeholder}
        </span>
        {value != null && !disabled && (
          <span
            className="ui-datefield-x"
            role="button"
            aria-label="Clear Time"
            onClick={e => {
              e.stopPropagation();
              onChange(null);
            }}
          >
            {XGlyph}
          </span>
        )}
      </button>
      <TimePicker
        open={open}
        onClose={() => {
          setOpen(false);
          onClose?.();
        }}
        value={value}
        onChange={onChange}
        title={pickerTitle}
        startHour={startHour}
        endHour={endHour}
        interval={interval}
      />
    </>
  );
}
