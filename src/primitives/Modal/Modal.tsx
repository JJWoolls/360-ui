"use client";

import { useCallback, useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import "./Modal.css";

/**
 * Modal — icon tile + title + close, body, actions bottom-right with the
 * primary last.
 *
 * STACKED MODALS WORK (Josh uses them — a picker opened from inside a form is
 * the normal case, not an edge case). That is the reason for the module-level
 * `stack` below: Escape must close the TOP modal only. Without it, one Escape
 * closes every modal in the pile at once, because each one hears the same
 * keydown on document.
 *
 * FOCUS: trapped while open, moved in on open, and returned to whatever was
 * focused before on close. The return matters more than it sounds — without it
 * focus lands back at the top of the document and a keyboard user has to tab
 * from the beginning to get back to where they were.
 *
 * Escape and backdrop both close. Neither is a substitute for the Cancel
 * button: an action a mouse user cannot see is an action they do not have.
 */

export type ModalTone = "brand" | "danger" | "warn" | "info" | "violet";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Glyph for the head tile. An inert <svg> using currentColor. */
  icon?: ReactNode;
  /** Tints the head tile. `danger` for destructive confirms. */
  iconTone?: ModalTone;
  /** Buttons. Bottom-right, primary LAST — the eye lands there. */
  footer?: ReactNode;
  /**
   * How wide the dialog is allowed to get, in px. Omit and it stays at the house
   * 460, which is right for a confirm and wrong for a form.
   *
   * This exists because the LMS has ~400 modal shells at widths chosen per
   * screen, and one width for all of them is not a standard, it is a regression.
   * It is a MAX, not a fixed size: the dialog is still 100% wide below it and
   * still refuses to grow past the window, so a number here can never push the
   * primary button off a narrow screen.
   */
  width?: number;
  children: ReactNode;
}

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "textarea:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/** Ids of every open modal, deepest last. Module-level: the stack is global. */
const stack: string[] = [];

function focusableIn(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    // A focusable element inside a display:none branch is not actually
    // focusable — offsetParent is the cheap way to ask.
    (el) => el.offsetParent !== null || el === document.activeElement,
  );
}

export function Modal({
  open,
  onClose,
  title,
  icon,
  iconTone = "brand",
  footer,
  width,
  children,
}: ModalProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const dialogRef = useRef<HTMLDivElement>(null);

  // Register in the stack while open, so Escape can find the top.
  useEffect(() => {
    if (!open) return;
    stack.push(id);
    return () => {
      const i = stack.lastIndexOf(id);
      if (i !== -1) stack.splice(i, 1);
    };
  }, [open, id]);

  // Move focus in, and put it back exactly where it was on close.
  useEffect(() => {
    if (!open) return;
    const restoreTo = document.activeElement as HTMLElement | null;
    const node = dialogRef.current;
    if (node) (focusableIn(node)[0] ?? node).focus();
    return () => restoreTo?.focus?.();
  }, [open]);

  // Lock the page behind the modal. Only the LAST modal to close unlocks it —
  // an inner modal closing must not restore scrolling to the one still open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      if (stack.length <= 1) document.body.style.overflow = prev;
    };
  }, [open]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Only the top modal reacts. This is what makes stacking work.
      if (stack[stack.length - 1] !== id) return;

      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key !== "Tab") return;

      const node = dialogRef.current;
      if (!node) return;
      const items = focusableIn(node);
      if (items.length === 0) {
        e.preventDefault();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      // Wrap at both ends — and pull focus back if it has escaped the dialog
      // entirely (it can, via the address bar or a stray programmatic focus).
      if (e.shiftKey && (active === first || !node.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !node.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    },
    [id, onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [open, onKeyDown]);

  if (!open) return null;

  return createPortal(
    <div
      className="ui-modal-overlay"
      // mousedown, not click: a click that STARTS inside the dialog and ends on
      // the backdrop (a drag across a text selection) must not close it.
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="ui-modal"
        // Overrides the stylesheet's max-width only when a caller asked. No
        // width prop means no inline style at all, so the house 460 stands.
        style={width == null ? undefined : { maxWidth: width }}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="ui-modal-head">
          {icon && (
            <span className="ui-modal-tile" data-tone={iconTone} aria-hidden="true">
              {icon}
            </span>
          )}
          <span className="ui-modal-title" id={titleId}>
            {title}
          </span>
          <button
            type="button"
            className="ui-modal-x"
            aria-label="Close"
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                d="M18 6L6 18M6 6l12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="ui-modal-body">{children}</div>

        {footer && <div className="ui-modal-foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
