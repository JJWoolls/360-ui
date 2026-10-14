"use client";

import type { KeyboardEvent } from "react";
import { Button } from "../Button/Button";
import { clampStepperValue, stepStepperValue, stepperGlyphs } from "./logic";
import "./Stepper.css";

/**
 * Stepper — a bench-size count control: a big minus, the number, a big plus.
 *
 * WHY IT EXISTS: the grip-stock count sheet is filled in standing at a shelf on
 * an iPad. A text field there means a keyboard over half the screen, a stray
 * decimal, and a number typed into the wrong row. Two 56px targets and no text
 * input make the only possible entries "one more" and "one less".
 *
 * NO TEXT INPUT, ON PURPOSE. The number is a role="spinbutton" the keyboard can
 * still drive (arrows, Page Up/Down for ten steps, Home/End for the bounds),
 * so it stays accessible without ever opening an on-screen keyboard.
 *
 * ROLLING NUMBER. Each digit is a strip of 0–9 that slides (translateY) to its
 * value, keyed by place value so 9 -> 10 rolls the ones column and adds a tens
 * column. The motion confirms the press landed when the finger hides the
 * number. Reduced-motion users get the number with no slide.
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
}: StepperProps) {
  const bounds = { min, max, step };
  const shown = clampStepperValue(value, bounds);
  const atMin = shown <= min;
  const atMax = shown >= max;

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

  return (
    <div className="ui-stepper" data-disabled={disabled || undefined}>
      <Button
        size="bench"
        variant="secondary"
        icon={<MinusMark />}
        aria-label={decrementLabel ?? `Decrease ${label}`}
        disabled={disabled || atMin}
        onClick={() => move(-1)}
      />
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
        <span className="ui-stepper-digits" aria-hidden="true">
          {stepperGlyphs(shown, step).map((g) =>
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
        {unit && (
          <span className="ui-stepper-unit" aria-hidden="true">
            {unit}
          </span>
        )}
      </div>
      <Button
        size="bench"
        variant="secondary"
        icon={<PlusMark />}
        aria-label={incrementLabel ?? `Increase ${label}`}
        disabled={disabled || atMax}
        onClick={() => move(1)}
      />
    </div>
  );
}
