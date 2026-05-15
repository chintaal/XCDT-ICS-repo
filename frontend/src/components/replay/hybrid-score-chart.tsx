"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { InferenceRecord } from "@/lib/api/types";
import { contiguousAlertSpans } from "@/lib/replay-dashboard-utils";
import { formatFixed } from "@/lib/utils";

const EPS = 1e-6;

export interface HybridScoreChartProps {
  records: InferenceRecord[];
  threshold: number;
}

export function HybridScoreChart({ records, threshold }: HybridScoreChartProps) {
  const { rows, spans, hasMahal } = useMemo(() => {
    const rows = records.map((r) => ({
      ts: r.timestamp,
      fused: Math.max(r.anomaly_score, EPS),
      mahal:
        r.score_mahalanobis != null
          ? Math.max(Number(r.score_mahalanobis), EPS)
          : null as number | null,
      thr: Math.max(threshold, EPS),
    }));
    const hasMahal = rows.some((x) => x.mahal != null);
    const spans = contiguousAlertSpans(records);
    return { rows, spans, hasMahal };
  }, [records, threshold]);

  if (rows.length < 2) return null;

  return (
    <div className="h-[400px] w-full min-h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 8, right: 16, left: 4, bottom: 8 }}>
          <CartesianGrid stroke="var(--color-border-subtle)" strokeDasharray="3 6" vertical={false} />
          <XAxis
            dataKey="ts"
            tick={{ fontSize: 9, fill: "var(--color-fg-quaternary)", fontFamily: "var(--font-mono)" }}
            interval="preserveStartEnd"
            tickLine={false}
            axisLine={{ stroke: "var(--color-border-subtle)" }}
            label={{ value: "Simulation time", position: "insideBottom", offset: -4, fill: "var(--color-fg-tertiary)", fontSize: 10 }}
          />
          <YAxis
            scale="log"
            domain={["auto", "auto"]}
            tick={{ fontSize: 10, fill: "var(--color-fg-quaternary)", fontFamily: "var(--font-mono)" }}
            width={52}
            tickLine={false}
            axisLine={false}
            label={{
              value: "Latent distance (log)",
              angle: -90,
              position: "insideLeft",
              fill: "var(--color-fg-tertiary)",
              fontSize: 10,
            }}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border-default)",
              borderRadius: 8,
              fontSize: 11,
            }}
            content={({ active, label, payload }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="space-y-0.5 px-1 py-0.5">
                  <div className="font-mono text-[var(--color-fg-tertiary)] text-[10px]">{String(label)}</div>
                  {payload.map((p) => (
                    <div key={String(p.dataKey)} className="font-mono tabular-nums text-[11px] text-[var(--color-fg-primary)]">
                      <span style={{ color: p.color }}>{p.name}</span>
                      {typeof p.value === "number" ? ` · ${formatFixed(p.value, 4)}` : null}
                    </div>
                  ))}
                </div>
              );
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {spans.map((s, i) => (
            <ReferenceArea
              key={`${s.start}-${s.end}-${i}`}
              x1={s.start}
              x2={s.end}
              fill="var(--color-state-alert)"
              fillOpacity={0.18}
              strokeOpacity={0}
            />
          ))}
          {hasMahal && (
            <Line
              type="monotone"
              dataKey="mahal"
              name="Mahalanobis (encoder)"
              stroke="#9ca3af"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="4 3"
              connectNulls
            />
          )}
          <Line
            type="monotone"
            dataKey="fused"
            name="Fused score (Mahal + α·collapse)"
            stroke="var(--color-accent-400)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="thr"
            name={`Threshold (${formatFixed(threshold, 2)})`}
            stroke="var(--color-state-alert)"
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
