"use client";

/**
 * Mirrors the Zustand systemState into a `data-system-state` attribute
 * on <html>, so CSS attribute selectors can cascade visual changes
 * (alert-state warming, panel border tint, etc.).
 */

import { useEffect } from "react";
import { useSystemStore } from "@/lib/store/system-store";

export function SystemStateBinder() {
  const systemState = useSystemStore((s) => s.systemState);

  useEffect(() => {
    document.documentElement.setAttribute("data-system-state", systemState);
  }, [systemState]);

  return null;
}
