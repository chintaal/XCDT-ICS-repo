/**
 * Helpers for the methodology replay dashboard (Streamlit dashboard.py parity).
 */

import { API_BASE_URL } from "@/lib/api/client";
import type { InferenceRecord, SensorAttribution } from "@/lib/api/types";

export function unpackSensor(item: unknown): [string, number] {
  if (item != null && typeof item === "object" && !Array.isArray(item)) {
    const o = item as Record<string, unknown>;
    return [String(o.sensor ?? "—"), Number(o.score ?? 0)];
  }
  if (Array.isArray(item) && item.length >= 2) {
    return [String(item[0]), Number(item[1])];
  }
  return [String(item ?? "—"), 0];
}

export function namesAndScores(records: unknown[] | undefined): { names: string[]; scores: number[] } {
  if (!records?.length) return { names: [], scores: [] };
  const pairs = records.map((r) => unpackSensor(r));
  return {
    names: pairs.map((p) => p[0]),
    scores: pairs.map((p) => p[1]),
  };
}

export function heatmapPublicUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = String(raw);
  const m = s.match(/heatmap_[^/\\]+\.png$/i);
  const file = m?.[0] ?? s.split(/[/\\]/).pop();
  if (!file || !file.endsWith(".png")) return null;
  return `${API_BASE_URL}/heatmaps/${file}`;
}

export const ATTRIBUTION_METHOD_LABELS: Record<string, string> = {
  variance_collapse: "variance-collapse (per-sensor σ² ratio)",
  channel_input_x_grad: "input × gradient per channel",
  spatial_heatmap_split: "horizontal heatmap split",
};

export function attributionMethodLabel(method: string | undefined): string {
  if (!method) return "spatial_heatmap_split";
  return ATTRIBUTION_METHOD_LABELS[method] ?? method;
}

/** Count transitions into alert=true within the series (Streamlit col5 logic). */
export function countAlertRisingEdges(records: InferenceRecord[]): number {
  let n = 0;
  let prev = false;
  for (const r of records) {
    const cur = Boolean(r.is_alert);
    if (cur && !prev) n += 1;
    prev = cur;
  }
  return n;
}

export function contiguousAlertSpans(records: InferenceRecord[]): { start: string; end: string }[] {
  const spans: { start: string; end: string }[] = [];
  let start: number | null = null;
  for (let i = 0; i < records.length; i++) {
    const on = Boolean(records[i].is_alert);
    if (on && start === null) start = i;
    if (!on && start !== null) {
      spans.push({
        start: records[start].timestamp,
        end: records[i - 1].timestamp,
      });
      start = null;
    }
  }
  if (start !== null) {
    spans.push({
      start: records[start].timestamp,
      end: records[records.length - 1].timestamp,
    });
  }
  return spans;
}

export function defaultInferenceCliSnippet(datasetKey: string): string {
  const thr =
    datasetKey === "Indian"
      ? " --threshold-mode f1"
      : " --threshold-pct 99.0";
  return `python inference_engine.py --dataset ${datasetKey}${thr} --persistence 2 --cooldown 5 --collapse-weight 10`;
}

export function topSensorsList(latest: InferenceRecord): unknown[] {
  const raw =
    latest.top_sensors ??
    latest.top_3_sensors ??
    ([] as SensorAttribution[]);
  return Array.isArray(raw) ? raw : [];
}
