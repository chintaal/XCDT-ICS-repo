"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useSystemStore } from "@/lib/store/system-store";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatFixed } from "@/lib/utils";
import { useTickingNow } from "@/lib/hooks/use-ticking-now";

export function ScoreChart() {
  const history = useSystemStore((s) => s.history);
  const systemState = useSystemStore((s) => s.systemState);
  const now = useTickingNow(1000);

  const data = useMemo(
    () =>
      history.map((p, i) => ({
        idx: i,
        t: p.t,
        score: p.score,
        threshold: p.threshold,
        isAlert: p.isAlert,
      })),
    [history],
  );

  const stroke =
    systemState === "alert"
      ? "var(--color-state-alert)"
      : systemState === "elevated"
        ? "var(--color-state-warn)"
        : "var(--color-accent-400)";

  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <div className="flex flex-col gap-1">
          <CardTitle>Anomaly timeline</CardTitle>
          <CardSubtitle>
            {history.length > 0
              ? `${history.length} samples · last ${Math.round(
                  (now - history[0].t) / 1000,
                )}s`
              : "Awaiting first sample"}
          </CardSubtitle>
        </div>
        <Badge variant="outline" className="font-mono">
          {history.length > 0
            ? formatFixed(history[history.length - 1].score, 2)
            : "—"}
        </Badge>
      </CardHeader>

      <CardContent className="px-1 pt-1 pb-2">
        <div className="h-[220px] w-full">
        {data.length < 2 ? (
          <ChartEmpty />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 6, right: 14, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="score-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"  stopColor={stroke} stopOpacity={0.32} />
                  <stop offset="65%" stopColor={stroke} stopOpacity={0.06} />
                  <stop offset="100%" stopColor={stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                stroke="var(--color-border-subtle)"
                strokeDasharray="2 4"
              />
              <XAxis dataKey="idx" hide />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--color-fg-quaternary)", fontFamily: "var(--font-mono)" }}
                axisLine={false}
                tickLine={false}
                width={48}
                domain={["auto", "auto"]}
              />
              <Tooltip
                cursor={{ stroke: "var(--color-border-strong)", strokeDasharray: "3 3" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload as (typeof data)[number];
                  return (
                    <div className="surface-3 rounded-md px-3 py-2 text-[11px] space-y-0.5">
                      <div className="text-[var(--color-fg-tertiary)] font-mono tabular-nums">
                        {new Date(p.t).toLocaleTimeString()}
                      </div>
                      <div className="font-mono tabular-nums text-[var(--color-fg-primary)]">
                        score · {formatFixed(p.score, 3)}
                      </div>
                      <div className="font-mono tabular-nums text-[var(--color-fg-tertiary)]">
                        threshold · {formatFixed(p.threshold, 3)}
                      </div>
                    </div>
                  );
                }}
              />
              {data[0]?.threshold !== undefined && (
                <ReferenceLine
                  y={data[data.length - 1].threshold}
                  stroke="var(--color-state-alert)"
                  strokeDasharray="3 3"
                  strokeOpacity={0.55}
                  strokeWidth={1}
                />
              )}
              <Area
                type="monotone"
                dataKey="score"
                stroke={stroke}
                strokeWidth={1.5}
                fill="url(#score-fill)"
                isAnimationActive={false}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
        </div>
      </CardContent>
    </Card>
  );
}

function ChartEmpty() {
  return (
    <div className="h-full flex items-center justify-center grid-dots">
      <div className="text-center">
        <div className="text-xs font-medium tracking-tight text-[var(--color-fg-secondary)]">
          Stream not yet open
        </div>
        <div className="text-[11px] text-[var(--color-fg-tertiary)] mt-1">
          Start an inference run to populate the timeline.
        </div>
      </div>
    </div>
  );
}
