import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
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
  Omit<InputHTMLAttributes<HTMLInputElement>, "className">;

export type TextareaProps = Shared &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className">;

export function Input({ invalid, ...rest }: InputProps) {
  return (
    <input
      {...rest}
      className="ui-input"
      data-invalid={invalid || undefined}
      aria-invalid={invalid || undefined}
    />
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
