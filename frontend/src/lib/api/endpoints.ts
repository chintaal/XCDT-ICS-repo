/**
 * Typed endpoint functions — mirror the FastAPI router structure.
 * Group by resource; export as a single object for ergonomic imports.
 */

import { api } from "./client";
import type {
  AttackInjectRequest,
  AttackTypeInfo,
  AttackValidationSeries,
  AttackValidationSeriesRequest,
  DatasetInfo,
  HealthResponse,
  IncidentFeedbackRequest,
  IncidentResponse,
  IncidentStats,
  InferenceRecord,
  InferenceStatus,
  SensorGraphResponse,
  StartInferenceRequest,
  ThresholdUpdateRequest,
} from "./types";

export const apiEndpoints = {
  health: () => api<HealthResponse>("/api/health"),

  datasets: {
    list:    () => api<DatasetInfo[]>("/api/datasets"),
    get:     (key: string) => api<DatasetInfo>(`/api/datasets/${encodeURIComponent(key)}`),
    graph:   (key: string) => api<SensorGraphResponse>(
      `/api/datasets/${encodeURIComponent(key)}/sensor-graph`,
    ),
  },

  inference: {
    start: (req: StartInferenceRequest) =>
      api<InferenceStatus>("/api/inference/start", { method: "POST", body: req }),
    stop: () =>
      api<InferenceStatus>("/api/inference/stop", { method: "POST" }),
    status: () =>
      api<InferenceStatus>("/api/inference/status"),
    snapshot: () =>
      api<InferenceRecord>("/api/inference/snapshot"),
    setThreshold: (req: ThresholdUpdateRequest) =>
      api<InferenceStatus>("/api/inference/threshold", { method: "POST", body: req }),
  },

  incidents: {
    list: (query: { dataset?: string; limit?: number; offset?: number } = {}) =>
      api<IncidentResponse[]>("/api/incidents", { query }),
    get: (id: number) => api<IncidentResponse>(`/api/incidents/${id}`),
    delete: (id: number) =>
      api<{ deleted: number }>(`/api/incidents/${id}`, { method: "DELETE" }),
    feedback: (id: number, req: IncidentFeedbackRequest) =>
      api<IncidentResponse>(`/api/incidents/${id}/feedback`, {
        method: "PATCH",
        body: req,
      }),
    stats: () => api<IncidentStats>("/api/incidents/stats/summary"),
  },

  attacks: {
    types:  () => api<AttackTypeInfo[]>("/api/attacks/types"),
    inject: (req: AttackInjectRequest) =>
      api<{ ok: boolean; attack: Record<string, unknown> }>("/api/attacks/inject", {
        method: "POST",
        body: req,
      }),
    clear:  () =>
      api<{ ok: boolean }>("/api/attacks/clear", { method: "DELETE" }),
    status: () =>
      api<Record<string, unknown>>("/api/attacks/status"),
    validationSeries: (req: AttackValidationSeriesRequest) =>
      api<AttackValidationSeries>("/api/attacks/validation-series", {
        method: "POST",
        body: req,
      }),
  },
};
