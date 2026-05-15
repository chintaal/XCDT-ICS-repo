/**
 * Global system state — this is the *single* place that lives outside React.
 * Drives:  live record stream, alert state, history ring buffer,
 *          UI cross-panel hover linking, connection status.
 */

import { create } from "zustand";
import type { InferenceRecord } from "@/lib/api/types";

const HISTORY_CAPACITY = 600; // ~30s @ 50ms; ~5min @ 500ms
/** Full records for methodology replay dashboard (matches Streamlit tail up to 5k). */
export const RECORD_HISTORY_CAPACITY = 5000;

export type ConnectionStatus = "connecting" | "live" | "offline" | "stale";
export type SystemState = "normal" | "elevated" | "alert";

export interface ScorePoint {
  t: number;        // epoch ms (numeric for charts)
  score: number;
  threshold: number;
  isAlert: boolean;
  windowEndIndex: number;
}

interface SystemStore {
  // Live stream
  current: InferenceRecord | null;
  history: ScorePoint[];        // ring buffer, oldest first
  /** Full engine records for replay / XAI charts (tail-capped). */
  recordHistory: InferenceRecord[];
  systemState: SystemState;

  // Connection
  connection: ConnectionStatus;
  latencyMs: number | null;
  lastMessageAt: number | null;

  // UI cross-panel
  hoveredSensor: string | null;
  selectedSensor: string | null;

  // Settings
  soundEnabled: boolean;
  sidebarCollapsed: boolean;

  // Actions
  pushRecord: (record: InferenceRecord) => void;
  setConnection: (s: ConnectionStatus) => void;
  setLatency: (ms: number | null) => void;
  setHoveredSensor: (id: string | null) => void;
  setSelectedSensor: (id: string | null) => void;
  toggleSound: () => void;
  toggleSidebar: () => void;
  resetHistory: () => void;
}

function deriveSystemState(score: number, threshold: number, isAlert: boolean): SystemState {
  if (isAlert) return "alert";
  if (threshold > 0 && score / threshold >= 0.7) return "elevated";
  return "normal";
}

export const useSystemStore = create<SystemStore>((set) => ({
  current: null,
  history: [],
  recordHistory: [],
  systemState: "normal",

  connection: "connecting",
  latencyMs: null,
  lastMessageAt: null,

  hoveredSensor: null,
  selectedSensor: null,

  soundEnabled: false,
  sidebarCollapsed: false,

  pushRecord: (record) => set((state) => {
    const tNow = Date.now();
    const point: ScorePoint = {
      t: tNow,
      score: record.anomaly_score,
      threshold: record.threshold,
      isAlert: record.is_alert,
      windowEndIndex: record.window_end_index,
    };
    const next = state.history.length >= HISTORY_CAPACITY
      ? [...state.history.slice(1), point]
      : [...state.history, point];
    const nextFull = [...state.recordHistory, record].slice(-RECORD_HISTORY_CAPACITY);
    return {
      current: record,
      history: next,
      recordHistory: nextFull,
      systemState: deriveSystemState(record.anomaly_score, record.threshold, record.is_alert),
      lastMessageAt: tNow,
      connection: "live",
    };
  }),

  setConnection: (s) => set({ connection: s }),
  setLatency: (ms) => set({ latencyMs: ms }),
  setHoveredSensor: (id) => set({ hoveredSensor: id }),
  setSelectedSensor: (id) => set({ selectedSensor: id }),
  toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  resetHistory: () => set({ history: [], current: null, recordHistory: [] }),
}));
