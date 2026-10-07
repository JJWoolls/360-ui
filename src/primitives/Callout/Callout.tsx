import type { ReactNode } from "react";
import type { AlertTone } from "../AlertCard/AlertCard";
import { AlertIcon } from "../AlertCard/AlertIcon";
import { Button } from "../Button/Button";
import "./Callout.css";

/**
 * Callout — a short notice INSIDE a form or a page, left-aligned, in the flow
 * of the content it is about.
 *
 * WHICH ALERT TO REACH FOR. The alert family shares one tone vocabulary and one
 * set of glyphs; what differs is where the message sits and what it stops:
 *
 *   Callout     — a notice about the thing in front of the person: a form that
 *                 would not save, a field combination that is not allowed, a
 *                 heads-up above a section. The rest of the page keeps working,
 *                 so the notice reads like a line of the page, not an event.
 *   ErrorPanel  — the whole area failed to load. There is nothing else to show,
 *                 so the failure takes the area's place, centred.
 *   AlertDialog — a decision the person must make before going on. Centred,
 *                 modal, stops the screen.
 *   Toast       — something happened elsewhere or after the fact and needs no
 *                 answer. Pops out in the corner and leaves.
 *
 * A failed save in a form is a Callout, not a Toast: the person is looking at
 * the form, and the reason belongs next to what they need to change. It stays
 * until the cause is fixed or it is dismissed.
 *
 * WHY LEFT-ALIGNED AND NOT THE CARD. The AlertCard is centred because it stands
 * alone in an empty area. A Callout sits among labels and fields that read from
 * the left edge; a centred block there breaks the reading line.
 *
 * THE LOOK: a light wash of the tone, a low-strength tone edge and a tone
 * glyph. The words stay in the ordinary text colour — the tint says what kind,
 * the words must stay easy to read on any palette. No animation: it appears
 * where the person is already looking.
 *
 * ANNOUNCED BY TONE, as the Toast is: danger interrupts (role="alert"), the
 * others wait their turn (role="status").
 */

export interface CalloutProps {
  tone: AlertTone;
  /** What happened, in a few words. Bold, on its own line above the message. */
  title?: ReactNode;
  /** The message: what is wrong or worth knowing, and what to do. */
  children?: ReactNode;
  /** Overrides the tone's glyph (an inert <svg> using currentColor); `false` hides it. */
  icon?: ReactNode | false;
  /** One control at the right, usually a small kit Button ("Retry", "Review"). */
  action?: ReactNode;
  /** Shows a close button labelled "Dismiss". Omit for a notice that stays. */
  onDismiss?: () => void;
  className?: string;
}

export function Callout({
  tone,
  title,
  children,
  icon,
  action,
  onDismiss,
  className,
}: CalloutProps) {
  const glyph = icon === false ? null : icon ?? <AlertIcon tone={tone} />;

  return (
    <div
      className={className ? `ui-callout ${className}` : "ui-callout"}
      data-tone={tone}
      role={tone === "danger" ? "alert" : "status"}
    >
      {glyph != null && (
        <span className="ui-callout-icon" aria-hidden="true">
          {glyph}
        </span>
      )}
      <div className="ui-callout-text">
        {title != null && <div className="ui-callout-title">{title}</div>}
        {children != null && <div className="ui-callout-body">{children}</div>}
      </div>
      {(action != null || onDismiss) && (
        <div className="ui-callout-end">
          {action}
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              aria-label="Dismiss"
              onClick={onDismiss}
              icon={
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              }
            />
          )}
        </div>
      )}
    </div>
  );
}
