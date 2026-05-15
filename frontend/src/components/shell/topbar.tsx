"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Bell, Command, Volume2, VolumeX } from "lucide-react";
import { ConnectionIndicator } from "./connection-indicator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSystemStore } from "@/lib/store/system-store";
import { apiEndpoints } from "@/lib/api/endpoints";
import { cn } from "@/lib/utils";

export function Topbar() {
  const soundEnabled = useSystemStore((s) => s.soundEnabled);
  const toggleSound = useSystemStore((s) => s.toggleSound);
  const systemState = useSystemStore((s) => s.systemState);

  const status = useQuery({
    queryKey: ["inference-status"],
    queryFn: () => apiEndpoints.inference.status(),
    refetchInterval: 5_000,
  });

  return (
    <header
      className={cn(
        "flex h-14 shrink-0 items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-base)]/60 px-4 backdrop-blur-xl",
        systemState === "alert" &&
          "border-b-[color-mix(in_srgb,var(--color-state-alert)_30%,transparent)]",
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <ConnectionIndicator />
        {status.data?.dataset && (
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <span className="text-[var(--color-fg-tertiary)]">Dataset</span>
            <span className="font-medium tracking-tight text-[var(--color-fg-primary)]">
              {status.data.dataset}
            </span>
          </div>
        )}
        {status.data?.status && status.data.status !== "idle" && (
          <Badge
            variant={
              status.data.status === "running"
                ? "ok"
                : status.data.status === "error"
                  ? "alert"
                  : "warn"
            }
            className="hidden sm:inline-flex"
          >
            {status.data.status}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <CommandHint />
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSound}
          aria-label={soundEnabled ? "Mute alerts" : "Enable alert sound"}
          title={soundEnabled ? "Mute alerts" : "Enable alert sound"}
        >
          {soundEnabled ? <Volume2 strokeWidth={1.6} /> : <VolumeX strokeWidth={1.6} />}
        </Button>
        <Link href="/incidents" aria-label="Incidents">
          <Button variant="ghost" size="icon">
            <Bell strokeWidth={1.6} />
          </Button>
        </Link>
      </div>
    </header>
  );
}

function CommandHint() {
  return (
    <button
      type="button"
      onClick={() => {
        // Dispatch synthetic Cmd+K — the global handler accepts both metaKey & ctrlKey.
        window.dispatchEvent(
          new KeyboardEvent("keydown", { key: "k", metaKey: true, ctrlKey: true }),
        );
      }}
      className="hidden sm:inline-flex items-center gap-2 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]/60 px-2 py-1.5 text-[11px] text-[var(--color-fg-tertiary)] hover:text-[var(--color-fg-secondary)] hover:border-[var(--color-border-default)] transition-colors"
    >
      <Command size={11} strokeWidth={2} />
      <span className="tracking-tight">Search</span>
      <kbd className="font-mono tracking-tighter text-[10px] rounded border border-[var(--color-border-subtle)] bg-[var(--color-bg-base)] px-1 py-0.5">
        ⌘K
      </kbd>
    </button>
  );
}
