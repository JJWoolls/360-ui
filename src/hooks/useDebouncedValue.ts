"use client";

import { useEffect, useState } from "react";

/* ============================================================================
   useDebouncedValue — the one debounce for search-as-you-type.
   ----------------------------------------------------------------------------
   WHY IT EXISTS. Search boxes hand-roll setTimeout/clearTimeout around every
   keystroke, and each copy gets a different part of it wrong:

     - the old timer is not cleared on the next keystroke, so every keystroke
       fires its own query and the results flicker through each prefix;
     - the timer is not cleared on unmount, so it fires after the screen has
       gone and sets state on nothing;
     - the timeout id lives in a plain variable that is lost on re-render.

   This hook owns the timer once. The screen keeps owning WHAT it runs off the
   settled value.

   THE CONTRACT.

     - Returns `value` once it has stopped changing for `delayMs` (default
       300). Until then it returns the last settled value; on first render that
       is `value` itself, so the first query runs without waiting.

     - Every change restarts the wait; unmount cancels it. Nothing is set after
       the screen has gone.

     - Pair it with useAsyncData: put the debounced value in its deps, so the
       fetch runs off the settled value and useAsyncData's latest-call-wins
       covers any request still in flight.

     - It compares with Object.is, as an effect dependency does. Pass a
       primitive (the search string), not an object rebuilt every render, or
       the wait restarts on every render and never settles.
   ========================================================================== */

export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delayMs);
    // Runs before the next change's effect and on unmount: one timer at most.
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return settled;
}
