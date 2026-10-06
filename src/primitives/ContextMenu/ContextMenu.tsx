"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, ReactNode } from "react";
import { createPortal } from "react-dom";
import { scaleRootProps, useScale } from "../Scale/Scale";
import "./ContextMenu.css";

/**
 * ContextMenu — the house right-click menu.
 *
 * THE HOUSE RULE (Josh, 2026-07-25): when you change something ABOUT a
 * specific thing on screen — a line, a row, a card, a node — the way in is a
 * right-click menu on that thing. Not the OS menu, not a modal, not a toolbar
 * the eye has to travel to. The first one shipped on the Whiteboard's lines
 * and he asked for it everywhere: "let's document that we wanna use these
 * right click pop ups when we wanna change something."
 *
 * WHAT BELONGS IN ONE: operations on the thing you clicked. Choices show a
 * tick on the CURRENT value, so the menu also answers "what is this now?"
 * without changing anything. What does NOT belong: navigation, anything
 * needing typed input (that is a Modal), or a duplicate of the only path to an
 * action — a mouse user must be able to SEE the action somewhere too.
 *
 * PORTALED to document.body: a menu clipped by its container's overflow is the
 * bug this avoids, and the canvas it was born on is overflow:hidden. Position
 * is fixed to the pointer, then clamped back inside the window once the real
 * size is known — a menu opened near an edge flips in rather than hanging off.
 *
 * KEYBOARD: opens focused, arrows move between enabled items, Home/End jump,
 * Enter or Space activates, Escape closes. Right-click is a mouse gesture, so
 * a keyboard user needs the same operations reachable another way — the menu
 * is a shortcut over an existing path, never the only door.
 */

export type ContextMenuItem =
  /** A plain operation. `danger` paints it as destructive. */
  | { kind: "action"; label: string; onSelect: () => void; disabled?: boolean; danger?: boolean }
  /** One option of a set — ticked when it is the current value. */
  | { kind: "choice"; label: string; selected: boolean; onSelect: () => void; disabled?: boolean }
  /** A quiet caption over a group. */
  | { kind: "heading"; label: string }
  /** A hairline between groups. */
  | { kind: "separator" };

export interface ContextMenuProps {
  /** Viewport coordinates the pointer opened it at (event.clientX / Y). */
  x: number;
  y: number;
  /** Names what the menu acts on — "Line", "3 Lines", "Task". */
  title?: string;
  items: ContextMenuItem[];
  onClose: () => void;
  /**
   * Render in place instead of at the pointer: no portal, no positioning, no
   * dismissal, no focus grab. For SHOWING a menu rather than using one — the
   * Design gallery's specimen, so the primitive is visible at rest like every
   * other one. Never use it for a real menu.
   */
  inline?: boolean;
}

/** Items a pointer or key can land on — headings and separators are skipped. */
function isSelectable(item: ContextMenuItem): boolean {
  return (item.kind === "action" || item.kind === "choice") && !item.disabled;
}

export function ContextMenu({ x, y, title, items, onClose, inline }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  // Portalled out of any <Scale>, so the floating menu carries the scale itself;
  // an inline menu is still inside it and simply inherits.
  const scale = useScale();
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [pos, setPos] = useState({ x, y, ready: false });

  // Clamp into the window once measured. Rendered invisible for that first
  // frame (ready=false) so nothing is ever seen in the wrong place.
  useEffect(() => {
    if (inline) return;
    const el = ref.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    setPos({
      x: Math.max(8, Math.min(x, window.innerWidth - width - 8)),
      y: Math.max(8, Math.min(y, window.innerHeight - height - 8)),
      ready: true,
    });
  }, [x, y, inline]);

  // Focus the first selectable item on open — the menu is usable from the
  // keyboard the moment it appears.
  useEffect(() => {
    // Never on an inline specimen — it would yank focus on page load.
    if (inline) return;
    const first = items.findIndex(isSelectable);
    if (first !== -1) itemRefs.current[first]?.focus();
  }, [items, inline]);

  const move = useCallback(
    (from: number, step: number) => {
      const n = items.length;
      for (let i = 1; i <= n; i++) {
        const at = (from + step * i + n * n) % n;
        if (isSelectable(items[at])) {
          itemRefs.current[at]?.focus();
          return;
        }
      }
    },
    [items],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        move(index, 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        move(index, -1);
      } else if (e.key === "Home") {
        e.preventDefault();
        move(-1, 1);
      } else if (e.key === "End") {
        e.preventDefault();
        move(items.length, -1);
      }
    },
    [move, items.length],
  );

  // Escape, or a press anywhere outside. Capture phase so the menu closes
  // before whatever was clicked reacts to the same press.
  useEffect(() => {
    if (inline) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as globalThis.Node)) onClose();
    };
    // Scrolling or resizing moves the thing out from under the menu.
    const onAway = () => onClose();
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("mousedown", onDown, true);
    window.addEventListener("resize", onAway);
    window.addEventListener("blur", onAway);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("mousedown", onDown, true);
      window.removeEventListener("resize", onAway);
      window.removeEventListener("blur", onAway);
    };
  }, [onClose, inline]);

  const pick = (run: () => void) => {
    // Close FIRST: the handler may unmount whatever the menu was pointing at.
    onClose();
    run();
  };

  const panel = (
    <div
      ref={ref}
      className={`ui-cmenu${inline ? " is-inline" : ""}`}
      role="menu"
      aria-label={title ?? "Menu"}
      {...(inline
        ? { style: undefined }
        : scaleRootProps(scale, { left: pos.x, top: pos.y, visibility: pos.ready ? "visible" : "hidden" }))}
      // The house menu replaces the OS one wherever it opens, including on
      // itself — a native menu over this would be the exact thing it exists
      // to avoid.
      onContextMenu={(e: ReactMouseEvent) => e.preventDefault()}
    >
      {title && <div className="ui-cmenu-title">{title}</div>}
      {items.map((item, i) => {
        if (item.kind === "separator") return <div key={i} className="ui-cmenu-sep" />;
        if (item.kind === "heading")
          return (
            <div key={i} className="ui-cmenu-heading">
              {item.label}
            </div>
          );
        const checked = item.kind === "choice" && item.selected;
        return (
          <button
            key={i}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            type="button"
            role={item.kind === "choice" ? "menuitemradio" : "menuitem"}
            {...(item.kind === "choice" ? { "aria-checked": item.selected } : {})}
            className={`ui-cmenu-item${checked ? " is-on" : ""}${
              item.kind === "action" && item.danger ? " is-danger" : ""
            }`}
            disabled={item.disabled}
            tabIndex={-1}
            onKeyDown={(e) => onKeyDown(e, i)}
            onClick={() => pick(item.onSelect)}
          >
            <span className="ui-cmenu-tick" aria-hidden="true">
              {checked ? <TickGlyph /> : null}
            </span>
            {item.label}
          </button>
        );
      })}
    </div>
  );

  return inline ? panel : createPortal(panel, document.body);
}

/** The tick on a chosen option — inert, currentColor, sized to the row. */
function TickGlyph(): ReactNode {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * useContextMenu — the state every right-click menu needs, so no caller
 * rewrites it: what was clicked, and where the pointer was.
 *
 *   const menu = useContextMenu<Task>();
 *   <Row onContextMenu={(e) => menu.openAt(e, task)} />
 *   {menu.at && <ContextMenu x={menu.at.x} y={menu.at.y} items={…} onClose={menu.close} />}
 *
 * openAt calls preventDefault for you — that is what replaces the OS menu.
 */
export function useContextMenu<T>() {
  const [at, setAt] = useState<{ x: number; y: number; target: T } | null>(null);
  const openAt = useCallback((e: ReactMouseEvent, target: T) => {
    e.preventDefault();
    e.stopPropagation();
    setAt({ x: e.clientX, y: e.clientY, target });
  }, []);
  const close = useCallback(() => setAt(null), []);
  return { at, openAt, close };
}
