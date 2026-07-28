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

/**
 * The full colour vocabulary, matching the Badge's. Josh, 2026-07-28, asked
 * for it: "put the color button in the vocabulary."
 *
 * WHY THIS EXISTS WHEN `variant` ALREADY PICKS A HUE. It picks three: brand,
 * neutral and red. The LMS's case header needs blue, amber, red, green and
 * violet for its RUSH / HOLD / REMAKE / COUPON / AUTOMATE flags, and under this
 * file's own rule — tint + border is a BUTTON, tint alone is a badge — those
 * flags are buttons. They were hand-rolled in raw hex for exactly this reason,
 * which is the shape a missing vocabulary always takes.
 *
 * `brand` and `danger` are the same hues `variant="primary"` and
 * `variant="danger"` already draw; they are here so the vocabulary is whole
 * rather than a set of leftovers. There is deliberately no `muted` tone —
 * `variant="secondary"` IS the neutral button, and a second name for it would
 * be the first step back towards four ways of saying one thing.
 */
export type ButtonTone = "brand" | "danger" | "warn" | "info" | "violet";

/**
 * Colour comes from EITHER the hierarchy names or the tone vocabulary, never
 * both — written as a union so passing both is a compile error rather than a
 * question this component has to answer at runtime. Same shape the Badge uses.
 *
 * `variant` stays because two of its members are not hues at all: `secondary`
 * is the neutral and `ghost` is the one control with no ground to colour.
 */
type ButtonColour =
  | { variant?: ButtonVariant; tone?: never }
  | { tone: ButtonTone; variant?: never };

export type ButtonProps = ButtonColour &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
    size?: ButtonSize;
    /** Leading icon. Replaced by the spinner while `loading`. */
    icon?: ReactNode;
    /** Non-interactive + spinner. Distinct from `disabled`: this one is temporary. */
    loading?: boolean;
    children?: ReactNode;
  };

export function Button({
  variant,
  tone,
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

  // One attribute carries the colour whichever vocabulary named it: the union
  // above guarantees at most one of the two arrived, and the CSS has a rule per
  // value. `secondary` is still the default for a button that says neither.
  const look = tone ?? variant ?? "secondary";

  return (
    <button
      {...rest}
      type={type}
      className="ui-btn"
      data-variant={look}
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

/**
 * buttonProps — the button's LOOK, handed to an element that is not a button.
 *
 * WHAT THIS IS FOR. Some controls that should look like buttons are really
 * LINKS: they navigate, and a link is the only thing a browser will let you
 * middle-click or open in a new tab. Rendering one as a <button> takes that
 * away silently — the LMS's Print Work Ticket is the case that forced this,
 * because the bench opens several tickets at once.
 *
 * WHY A HELPER RATHER THAN A ButtonLink COMPONENT. The kit cannot render the
 * link: a Next.js app needs next/link for client-side navigation, a Tauri app
 * needs something else, and neither belongs in a framework-agnostic kit. So the
 * kit hands over the ATTRIBUTES and the app supplies the element:
 *
 *   <Link href={…} {...buttonProps({ variant: "secondary", size: "sm" })}>
 *     <span className="ui-btn-icon"><Printer size={16} /></span>
 *   </Link>
 *
 * THIS IS NOT A CLASSNAME ESCAPE HATCH. It returns the same className and data
 * attributes the Button itself sets, from the same place — so a link cannot
 * drift from the real control the way a hand-copied recipe does. If the button
 * changes, this changes with it. What it does NOT give you is `loading` or
 * `disabled`: a link cannot be busy or inert, and pretending otherwise is how
 * you end up with a "disabled" link people can still click.
 */
export function buttonProps({
  variant,
  tone,
  size = "md",
}: ButtonColour & { size?: ButtonSize } = {}) {
  return {
    className: "ui-btn",
    "data-variant": tone ?? variant ?? "secondary",
    "data-size": size,
  } as const;
}
