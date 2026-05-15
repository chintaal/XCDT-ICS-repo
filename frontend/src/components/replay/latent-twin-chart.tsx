"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import type { InferenceRecord } from "@/lib/api/types";
import { formatFixed } from "@/lib/utils";

function scoreColor(score: number, minS: number, maxS: number): string {
  if (maxS <= minS) return "var(--color-accent-400)";
  const t = (score - minS) / (maxS - minS);
  const h = 210 - t * 150;
  const l = 42 + t * 18;
  return `hsl(${h} 70% ${l}%)`;
}

export interface LatentTwinChartProps {
  records: InferenceRecord[];
  latestIndex: number;
  isAlertNow: boolean;
}

export function LatentTwinChart({ records, latestIndex, isAlertNow }: LatentTwinChartProps) {
  const { traj, nowPt, minS, maxS } = useMemo(() => {
    const traj: { z1: number; z2: number; score: number; ts: string; recIdx: number }[] = [];
    records.forEach((r, recIdx) => {
      const lv = r.latent_vector_2d;
      if (Array.isArray(lv) && lv.length >= 2 && Number.isFinite(lv[0]) && Number.isFinite(lv[1])) {
        traj.push({
          z1: lv[0],
          z2: lv[1],
          score: r.anomaly_score,
          ts: r.timestamp,
          recIdx,
        });
      }
    });
    const scores = traj.map((p) => p.score);
    const minS = scores.length ? Math.min(...scores) : 0;
    const maxS = scores.length ? Math.max(...scores) : 1;
    const nowPt =
      traj.find((p) => p.recIdx === latestIndex) ?? traj[traj.length - 1] ?? null;
    return { traj, nowPt, minS, maxS };
  }, [records, latestIndex]);

  if (traj.length < 2) {
    return (
      <div className="h-[300px] flex items-center justify-center text-[12px] text-[var(--color-fg-tertiary)]">
        Waiting for latent 2D vectors in the stream …
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
          <CartesianGrid stroke="var(--color-border-subtle)" strokeDasharray="3 6" />
          <XAxis
            type="number"
            dataKey="z1"
            name="Z₁"
            tick={{ fontSize: 10, fill: "var(--color-fg-quaternary)", fontFamily: "var(--font-mono)" }}
            axisLine={{ stroke: "var(--color-border-subtle)" }}
            label={{ value: "Z₁", position: "bottom", offset: 0, fill: "var(--color-fg-tertiary)", fontSize: 10 }}
          />
          <YAxis
            type="number"
            dataKey="z2"
            name="Z₂"
            tick={{ fontSize: 10, fill: "var(--color-fg-quaternary)", fontFamily: "var(--font-mono)" }}
            axisLine={{ stroke: "var(--color-border-subtle)" }}
            label={{ value: "Z₂", angle: -90, position: "insideLeft", fill: "var(--color-fg-tertiary)", fontSize: 10 }}
          />
          <ZAxis range={[48, 48]} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const pl = payload[0].payload as { score?: number; ts?: string; z1?: number; z2?: number };
              return (
                <div
                  className="rounded-lg border border-[var(--color-border-default)] px-3 py-2 text-[11px]"
                  style={{ background: "var(--color-bg-elevated)" }}
                >
                  <div className="font-mono text-[var(--color-fg-tertiary)]">{pl.ts}</div>
                  <div className="font-mono tabular-nums text-[var(--color-fg-primary)]">
                    score · {formatFixed(pl.score ?? 0, 3)}
                  </div>
                  <div className="font-mono tabular-nums text-[var(--color-fg-quaternary)] text-[10px]">
                    z₁ {formatFixed(pl.z1 ?? 0, 4)} · z₂ {formatFixed(pl.z2 ?? 0, 4)}
                  </div>
                </div>
              );
            }}
          />
          <Scatter name="Trajectory" data={traj} fill="var(--color-accent-400)">
            {traj.map((entry, index) => (
              <Cell key={`c-${index}`} fill={scoreColor(entry.score, minS, maxS)} />
            ))}
          </Scatter>
          {nowPt && (
            <Scatter
              name={`Now (score ${formatFixed(nowPt.score, 2)})`}
              data={[nowPt]}
              fill={isAlertNow ? "var(--color-state-alert)" : "var(--color-fg-primary)"}
              shape={(props: { cx?: number; cy?: number }) => {
                const cx = props.cx ?? 0;
                const cy = props.cy ?? 0;
                const r = 11;
                return (
                  <polygon
                    points={`${cx},${cy - r} ${cx + r * 0.95},${cy + r * 0.35} ${cx + r * 0.6},${cy + r * 1.05} ${cx - r * 0.6},${cy + r * 1.05} ${cx - r * 0.95},${cy + r * 0.35}`}
                    fill={isAlertNow ? "var(--color-state-alert)" : "var(--color-fg-primary)"}
                    stroke={isAlertNow ? "var(--color-bg-base)" : "var(--color-state-alert)"}
                    strokeWidth={2}
                  />
                );
              }}
            />
          )}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
