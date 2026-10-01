import type { ReactNode } from "react";
import "./AlertCard.css";

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

/** The tone's own glyph — the same drawing vocabulary as the Toast's icons. */
function AlertIcon({ tone }: { tone: AlertTone }) {
  if (tone === "success") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          d="M20 6 L9 17 l-5 -5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (tone === "warn") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (tone === "info") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
        <path
          d="M12 8h.01M12 12v4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  // danger — an exclamation in a circle: "this stopped", not "this is closed".
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 7v6M12 17h.01"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
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
