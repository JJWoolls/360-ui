"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toError } from "./useSaveState";

/* ============================================================================
   useKeyedSaveState — useSaveState for writes that belong to a ROW, not a form.
   ----------------------------------------------------------------------------
   WHY IT EXISTS. useSaveState holds one write at a time: a second run while
   one is in flight is ignored. That is right for a form's Save button and
   wrong for a grid, where ticking row 3 while row 2 is still saving is two
   different writes. Those screens were left hand-rolling their flags, and
   most failed with only a console log.

   THE CONTRACT — the same as useSaveState, per key.

     - `run(key, fn)` runs the write for that key (a row id, or `${id}:${field}`
       for a per-cell write). A second run on the SAME key while it is in
       flight is ignored (returns false). Different keys run together; there
       is no global busy guard.

     - `saving(key)` / `saved(key)` / `error(key)` read that key's state.
       `saved(key)` is true for `savedFor` ms after that key's write worked.
       `anySaving` is true while any key is in flight (e.g. a close guard).

     - `run` resolves true when `fn` resolved, false when it threw or was
       ignored; it never rejects. `fn` must THROW on failure.

     - `onError(err, key)` runs once per failure — where an app shows its toast.

     - Nothing is set after unmount.
   ========================================================================== */

export interface KeyedSaveStateOptions {
  /** How long `saved(key)` stays true after that key's write worked. Default 2000ms. */
  savedFor?: number;
  /** Called once per failed write. */
  onError?: (error: Error, key: string) => void;
  /** Called once per write that worked. */
  onSaved?: (key: string) => void;
}

export interface KeyedSaveState {
  /** That key's write is in flight. */
  saving: (key: string | number) => boolean;
  /** That key's write worked within the last `savedFor` ms. */
  saved: (key: string | number) => boolean;
  /** That key's last write failed. Cleared when its next write starts. */
  error: (key: string | number) => Error | null;
  /** Any key is in flight. */
  anySaving: boolean;
  /** Run a write for a key. True when it worked; false when it threw or was ignored. */
  run: (key: string | number, fn: () => Promise<unknown>) => Promise<boolean>;
  /** Clear `saved` and `error` for one key, or for every key. */
  reset: (key?: string | number) => void;
}

export function useKeyedSaveState(opts: KeyedSaveStateOptions = {}): KeyedSaveState {
  const [savingKeys, setSavingKeys] = useState<ReadonlySet<string>>(() => new Set());
  const [savedKeys, setSavedKeys] = useState<ReadonlySet<string>>(() => new Set());
  const [errors, setErrors] = useState<ReadonlyMap<string, Error>>(() => new Map());

  // A ref as well as state: two clicks in one frame both see the key idle.
  const busyRef = useRef<Set<string>>(new Set());
  const mountedRef = useRef(true);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    mountedRef.current = true;
    const timers = timersRef.current;
    return () => {
      mountedRef.current = false;
      timers.forEach(t => clearTimeout(t));
      timers.clear();
    };
  }, []);

  const without = <T,>(s: ReadonlySet<T>, k: T): ReadonlySet<T> => {
    if (!s.has(k)) return s;
    const n = new Set(s);
    n.delete(k);
    return n;
  };
  const withKey = <T,>(s: ReadonlySet<T>, k: T): ReadonlySet<T> => {
    if (s.has(k)) return s;
    const n = new Set(s);
    n.add(k);
    return n;
  };
  const clearTimer = (k: string) => {
    const t = timersRef.current.get(k);
    if (t) clearTimeout(t);
    timersRef.current.delete(k);
  };

  const run = useCallback(async (rawKey: string | number, fn: () => Promise<unknown>) => {
    const key = String(rawKey);
    if (busyRef.current.has(key)) return false;
    busyRef.current.add(key);
    clearTimer(key);
    setSavedKeys(s => without(s, key));
    setErrors(m => {
      if (!m.has(key)) return m;
      const n = new Map(m);
      n.delete(key);
      return n;
    });
    setSavingKeys(s => withKey(s, key));
    try {
      await fn();
      if (mountedRef.current) {
        setSavedKeys(s => withKey(s, key));
        timersRef.current.set(key, setTimeout(() => {
          timersRef.current.delete(key);
          if (mountedRef.current) setSavedKeys(s => without(s, key));
        }, optsRef.current.savedFor ?? 2000));
      }
      optsRef.current.onSaved?.(key);
      return true;
    } catch (thrown) {
      const err = toError(thrown);
      if (mountedRef.current) setErrors(m => new Map(m).set(key, err));
      optsRef.current.onError?.(err, key);
      return false;
    } finally {
      busyRef.current.delete(key);
      if (mountedRef.current) setSavingKeys(s => without(s, key));
    }
  }, []);

  const reset = useCallback((rawKey?: string | number) => {
    if (rawKey === undefined) {
      timersRef.current.forEach(t => clearTimeout(t));
      timersRef.current.clear();
      setSavedKeys(new Set());
      setErrors(new Map());
      return;
    }
    const key = String(rawKey);
    clearTimer(key);
    setSavedKeys(s => without(s, key));
    setErrors(m => {
      if (!m.has(key)) return m;
      const n = new Map(m);
      n.delete(key);
      return n;
    });
  }, []);

  const saving = useCallback((k: string | number) => savingKeys.has(String(k)), [savingKeys]);
  const saved = useCallback((k: string | number) => savedKeys.has(String(k)), [savedKeys]);
  const error = useCallback((k: string | number) => errors.get(String(k)) ?? null, [errors]);

  return { saving, saved, error, anySaving: savingKeys.size > 0, run, reset };
}
