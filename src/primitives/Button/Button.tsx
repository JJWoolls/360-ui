import type { ButtonHTMLAttributes, ReactNode } from "react";
import "./Button.css";

/**
 * Button — the house button.
 *
 * This is a primitive: it is the ONE place a native <button> is legal. Every
 * other surface in the app imports this instead, so a change here changes
 * everywhere. Colors come from tokens even in here — no exceptions.
 */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Leading icon. Replaced by the spinner while `loading`. */
  icon?: ReactNode;
  /** Non-interactive + spinner. Distinct from `disabled`: this one is temporary. */
  loading?: boolean;
  children?: ReactNode;
}

export function Button({
  variant = "secondary",
  size = "md",
  icon,
  loading = false,
  disabled = false,
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  // A loading button must not fire. `disabled` on the element is what makes
  // that true for mouse, keyboard and screen reader alike.
  const inert = disabled || loading;

  return (
    <button
      {...rest}
      type={type}
      className="ui-btn"
      data-variant={variant}
      data-size={size}
      data-loading={loading || undefined}
      disabled={inert}
      aria-busy={loading || undefined}
    >
      {loading ? (
        <span className="ui-btn-spinner" aria-hidden="true" />
      ) : icon ? (
        <span className="ui-btn-icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {children != null && <span className="ui-btn-label">{children}</span>}
    </button>
  );
}
