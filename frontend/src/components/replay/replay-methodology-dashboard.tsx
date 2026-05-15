"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  CheckCircle2,
  FileWarning,
  Loader2,
  Play,
  Square,
  Terminal,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shell/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiEndpoints } from "@/lib/api/endpoints";
import { useSystemStore, RECORD_HISTORY_CAPACITY } from "@/lib/store/system-store";
import type { InferenceRecord } from "@/lib/api/types";
import { formatFixed } from "@/lib/utils";
import { HybridScoreChart } from "@/components/replay/hybrid-score-chart";
import { LatentTwinChart } from "@/components/replay/latent-twin-chart";
import {
  attributionMethodLabel,
  countAlertRisingEdges,
  defaultInferenceCliSnippet,
  heatmapPublicUrl,
  namesAndScores,
  topSensorsList,
  unpackSensor,
} from "@/lib/replay-dashboard-utils";

function MetricTile({
  label,
  value,
  hint,
  sub,
}: {
  label: string;
  value: string;
  hint?: string;
  sub?: string;
}) {
  return (
    <div
      className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)]/40 px-3 py-2.5"
      title={hint}
    >
      <div className="text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--color-fg-tertiary)]">
        {label}
      </div>
      <div className="font-mono text-[18px] tabular-nums tracking-tight text-[var(--color-fg-primary)] mt-0.5">
        {value}
      </div>
      {sub && <div className="text-[10px] text-[var(--color-fg-quaternary)] mt-0.5">{sub}</div>}
    </div>
  );
}

export function ReplayMethodologyDashboard() {
  const qc = useQueryClient();
  const recordHistory = useSystemStore((s) => s.recordHistory);
  const resetHistory = useSystemStore((s) => s.resetHistory);
  const connection = useSystemStore((s) => s.connection);

  const datasetsQ = useQuery({
    queryKey: ["datasets"],
    queryFn: () => apiEndpoints.datasets.list(),
  });

  const keys = useMemo(() => datasetsQ.data?.map((d) => d.key) ?? ["SWaT"], [datasetsQ.data]);
  const [targetDataset, setTargetDataset] = useState("SWaT");

  useEffect(() => {
    if (keys.length && !keys.includes(targetDataset)) {
      setTargetDataset(keys[0]);
    }
  }, [keys, targetDataset]);

  const datasetDetailQ = useQuery({
    queryKey: ["dataset", targetDataset],
    queryFn: () => apiEndpoints.datasets.get(targetDataset),
    enabled: Boolean(targetDataset),
  });

  const statusQ = useQuery({
    queryKey: ["inference-status"],
    queryFn: () => apiEndpoints.inference.status(),
    refetchInterval: 5_000,
  });

  const [logTouched, setLogTouched] = useState(false);
  const [logPath, setLogPath] = useState(`runs/${targetDataset}_replay_log.jsonl`);
  useEffect(() => {
    if (!logTouched) setLogPath(`runs/${targetDataset}_replay_log.jsonl`);
  }, [targetDataset, logTouched]);

  const [liveMode, setLiveMode] = useState(true);
  const [refreshSec, setRefreshSec] = useState(2);
  const [tailN, setTailN] = useState(1000);
  const [pausedBuffer, setPausedBuffer] = useState<InferenceRecord[] | null>(null);

  const prevDatasetRef = useRef(targetDataset);
  useEffect(() => {
    if (prevDatasetRef.current !== targetDataset) {
      resetHistory();
      setPausedBuffer(null);
      prevDatasetRef.current = targetDataset;
    }
  }, [targetDataset, resetHistory]);

  const baseRecords = pausedBuffer ?? recordHistory;
  const visible = useMemo(() => baseRecords.slice(-tailN), [baseRecords, tailN]);

  const latest = visible.length ? visible[visible.length - 1] : null;
  const latestIdx = visible.length - 1;

  const thresholdVal = visible.length ? Number(visible[0].threshold) : 0;
  const thresholdDrift = useMemo(() => {
    const set = new Set(visible.map((r) => Number(r.threshold).toFixed(6)));
    return set.size > 1;
  }, [visible]);

  const newEventsAcc = useRef(0);
  const prevLenRef = useRef(0);
  useEffect(() => {
    const delta = Math.max(0, recordHistory.length - prevLenRef.current);
    newEventsAcc.current += delta;
    prevLenRef.current = recordHistory.length;
  }, [recordHistory.length]);

  const [tickMeta, setTickMeta] = useState({ newEvents: 0, at: Date.now() });
  useEffect(() => {
    if (!liveMode) return;
    const t = window.setInterval(() => {
      setTickMeta({ newEvents: newEventsAcc.current, at: Date.now() });
      newEventsAcc.current = 0;
    }, Math.max(1, refreshSec) * 1000);
    return () => clearInterval(t);
  }, [liveMode, refreshSec]);

  const toggleLive = useCallback(
    (on: boolean) => {
      setLiveMode(on);
      if (!on) {
        setPausedBuffer([...recordHistory]);
      } else {
        setPausedBuffer(null);
      }
    },
    [recordHistory],
  );

  const startMut = useMutation({
    mutationFn: () =>
      apiEndpoints.inference.start({
        dataset: targetDataset,
        emit_interval: 0.05,
        threshold_pct: 99,
        persistence_k: 2,
        cooldown_k: 5,
      }),
    onSuccess: () => {
      toast.success("Inference engine started", { description: targetDataset });
      qc.invalidateQueries({ queryKey: ["inference-status"] });
    },
    onError: (e: unknown) =>
      toast.error("Could not start", { description: e instanceof Error ? e.message : String(e) }),
  });

  const stopMut = useMutation({
    mutationFn: () => apiEndpoints.inference.stop(),
    onSuccess: () => {
      toast.success("Inference stopped.");
      qc.invalidateQueries({ queryKey: ["inference-status"] });
    },
  });

  const isRunning =
    statusQ.data?.status === "running" || statusQ.data?.status === "initializing";
  const engineDataset = statusQ.data?.dataset ?? null;
  const mismatchEngine = isRunning && engineDataset && engineDataset !== targetDataset;

  const topList = latest ? topSensorsList(latest) : [];
  const [primaryName] = topList.length ? unpackSensor(topList[0]) : ["—", 0];
  const isSystemic = Boolean(topList.length) && primaryName.startsWith("Indeterminate");
  const isAlertNow = Boolean(latest?.is_alert);
  const method = latest?.attribution_method ?? "spatial_heatmap_split";
  const methodLabel = attributionMethodLabel(method);
  const badgeColor = method === "variance_collapse" ? "#ef4444" : "#3b82f6";

  const { names: barNames, scores: barScores } = namesAndScores(
    isSystemic ? [] : topList,
  );
  const barData = barNames.map((name, i) => ({ name, v: barScores[i] ?? 0 }));

  const gradAlt = latest?.top_sensors_grad;
  const gradAltList = Array.isArray(gradAlt) ? gradAlt.slice(0, 5) : [];
  const { names: altNames, scores: altScores } = namesAndScores(gradAltList);
  const altBar = altNames.map((name, i) => ({ name, v: altScores[i] ?? 0 }));

  const xAxisTitle =
    method === "variance_collapse"
      ? "log(σ²_baseline / σ²_window) — higher = more frozen"
      : "Mean gradient × input activation";

  const incidentsInView = countAlertRisingEdges(visible);
  const mahalV = latest?.score_mahalanobis;
  const collapseV = latest?.score_collapse;
  const weightV = latest?.collapse_weight ?? 0;
  const infMs = latest?.inference_time_ms;

  const heatmapUrl =
    isAlertNow && latest?.heatmap_path ? heatmapPublicUrl(String(latest.heatmap_path)) : null;

  const ds = datasetDetailQ.data;
  const missing = ds?.missing_files ?? [];

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        eyebrow="Methodology 6.5"
        title="Explainable contrastive learning for ICS anomaly detection"
        description="Real-time replay simulation — full parity with the Streamlit dashboard: hybrid scores, XAI attribution, Grad-CAM, and digital-twin latent space."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {isRunning ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => stopMut.mutate()}
                disabled={stopMut.isPending}
              >
                {stopMut.isPending ? <Loader2 className="size-4 animate-spin" /> : <Square className="size-4" strokeWidth={1.8} />}
                Stop engine
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => startMut.mutate()}
                disabled={startMut.isPending || !ds?.assets_ok}
              >
                {startMut.isPending ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" strokeWidth={1.8} />}
                Start inference
              </Button>
            )}
          </div>
        }
      />

      <div className="px-6">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(280px,320px)_1fr] gap-6 items-start">
          {/* Sidebar — Streamlit st.sidebar */}
          <aside className="space-y-5 xl:sticky xl:top-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-[15px]">Target environment</CardTitle>
                <CardSubtitle>Model, normalizer, and sensor mapping</CardSubtitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="replay-dataset">Dataset / model</Label>
                  <select
                    id="replay-dataset"
                    className="w-full h-9 rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-base)] px-2.5 text-[13px] text-[var(--color-fg-primary)]"
                    value={targetDataset}
                    onChange={(e) => setTargetDataset(e.target.value)}
                  >
                    {keys.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>

                {mismatchEngine && (
                  <div className="flex gap-2 rounded-md border border-[var(--color-state-warn)]/40 bg-[var(--color-state-warn)]/8 px-3 py-2 text-[11px] text-[var(--color-fg-secondary)]">
                    <AlertTriangle className="size-4 shrink-0 text-[var(--color-state-warn)]" strokeWidth={1.8} />
                    <span>
                      Inference is running on <span className="font-mono">{engineDataset}</span> while
                      you have <span className="font-mono">{targetDataset}</span> selected. Stop and start
                      to align, or switch the selection to match the live engine.
                    </span>
                  </div>
                )}

                {datasetDetailQ.isLoading ? (
                  <div className="text-[12px] text-[var(--color-fg-tertiary)]">Checking assets…</div>
                ) : missing.length ? (
                  <div className="space-y-2">
                    {missing.map((err) => (
                      <div
                        key={err}
                        className="flex gap-2 rounded-md border border-[var(--color-state-alert)]/35 bg-[var(--color-state-alert)]/8 px-3 py-2 text-[11px] text-[var(--color-fg-secondary)]"
                      >
                        <FileWarning className="size-4 shrink-0 text-[var(--color-state-alert)]" strokeWidth={1.8} />
                        <span>
                          <span className="font-semibold text-[var(--color-fg-primary)]">{targetDataset}</span>: {err}
                        </span>
                      </div>
                    ))}
                    {missing.some((e) => e.toLowerCase().includes("checkpoint")) && (
                      <p className="text-[11px] text-[var(--color-fg-tertiary)]">
                        The inference engine cannot run without a checkpoint. Train a model first or supply a valid
                        <code className="mx-1 font-mono text-[10px]">.pt</code> file.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-[12px] text-[var(--color-state-ok)]">
                    <CheckCircle2 className="size-4" strokeWidth={1.8} />
                    All files present for <span className="font-semibold">{targetDataset}</span>
                  </div>
                )}

                {ds && (
                  <details className="rounded-md border border-[var(--color-border-subtle)] px-3 py-2">
                    <summary className="cursor-pointer text-[12px] font-medium text-[var(--color-fg-secondary)]">
                      {ds.display_name}
                    </summary>
                    <ul className="mt-2 space-y-1 text-[11px] text-[var(--color-fg-tertiary)] list-disc pl-4">
                      <li>
                        <span className="text-[var(--color-fg-quaternary)]">Sensors:</span>{" "}
                        {ds.n_sensors ?? "auto-detect"}
                      </li>
                      <li className="font-mono break-all">
                        <span className="text-[var(--color-fg-quaternary)]">Checkpoint:</span> {ds.checkpoint_path}
                      </li>
                      <li className="font-mono break-all">
                        <span className="text-[var(--color-fg-quaternary)]">Normal CSV:</span> {ds.normal_csv}
                      </li>
                      <li className="font-mono break-all">
                        <span className="text-[var(--color-fg-quaternary)]">Attack CSV:</span> {ds.attack_csv}
                      </li>
                      <li>
                        <span className="text-[var(--color-fg-quaternary)]">Labels:</span> per dataset registry
                        (numeric or string)
                      </li>
                    </ul>
                  </details>
                )}

                <div className="h-px bg-[var(--color-border-subtle)]" />

                <div className="space-y-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-fg-tertiary)]">
                    Stream settings
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="log-path">Log file (JSONL)</Label>
                    <Input
                      id="log-path"
                      className="font-mono text-[12px]"
                      value={logPath}
                      onChange={(e) => {
                        setLogTouched(true);
                        setLogPath(e.target.value);
                      }}
                    />
                    <p className="text-[10px] text-[var(--color-fg-quaternary)] leading-snug">
                      The FastAPI backend tails <span className="font-mono">runs/{targetDataset}_replay_log.jsonl</span>{" "}
                      under the ML workspace when you start inference. This field mirrors the Streamlit path for
                      operator notes; the live chart uses the WebSocket stream.
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="live-toggle" className="text-[12px]">
                      Live mode
                    </Label>
                    <button
                      id="live-toggle"
                      type="button"
                      role="switch"
                      aria-checked={liveMode}
                      onClick={() => toggleLive(!liveMode)}
                      className={`relative h-7 w-12 rounded-full transition-colors ${
                        liveMode ? "bg-[var(--color-accent-500)]" : "bg-[var(--color-border-strong)]"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow transition-transform ${
                          liveMode ? "translate-x-5" : ""
                        }`}
                      />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-[var(--color-fg-tertiary)]">
                      <span>Refresh interval (s)</span>
                      <span className="font-mono">{refreshSec}</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      step={1}
                      value={refreshSec}
                      disabled={!liveMode}
                      onChange={(e) => setRefreshSec(Number(e.target.value))}
                      className="w-full accent-[var(--color-accent-500)]"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-[var(--color-fg-tertiary)]">
                      <span>Show last N windows</span>
                      <span className="font-mono">{tailN}</span>
                    </div>
                    <input
                      type="range"
                      min={100}
                      max={5000}
                      step={100}
                      value={tailN}
                      onChange={(e) => setTailN(Number(e.target.value))}
                      className="w-full accent-[var(--color-accent-500)]"
                    />
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      resetHistory();
                      setPausedBuffer(null);
                      toast.message("Cache cleared", { description: "Record history reset." });
                    }}
                  >
                    Reset cache
                  </Button>
                </div>

                <div className="h-px bg-[var(--color-border-subtle)]" />

                <div className="space-y-2">
                  <p className="text-[10px] leading-relaxed text-[var(--color-fg-quaternary)]">
                    <span className="font-semibold text-[var(--color-fg-tertiary)]">Hybrid scoring</span> — the engine
                    fuses encoder Mahalanobis with a per-sensor variance-collapse term that catches freeze attacks
                    without retraining:
                  </p>
                  <div className="flex items-start gap-2 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-bg-base)] p-2.5">
                    <Terminal className="size-3.5 shrink-0 mt-0.5 text-[var(--color-fg-quaternary)]" strokeWidth={1.8} />
                    <pre className="text-[10px] leading-snug font-mono text-[var(--color-accent-300)] whitespace-pre-wrap break-all">
                      {defaultInferenceCliSnippet(targetDataset)}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Main column */}
          <div className="space-y-5 min-w-0">
            {!latest && (
              <Card className="border-[var(--color-state-warn)]/30 bg-[var(--color-state-warn)]/5">
                <CardContent className="py-5 text-[13px] text-[var(--color-fg-secondary)]">
                  <p>
                    No data yet at <code className="font-mono text-[12px]">{logPath}</code>. Start the inference engine
                    (sidebar or header), or run locally:
                  </p>
                  <pre className="mt-3 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-bg-base)] p-3 text-[11px] font-mono text-[var(--color-fg-tertiary)] overflow-x-auto">
                    {`python inference_engine.py --dataset ${targetDataset} --out runs/${targetDataset}_replay_log.jsonl`}
                  </pre>
                  <p className="mt-3 text-[11px] text-[var(--color-fg-quaternary)]">
                    WebSocket: <span className="font-mono">{connection}</span>
                    {liveMode ? " · waiting for first window …" : " · live mode paused"}
                  </p>
                </CardContent>
              </Card>
            )}

            {latest && (
              <>
                {thresholdDrift && (
                  <div className="flex gap-2 rounded-md border border-[var(--color-state-warn)]/40 bg-[var(--color-state-warn)]/8 px-3 py-2 text-[12px] text-[var(--color-fg-secondary)]">
                    <AlertTriangle className="size-4 shrink-0 text-[var(--color-state-warn)]" strokeWidth={1.8} />
                    Threshold changed mid-stream — using first value ({formatFixed(thresholdVal, 3)}). Regenerate the log
                    if the engine was restarted with new settings.
                  </div>
                )}

                {isAlertNow ? (
                  <div className="rounded-lg border border-[var(--color-state-alert)]/45 bg-[var(--color-state-alert)]/12 px-4 py-3">
                    <h2 className="text-[15px] font-semibold tracking-tight text-[var(--color-state-alert)]">
                      Critical: active attack detected
                    </h2>
                    <p className="text-[13px] text-[var(--color-fg-secondary)] mt-1">
                      Primary culprit:{" "}
                      <span className="font-semibold text-[var(--color-fg-primary)]">
                        {primaryName.startsWith("Indeterminate") ? "Systemic (multi-sensor)" : primaryName}
                      </span>{" "}
                      · score <span className="font-mono">{formatFixed(latest.anomaly_score, 2)}</span> / threshold{" "}
                      <span className="font-mono">{formatFixed(thresholdVal, 2)}</span>
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-[var(--color-state-ok)]/35 bg-[var(--color-state-ok)]/8 px-4 py-3">
                    <h2 className="text-[15px] font-semibold tracking-tight text-[var(--color-state-ok)]">
                      Digital twin: nominal operation
                    </h2>
                    <p className="text-[13px] text-[var(--color-fg-secondary)] mt-1">
                      Score <span className="font-mono">{formatFixed(latest.anomaly_score, 2)}</span> / threshold{" "}
                      <span className="font-mono">{formatFixed(thresholdVal, 2)}</span>
                    </p>
                  </div>
                )}

                <p className="text-[11px] text-[var(--color-fg-quaternary)]">
                  Last refresh <span className="font-mono text-[var(--color-fg-tertiary)]">{new Date(tickMeta.at).toLocaleTimeString()}</span>{" "}
                  · total events <span className="font-mono">{recordHistory.length.toLocaleString()}</span> / cap{" "}
                  {RECORD_HISTORY_CAPACITY.toLocaleString()}
                  {liveMode ? (
                    <>
                      {" "}
                      · new this interval <span className="font-mono">{tickMeta.newEvents}</span>
                    </>
                  ) : null}{" "}
                  · serving row index <span className="font-mono">{latestIdx}</span>
                  {!liveMode ? <Badge variant="outline" className="ml-2 text-[10px]">Paused</Badge> : null}
                </p>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                  <MetricTile label="Fused score" value={formatFixed(latest.anomaly_score, 2)} hint="Mahalanobis + α · variance-collapse" />
                  <MetricTile
                    label="Threshold"
                    value={formatFixed(thresholdVal, 2)}
                    sub={`Δ ${formatFixed(latest.anomaly_score - thresholdVal, 2)}`}
                  />
                  {mahalV != null ? (
                    <MetricTile
                      label="Mahalanobis"
                      value={formatFixed(Number(mahalV), 2)}
                      hint="Encoder-side anomaly distance (Section 6.2 Option B)."
                    />
                  ) : (
                    <MetricTile label="Primary sensor" value={primaryName} />
                  )}
                  {collapseV != null ? (
                    <MetricTile
                      label="Freeze detector"
                      value={formatFixed(Number(collapseV) * Number(weightV), 2)}
                      hint="α · Σ_i max(0, log(σ²_baseline / σ²_window))"
                    />
                  ) : (
                    <MetricTile label="Active incidents" value={String(incidentsInView)} hint="Rising edges in view" />
                  )}
                  <MetricTile label="Active incidents" value={String(incidentsInView)} hint="Rising edges in view" />
                  <MetricTile
                    label="Inference time"
                    value={infMs != null ? `${formatFixed(Number(infMs), 1)} ms` : "—"}
                    hint="Encode + score + Grad-CAM + collapse per window"
                  />
                </div>

                <Card>
                  <CardHeader className="pb-1">
                    <CardTitle className="text-[16px]">Hybrid anomaly score vs. threshold</CardTitle>
                    <CardSubtitle>Sections 6.2 and 6.3 · log scale (Mahalanobis when present)</CardSubtitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <HybridScoreChart records={visible} threshold={thresholdVal} />
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex flex-col gap-2">
                        <CardTitle className="text-[16px]">Sensor attribution</CardTitle>
                        <CardSubtitle>Section 6.4 XAI</CardSubtitle>
                        <span
                          className="inline-flex w-fit items-center rounded-md px-2 py-0.5 text-[10px] font-semibold"
                          style={{
                            background: `${badgeColor}22`,
                            color: badgeColor,
                          }}
                        >
                          Active method: {methodLabel}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {isSystemic ? (
                        <div className="rounded-md border border-[var(--color-state-warn)]/35 bg-[var(--color-state-warn)]/8 px-3 py-2.5 text-[12px] text-[var(--color-fg-secondary)]">
                          <span className="font-semibold text-[var(--color-fg-primary)]">Indeterminate / systemic anomaly</span>{" "}
                          — Grad-CAM attribution is spread across many sensors (no sensor exceeds 2× mean of the rest).
                          Likely a plant-wide regime shift rather than a single compromised sensor.
                        </div>
                      ) : barData.length ? (
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                              <CartesianGrid stroke="var(--color-border-subtle)" strokeDasharray="3 6" horizontal={false} />
                              <XAxis
                                type="number"
                                tick={{ fontSize: 10, fill: "var(--color-fg-quaternary)", fontFamily: "var(--font-mono)" }}
                                axisLine={{ stroke: "var(--color-border-subtle)" }}
                                label={{
                                  value: xAxisTitle,
                                  position: "bottom",
                                  offset: 0,
                                  fill: "var(--color-fg-tertiary)",
                                  fontSize: 9,
                                }}
                              />
                              <YAxis
                                type="category"
                                dataKey="name"
                                width={88}
                                tick={{ fontSize: 10, fill: "var(--color-fg-secondary)", fontFamily: "var(--font-mono)" }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <Tooltip
                                content={({ active, payload }) => {
                                  if (!active || !payload?.[0]) return null;
                                  const row = payload[0].payload as { name: string; v: number };
                                  return (
                                    <div className="rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] px-2.5 py-1.5 text-[11px] font-mono">
                                      {row.name}: {formatFixed(row.v, 3)}
                                    </div>
                                  );
                                }}
                              />
                              <Bar dataKey="v" radius={[0, 4, 4, 0]} maxBarSize={22}>
                                {barData.map((_, i) => (
                                  <Cell
                                    key={i}
                                    fill={isAlertNow ? "#cd5c5c" : "#4682b4"}
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <p className="text-[12px] text-[var(--color-fg-tertiary)]">No top-sensor attribution in this window.</p>
                      )}

                      {method === "variance_collapse" && altBar.length > 0 && (
                        <details className="rounded-md border border-[var(--color-border-subtle)]">
                          <summary className="cursor-pointer px-3 py-2 text-[12px] font-medium text-[var(--color-fg-secondary)]">
                            Compare with encoder&apos;s gradient attribution
                          </summary>
                          <div className="h-[240px] px-2 pb-2">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={altBar} layout="vertical" margin={{ left: 8, right: 12, top: 4, bottom: 4 }}>
                                <CartesianGrid stroke="var(--color-border-subtle)" strokeDasharray="3 6" horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 9, fill: "var(--color-fg-quaternary)", fontFamily: "var(--font-mono)" }} />
                                <YAxis
                                  type="category"
                                  dataKey="name"
                                  width={80}
                                  tick={{ fontSize: 9, fill: "var(--color-fg-tertiary)", fontFamily: "var(--font-mono)" }}
                                />
                                <Tooltip
                                  content={({ active, payload }) => {
                                    if (!active || !payload?.[0]) return null;
                                    const row = payload[0].payload as { name: string; v: number };
                                    return (
                                      <div className="rounded-md border bg-[var(--color-bg-elevated)] px-2 py-1 text-[10px] font-mono">
                                        {row.name}: {formatFixed(row.v, 3)}
                                      </div>
                                    );
                                  }}
                                />
                                <Bar dataKey="v" fill="#94a3b8" radius={[0, 4, 4, 0]} maxBarSize={18} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </details>
                      )}

                      {isAlertNow && heatmapUrl && (
                        <div>
                          <h4 className="text-[13px] font-semibold text-[var(--color-fg-primary)] mb-2">
                            Grad-CAM heatmap (final conv layer)
                          </h4>
                          <div className="relative w-full overflow-hidden rounded-md border border-[var(--color-border-default)] bg-black/20">
                            <img
                              src={heatmapUrl}
                              alt={`Grad-CAM heatmap at ${latest.timestamp}`}
                              className="w-full h-auto object-contain max-h-[420px]"
                            />
                          </div>
                          <p className="text-[10px] text-[var(--color-fg-quaternary)] mt-1 font-mono">
                            Window end @ {latest.timestamp}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-1">
                      <CardTitle className="text-[16px]">Digital twin latent space</CardTitle>
                      <CardSubtitle>Section 6.5 · trajectory coloured by fused score</CardSubtitle>
                    </CardHeader>
                    <CardContent>
                      <LatentTwinChart records={visible} latestIndex={visible.length - 1} isAlertNow={isAlertNow} />
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
