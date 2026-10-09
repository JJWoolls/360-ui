import type { ReactNode } from "react";
import "./FieldLabel.css";

/**
 * FieldLabel — the label above one form field ("Practice Name", "Due Date").
 *
 * WHY IT EXISTS: Input, Textarea and Select deliberately take no label — a text
 * field's label sits above it and belongs to the form. Without a house label,
 * every form hand-rolled one: tiny bold uppercase with letter-spacing in one
 * place, plain 11px text in another. One component, one look.
 *
 * TITLE CASE, NEVER UPPERCASE. Pass the words the way they should read; this
 * component does not transform them and adds no letter-spacing.
 *
 * WHICH ONE TO USE:
 *   - Names one field, points at it with htmlFor  -> FieldLabel.
 *   - Names a block of content or several fields  -> SectionLabel.
 *   - Checkbox / Toggle                           -> neither; they carry their
 *     own label, because there the label is the hit area.
 *
 * `htmlFor` should match the field's id so clicking the label focuses the
 * field and assistive tech reads the label as the field's name.
 *
 * `required` adds a quiet asterisk (decorative, aria-hidden). It is a visual
 * cue only: the field itself still carries `required` / `aria-required`.
 *
 * `hint` renders UNDER THE LABEL, above the field — one muted line of helper
 * text ("As it appears on the invoice"). It lives inside the <label>, so it is
 * part of the field's name and stays attached to the label wherever the label
 * goes. Keep it short; a paragraph of guidance belongs in a Tooltip or Callout.
 *
 * `action` is a right-aligned slot on the label's row — a small "Clear" or
 * "Use Default" control. It sits OUTSIDE the <label>, because an interactive
 * control nested inside a label would steal the label's click.
 */

export interface FieldLabelProps {
  /** The label, in Title Case. Rendered as written — never uppercased. */
  children: ReactNode;
  /** The id of the field this label names. */
  htmlFor?: string;
  /** Shows a subtle required marker. Visual only — mark the field itself too. */
  required?: boolean;
  /** One line of helper text under the label, above the field. */
  hint?: ReactNode;
  /** Right-aligned slot on the label's row, outside the <label> element. */
  action?: ReactNode;
  /** Extra classes from the caller (layout only). Applied to the outermost element. */
  className?: string;
}

export function FieldLabel({ children, htmlFor, required = false, hint, action, className }: FieldLabelProps) {
  const label = (
    <label className={!action && className ? `ui-field-label ${className}` : "ui-field-label"} htmlFor={htmlFor}>
      <span className="ui-field-label-text">
        {children}
        {required && (
          <span className="ui-field-label-required" aria-hidden="true">
            *
          </span>
        )}
      </span>
      {hint != null && <span className="ui-field-label-hint">{hint}</span>}
    </label>
  );

  // No action means no row wrapper: the label is the element itself.
  if (action == null) return label;

  return (
    <div className={className ? `ui-field-label-row ${className}` : "ui-field-label-row"}>
      {label}
      <div className="ui-field-label-action">{action}</div>
    </div>
  );
}
