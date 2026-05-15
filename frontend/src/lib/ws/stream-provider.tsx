"use client";

/**
 * WebSocket lifeline.
 *  - Single global connection, mounted once at the app shell.
 *  - Exponential reconnect backoff (capped at 30s).
 *  - Pushes parsed records into the Zustand store.
 *  - Marks connection 'stale' if no message arrives for 5s.
 */

import { useEffect, useRef } from "react";
import { WS_URL } from "@/lib/api/client";
import { useSystemStore } from "@/lib/store/system-store";
import type { InferenceRecord } from "@/lib/api/types";

const STALE_THRESHOLD_MS  = 5_000;
const STALE_CHECK_INTERVAL = 1_000;
const INITIAL_RETRY_MS    = 500;
const MAX_RETRY_MS        = 30_000;

export function StreamProvider({ children }: { children: React.ReactNode }) {
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(INITIAL_RETRY_MS);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const staleTimerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const closingIntentionally = useRef(false);

  useEffect(() => {
    const pushRecord    = useSystemStore.getState().pushRecord;
    const setConnection = useSystemStore.getState().setConnection;

    function connect() {
      setConnection("connecting");
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.addEventListener("open", () => {
        retryRef.current = INITIAL_RETRY_MS;
        setConnection("live");
      });

      ws.addEventListener("message", (event) => {
        try {
          const data = JSON.parse(event.data) as InferenceRecord;
          // Backend may send heartbeats / non-records — only accept if it has anomaly_score
          if (typeof data?.anomaly_score === "number") {
            pushRecord(data);
          }
        } catch {
          // ignore non-JSON or malformed payloads
        }
      });

      ws.addEventListener("close", () => {
        setConnection("offline");
        if (closingIntentionally.current) return;
        scheduleReconnect();
      });

      ws.addEventListener("error", () => {
        // browser will fire close after error; reconnect is scheduled there
      });
    }

    function scheduleReconnect() {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      const delay = retryRef.current;
      reconnectTimerRef.current = setTimeout(() => {
        retryRef.current = Math.min(MAX_RETRY_MS, retryRef.current * 2);
        connect();
      }, delay);
    }

    connect();

    // Stale watchdog — flips connection to 'stale' if messages stop flowing
    staleTimerRef.current = setInterval(() => {
      const { lastMessageAt, connection } = useSystemStore.getState();
      if (connection !== "live" || !lastMessageAt) return;
      if (Date.now() - lastMessageAt > STALE_THRESHOLD_MS) {
        setConnection("stale");
      }
    }, STALE_CHECK_INTERVAL);

    return () => {
      closingIntentionally.current = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (staleTimerRef.current) clearInterval(staleTimerRef.current);
      wsRef.current?.close();
    };
  }, []);

  return <>{children}</>;
}
