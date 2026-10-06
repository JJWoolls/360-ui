"use client";

import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef } from "react";
import type { InputHTMLAttributes, ReactNode, RefObject, TextareaHTMLAttributes } from "react";
import "./Input.css";

// useLayoutEffect warns during server render; on the server there is nothing
// to measure anyway, and the CSS fallback in Input.css covers first paint.
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Input — the house text field. And Textarea, its multi-line twin.
 *
 * WHY THIS LOOKS LIKE THE SELECT: it IS the Select's trigger without the
 * chevron. A text box and a dropdown sit beside each other in every form in
 * both apps, and if their height, padding, border or radius disagree the form
 * looks broken no matter how good either one is on its own. So the field is
 * one shape, and what varies is whether it opens a list.
 *
 * That also means nothing here was invented. Select.css was ported from the
 * LMS's own StyledSelect, so these numbers are the LMS's numbers, arrived at
 * through it: 36px tall, 8px/12px padding, 1px border, --radius, 16px type (the iOS no-zoom floor).
 *
 * WHY IT WAS WORTH BUILDING. The LMS had at least five different local
 * `inputClass` constants — 25 call sites on one of them, 252 on another — each
 * a page's private answer to the same question. Josh, 2026-07-28: "why don't
 * we pick something here and set it as our house text input, set it the same
 * everywhere, and start linting to that as well."
 *
 * NO LABEL PROP, deliberately. The Checkbox and Toggle own their labels
 * because the label IS the control's hit area there. A text field's label sits
 * above it and belongs to the form's layout, not to the field — and Select,
 * the part this must match, has no label prop either. Give it an id and point
 * a <label htmlFor> at it, or pass aria-label when there is no visible label.
 */

/**
 * The two the apps actually draw, named the same as the Button's so a form and
 * its buttons can be asked for the same size in the same word.
 *
 *   "md" — the default, and the Select trigger's size. A form field.
 *   "sm" — an INLINE editor: a field that appears in place inside a row or a
 *          card, where a 36px box would push the row apart. The LMS edits a
 *          tracking number and a line quantity this way.
 *   "touch" — a field a FINGER uses: a bench iPad or a station screen. 44px
 *          tall (--touch-target, the Button's touch floor) and 16px type, the
 *          size below which iOS zooms the page on focus. Unlike the Button,
 *          this is a prop and not a `pointer: coarse` query: a touch screen
 *          surface is a layout decision its page already makes (it lays out
 *          bigger rows too), and a desktop field must not grow on a
 *          touch-screen laptop.
 *
 * Size is free; the treatment is not — same border, same radius, same focus.
 */
export type InputSize = "sm" | "md" | "touch";

type Shared = {
  /** Failed validation. Draws the danger edge and sets aria-invalid. */
  invalid?: boolean;
  size?: InputSize;
};

// `size` and `prefix` are both real HTML attributes — size is a character
// count, prefix is a legacy RDFa string. Left in place they would intersect
// with ours to `never` and `string`, so an element prefix would not compile.
// Omitted here so the house meanings win.
export type InputProps = Shared &
  Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "size" | "prefix"> & {
    /**
     * A fixed mark inside the field's left edge — a currency sign, a search
     * icon, a unit. NOT a label and not a hint: it is part of the value's
     * shape, which is why it sits inside the box and why it is aria-hidden.
     *
     * This exists so a money field does not have to reach outside the
     * primitive for padding. The LMS is full of them, and the alternative was
     * a className escape hatch, which is how a primitive stops being one.
     */
    prefix?: ReactNode;
    /**
     * Makes the prefix a real button — the search box whose magnifier runs
     * the search, or a mode glyph that switches what is searched. Without it
     * the prefix is decoration (aria-hidden, click-through to the field).
     * With it, the mark is a focusable button named by `prefixLabel`; after
     * the handler runs the cursor goes back into the field, so a click on the
     * icon of an empty search box simply focuses it.
     */
    onPrefixClick?: () => void;
    /** The prefix button's accessible name. Default "Search". Name what it does. */
    prefixLabel?: string;
    /**
     * The same on the right — a unit, a percent sign. Shares the right edge
     * with the clear button: when `onClear` is set and the field has a value,
     * the clear button shows in its place; when the field is empty, the suffix.
     */
    suffix?: ReactNode;
    /**
     * Gives the field a built-in clear button: a small X inside the right edge,
     * shown only while `value` is a non-empty string. Clicking it calls this
     * and puts the cursor back in the field, so the person can type the next
     * search straight away. The caller does the clearing (`() => setQ("")`) —
     * the field is controlled, so only the caller can empty it.
     *
     * Hidden on a disabled or read-only field, where clearing is not allowed.
     */
    onClear?: () => void;
    /** The clear button's accessible name. Default "Clear"; name what it clears ("Clear search"). */
    clearLabel?: string;
  };

export type TextareaProps = Shared &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className">;


/**
 * The field's padding is sized to the mark actually sitting in it. The first
 * version padded a prefixed field by a fixed --s5, sized for a "$", and every
 * search icon ran over the placeholder (Josh, 2026-09-30) — and a suffix got no
 * room at all, so typed text slid under it. A fixed number can only be right
 * for one mark, so the wrap measures each mark and hands its width to the CSS
 * as --ui-affix-start / --ui-affix-end. Input.css holds the arithmetic and the
 * first-paint fallback.
 */
function useAffixWidths(hasPrefix: boolean, end: "suffix" | "clear" | null) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  // The start mark is a span, or a button when the prefix is clickable.
  const startRef = useRef<HTMLElement>(null);
  // The right edge holds either the suffix mark or the clear button; whichever
  // is showing is the one measured, so the padding follows the swap.
  const endRef = useRef<HTMLElement>(null);

  useIsoLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const measure = () => {
      const start = startRef.current;
      if (start) {
        // A clickable prefix is a button with a hit area wider than its mark;
        // the padding follows the MARK, so the text sits where it would beside
        // a decorative icon.
        const mark = start.tagName === "BUTTON" ? start.firstElementChild : null;
        const width = mark ? mark.getBoundingClientRect().width : start.offsetWidth;
        wrap.style.setProperty("--ui-affix-start", `${width}px`);
      }
      if (endRef.current) wrap.style.setProperty("--ui-affix-end", `${endRef.current.offsetWidth}px`);
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    if (startRef.current) ro.observe(startRef.current);
    if (endRef.current) ro.observe(endRef.current);
    return () => ro.disconnect();
  }, [hasPrefix, end]);

  return { wrapRef, startRef, endRef };
}

/**
 * Forwards its ref to the <input>, so a caller can focus it or measure it
 * (a results dropdown anchored under the field) without reaching around the
 * primitive.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    invalid,
    size = "md",
    prefix,
    onPrefixClick,
    prefixLabel = "Search",
    suffix,
    onClear,
    clearLabel = "Clear",
    ...rest
  },
  forwardedRef,
) {
  const hasPrefix = prefix != null;
  // The clear button takes the suffix's slot rather than sitting beside it: a
  // field with two marks on one edge leaves too little room for the text, and
  // the suffix (a unit, an icon) says nothing the typed value does not.
  const showClear =
    onClear != null &&
    typeof rest.value === "string" &&
    rest.value !== "" &&
    !rest.disabled &&
    !rest.readOnly;
  const hasSuffix = !showClear && suffix != null;
  const end = showClear ? "clear" : hasSuffix ? "suffix" : null;
  const { wrapRef, startRef, endRef } = useAffixWidths(hasPrefix, end);
  const inputRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(forwardedRef, () => inputRef.current as HTMLInputElement, []);

  const field = (
    <input
      {...rest}
      ref={inputRef}
      className="ui-input"
      data-size={size}
      data-invalid={invalid || undefined}
      aria-invalid={invalid || undefined}
    />
  );

  // No wrapper unless one is needed — a plain field stays a plain element, so
  // it can still be a flex or grid child without an extra box in the way.
  // A field that can be cleared keeps its wrapper even while empty, so the
  // input is not remounted (and does not lose focus) on the first keystroke.
  if (!hasPrefix && suffix == null && onClear == null) return field;

  return (
    <span
      ref={wrapRef}
      className="ui-input-wrap"
      data-size={size}
      data-has-prefix={hasPrefix || undefined}
      data-has-suffix={hasSuffix || undefined}
      data-has-clear={showClear || undefined}
    >
      {hasPrefix &&
        (onPrefixClick ? (
          <button
            ref={startRef as RefObject<HTMLButtonElement>}
            type="button"
            className="ui-input-affix ui-input-affix-btn"
            data-side="start"
            aria-label={prefixLabel}
            disabled={rest.disabled}
            onClick={() => {
              onPrefixClick();
              inputRef.current?.focus();
            }}
          >
            {prefix}
          </button>
        ) : (
          <span
            ref={startRef as RefObject<HTMLSpanElement>}
            className="ui-input-affix"
            data-side="start"
            aria-hidden="true"
          >
            {prefix}
          </span>
        ))}
      {field}
      {hasSuffix && (
        <span
          ref={endRef as RefObject<HTMLSpanElement>}
          className="ui-input-affix"
          data-side="end"
          aria-hidden="true"
        >
          {suffix}
        </span>
      )}
      {showClear && (
        <button
          ref={endRef as RefObject<HTMLButtonElement>}
          type="button"
          className="ui-input-clear"
          aria-label={clearLabel}
          onClick={() => {
            onClear?.();
            inputRef.current?.focus();
          }}
        >
          {/* The Modal's close X, so "dismiss" and "clear" are one glyph. */}
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              d="M18 6L6 18M6 6l12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </span>
  );
});

/**
 * The same field, grown vertically. `rows` still works and is the way to say
 * how tall it starts; the user can drag it taller and not narrower, because a
 * field narrower than the form it sits in just looks like a mistake.
 */
export function Textarea({ invalid, size = "md", rows = 3, ...rest }: TextareaProps) {
  return (
    <textarea
      {...rest}
      rows={rows}
      className="ui-input ui-textarea"
      data-size={size}
      data-invalid={invalid || undefined}
      aria-invalid={invalid || undefined}
    />
  );
}
