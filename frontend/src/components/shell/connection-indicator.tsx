"use client";

import { useSystemStore } from "@/lib/store/system-store";
import { StatusDot } from "@/components/ui/dot";
import { useTickingNow } from "@/lib/hooks/use-ticking-now";
import { cn } from "@/lib/utils";

const labelMap = {
  connecting: "Connecting",
  live:       "Live",
  stale:      "Stale",
  offline:    "Offline",
} as const;

const toneMap = {
  connecting: "warn",
  live:       "ok",
  stale:      "warn",
  offline:    "alert",
} as const;

export function ConnectionIndicator({ className }: { className?: string }) {
  const status = useSystemStore((s) => s.connection);
  const lastMessageAt = useSystemStore((s) => s.lastMessageAt);
  const now = useTickingNow(1000);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]/60 px-2.5 py-1",
        className,
      )}
    >
      <StatusDot tone={toneMap[status]} pulse={status === "live"} size="xs" />
      <span className="text-[11px] font-medium tracking-tight text-[var(--color-fg-secondary)]">
        {labelMap[status]}
      </span>
      {lastMessageAt && status === "live" && (
        <span className="text-[10px] text-[var(--color-fg-quaternary)] tabular-nums">
          · {Math.max(0, Math.round((now - lastMessageAt) / 100) * 100 / 1000)}s
        </span>
      )}
    </div>
  );
}
