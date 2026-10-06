"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { Toast, type ToastTone } from "./Toast";
import { scaleRootProps, useScale, type ScaleValue } from "../Scale/Scale";
import "./Toaster.css";

/**
 * Toaster + useToast — the corner pop-out, placed, stacked and timed.
 *
 * The Toast draws one notice; this decides WHERE and FOR HOW LONG, so no
 * screen has to. Mount <Toaster> once near the app root, then anywhere below:
 *
 *   const { toast } = useToast();
 *   toast({ tone: "danger", title: "Couldn't save", body: "Check the connection and try again." });
 *
 * CORNER POP-OUTS ARE FOR THINGS THAT NEED NO ANSWER. A choice belongs in an
 * AlertDialog; a failed page belongs in an ErrorPanel. A toast that asks a
 * question disappears before it is answered.
 *
 * TIMING:
 *   - danger stays until dismissed. A failure that vanishes on its own is a
 *     failure nobody read. `duration` does not override this.
 *   - everything else leaves after about five seconds, and the clock stops
 *     while the pointer is over it or focus is inside it — nobody should lose
 *     a notice halfway through reading it.
 *
 * AT MOST FOUR SHOW. A fifth pushes out the oldest notice that would have
 * timed out anyway. A danger notice is never pushed out: if four failures are
 * waiting, the newest wait their turn and appear as earlier ones are dismissed.
 */

export interface ToastOptions {
  tone?: ToastTone;
  /** What happened. Short. */
  title: string;
  /** What to do about it. */
  body?: string;
  /** Milliseconds before it leaves. Ignored for danger, which stays. */
  duration?: number;
}

export interface ToastApi {
  /** Raises a toast; returns its id so the caller can take it down early. */
  toast: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
}

export interface ToasterProps {
  children?: ReactNode;
}

interface ToastItem extends ToastOptions {
  id: string;
  /** The <Scale> in force where the toast was raised; the stack is portalled
      out of it, so each toast carries its own. */
  scale?: ScaleValue | null;
}

/** The context's shape: the public api, plus the raiser's scale on toast(). */
interface ToastContextValue {
  toast: (options: ToastOptions, scale?: ScaleValue | null) => string;
  dismiss: (id: string) => void;
}

const DEFAULT_DURATION = 5000;
const MAX_VISIBLE = 4;

const ToastContext = createContext<ToastContextValue | null>(null);

/** Module-level so ids stay unique even across two Toasters in one page. */
let sequence = 0;

const isSticky = (t: ToastItem) => (t.tone ?? "success") === "danger";

export function Toaster({ children }: ToasterProps) {
  const [items, setItems] = useState<ToastItem[]>([]);
  // The stack is portalled to <body>, which does not exist during a server
  // render. Wait for the first client effect before drawing it.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((options: ToastOptions, scale?: ScaleValue | null) => {
    sequence += 1;
    const id = `ui-toast-${sequence}`;
    setItems((prev) => {
      const next = [...prev, { ...options, id, scale }];
      // Over the limit: drop the oldest transient notices first. Danger ones
      // are never dropped — they queue instead (see the note above).
      while (next.length > MAX_VISIBLE) {
        const i = next.findIndex((t) => !isSticky(t));
        if (i === -1) break;
        next.splice(i, 1);
      }
      return next;
    });
    return id;
  }, []);

  const api = useMemo<ToastContextValue>(() => ({ toast, dismiss }), [toast, dismiss]);
  // A Toaster mounted inside a <Scale> sizes its stack to it.
  const scale = useScale();

  // The oldest four show; a queued danger notice appears as one ahead of it
  // is dismissed. Newest sits nearest the corner, where the eye goes.
  const visible = items.slice(0, MAX_VISIBLE);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {mounted &&
        visible.length > 0 &&
        createPortal(
          <div className="ui-toaster" {...scaleRootProps(scale)}>
            {visible.map((item) => (
              <ToasterItem key={item.id} item={item} dismiss={dismiss} />
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

function ToasterItem({
  item,
  dismiss,
}: {
  item: ToastItem;
  dismiss: (id: string) => void;
}) {
  const sticky = isSticky(item);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const paused = hovered || focused;

  // Time left, carried across pauses so a hover resumes the clock rather than
  // restarting it.
  const remaining = useRef(item.duration ?? DEFAULT_DURATION);

  const close = useCallback(() => dismiss(item.id), [dismiss, item.id]);

  useEffect(() => {
    if (sticky || paused) return;
    const started = Date.now();
    const timer = window.setTimeout(close, remaining.current);
    return () => {
      window.clearTimeout(timer);
      remaining.current -= Date.now() - started;
    };
  }, [sticky, paused, close]);

  return (
    <div
      className="ui-toaster-item"
      {...scaleRootProps(item.scale ?? null)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        // Focus moving between parts of the same toast is not leaving it.
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
    >
      <Toast tone={item.tone} title={item.title} body={item.body} onDismiss={close} />
    </div>
  );
}

/** Raise and dismiss toasts. Must be called beneath a <Toaster>. */
export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  // Toasts raised from inside a <Scale> carry it into the portalled stack.
  // Outside one the api is handed back as it is.
  const scale = useScale();
  const scoped = useMemo<ToastApi | null>(
    () => (api && scale ? { toast: (options) => api.toast(options, scale), dismiss: api.dismiss } : api),
    [api, scale],
  );
  if (!scoped) {
    throw new Error("useToast() must be called inside a <Toaster>. Mount one near the app root.");
  }
  return scoped;
}
