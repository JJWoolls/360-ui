"use client";

import { useId } from "react";
import type { ReactNode } from "react";
import "./Tooltip.css";

/**
 * Tooltip — hover or keyboard focus, positioned above, with an arrow.
 *
 * THIS EXISTS TO KILL title=. The native attribute is banned by lint and this
 * is the replacement: title= cannot be styled, its ~1s delay is the browser's
 * choice rather than ours, it never appears on keyboard focus, and it is
 * invisible to touch entirely. Every one of those is a reason it had to go.
 *
 * A TOOLTIP IS NEVER THE ONLY COPY OF SOMETHING. It cannot be reached by touch
 * and it disappears on any interruption. If the user MUST read it, it belongs
 * on the page. This is for the nice-to-know ("Merges into Stow — 5 min away").
 *
 * `aria-describedby` is what makes it real for screen readers — the tip is a
 * description of the control, not a label. If the control has no visible text
 * at all, it needs its own aria-label; a description is not a name.
 *
 * Shown via CSS :hover/:focus-within rather than React state. The tip stays in
 * the DOM so aria-describedby always resolves, and no state means no re-render
 * on every mouse cross.
 */

export interface TooltipProps {
  /** The tip text. Short — it is one line and does not wrap. */
  label: string;
  /** Force it open. For galleries and screenshots; not for real UI. */
  always?: boolean;
  /** The control being described. */
  children: ReactNode;
}

export function Tooltip({ label, always = false, children }: TooltipProps) {
  const id = useId();

  return (
    <span className="ui-tip-host" aria-describedby={id}>
      <span className="ui-tip" id={id} role="tooltip" data-always={always || undefined}>
        {label}
      </span>
      {children}
    </span>
  );
}
