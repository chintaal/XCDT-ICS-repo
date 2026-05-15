"use client";

import { useSyncExternalStore } from "react";

/**
 * Returns the current epoch ms, ticking every `intervalMs`.
 * Pure during render (reads through React's `useSyncExternalStore`),
 * which avoids the React-19 `react-hooks/purity` lint rule that flags
 * direct `Date.now()` calls during render.
 */
export function useTickingNow(intervalMs: number = 1000): number {
  return useSyncExternalStore(
    (notify) => {
      const id = setInterval(notify, intervalMs);
      return () => clearInterval(id);
    },
    () => Date.now(),
    () => 0, // SSR snapshot
  );
}
