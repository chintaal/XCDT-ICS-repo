"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useSystemStore } from "@/lib/store/system-store";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatFixed } from "@/lib/utils";
import type { SensorAttribution } from "@/lib/api/types";

export function TopSensors() {
  const current = useSystemStore((s) => s.current);
  const setHovered = useSystemStore((s) => s.setHoveredSensor);
  const hovered = useSystemStore((s) => s.hoveredSensor);

  const sensors = useMemo<SensorAttribution[]>(() => {
    if (!current) return [];
    const arr = (current.top_sensors ?? current.top_3_sensors ?? []) as SensorAttribution[];
    return arr.slice(0, 8);
  }, [current]);

  const max = useMemo(
    () => sensors.reduce((m, s) => Math.max(m, s.score), 0) || 1,
    [sensors],
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-1">
          <CardTitle>Top contributing sensors</CardTitle>
          <CardSubtitle>
            {current?.attribution_method
              ? `Method · ${formatMethod(current.attribution_method)}`
              : "Variance-collapse + direct evidence"}
          </CardSubtitle>
        </div>
        {sensors.length > 0 && (
          <Badge variant="accent" className="font-mono">
            {sensors.length}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-1.5">
        {sensors.length === 0 ? (
          <div className="grid-dots flex items-center justify-center py-10">
            <span className="text-xs text-[var(--color-fg-tertiary)]">
              Awaiting attribution data…
            </span>
          </div>
        ) : (
          sensors.map((s, idx) => {
            const pct = (s.score / max) * 100;
            const isHovered = hovered === s.sensor;
            return (
              <motion.div
                key={s.sensor}
                layout
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
                onMouseEnter={() => setHovered(s.sensor)}
                onMouseLeave={() => setHovered(null)}
                className={
                  "group relative flex items-center gap-3 rounded-md px-2.5 py-1.5 transition-colors " +
                  (isHovered
                    ? "bg-[var(--color-bg-elevated)]"
                    : "hover:bg-[var(--color-bg-elevated)]/60")
                }
              >
                <span className="w-5 text-[10px] font-mono tabular-nums text-[var(--color-fg-quaternary)]">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <span className="text-[12.5px] font-mono tracking-tight text-[var(--color-fg-primary)] truncate">
                      {s.sensor}
                    </span>
                    <span className="text-[11px] font-mono tabular-nums text-[var(--color-fg-secondary)]">
                      {formatFixed(s.score, 2)}
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-[var(--color-bg-elevated)] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: idx === 0
                          ? "var(--color-state-warn)"
                          : "var(--color-accent-400)",
                        transition: "width 320ms cubic-bezier(0.22,1,0.36,1)",
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function formatMethod(m: string): string {
  return m
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
