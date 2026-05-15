"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSystemStore } from "@/lib/store/system-store";
import { apiEndpoints } from "@/lib/api/endpoints";
import { KpiTile } from "./kpi-tile";

export function KpiStrip() {
  const current = useSystemStore((s) => s.current);
  const history = useSystemStore((s) => s.history);

  const stats = useQuery({
    queryKey: ["incident-stats"],
    queryFn: () => apiEndpoints.incidents.stats(),
    refetchInterval: 10_000,
  });

  const trend = useMemo(() => history.slice(-60).map((p) => p.score), [history]);

  const inferenceMs = current?.inference_time_ms ?? 0;
  const ratio = current && current.threshold > 0
    ? current.anomaly_score / current.threshold
    : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <KpiTile
        label="Current score"
        value={current ? current.anomaly_score.toFixed(2) : "—"}
        unit="anomaly"
        trend={trend}
        tone={current?.is_alert ? "alert" : ratio > 0.7 ? "warn" : "ok"}
      />
      <KpiTile
        label="Threshold ratio"
        value={current ? `${(ratio * 100).toFixed(0)}%` : "—"}
        tone={ratio > 1 ? "alert" : ratio > 0.7 ? "warn" : "ok"}
      />
      <KpiTile
        label="Inference latency"
        value={inferenceMs ? inferenceMs.toFixed(0) : "—"}
        unit="ms"
        tone={inferenceMs > 500 ? "warn" : "ok"}
      />
      <KpiTile
        label="Incidents (all time)"
        value={stats.data?.total != null ? String(stats.data.total) : "—"}
        unit={stats.data?.true_positives != null ? `${stats.data.true_positives} TP` : undefined}
      />
    </div>
  );
}
