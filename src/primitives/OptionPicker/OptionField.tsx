import type { ReactNode } from "react";
import "./OptionField.css";

/**
 * OptionField — the trigger half of the house modal-picker pattern.
 *
 * Josh's ruling: fields open MODAL pickers, not inline dropdowns. The field
 * shows a grayed placeholder ("Not Set") until a value is chosen, then flips
 * to the brand tint — same 12% ground / 35% border recipe as a primary Button,
 * which is exactly what the LMS does.
 *
 * Ported from the LMS `fieldBtn` helper
 * (lab-portal/components/CustomShadeCaseModal.tsx:270-282):
 *   set:   rgba(brand, .12) ground · brand text · rgba(brand, .35) border
 *   unset: muted ground · muted text · default border
 *
 * This component is presentational — it renders the current choice and fires
 * onClick. Pair it with <OptionPickerModal> (or any picker modal) and keep the
 * open/closed state in the parent, exactly like the LMS does.
 */

export interface OptionFieldProps {
  /** Display label of the chosen option, or null while nothing is chosen. */
  label: string | null;
  /** Open the picker. */
  onClick: () => void;
  /** Grayed text while unset. Title Case, per house rule. */
  placeholder?: string;
  /** Leading glyph. An inert <svg> using currentColor. */
  icon?: ReactNode;
  disabled?: boolean;
}

export function OptionField({
  label,
  onClick,
  placeholder = "Not Set",
  icon,
  disabled = false,
}: OptionFieldProps) {
  const set = label != null && label !== "";

  return (
    <button
      type="button"
      className="ui-optionfield"
      data-set={set || undefined}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && (
        <span className="ui-optionfield-icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="ui-optionfield-label">{set ? label : placeholder}</span>
    </button>
  );
}
