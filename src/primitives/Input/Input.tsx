import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import "./Input.css";

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
 * through it: 36px tall, 8px/12px padding, 1px border, --radius, 13px type.
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

type Shared = {
  /** Failed validation. Draws the danger edge and sets aria-invalid. */
  invalid?: boolean;
};

export type InputProps = Shared &
  Omit<InputHTMLAttributes<HTMLInputElement>, "className"> & {
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
    /** The same on the right — a unit, a percent sign. */
    suffix?: ReactNode;
  };

export type TextareaProps = Shared &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className">;

export function Input({ invalid, prefix, suffix, ...rest }: InputProps) {
  const field = (
    <input
      {...rest}
      className="ui-input"
      data-invalid={invalid || undefined}
      aria-invalid={invalid || undefined}
    />
  );

  // No wrapper unless one is needed — a plain field stays a plain element, so
  // it can still be a flex or grid child without an extra box in the way.
  if (prefix == null && suffix == null) return field;

  return (
    <span className="ui-input-wrap" data-has-prefix={prefix != null || undefined}>
      {prefix != null && (
        <span className="ui-input-affix" data-side="start" aria-hidden="true">
          {prefix}
        </span>
      )}
      {field}
      {suffix != null && (
        <span className="ui-input-affix" data-side="end" aria-hidden="true">
          {suffix}
        </span>
      )}
    </span>
  );
}

/**
 * The same field, grown vertically. `rows` still works and is the way to say
 * how tall it starts; the user can drag it taller and not narrower, because a
 * field narrower than the form it sits in just looks like a mistake.
 */
export function Textarea({ invalid, rows = 3, ...rest }: TextareaProps) {
  return (
    <textarea
      {...rest}
      rows={rows}
      className="ui-input ui-textarea"
      data-invalid={invalid || undefined}
      aria-invalid={invalid || undefined}
    />
  );
}
