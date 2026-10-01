"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DependencyList,
  type Dispatch,
  type SetStateAction,
} from "react";

/* ============================================================================
   useAsyncData — the one way a screen loads its data.
   ----------------------------------------------------------------------------
   WHY IT EXISTS. Every screen used to hand-roll the same three pieces of state
   — data, loading, error — and an effect to fill them. Each copy got a
   different subset of it right. The usual failures:

     - the error was swallowed (logged, or never read), so a broken load looked
       exactly like an empty list: "nothing here" and "this broke" are
       different news and a person acts on them differently;
     - a slow first request finished AFTER a fast second one and overwrote the
       newer answer (switch a filter quickly and the list shows the old one);
     - a request finished after the screen had gone and set state on nothing;
     - a reload blanked the whole screen to a spinner and back.

   This hook owns all of that once. The screen keeps owning WHAT it fetches —
   the fetcher is an ordinary async function and the hook never looks inside
   it — and HOW it renders the three states (see AsyncBoundary).

   THE CONTRACT.

     - `loading` is true only while there is nothing loaded yet to show: the
       first load, or a reload after a failure that had nothing to keep. It is
       NOT true during a reload that keeps the previous data on screen — that
       is `refreshing`, so a page can show a quiet indicator without the
       content disappearing under a full-page loader.

     - Only the LATEST call can write. Each call takes a ticket; a result whose
       ticket is no longer the newest is dropped, and so is anything arriving
       after unmount. No AbortController is needed for correctness, which keeps
       the fetcher's signature plain.

     - It never throws to the page. A rejected fetcher becomes `error`, always
       an Error. Things that are thrown but are not Errors (a plain object with
       a `message`, as many client libraries reject with) are wrapped so the
       page can always read `error.message`.

     - `deps` re-run the fetch, exactly like an effect's dependency list: put
       the values the fetcher reads (an id, a filter) in it. The fetcher itself
       is read through a ref, so an inline arrow is fine and does not refetch
       on every render.

     - `setData` is for local edits after a mutation — change the row in place
       instead of refetching the world. `reload()` is for when the server is
       the only one who knows the new answer. reload() returns a promise that
       settles when the fetch does and never rejects, so `await reload()` is
       safe in a save handler.

   DESIGN CHOICES WORTH KNOWING.

     - Previous data is kept during a reload by default
       (`keepPreviousOnReload: true`). A screen whose old data would be WRONG
       to show next to the new inputs (a different record entirely) passes
       false, and the reload resets to `initial` and shows `loading` again.

     - `initial` is the value before the first load (an empty array, say).
       Passing it changes the type of `data` from `T | undefined` to `T`, so a
       list screen can map over `data` without a guard. Having an `initial`
       does NOT count as "loaded": `loading` is still true until the first
       fetch settles — an empty array that has not been fetched is not an
       empty list.

     - A new fetch clears `error` as it starts, so a retry moves the screen
       from ErrorPanel back to the loader, not from error to error.

     - `enabled: false` skips fetching (a required id not known yet) and
       leaves `loading` false. Turning it on fetches.

     - React 18 surface only: no `use()`, no transitions, so both consuming
       apps can run it.
   ========================================================================== */

export interface AsyncDataOptions<T> {
  /** The value before the first load. Passing it makes `data` non-optional. */
  initial?: T;
  /** Keep the current data on screen while a reload is in flight. Default true. */
  keepPreviousOnReload?: boolean;
  /** False skips fetching until it turns true. Default true. */
  enabled?: boolean;
}

export interface AsyncData<D> {
  data: D;
  /** Nothing loaded yet to show, and a fetch is in flight. */
  loading: boolean;
  /** A fetch is in flight while previous data stays on screen. */
  refreshing: boolean;
  /** The last fetch failed. Cleared when the next fetch starts. */
  error: Error | null;
  /** Fetch again. Settles when the fetch does; never rejects. */
  reload: () => Promise<void>;
  /** Edit the loaded data locally, e.g. after a mutation. */
  setData: Dispatch<SetStateAction<D>>;
}

/** Turn anything thrown into an Error the page can read `.message` from. */
function toError(thrown: unknown): Error {
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

export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  deps: DependencyList,
  opts: AsyncDataOptions<T> & { initial: T },
): AsyncData<T>;
export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  deps: DependencyList,
  opts?: AsyncDataOptions<T>,
): AsyncData<T | undefined>;
export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  deps: DependencyList,
  opts: AsyncDataOptions<T> = {},
): AsyncData<T | undefined> {
  const { initial, keepPreviousOnReload = true, enabled = true } = opts;

  const [data, setData] = useState<T | undefined>(initial);
  const [error, setError] = useState<Error | null>(null);
  const [inFlight, setInFlight] = useState(enabled);
  // "Has a fetch ever succeeded?" — what separates `loading` from `refreshing`.
  // State rather than a ref because it changes what the page renders.
  const [loaded, setLoaded] = useState(false);

  // The newest fetcher, so an inline arrow does not refetch every render.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  // The initial value at mount, for resetting when previous data is dropped.
  const initialRef = useRef(initial);

  // Ticket of the newest call; a result holding an older ticket is dropped.
  const ticketRef = useRef(0);
  const mountedRef = useRef(true);

  const run = useCallback(async (): Promise<void> => {
    const ticket = ++ticketRef.current;
    const isCurrent = () => mountedRef.current && ticket === ticketRef.current;

    setError(null);
    setInFlight(true);
    if (!keepPreviousOnReload) {
      setData(initialRef.current);
      setLoaded(false);
    }

    try {
      const result = await fetcherRef.current();
      if (!isCurrent()) return;
      setData(result);
      setLoaded(true);
    } catch (thrown) {
      if (!isCurrent()) return;
      setError(toError(thrown));
    } finally {
      if (isCurrent()) setInFlight(false);
    }
  }, [keepPreviousOnReload]);

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled) {
      // Invalidate anything still in flight from when it was enabled.
      ticketRef.current++;
      setInFlight(false);
      return;
    }
    void run();
    // The caller's deps decide when to refetch, as with useEffect itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, run, ...deps]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const reload = useCallback(() => run(), [run]);

  return {
    data,
    loading: inFlight && !loaded,
    refreshing: inFlight && loaded,
    error,
    reload,
    setData,
  };
}
