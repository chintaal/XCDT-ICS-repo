"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Server, Shield, SlidersHorizontal, Sparkles, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { apiEndpoints } from "@/lib/api/endpoints";
import { API_BASE_URL, WS_URL } from "@/lib/api/client";
import { useSystemStore } from "@/lib/store/system-store";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const qc = useQueryClient();
  const status = useQuery({
    queryKey: ["inference-status"],
    queryFn: () => apiEndpoints.inference.status(),
    refetchInterval: 5_000,
  });

  const [thresholdInput, setThresholdInput] = useState<string | null>(null);

  // Effective input value — uses operator's edit if any, else the live threshold.
  const effectiveInput =
    thresholdInput ??
    (status.data?.threshold != null ? String(status.data.threshold) : "");

  const thresholdMut = useMutation({
    mutationFn: (threshold: number) =>
      apiEndpoints.inference.setThreshold({ threshold }),
    onSuccess: () => {
      toast.success("Threshold updated.");
      qc.invalidateQueries({ queryKey: ["inference-status"] });
    },
    onError: (e) => toast.error("Could not update threshold", { description: String(e) }),
  });

  const soundEnabled = useSystemStore((s) => s.soundEnabled);
  const toggleSound = useSystemStore((s) => s.toggleSound);

  const health = useQuery({
    queryKey: ["health"],
    queryFn: () => apiEndpoints.health(),
    refetchInterval: 10_000,
  });

  return (
    <div className="flex flex-col gap-6 pb-10">
      <PageHeader
        eyebrow="System configuration"
        title="Settings"
        description="Tune the operating threshold, audio cues, and review the live system status."
      />

      <div className="px-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>
                <span className="inline-flex items-center gap-2">
                  <SlidersHorizontal size={11} strokeWidth={2} />
                  Threshold calibration
                </span>
              </CardTitle>
              <CardSubtitle>
                Override the operating threshold at runtime. Effect is immediate from the next emitted window.
              </CardSubtitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <Stat
                label="Active threshold"
                value={status.data?.threshold != null ? status.data.threshold.toFixed(3) : "—"}
              />
              <Stat
                label="Engine status"
                value={status.data?.status ?? "—"}
                tone={status.data?.status === "running" ? "ok" : "neutral"}
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-[var(--color-border-faint)]">
              <Label htmlFor="threshold-input">New threshold</Label>
              <div className="flex gap-2">
                <Input
                  id="threshold-input"
                  type="number"
                  min={0}
                  step={0.1}
                  value={effectiveInput}
                  onChange={(e) => setThresholdInput(e.target.value)}
                  className="font-mono tabular-nums"
                  disabled={status.data?.status !== "running"}
                />
                <Button
                  variant="primary"
                  onClick={() => {
                    const n = Number(effectiveInput);
                    if (Number.isFinite(n) && n > 0) thresholdMut.mutate(n);
                  }}
                  disabled={
                    thresholdMut.isPending ||
                    status.data?.status !== "running" ||
                    !effectiveInput
                  }
                >
                  {thresholdMut.isPending ? <Loader2 className="animate-spin" /> : <Save size={14} />}
                  Apply
                </Button>
              </div>
              {status.data?.status !== "running" && (
                <p className="text-[11px] text-[var(--color-fg-tertiary)]">
                  Inference must be running to change the threshold at runtime.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>
                <span className="inline-flex items-center gap-2">
                  <Volume2 size={11} strokeWidth={2} />
                  Preferences
                </span>
              </CardTitle>
              <CardSubtitle>Per-session UI options</CardSubtitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Toggle
              label="Alert sound"
              description="Play a subtle tone when the system enters alert state."
              active={soundEnabled}
              onClick={toggleSound}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <div>
              <CardTitle>
                <span className="inline-flex items-center gap-2">
                  <Server size={11} strokeWidth={2} />
                  Connection
                </span>
              </CardTitle>
              <CardSubtitle>Backend service health and endpoints</CardSubtitle>
            </div>
            {health.data?.status === "ok" ? (
              <Badge variant="ok">
                <Sparkles size={11} />
                Healthy
              </Badge>
            ) : (
              <Badge variant="warn">
                <Shield size={11} />
                Unknown
              </Badge>
            )}
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Row label="API base URL" value={API_BASE_URL} mono />
            <Row label="WebSocket" value={WS_URL} mono />
            <Row label="Database" value={health.data?.db_ok ? "OK" : "—"} />
            <Row label="ML source" value={health.data?.ml_src_ok ? "OK" : "—"} />
            <Row label="Backend version" value={health.data?.version ?? "—"} mono />
            <Row label="Inference status" value={health.data?.inference_status ?? "—"} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "ok";
}) {
  return (
    <div className="tile px-3 py-2.5">
      <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--color-fg-tertiary)] mb-1">
        {label}
      </div>
      <div
        className={cn(
          "font-mono tabular-nums text-[16px] tracking-tight",
          tone === "ok" ? "text-[var(--color-state-ok)]" : "text-[var(--color-fg-primary)]",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-md bg-[var(--color-bg-base)]/50 border border-[var(--color-border-faint)]">
      <span className="text-[10.5px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-tertiary)]">
        {label}
      </span>
      <span
        className={cn(
          "text-[12px] truncate",
          mono ? "font-mono text-[var(--color-fg-secondary)]" : "text-[var(--color-fg-primary)]",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function Toggle({
  label,
  description,
  active,
  onClick,
}: {
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between gap-3 rounded-md border border-[var(--color-border-faint)] bg-[var(--color-bg-base)]/40 px-3 py-2.5 text-left hover:border-[var(--color-border-default)] transition-colors"
    >
      <div className="space-y-0.5 min-w-0">
        <div className="text-[12.5px] font-medium tracking-tight text-[var(--color-fg-primary)]">
          {label}
        </div>
        <div className="text-[11px] text-[var(--color-fg-tertiary)]">
          {description}
        </div>
      </div>
      <div
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
          active ? "bg-[var(--color-accent-500)]" : "bg-[var(--color-bg-elevated)]",
        )}
      >
        <span
          className={cn(
            "inline-block size-4 rounded-full bg-white transition-transform shadow-sm",
            active ? "translate-x-4" : "translate-x-0.5",
          )}
        />
      </div>
    </button>
  );
}
