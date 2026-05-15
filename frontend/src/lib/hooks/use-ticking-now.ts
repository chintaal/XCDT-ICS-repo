"use client";

import { useEffect, useState } from "react";

/**
 * Current epoch ms, advancing every `intervalMs`.
 *
 * Implemented with `useState` + `useEffect` instead of `useSyncExternalStore`:
 * - `getSnapshot: () => Date.now()` is invalid (new value every read → infinite renders).
 * - A ticking external store must still align `getServerSnapshot` with the client in
 *   Next.js SSR, or hydration recovery can thrash updates in React 19.
 */
export function useTickingNow(intervalMs: number = 1000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
