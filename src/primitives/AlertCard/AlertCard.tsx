import type { ReactNode } from "react";
import "./AlertCard.css";
import { AlertIcon } from "./AlertIcon";

/**
 * AlertCard — the one card the whole alert family is drawn with.
 *
 * ONE LOOK, FOUR PLACES. A failure inside a page (ErrorPanel), a decision in
 * the middle of the screen (AlertDialog) and a stop-work alarm all use this
 * card, so a person learns the shape once: an icon in a soft tinted circle, a
 * title, one line of message, and the way out as buttons — all centred. The
 * corner pop-out (Toast) is the only sibling with a different shape, because
 * it must sit beside work without covering it.
 *
 * COLOUR IS THE KIND, NOT DECORATION:
 *   danger  — something failed
 *   warn    — something needs care before going on
 *   info    — something worth knowing, nothing wrong
 *   success — something finished
 *
 * EMPHASIS IS HOW LOUD, NOT WHAT KIND. `quiet` is the default and is right
 * almost always: a low-strength tone border on the ordinary surface. `alarm`
 * is a full-strength border with a slow pulse — kept for the rare moment that
 * should stop work. If everything pulses, nothing does.
 *
 * It renders INLINE: no position, no overlay. Placement is the job of the
 * component that hosts it.
 *
 * WRITE THE TITLE AS WHAT HAPPENED AND THE MESSAGE AS WHAT TO DO — same rule as
 * the Toast. No apologies, no "Oops".
 */

export type AlertTone = "danger" | "warn" | "info" | "success";
export type AlertEmphasis = "quiet" | "alarm";

export interface AlertCardProps {
  tone: AlertTone;
  /** What happened. Short. */
  title: string;
  /** One line: what to do about it. */
  message?: ReactNode;
  /** Overrides the tone's own glyph. An inert <svg> using currentColor. */
  icon?: ReactNode;
  /** Usually kit Buttons, primary LAST. Centred under the message. */
  actions?: ReactNode;
  emphasis?: AlertEmphasis;
}

export function AlertCard({
  tone,
  title,
  message,
  icon,
  actions,
  emphasis = "quiet",
}: AlertCardProps) {
  return (
    <div className="ui-alert-card" data-tone={tone} data-emphasis={emphasis}>
      <span className="ui-alert-card-icon" aria-hidden="true">
        {icon ?? <AlertIcon tone={tone} />}
      </span>
      <div className="ui-alert-card-title">{title}</div>
      {message != null && <div className="ui-alert-card-message">{message}</div>}
      {actions != null && <div className="ui-alert-card-actions">{actions}</div>}
    </div>
  );
}
