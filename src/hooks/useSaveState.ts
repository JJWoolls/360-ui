"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ============================================================================
   useSaveState — the one way a screen runs a write and says how it went.
   ----------------------------------------------------------------------------
   WHY IT EXISTS. Screens hand-roll `const [saving, setSaving] = useState()`
   around every write, and each copy gets a different part of it wrong:

     - the flag is never reset when the write throws, so the button spins
       forever and the person reloads to escape;
     - a second click while the first write is in flight sends it twice;
     - nothing is said when the write works, so the person cannot tell a save
       that landed from a click that did nothing;
     - the failure is logged to the console and never shown.

   This hook owns all of that once. The screen keeps owning WHAT it writes.

   THE CONTRACT.

     - `run(fn)` runs the write. While it is in flight `saving` is true and a
       second `run` is ignored (returns false) — one write per action at a
       time. Wire `saving` to the button's `loading`.

     - `run` resolves true when `fn` resolved, false when it threw (or was
       ignored). It never rejects, so `if (!(await save.run(...))) return` is
       safe. Anything the write produces is applied INSIDE `fn` — update the
       list there — so there is no "result or failure" value to untangle.

     - `fn` must THROW on failure. A client that returns `{ error }` instead
       of throwing has to be unwrapped inside `fn` (`if (error) throw error`),
       or the hook will report a failed write as saved.

     - `saved` is true for `savedFor` ms after a write that worked (default
       2000), for a short "Saved" on the button. It clears early if another
       write starts.

     - `error` is the last failure, always an Error (non-Error throws are
       wrapped so `.message` is readable). Cleared when the next write starts.
       `onError` runs once per failure — where an app shows its toast.

     - Nothing is set after unmount, so a save that closes its own modal is
       fine.
   ========================================================================== */

export interface SaveStateOptions {
  /** How long `saved` stays true after a write that worked. Default 2000ms. */
  savedFor?: number;
  /** Called once per failed write — where the app shows its error message. */
  onError?: (error: Error) => void;
  /** Called once per write that worked. */
  onSaved?: () => void;
}

export interface SaveState {
  /** A write is in flight. Wire to the button's `loading`. */
  saving: boolean;
  /** A write worked within the last `savedFor` ms. */
  saved: boolean;
  /** The last write failed. Cleared when the next write starts. */
  error: Error | null;
  /** Run a write. True when it worked; false when it threw or was ignored. */
  run: (fn: () => Promise<unknown>) => Promise<boolean>;
  /** Clear `saved` and `error`, e.g. when the form is edited again. */
  reset: () => void;
}

export function toError(thrown: unknown): Error {
  if (thrown instanceof Error) return thrown;
  if (thrown && typeof thrown === "object" && "message" in thrown) {
    const message = (thrown as { message: unknown }).message;
    if (typeof message === "string") {
      const err = new Error(message);
      (err as Error & { cause?: unknown }).cause = thrown;
      return err;
    }
  }
  return new Error(typeof thrown === "string" ? thrown : "Something went wrong");
}

export function useSaveState(opts: SaveStateOptions = {}): SaveState {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // A ref as well as state: two clicks in one frame both see `saving` false.
  const busyRef = useRef(false);
  const mountedRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const run = useCallback(async (fn: () => Promise<unknown>) => {
    if (busyRef.current) return false;
    busyRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    setSaved(false);
    setError(null);
    setSaving(true);
    try {
      await fn();
      if (mountedRef.current) {
        setSaved(true);
        timerRef.current = setTimeout(() => {
          if (mountedRef.current) setSaved(false);
        }, optsRef.current.savedFor ?? 2000);
      }
      optsRef.current.onSaved?.();
      return true;
    } catch (thrown) {
      const err = toError(thrown);
      if (mountedRef.current) setError(err);
      optsRef.current.onError?.(err);
      return false;
    } finally {
      busyRef.current = false;
      if (mountedRef.current) setSaving(false);
    }
  }, []);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSaved(false);
    setError(null);
  }, []);

  return { saving, saved, error, run, reset };
}
