import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format a number with k/M suffix and configurable decimals. */
export function formatCompact(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(digits)}M`;
  if (abs >= 1_000)     return `${(value / 1_000).toFixed(digits)}k`;
  return value.toFixed(digits);
}

/** Format a number to N decimals, always showing them. */
export function formatFixed(value: number | null | undefined, digits = 2): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toFixed(digits);
}

/** Format an ISO timestamp as HH:MM:SS in local time. */
export function formatTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** Format an ISO timestamp as a short relative duration ("3m ago"). */
export function formatRelative(iso?: string | null, nowMs?: number): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return iso;
  const now = nowMs ?? Date.now();
  const diff = Math.max(0, now - t);
  if (diff < 60_000)         return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000)      return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000)     return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

/** Clamp a number between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Ratio of value vs threshold, clamped to [0, 1]. */
export function severityRatio(value: number, threshold: number): number {
  if (!threshold || threshold <= 0) return 0;
  return clamp(value / threshold, 0, 2) / 2;
}
