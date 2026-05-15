/**
 * Type definitions mirroring backend openapi.json.
 * These are the source of truth on the frontend.
 */

export interface SensorAttribution {
  sensor: string;
  score: number;
}

export interface SensorNode {
  id: string;
  stage: string;
  stage_short: string;
}

export interface SensorEdge {
  source: string;
  target: string;
  weight: number;
}

export interface SensorGraphResponse {
  dataset: string;
  nodes: SensorNode[];
  edges: SensorEdge[];
}

export interface DatasetInfo {
  key: string;
  display_name: string;
  n_sensors: number | null;
  checkpoint_path: string;
  normal_csv: string;
  attack_csv: string;
  assets_ok: boolean;
  missing_files: string[];
}

export interface InferenceRecord {
  timestamp: string;
  window_end_index: number;
  anomaly_score: number;
  score_mahalanobis?: number;
  score_collapse?: number;
  score_deviation?: number;
  collapse_weight?: number;
  raw_above: boolean;
  is_alert: boolean;
  threshold: number;
  true_label: number;
  top_sensors?: SensorAttribution[];
  top_sensors_grad?: unknown[];
  top_sensors_direct?: unknown[];
  top_3_sensors?: SensorAttribution[];
  attribution_method?: string;
  heatmap_path?: string | null;
  latent_vector_2d?: number[];
  inference_time_ms?: number;
  dataset?: string | null;
  pass_number?: number | null;
  // Allow extra fields from the engine
  [key: string]: unknown;
}

export interface InferenceStatus {
  status: "idle" | "initializing" | "running" | "stopped" | "error" | string;
  dataset?: string | null;
  threshold?: number | null;
  sensor_cols?: string[] | null;
  n_sensors?: number | null;
  pass_number: number;
  total_windows: number;
  error?: string | null;
  current_record?: InferenceRecord | null;
}

export interface StartInferenceRequest {
  dataset?: string;
  emit_interval?: number;
  threshold_pct?: number;
  persistence_k?: number;
  cooldown_k?: number;
  max_rows?: number | null;
}

export interface ThresholdUpdateRequest {
  threshold: number;
}

export interface AttackTypeInfo {
  type: string;
  description: string;
  example_magnitude: number;
}

export interface AttackInjectRequest {
  sensor: string;
  attack_type?: "freeze" | "offset" | "noise";
  magnitude?: number;
  duration_ticks?: number;
}

export interface IncidentResponse {
  id: number;
  dataset: string;
  start_time: string;
  end_time: string | null;
  peak_score: number;
  threshold: number;
  duration_windows: number;
  top_sensors: SensorAttribution[];
  attribution_method: string;
  heatmap_path: string | null;
  ground_truth: number | null;
  notes: string | null;
  created_at: string;
}

export interface IncidentFeedbackRequest {
  ground_truth?: number | null;
  notes?: string | null;
}

export interface HealthResponse {
  status: string;
  version: string;
  inference_status: string;
  dataset: string | null;
  db_ok: boolean;
  ml_src_ok: boolean;
}

export interface IncidentStats {
  total: number;
  by_dataset: Record<string, number>;
  true_positives: number;
  false_positives: number;
  pending: number;
  [key: string]: unknown;
}
