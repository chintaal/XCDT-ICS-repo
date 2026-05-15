"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiEndpoints } from "@/lib/api/endpoints";
import { useSystemStore } from "@/lib/store/system-store";

export function SystemMeta() {
  const status = useQuery({
    queryKey: ["inference-status"],
    queryFn: () => apiEndpoints.inference.status(),
    refetchInterval: 5_000,
  });

  const current = useSystemStore((s) => s.current);
  const latency = current?.inference_time_ms;

  const items = [
    {
      label: "Status",
      value: status.data?.status ?? "—",
      tone: status.data?.status === "running" ? ("ok" as const)
            : status.data?.status === "error" ? ("alert" as const)
            : ("neutral" as const),
    },
    { label: "Dataset", value: status.data?.dataset ?? "—" },
    { label: "Sensors", value: status.data?.n_sensors != null ? String(status.data.n_sensors) : "—" },
    { label: "Pass", value: status.data?.pass_number ?? 0 },
    { label: "Total windows", value: status.data?.total_windows ?? 0 },
    { label: "Inference / window", value: latency ? `${latency.toFixed(0)} ms` : "—" },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-1">
          <CardTitle>Engine telemetry</CardTitle>
          <CardSubtitle>Direct from the FastAPI service</CardSubtitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5 pb-5">
        {items.map((it) => (
          <div
            key={it.label}
            className="flex items-center justify-between py-1.5 border-b border-[var(--color-border-faint)] last:border-0"
          >
            <span className="text-[11px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-tertiary)]">
              {it.label}
            </span>
            {"tone" in it ? (
              <Badge variant={it.tone}>{String(it.value)}</Badge>
            ) : (
              <span className="font-mono tabular-nums text-[12.5px] text-[var(--color-fg-primary)]">
                {String(it.value)}
              </span>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
