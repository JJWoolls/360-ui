"use client";

import { useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent, MouseEvent } from "react";
import { Button } from "../Button/Button";
import {
  clampStepperValue,
  filterStepperText,
  formatStepperValue,
  parseStepperText,
  stepStepperValue,
  stepperGlyphs,
} from "./logic";
import "./Stepper.css";

/**
 * Stepper — a bench-size count control: a big minus, the number, a big plus.
 *
 * WHY IT EXISTS: the grip-stock count sheet is filled in standing at a shelf on
 * an iPad. Two 56px targets make "one more" and "one less" a single tap each.
 *
 * NO TEXT INPUT BY DEFAULT. The number is a role="spinbutton" the keyboard can
 * still drive (arrows, Page Up/Down for ten steps, Home/End for the bounds),
 * so it stays accessible without ever opening an on-screen keyboard.
 *
 * `typeable` (opt-in, added 2026-10-19 for the grip-stock count sheet — Josh:
 * "I don't mind having a typable box and also the ability to increment it up
 * and down with arrows"): tapping the number opens it for typing. Counting 40
 * gloves one tap at a time is the wrong tool, so the number becomes a numeric
 * text field (inputMode numeric, everything selected on focus so the first
 * digit replaces it). It commits on blur or Enter — snapped to the step and
 * clamped to min/max — and Escape puts back what was there. Up/Down and Page
 * Up/Down still step it; Left/Right/Home/End move the caret, as in any text
 * field. The +/- buttons are unchanged. It is still the spinbutton: the field
 * carries the role, the name and the value. Off, nothing renders differently.
 *
 * ROLLING NUMBER. Each digit is a strip of 0–9 that slides (translateY) to its
 * value, keyed by place value so 9 -> 10 rolls the ones column and adds a tens
 * column. The motion confirms the press landed when the finger hides the
 * number. Reduced-motion users get the number with no slide. In typeable mode
 * the roll shows while the field is idle and the typed text shows while it
 * has focus.
 *
 * The buttons are the kit Button at size="bench" (56px, --bench-target), so a
 * Stepper lines up with a bench button bar and grows with Scale the same way.
 */

export interface StepperProps {
  value: number;
  /** Called with the next value, already clamped to min/max. */
  onChange: (next: number) => void;
  /**
   * What is being counted — the accessible name of the number ("Nitrile
   * Gloves L") and the base of the button names ("Decrease Nitrile Gloves L").
   */
  label: string;
  /** Floor. Default 0. */
  min?: number;
  /** Ceiling. Default none. */
  max?: number;
  /** One press. Default 1. */
  step?: number;
  /** A small word under the number ("boxes"); also read out with the value. */
  unit?: string;
  disabled?: boolean;
  /** Override the button names. Defaults: "Decrease <label>" / "Increase <label>". */
  decrementLabel?: string;
  incrementLabel?: string;
  /**
   * Tap the number to type it. Opt-in; default false keeps the original
   * no-keyboard control. Commits on blur/Enter, Escape reverts.
   */
  typeable?: boolean;
}

function MinusMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden="true">
      <path d="M5 12h14" />
    </svg>
  );
}

function PlusMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

function RollingDigits({ value, step }: { value: number; step: number }) {
  return (
    <span className="ui-stepper-digits" aria-hidden="true">
      {stepperGlyphs(value, step).map((g) =>
        g.kind === "digit" ? (
          <span key={g.key} className="ui-stepper-cell">
            <span className="ui-stepper-strip" style={{ transform: `translateY(${-g.digit * 10}%)` }}>
              {DIGITS.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </span>
          </span>
        ) : (
          <span key={g.key} className="ui-stepper-cell" data-char="">
            {g.char}
          </span>
        ),
      )}
    </span>
  );
}

export function Stepper({
  value,
  onChange,
  label,
  min = 0,
  max = Infinity,
  step = 1,
  unit,
  disabled = false,
  decrementLabel,
  incrementLabel,
  typeable = false,
}: StepperProps) {
  const bounds = { min, max, step };
  const shown = clampStepperValue(value, bounds);
  const atMin = shown <= min;
  const atMax = shown >= max;

  // Typeable mode only: the text while the field has focus; null when idle.
  const [draft, setDraft] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const justFocused = useRef(false);
  const shownText = formatStepperValue(shown, step);
  const dirty = draft !== null && draft !== shownText;

  const move = (times: number) => {
    if (disabled) return;
    const next = stepStepperValue(shown, times, bounds);
    if (next !== value) onChange(next);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    let handled = true;
    switch (e.key) {
      case "ArrowUp":
      case "ArrowRight":
        move(1);
        break;
      case "ArrowDown":
      case "ArrowLeft":
        move(-1);
        break;
      case "PageUp":
        move(10);
        break;
      case "PageDown":
        move(-10);
        break;
      case "Home":
        if (!disabled && shown !== min) onChange(min);
        break;
      case "End":
        if (!disabled && Number.isFinite(max) && shown !== max) onChange(max);
        break;
      default:
        handled = false;
    }
    if (handled) e.preventDefault();
  };

  /** The value the typed text stands for: the parsed draft, else what is shown. */
  const typedOrShown = () => (draft === null ? shown : (parseStepperText(draft, bounds) ?? shown));

  const commit = () => {
    if (draft === null) return;
    const next = parseStepperText(draft, bounds);
    if (next !== null && next !== value) onChange(next);
  };

  const selectAll = (el: HTMLInputElement) => {
    el.select();
    // iOS Safari drops a select() made during focus; ask again next frame.
    requestAnimationFrame(() => {
      if (document.activeElement === el) el.setSelectionRange(0, el.value.length);
    });
  };

  const onFieldKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const steps: Record<string, number> = { ArrowUp: 1, ArrowDown: -1, PageUp: 10, PageDown: -10 };
    if (e.key in steps) {
      e.preventDefault();
      if (disabled) return;
      const next = stepStepperValue(typedOrShown(), steps[e.key], bounds);
      if (next !== value) onChange(next);
      setDraft(formatStepperValue(next, step));
      return;
    }
    if (e.key === "Enter") {
      // Blur does the commit, and closes the on-screen keyboard.
      e.preventDefault();
      e.currentTarget.blur();
      return;
    }
    if (e.key === "Escape" && dirty) {
      // The field carries data-handles-escape only while dirty, so a window
      // around it stays open for this Escape and closes on the next.
      setDraft(shownText);
      selectAll(e.currentTarget);
    }
  };

  const onFieldChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDraft(filterStepperText(e.target.value, bounds));
  };

  const onFieldFocus = (e: { currentTarget: HTMLInputElement }) => {
    justFocused.current = true;
    setDraft(shownText);
    selectAll(e.currentTarget);
  };

  const onFieldBlur = () => {
    commit();
    setDraft(null);
  };

  // A click that focused the field would otherwise drop the selection on
  // mouse-up and leave a caret; keep everything selected so typing replaces it.
  const onFieldMouseUp = (e: MouseEvent<HTMLInputElement>) => {
    if (justFocused.current) {
      e.preventDefault();
      justFocused.current = false;
    }
  };

  // A tap anywhere in the number box (the unit, the padding) opens the field.
  const onBoxMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (disabled || e.target === inputRef.current) return;
    e.preventDefault();
    inputRef.current?.focus();
  };

  const decrease = (
    <Button
      size="bench"
      variant="secondary"
      icon={<MinusMark />}
      aria-label={decrementLabel ?? `Decrease ${label}`}
      disabled={disabled || atMin}
      onClick={() => move(-1)}
    />
  );
  const increase = (
    <Button
      size="bench"
      variant="secondary"
      icon={<PlusMark />}
      aria-label={incrementLabel ?? `Increase ${label}`}
      disabled={disabled || atMax}
      onClick={() => move(1)}
    />
  );
  const unitMark = unit && (
    <span className="ui-stepper-unit" aria-hidden="true">
      {unit}
    </span>
  );

  if (typeable) {
    const editing = draft !== null;
    return (
      <div className="ui-stepper" data-disabled={disabled || undefined} data-typeable="">
        {decrease}
        <div className="ui-stepper-value" data-editing={editing || undefined} onMouseDown={onBoxMouseDown}>
          <span className="ui-stepper-field">
            {editing ? (
              // Sizes the box to the typed text; the field draws over it.
              <span className="ui-stepper-digits ui-stepper-sizer" aria-hidden="true">
                {draft || "0"}
              </span>
            ) : (
              <RollingDigits value={shown} step={step} />
            )}
            <input
              ref={inputRef}
              className="ui-stepper-input"
              type="text"
              inputMode={Number.isInteger(step) ? "numeric" : "decimal"}
              enterKeyHint="done"
              autoComplete="off"
              spellCheck={false}
              role="spinbutton"
              aria-label={label}
              aria-valuenow={shown}
              aria-valuemin={min}
              aria-valuemax={Number.isFinite(max) ? max : undefined}
              aria-valuetext={unit ? `${shown} ${unit}` : undefined}
              data-handles-escape={dirty || undefined}
              disabled={disabled}
              value={editing ? draft : shownText}
              onChange={onFieldChange}
              onFocus={onFieldFocus}
              onBlur={onFieldBlur}
              onMouseUp={onFieldMouseUp}
              onKeyDown={onFieldKeyDown}
            />
          </span>
          {unitMark}
        </div>
        {increase}
      </div>
    );
  }

  return (
    <div className="ui-stepper" data-disabled={disabled || undefined}>
      {decrease}
      <div
        className="ui-stepper-value"
        role="spinbutton"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-valuenow={shown}
        aria-valuemin={min}
        aria-valuemax={Number.isFinite(max) ? max : undefined}
        aria-valuetext={unit ? `${shown} ${unit}` : undefined}
        aria-disabled={disabled || undefined}
        onKeyDown={onKeyDown}
      >
        <RollingDigits value={shown} step={step} />
        {unitMark}
      </div>
      {increase}
    </div>
  );
}
