"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import "./Tooltip.css";

/**
 * Tooltip — hover or keyboard focus, positioned on any of four sides, and it
 * moves itself out of the way rather than off the screen.
 *
 * THIS EXISTS TO KILL title=. The native attribute is banned by lint and this
 * is the replacement: title= cannot be styled, its ~1s delay is the browser's
 * choice rather than ours, it never appears on keyboard focus, and it is
 * invisible to touch entirely.
 *
 * A TOOLTIP IS NEVER THE ONLY COPY OF SOMETHING. It cannot be reached by touch
 * and it disappears on any interruption. If the user MUST read it, it belongs
 * on the page. This is for the nice-to-know ("Merges into Stow — 5 min away").
 *
 * `aria-describedby` is what makes it real for screen readers — the tip is a
 * description of the control, not a label. If the control has no visible text
 * at all, it needs its own aria-label; a description is not a name.
 *
 * PROVENANCE, 2026-07-27: this is the LMS's implementation promoted into the
 * kit, not the kit's own. The kit had a CSS-only tip that could only sit above
 * its control, on one line, with plain text. The LMS had 122 files importing a
 * richer one — four sides, off-screen flipping, multi-line, rich content — and
 * ~64 call sites positioning a tip somewhere other than above. Replacing that
 * with the simpler one would have been a visible downgrade across the app, so
 * the direction reversed: the better implementation came up, and the one thing
 * the kit's did better (keyboard focus and aria-describedby) came with it.
 *
 * WHY IT PORTALS: a tip rendered inside its trigger inherits `overflow: hidden`
 * from any scroller above it and gets clipped. Fixed positioning in a portal is
 * what lets a tip on a table row escape the table.
 */

export type TooltipPosition = "top" | "bottom" | "left" | "right";

export interface TooltipProps {
  /** The tip text. Also the accessible description, so it is required even when `content` renders instead. */
  label: string;
  /** Rich body — rendered in place of `label` when given. `label` still carries the meaning for assistive tech. */
  content?: ReactNode;
  /** Which side to prefer. It still flips if that side would run off the top. */
  position?: TooltipPosition;
  /** Hover dwell before it appears, in ms. Keyboard focus is immediate — a keyboard user has already committed. */
  delay?: number;
  /** The trigger wrapper's class. Defaults to shrink-to-fit; pass a block class to make the trigger fill its parent. */
  wrapperClassName?: string;
  /** Keep newlines in `label` and let the box grow downward. */
  multiline?: boolean;
  /** With multiline: do not wrap or cap the width — the box stretches to the longest line. */
  wide?: boolean;
  /** Force it open. For galleries and screenshots; never for real UI. */
  always?: boolean;
  /** The control being described. */
  children: ReactNode;
}

const OFFSET = 6;
const EDGE = 4;

export function Tooltip({
  label,
  content,
  position = "top",
  delay = 400,
  wrapperClassName = "ui-tip-host",
  multiline = false,
  wide = false,
  always = false,
  children,
}: TooltipProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);

  const show = useCallback(() => {
    timer.current = setTimeout(() => setVisible(true), delay);
  }, [delay]);

  // Focus does not wait. A keyboard user tabbing onto a control has already
  // committed to it; the dwell delay only exists to stop tips flashing at a
  // mouse crossing the screen.
  const showNow = useCallback(() => setVisible(true), []);

  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setVisible(false);
    setCoords(null);
  }, []);

  // Clear a pending timer on unmount, or a tip appears over a screen whose
  // trigger has already gone.
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  // An empty tip never opens. A conditional hint ("only while unpaid") can keep
  // one stable wrapper and pass "" when it has nothing to say, instead of the
  // caller mounting and unmounting the wrapper (which remounts the control).
  const empty = !label && content == null;
  const open = !empty && (visible || always);

  useEffect(() => {
    if (!open || !triggerRef.current) return;

    const place = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const tip = tipRef.current;
      const tw = tip?.offsetWidth ?? 0;
      const th = tip?.offsetHeight ?? 0;

      let top = 0;
      let left = 0;

      switch (position) {
        case "top":
          top = rect.top - th - OFFSET;
          left = rect.left + rect.width / 2 - tw / 2;
          break;
        case "bottom":
          top = rect.bottom + OFFSET;
          left = rect.left + rect.width / 2 - tw / 2;
          break;
        case "left":
          top = rect.top + rect.height / 2 - th / 2;
          left = rect.left - tw - OFFSET;
          break;
        case "right":
          top = rect.top + rect.height / 2 - th / 2;
          left = rect.right + OFFSET;
          break;
      }

      // Stay on screen. Horizontal clamps; vertical flips, because a tip
      // squashed against the top edge covers the thing it describes.
      if (left < EDGE) left = EDGE;
      if (left + tw > window.innerWidth - EDGE) left = window.innerWidth - tw - EDGE;
      if (top < EDGE) top = rect.bottom + OFFSET;

      setCoords({ top, left });
    };

    // Twice: once to get on screen, once after layout so the measured width is
    // real. Without the second pass a tip centres itself against a width of 0.
    place();
    const raf = requestAnimationFrame(place);
    return () => cancelAnimationFrame(raf);
  }, [open, position]);

  return (
    <span
      ref={triggerRef}
      className={wrapperClassName}
      // describedby only while it exists — pointing at an absent node tells a
      // screen reader there is a description and then gives it nothing.
      aria-describedby={open ? id : undefined}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={showNow}
      onBlur={hide}
    >
      {children}
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <span
            ref={tipRef}
            id={id}
            role="tooltip"
            className="ui-tip"
            data-multiline={multiline ? "" : undefined}
            data-wide={multiline && wide ? "" : undefined}
            // Excluded from in-app screenshots: a tip caught mid-hover in a
            // snapshot looks like part of the page.
            data-snapshot-exclude=""
            style={{
              top: coords?.top ?? -9999,
              left: coords?.left ?? -9999,
              opacity: coords ? 1 : 0,
            }}
          >
            {content ?? label}
          </span>,
          document.body,
        )}
    </span>
  );
}
