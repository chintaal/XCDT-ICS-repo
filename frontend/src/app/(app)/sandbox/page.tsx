"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Activity,
  Loader2,
  Plus,
  Shield,
  ShieldAlert,
  Snowflake,
  Sparkles,
  Target,
  Waves,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { apiEndpoints } from "@/lib/api/endpoints";
import { useSystemStore } from "@/lib/store/system-store";
import { cn, formatFixed } from "@/lib/utils";

const ATTACK_TYPE_META: Record<string, {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string;
  body: string;
}> = {
  freeze: {
    icon: Snowflake,
    label: "Freeze",
    body: "Holds the sensor at its last value, masking real changes.",
  },
  offset: {
    icon: Target,
    label: "Offset",
    body: "Adds a constant bias to the sensor stream.",
  },
  noise: {
    icon: Waves,
    label: "Noise",
    body: "Injects Gaussian noise scaled by magnitude.",
  },
};

export default function SandboxPage() {
  const qc = useQueryClient();
  const status = useQuery({
    queryKey: ["inference-status"],
    queryFn: () => apiEndpoints.inference.status(),
    refetchInterval: 4_000,
  });

  const attackTypesQ = useQuery({
    queryKey: ["attack-types"],
    queryFn: () => apiEndpoints.attacks.types(),
  });

  const attackStatus = useQuery({
    queryKey: ["attack-status"],
    queryFn: () => apiEndpoints.attacks.status(),
    refetchInterval: 1_500,
  });

  const sensors = useMemo(() => status.data?.sensor_cols ?? [], [status.data?.sensor_cols]);
  const isRunning = status.data?.status === "running";

  const [selectedSensor, setSelectedSensor] = useState<string>("");
  const [attackType, setAttackType] = useState<"freeze" | "offset" | "noise">("freeze");
  const [magnitude, setMagnitude] = useState<number>(1);
  const [duration, setDuration] = useState<number>(60);

  // Compute effective sensor in render — fall back to the first sensor
  // until the operator picks one.
  const effectiveSensor =
    selectedSensor && sensors.includes(selectedSensor)
      ? selectedSensor
      : sensors[0] ?? "";

  const injectMut = useMutation({
    mutationFn: () =>
      apiEndpoints.attacks.inject({
        sensor: effectiveSensor,
        attack_type: attackType,
        magnitude,
        duration_ticks: duration,
      }),
    onSuccess: () => {
      toast.success("Attack injected", {
        description: `${attackType} on ${effectiveSensor} · magnitude ${magnitude} · ${duration} ticks`,
      });
      qc.invalidateQueries({ queryKey: ["attack-status"] });
    },
    onError: (e) => toast.error("Could not inject", { description: String(e) }),
  });

  const clearMut = useMutation({
    mutationFn: () => apiEndpoints.attacks.clear(),
    onSuccess: () => {
      toast.success("Attack cleared.");
      qc.invalidateQueries({ queryKey: ["attack-status"] });
    },
  });

  const isAttackActive = Boolean((attackStatus.data as { active?: boolean })?.active);

  return (
    <div className="flex flex-col gap-6 pb-10">
      <PageHeader
        eyebrow="Red-team simulation"
        title="Attack sandbox"
        description="Inject controlled perturbations into the live sensor stream. Use this to probe model robustness, train operators, and reproduce known attack patterns."
        actions={
          isAttackActive ? (
            <Button
              variant="danger"
              size="sm"
              onClick={() => clearMut.mutate()}
              disabled={clearMut.isPending}
            >
              {clearMut.isPending ? <Loader2 className="animate-spin" /> : <XCircle strokeWidth={1.8} />}
              Clear active attack
            </Button>
          ) : (
            <Badge variant="outline">
              <Shield size={11} />
              Disarmed
            </Badge>
          )
        }
      />

      <div className="px-6 grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Attack configurator */}
        <div className="lg:col-span-3 space-y-5">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Attack type</CardTitle>
                <CardSubtitle>Choose how the perturbation should manipulate the stream.</CardSubtitle>
              </div>
            </CardHeader>
            <CardContent>
              {attackTypesQ.isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[120px]" />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(attackTypesQ.data ?? []).map((t) => {
                    const meta = ATTACK_TYPE_META[t.type] ?? {
                      icon: Sparkles,
                      label: t.type,
                      body: t.description,
                    };
                    const Icon = meta.icon;
                    const active = attackType === t.type;
                    return (
                      <button
                        key={t.type}
                        onClick={() => {
                          setAttackType(t.type as typeof attackType);
                          setMagnitude(t.example_magnitude);
                        }}
                        className={cn(
                          "tile text-left p-4 transition-all",
                          active
                            ? "border-[var(--color-accent-400)]/60 bg-[var(--color-bg-elevated)]"
                            : "hover:border-[var(--color-border-default)] hover:bg-[var(--color-bg-elevated)]/50",
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div
                            className={cn(
                              "size-8 rounded-md inline-flex items-center justify-center",
                              active
                                ? "bg-[color-mix(in_srgb,var(--color-accent-400)_18%,transparent)] text-[var(--color-accent-200)]"
                                : "bg-[var(--color-bg-base)] text-[var(--color-fg-secondary)]",
                            )}
                          >
                            <Icon size={16} strokeWidth={1.6} />
                          </div>
                          {active && <Badge variant="accent">selected</Badge>}
                        </div>
                        <div className="text-[14px] font-medium tracking-tight text-[var(--color-fg-primary)] mb-1">
                          {meta.label}
                        </div>
                        <div className="text-[11px] text-[var(--color-fg-tertiary)] leading-relaxed">
                          {meta.body}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Target & parameters</CardTitle>
                <CardSubtitle>Pick a sensor from the running pipeline and tune the perturbation.</CardSubtitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isRunning ? (
                <EmptyState
                  icon={<ShieldAlert />}
                  title="Inference must be running"
                  description="Start an inference run on the Live Operations page or Datasets page first."
                />
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label>Sensor ({sensors.length} available)</Label>
                    <SensorPicker
                      sensors={sensors}
                      value={effectiveSensor}
                      onChange={setSelectedSensor}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="magnitude">Magnitude</Label>
                      <Input
                        id="magnitude"
                        type="number"
                        min={0}
                        step={0.1}
                        value={magnitude}
                        onChange={(e) => setMagnitude(Number(e.target.value))}
                        className="font-mono tabular-nums"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="duration">Duration (ticks)</Label>
                      <Input
                        id="duration"
                        type="number"
                        min={1}
                        max={10000}
                        step={1}
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                        className="font-mono tabular-nums"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      variant="accent"
                      onClick={() => injectMut.mutate()}
                      disabled={
                        !effectiveSensor || injectMut.isPending || isAttackActive
                      }
                    >
                      {injectMut.isPending ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Plus strokeWidth={1.8} />
                      )}
                      Inject attack
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Live monitor */}
        <div className="lg:col-span-2">
          <AttackMonitor isAttackActive={isAttackActive} attackData={attackStatus.data} />
        </div>
      </div>
    </div>
  );
}

function SensorPicker({
  sensors,
  value,
  onChange,
}: {
  sensors: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [filter, setFilter] = useState("");
  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return sensors.slice(0, 80);
    return sensors.filter((s) => s.toLowerCase().includes(q)).slice(0, 80);
  }, [filter, sensors]);

  return (
    <div className="space-y-2">
      <Input
        placeholder="Filter sensors…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="font-mono"
      />
      <div className="flex flex-wrap gap-1.5 max-h-[180px] overflow-y-auto pr-1">
        {filtered.map((s) => (
          <button
            key={s}
            onClick={() => onChange(s)}
            className={cn(
              "px-2 py-1 rounded font-mono text-[11px] tracking-tight border transition-colors",
              value === s
                ? "bg-[var(--color-bg-elevated)] border-[var(--color-accent-400)]/40 text-[var(--color-fg-primary)]"
                : "bg-transparent border-[var(--color-border-subtle)] text-[var(--color-fg-tertiary)] hover:text-[var(--color-fg-primary)] hover:border-[var(--color-border-default)]",
            )}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function AttackMonitor({
  isAttackActive,
  attackData,
}: {
  isAttackActive: boolean;
  attackData: Record<string, unknown> | undefined;
}) {
  const current = useSystemStore((s) => s.current);

  return (
    <Card className="h-full">
      <CardHeader>
        <div>
          <CardTitle>Live monitor</CardTitle>
          <CardSubtitle>System response to active attacks</CardSubtitle>
        </div>
        {isAttackActive ? (
          <Badge variant="alert">
            <Activity size={11} />
            Active
          </Badge>
        ) : (
          <Badge variant="outline">Idle</Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {isAttackActive ? (
          <motion.div
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-md bg-[color-mix(in_srgb,var(--color-state-alert)_8%,transparent)] border border-[color-mix(in_srgb,var(--color-state-alert)_25%,transparent)] p-3 space-y-2"
          >
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[var(--color-state-alert)] pulse-dot" />
              <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--color-state-alert)]">
                Injecting
              </span>
            </div>
            <div className="font-mono text-[12px] text-[var(--color-fg-primary)] space-y-1">
              {attackData &&
                ["sensor", "type", "magnitude", "duration_ticks"]
                  .filter((k) => attackData[k] != null)
                  .map((k) => (
                    <div key={k} className="flex items-center justify-between gap-2">
                      <span className="text-[var(--color-fg-tertiary)]">{k}</span>
                      <span className="text-[var(--color-fg-primary)]">{String(attackData[k])}</span>
                    </div>
                  ))}
            </div>
          </motion.div>
        ) : (
          <div className="rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-bg-base)]/50 p-3 text-[12px] text-[var(--color-fg-tertiary)]">
            No active attack. Configure parameters and inject to begin.
          </div>
        )}

        <div className="space-y-2.5 pt-3 border-t border-[var(--color-border-faint)]">
          <Stat label="Live score" value={current ? formatFixed(current.anomaly_score, 2) : "—"} />
          <Stat label="Threshold" value={current ? formatFixed(current.threshold, 2) : "—"} />
          <Stat
            label="Above threshold"
            value={current ? (current.is_alert ? "Yes" : "No") : "—"}
            tone={current?.is_alert ? "alert" : "neutral"}
          />
          <Stat
            label="Top contributor"
            value={current?.top_sensors?.[0]?.sensor ?? "—"}
            mono
          />
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  mono = true,
  tone = "neutral",
}: {
  label: string;
  value: string;
  mono?: boolean;
  tone?: "neutral" | "alert";
}) {
  return (
    <div className="flex items-center justify-between text-[12.5px]">
      <span className="text-[10.5px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-tertiary)]">
        {label}
      </span>
      <span
        className={cn(
          mono && "font-mono tabular-nums",
          tone === "alert" ? "text-[var(--color-state-alert)]" : "text-[var(--color-fg-primary)]",
        )}
      >
        {value}
      </span>
    </div>
  );
}
