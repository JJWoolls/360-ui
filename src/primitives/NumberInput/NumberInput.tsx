"use client";

import { forwardRef, useEffect, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { Input } from "../Input/Input";
import type { InputSize, InputTone } from "../Input/Input";
import { clampNumber, formatNumberText, parseNumberText, stepNumber } from "./logic";

/**
 * NumberInput — the house field for a typed number: a price, a percent, a
 * weight, a count too large for the Stepper's buttons. It is the house Input
 * (same box, prefix/suffix marks, sizes, tones) with a number contract on top,
 * so a page never writes `type="number"` and never parses text itself.
 *
 * WHY NOT type="number". The native number field scrolls its value under the
 * mouse wheel, accepts "1e5" and "--", shows browser spinners that cannot be
 * styled, and reports "" for half-typed text like "1." — so the caller cannot
 * tell empty from mid-edit. This is a text field with inputMode, which brings
 * the number keypad on iPads and phones and none of the rest.
 *
 * Value contract: a number, or null when empty. While the person types, the
 * text is theirs (a trailing "." or a lone "-" is kept on screen); each
 * keystroke that parses reports the number, and on blur the value is clamped
 * into [min, max], rounded to `decimals` and the text re-written tidy.
 *
 * ArrowUp / ArrowDown step by `step` (Shift = x10). Counts at a bench shelf are
 * the Stepper; this is the keyboard field.
 */

export interface NumberInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  /** Arrow-key step. Default 1. */
  step?: number;
  /** Digits after the point. 0 = whole numbers only (no "." accepted). Default 2. */
  decimals?: number;
  /** Allow a minus sign. Default: only when min is below zero or unset. */
  allowNegative?: boolean;
  /** A mark inside the left edge ("$"). */
  prefix?: ReactNode;
  /** A mark inside the right edge ("%", "g"). */
  suffix?: ReactNode;
  placeholder?: string;
  size?: InputSize;
  tone?: InputTone;
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  id?: string;
  name?: string;
  autoFocus?: boolean;
  "aria-label"?: string;
  "aria-describedby"?: string;
  onBlur?: () => void;
  /** Enter in the field — commit and move on. */
  onEnter?: () => void;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(function NumberInput(
  {
    value,
    onChange,
    min,
    max,
    step = 1,
    decimals = 2,
    allowNegative,
    prefix,
    suffix,
    size,
    tone,
    invalid,
    onBlur,
    onEnter,
    ...rest
  },
  ref,
) {
  const negative = allowNegative ?? (min == null || min < 0);
  const [text, setText] = useState(() => formatNumberText(value, decimals));

  // An outside change (a reset, a loaded record) rewrites the text — but not
  // when the text already means that number, or a half-typed "1." would be
  // snapped back to "1" on every keystroke.
  useEffect(() => {
    if (parseNumberText(text, { decimals, negative }) !== value) {
      setText(formatNumberText(value, decimals));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reacts to value only
  }, [value]);

  const commit = () => {
    const parsed = parseNumberText(text, { decimals, negative });
    const next = parsed == null ? null : clampNumber(parsed, { min, max, decimals });
    setText(formatNumberText(next, decimals));
    if (next !== value) onChange(next);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const dir = e.key === "ArrowUp" ? 1 : -1;
      const next = stepNumber(value, dir * step * (e.shiftKey ? 10 : 1), { min, max, decimals });
      setText(formatNumberText(next, decimals));
      onChange(next);
    } else if (e.key === "Enter") {
      commit();
      onEnter?.();
    }
  };

  return (
    <Input
      {...rest}
      ref={ref}
      type="text"
      inputMode={decimals > 0 ? "decimal" : "numeric"}
      autoComplete="off"
      value={text}
      prefix={prefix}
      suffix={suffix}
      size={size}
      tone={tone}
      invalid={invalid}
      onChange={e => {
        const raw = e.target.value;
        if (!isNumberDraft(raw, decimals, negative)) return; // refuse letters, a second ".", etc.
        setText(raw);
        const parsed = parseNumberText(raw, { decimals, negative });
        if (parsed !== value) onChange(parsed);
      }}
      onKeyDown={onKeyDown}
      onBlur={() => {
        commit();
        onBlur?.();
      }}
    />
  );
});

/** Text that is a number or on its way to one: "", "-", "1.", "-0.5", "1,200". */
function isNumberDraft(raw: string, decimals: number, negative: boolean): boolean {
  const body = raw.replace(/,/g, "");
  const sign = negative ? "-?" : "";
  const frac = decimals > 0 ? `(\\.\\d{0,${decimals}})?` : "";
  return new RegExp(`^${sign}\\d*${frac}$`).test(body);
}
