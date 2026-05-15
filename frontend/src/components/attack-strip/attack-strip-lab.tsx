"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Loader2, Play, TestTube2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shell/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Segmented } from "@/components/ui/segmented";
import { apiEndpoints } from "@/lib/api/endpoints";
import type { AttackValidationSeries } from "@/lib/api/types";
import { formatFixed } from "@/lib/utils";

const COL = {
  clean: "#58a6ff",
  attack: "#f85149",
  threshold: "#ffa657",
  mahal: "#79c0ff",
  collapse: "#d2a8ff",
  deviation: "#f778ba",
  fused: "#7ee787",
} as const;

function nearestWindowIndex(row: number, centers: number[]): number {
  if (!centers.length) return 0;
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < centers.length; i++) {
        const d = Math.abs(centers[i] - row);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
  }
  return best;
}

export function AttackStripLab() {
  const datasetsQ = useQuery({
    queryKey: ["datasets"],
    queryFn: () => apiEndpoints.datasets.list(),
  });

  const [dataset, setDataset] = useState("SWaT");
  const [attackType, setAttackType] = useState<"freeze" | "offset" | "noise">("offset");
  const [sensor, setSensor] = useState("");
  const [nRows, setNRows] = useState(500);
  const [attackStart, setAttackStart] = useState(150);
  const [attackEnd, setAttackEnd] = useState(350);

  const [series, setSeries] = useState<AttackValidationSeries | null>(null);
  const [focusRow, setFocusRow] = useState(200);

  const runMut = useMutation({
    mutationFn: () =>
      apiEndpoints.attacks.validationSeries({
        dataset,
        attack_type: attackType,
        sensor: sensor.trim() || undefined,
        n_rows: nRows,
        attack_start: attackStart,
        attack_end: attackEnd,
      }),
    onSuccess: (data) => {
      setSeries(data);
      setFocusRow(Math.min(200, Math.max(0, data.n_rows - 1)));
      toast.success("Simulation complete", { description: `${data.attack_name} on ${data.target_sensor}` });
    },
    onError: (e: unknown) => {
      toast.error("Simulation failed", {
        description: e instanceof Error ? e.message : String(e),
      });
    },
  });

  const rawRows = useMemo(() => {
    if (!series) return [];
    return series.row_index.map((r, i) => ({
      r,
      clean: series.raw_clean[i] ?? 0,
      attacked: series.raw_attacked[i] ?? 0,
    }));
  }, [series]);

  const scoreRows = useMemo(() => {
    if (!series) return [];
    return series.window_center.map((c, i) => ({
      c,
      mahal: series.mahalanobis[i] ?? 0,
      collapse: series.collapse_weighted[i] ?? 0,
      deviation: series.deviation_weighted[i] ?? 0,
      fused: series.fused[i] ?? 0,
      threshold: series.threshold,
      inTopk: series.top_sensors_per_window[i]?.some((s) => s.sensor === series.target_sensor) ? 1 : 0,
      top1: series.top_sensors_per_window[i]?.[0]?.sensor === series.target_sensor ? 1 : 0,
    }));
  }, [series]);

  const peakIdx = useMemo(() => {
    if (!series?.fused.length) return 0;
    let m = -Infinity;
    let ix = 0;
    series.fused.forEach((v, i) => {
      if (v > m) {
        m = v;
        ix = i;
      }
    });
    return ix;
  }, [series]);

  const winI = series ? nearestWindowIndex(focusRow, series.window_center) : 0;

  const onChartClick = useCallback(
    (state: { activeLabel?: string | number }) => {
      if (state.activeLabel == null || !series) return;
      const v = Number(state.activeLabel);
      if (Number.isFinite(v)) setFocusRow(Math.round(Math.min(series.n_rows - 1, Math.max(0, v))));
    },
    [series],
  );

  const dsKeys = datasetsQ.data?.map((d) => d.key) ?? [];

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        eyebrow="Offline ML validation"
        title="Attack injection strip"
        description="Three synchronized panels matching validate_attack_injection.py: raw clean vs attacked, fused score components vs threshold, and per-window attribution. Pick a row index to inspect every value at that location."
        actions={
          <Button
            variant="primary"
            size="sm"
            disabled={runMut.isPending}
            onClick={() => runMut.mutate()}
          >
            {runMut.isPending ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" strokeWidth={1.8} />}
            Run simulation
          </Button>
        }
      />

      <div className="px-6 space-y-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[15px] flex items-center gap-2">
              <TestTube2 className="size-4 text-[var(--color-accent-400)]" strokeWidth={1.8} />
              Parameters
            </CardTitle>
            <CardSubtitle>Same defaults as the ML repo script (500 rows, attack 150–350)</CardSubtitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label>Dataset</Label>
              <select
                className="w-full h-9 rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-base)] px-2 text-[13px]"
                value={dataset}
                onChange={(e) => setDataset(e.target.value)}
              >
                {(dsKeys.length ? dsKeys : ["SWaT"]).map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5 lg:col-span-2">
              <Label>Attack type</Label>
              <Segmented<"freeze" | "offset" | "noise">
                value={attackType}
                onChange={setAttackType}
                options={[
                  { value: "freeze", label: "Freeze" },
                  { value: "offset", label: "Offset" },
                  { value: "noise", label: "Noise" },
                ]}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sensor-opt">Sensor (optional)</Label>
              <Input
                id="sensor-opt"
                placeholder="Auto: highest variance"
                value={sensor}
                onChange={(e) => setSensor(e.target.value)}
                className="font-mono text-[12px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="n-rows">N rows</Label>
              <Input
                id="n-rows"
                type="number"
                min={50}
                max={5000}
                value={nRows}
                onChange={(e) => setNRows(Number(e.target.value))}
                className="font-mono tabular-nums"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="atk-s">Attack start</Label>
              <Input
                id="atk-s"
                type="number"
                min={0}
                value={attackStart}
                onChange={(e) => setAttackStart(Number(e.target.value))}
                className="font-mono tabular-nums"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="atk-e">Attack end</Label>
              <Input
                id="atk-e"
                type="number"
                min={2}
                value={attackEnd}
                onChange={(e) => setAttackEnd(Number(e.target.value))}
                className="font-mono tabular-nums"
              />
            </div>
          </CardContent>
        </Card>

        {series && (
          <>
            <div className="flex flex-wrap items-center gap-3 text-[12px] text-[var(--color-fg-tertiary)]">
              <span className="font-medium text-[var(--color-fg-secondary)]">
                {series.attack_name} on {series.target_sensor}
              </span>
              <span className="font-mono">
                mag={formatFixed(series.magnitude, 4)} · ticks={series.ticks}
              </span>
              {series.detected ? (
                <Badge variant="ok" className="normal-case tracking-normal text-[11px]">
                  Detected
                </Badge>
              ) : (
                <Badge variant="warn" className="normal-case tracking-normal text-[11px]">
                  Below threshold
                </Badge>
              )}
            </div>

            <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[#0d1117]/90 overflow-hidden">
              {/* Panel 1 */}
              <div className="h-[200px] w-full border-b border-[var(--color-border-subtle)] px-2 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={rawRows}
                    margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                    onClick={onChartClick}
                  >
                    <CartesianGrid stroke="#21262d" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="r"
                      type="number"
                      domain={[0, series.n_rows - 1]}
                      tick={{ fill: "#8b949e", fontSize: 10 }}
                      label={{ value: "Row index", position: "insideBottom", offset: -2, fill: "#8b949e", fontSize: 10 }}
                    />
                    <YAxis
                      tick={{ fill: "#8b949e", fontSize: 10 }}
                      width={44}
                      label={{
                        value: `${series.target_sensor} (raw)`,
                        angle: -90,
                        position: "insideLeft",
                        fill: "#8b949e",
                        fontSize: 10,
                      }}
                    />
                    <Tooltip
                      contentStyle={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 8, fontSize: 11 }}
                      labelFormatter={(v) => `Row ${v}`}
                    />
                    <ReferenceArea
                      x1={series.attack_start}
                      x2={series.attack_end}
                      fill={COL.attack}
                      fillOpacity={0.15}
                      strokeOpacity={0}
                    />
                    <Line dataKey="clean" stroke={COL.clean} dot={false} strokeWidth={1} name="Clean" isAnimationActive={false} />
                    <Line dataKey="attacked" stroke={COL.attack} dot={false} strokeWidth={1.2} name="Attacked" isAnimationActive={false} />
                    <ReferenceLine x={focusRow} stroke="#f0f6fc" strokeDasharray="4 4" strokeOpacity={0.6} />
                    <Legend wrapperStyle={{ fontSize: 10, color: "#c9d1d9" }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Panel 2 */}
              <div className="h-[240px] w-full border-b border-[var(--color-border-subtle)] px-2 pt-2 relative">
                {series.detected && (
                  <div className="absolute right-3 top-3 z-10 rounded-md border border-[#7ee787]/50 bg-[#238636]/90 px-2.5 py-1 text-[11px] font-semibold text-[#7ee787]">
                    ✓ DETECTED
                  </div>
                )}
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={scoreRows}
                    margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                    onClick={onChartClick}
                  >
                    <CartesianGrid stroke="#21262d" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="c"
                      type="number"
                      domain={[0, series.n_rows - 1]}
                      tick={{ fill: "#8b949e", fontSize: 10 }}
                      label={{ value: "Row index", position: "insideBottom", offset: -2, fill: "#8b949e", fontSize: 10 }}
                    />
                    <YAxis
                      tick={{ fill: "#8b949e", fontSize: 10 }}
                      width={48}
                      label={{
                        value: "Anomaly score",
                        angle: -90,
                        position: "insideLeft",
                        fill: "#8b949e",
                        fontSize: 10,
                      }}
                    />
                    <Tooltip
                      contentStyle={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 8, fontSize: 11 }}
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div className="rounded-md border border-[#30363d] bg-[#161b22] px-2.5 py-1.5 text-[11px] font-mono">
                            <div className="text-[#8b949e] mb-1">center {String(label)}</div>
                            {payload.map((p) => (
                              <div key={String(p.dataKey)} className="tabular-nums text-[#c9d1d9]">
                                {p.name}: {typeof p.value === "number" ? formatFixed(p.value, 3) : String(p.value)}
                              </div>
                            ))}
                          </div>
                        );
                      }}
                    />
                    <ReferenceArea
                      x1={series.attack_start}
                      x2={series.attack_end}
                      fill={COL.attack}
                      fillOpacity={0.15}
                      strokeOpacity={0}
                    />
                    <Line dataKey="mahal" stroke={COL.mahal} dot={false} strokeWidth={1} name="Mahalanobis" isAnimationActive={false} />
                    <Line dataKey="collapse" stroke={COL.collapse} dot={false} strokeWidth={1} name="Collapse (×α)" isAnimationActive={false} />
                    <Line dataKey="deviation" stroke={COL.deviation} dot={false} strokeWidth={1} name="Deviation (×α)" isAnimationActive={false} />
                    <Line dataKey="fused" stroke={COL.fused} dot={false} strokeWidth={2} name="Fused score" isAnimationActive={false} />
                    <Line
                      dataKey="threshold"
                      stroke={COL.threshold}
                      strokeDasharray="5 4"
                      dot={false}
                      name={`Threshold (${formatFixed(series.threshold, 1)})`}
                      isAnimationActive={false}
                    />
                    {scoreRows[peakIdx] && (
                      <ReferenceDot
                        x={scoreRows[peakIdx].c}
                        y={scoreRows[peakIdx].fused}
                        r={5}
                        fill={COL.threshold}
                        stroke="#161b22"
                      />
                    )}
                    <ReferenceLine x={focusRow} stroke="#f0f6fc" strokeDasharray="4 4" strokeOpacity={0.6} />
                    <Legend wrapperStyle={{ fontSize: 9, color: "#c9d1d9" }} />
                  </ComposedChart>
                </ResponsiveContainer>
                <div
                  className="pointer-events-none absolute text-[10px] font-bold text-[#ffa657]"
                  style={{
                    left: "58%",
                    top: "18%",
                  }}
                >
                  Peak: {formatFixed(series.peak_fused, 1)}
                </div>
              </div>

              {/* Panel 3 */}
              <div className="h-[140px] w-full px-2 pt-2 pb-1">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={scoreRows}
                    margin={{ top: 4, right: 12, left: 0, bottom: 4 }}
                    onClick={onChartClick}
                  >
                    <CartesianGrid stroke="#21262d" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="c"
                      type="number"
                      domain={[0, series.n_rows - 1]}
                      tick={{ fill: "#8b949e", fontSize: 10 }}
                      label={{ value: "Row index", position: "insideBottom", offset: -2, fill: "#8b949e", fontSize: 10 }}
                    />
                    <YAxis
                      domain={[-0.05, 1.15]}
                      ticks={[0, 1]}
                      tickFormatter={(v) => (v >= 0.5 ? series.target_sensor : "Other")}
                      tick={{ fill: "#8b949e", fontSize: 10 }}
                      width={72}
                      label={{
                        value: "Attribution",
                        angle: -90,
                        position: "insideLeft",
                        fill: "#8b949e",
                        fontSize: 10,
                      }}
                    />
                    <Tooltip
                      contentStyle={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 8, fontSize: 11 }}
                    />
                    <ReferenceArea
                      x1={series.attack_start}
                      x2={series.attack_end}
                      fill={COL.attack}
                      fillOpacity={0.15}
                      strokeOpacity={0}
                    />
                    <Area
                      type="stepAfter"
                      dataKey="inTopk"
                      stroke={COL.fused}
                      fill={COL.fused}
                      fillOpacity={0.28}
                      name={`${series.target_sensor} in top-k`}
                      isAnimationActive={false}
                    />
                    <Area
                      type="stepAfter"
                      dataKey="top1"
                      stroke={COL.fused}
                      fill={COL.fused}
                      fillOpacity={0.55}
                      name={`${series.target_sensor} is #1`}
                      isAnimationActive={false}
                    />
                    <ReferenceLine x={focusRow} stroke="#f0f6fc" strokeDasharray="4 4" strokeOpacity={0.6} />
                    <Legend wrapperStyle={{ fontSize: 10, color: "#c9d1d9" }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-[15px]">Selected location</CardTitle>
                <CardSubtitle>
                  Row index {focusRow} · nearest window center {formatFixed(series.window_center[winI] ?? 0, 1)} · stride{" "}
                  {series.stride} · window length {series.window_len}
                </CardSubtitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-[var(--color-fg-tertiary)]">
                    <span>Focus row index</span>
                    <span className="font-mono">{focusRow}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={series.n_rows - 1}
                    value={focusRow}
                    onChange={(e) => setFocusRow(Number(e.target.value))}
                    className="w-full accent-[var(--color-accent-500)]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[12px]">
                  <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)]/30 p-3 space-y-2">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-fg-tertiary)]">
                      Raw row
                    </div>
                    <div className="font-mono tabular-nums text-[var(--color-fg-primary)]">
                      clean · {formatFixed(series.raw_clean[focusRow] ?? 0, 4)}
                    </div>
                    <div className="font-mono tabular-nums text-[var(--color-fg-primary)]">
                      attacked · {formatFixed(series.raw_attacked[focusRow] ?? 0, 4)}
                    </div>
                  </div>
                  <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)]/30 p-3 space-y-2">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-fg-tertiary)]">
                      Window scores (nearest center)
                    </div>
                    <div className="font-mono tabular-nums text-[var(--color-fg-primary)]">
                      fused · {formatFixed(series.fused[winI] ?? 0, 3)} (thr {formatFixed(series.threshold, 2)})
                    </div>
                    <div className="font-mono tabular-nums text-[var(--color-fg-secondary)] text-[11px]">
                      mahal {formatFixed(series.mahalanobis[winI] ?? 0, 3)} · collapse×α{" "}
                      {formatFixed(series.collapse_weighted[winI] ?? 0, 3)} · dev×α{" "}
                      {formatFixed(series.deviation_weighted[winI] ?? 0, 3)}
                    </div>
                    <div className="text-[11px] text-[var(--color-fg-tertiary)]">
                      attr method · {series.attribution_method[winI] ?? "—"}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-base)] p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-fg-tertiary)] mb-2">
                    Top sensors at nearest window
                  </div>
                  <ul className="font-mono text-[11px] space-y-1 text-[var(--color-fg-secondary)]">
                    {(series.top_sensors_per_window[winI] ?? []).map((s, j) => (
                      <li key={`${s.sensor}-${j}`}>
                        {j + 1}. {s.sensor} · {formatFixed(s.score, 4)}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {!series && !runMut.isPending && (
          <Card>
            <CardContent className="py-8 text-center text-[13px] text-[var(--color-fg-tertiary)]">
              Run a simulation to load the strip. This calls the ML export script (torch + baseline fit) and may take up to a few
              minutes on CPU.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
