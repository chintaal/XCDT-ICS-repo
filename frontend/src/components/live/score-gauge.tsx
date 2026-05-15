"use client";

import { useMemo } from "react";
import { useSystemStore } from "@/lib/store/system-store";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { clamp, formatFixed } from "@/lib/utils";

const SIZE = 232;
const STROKE = 12;
const RADIUS = SIZE / 2 - STROKE;
const CIRC = 2 * Math.PI * RADIUS;

export function ScoreGauge() {
  const current = useSystemStore((s) => s.current);
  const history = useSystemStore((s) => s.history);
  const systemState = useSystemStore((s) => s.systemState);

  const score = current?.anomaly_score ?? 0;
  const threshold = current?.threshold ?? 1;
  const ratio = clamp(score / (threshold * 1.5), 0, 1);

  const delta60s = useMemo(() => {
    if (history.length < 2) return 0;
    const now = history[history.length - 1].score;
    // approximate "60s ago" by ~60 entries; if fewer, use first
    const past = history.length > 60 ? history[history.length - 61].score : history[0].score;
    return now - past;
  }, [history]);

  // Stroke dasharray fill
  const dashOffset = CIRC - ratio * CIRC * 0.85; // 85% sweep

  const accentColor =
    systemState === "alert"
      ? "var(--color-state-alert)"
      : systemState === "elevated"
        ? "var(--color-state-warn)"
        : "var(--color-accent-400)";

  return (
    <Card className="lg:col-span-2 row-span-2">
      <CardHeader>
        <CardTitle>Fused anomaly score</CardTitle>
        <Badge
          variant={
            systemState === "alert" ? "alert" : systemState === "elevated" ? "warn" : "ok"
          }
        >
          {systemState === "alert"
            ? "Anomaly"
            : systemState === "elevated"
              ? "Elevated"
              : "Nominal"}
        </Badge>
      </CardHeader>

      <CardContent className="flex flex-col items-center gap-4 pt-2 pb-6">
        <div className="relative" style={{ width: SIZE, height: SIZE }}>
          {/* Faint backplate ring */}
          <svg
            className="absolute inset-0 -rotate-[126deg]"
            width={SIZE}
            height={SIZE}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
          >
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              stroke="var(--color-bg-elevated)"
              strokeWidth={STROKE}
              fill="none"
              strokeDasharray={`${CIRC * 0.85} ${CIRC}`}
              strokeLinecap="round"
            />
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              stroke={accentColor}
              strokeWidth={STROKE}
              fill="none"
              strokeDasharray={`${CIRC * 0.85} ${CIRC}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 480ms cubic-bezier(0.22,1,0.36,1), stroke 300ms" }}
            />
          </svg>

          {/* Centerpiece — value */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--color-fg-tertiary)] mb-1.5">
              Anomaly
            </div>
            <AnimatedNumber
              value={score}
              decimals={score > 100 ? 0 : 2}
              className="text-[44px] font-semibold tracking-tighter text-[var(--color-fg-primary)] leading-none"
            />
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[var(--color-fg-tertiary)] tracking-tight">
              <span>Threshold</span>
              <span className="font-mono text-[var(--color-fg-secondary)]">
                {formatFixed(threshold, 2)}
              </span>
            </div>
          </div>
        </div>

        {/* Decomposition */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-[280px]">
          <SubScore
            label="Mahalanobis"
            value={current?.score_mahalanobis ?? 0}
            max={Math.max(threshold, 1)}
          />
          <SubScore
            label="Variance-collapse"
            value={current?.score_collapse ?? 0}
            max={Math.max(threshold, 1)}
          />
        </div>

        {/* Delta */}
        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-[var(--color-fg-tertiary)] uppercase tracking-[0.1em] font-medium">
            Δ 60s
          </span>
          <span
            className={
              "font-mono font-medium " +
              (delta60s > 0
                ? "text-[var(--color-state-warn)]"
                : "text-[var(--color-fg-secondary)]")
            }
          >
            {delta60s > 0 ? "+" : ""}
            {formatFixed(delta60s, 3)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function SubScore({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = clamp(value / max, 0, 1) * 100;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--color-fg-tertiary)]">
          {label}
        </span>
        <span className="font-mono text-[11px] tabular-nums text-[var(--color-fg-primary)]">
          {formatFixed(value, 2)}
        </span>
      </div>
      <div className="h-1 rounded-full bg-[var(--color-bg-elevated)] overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--color-accent-400)]"
          style={{
            width: `${pct}%`,
            transition: "width 400ms cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </div>
    </div>
  );
}
