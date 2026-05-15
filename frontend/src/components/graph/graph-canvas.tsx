"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { SensorEdge, SensorNode } from "@/lib/api/types";
import { useSystemStore } from "@/lib/store/system-store";
import { cn } from "@/lib/utils";

interface GraphCanvasProps {
  nodes: SensorNode[];
  edges: SensorEdge[];
  liveAttribution: Map<string, number>;
}

interface PositionedNode extends SensorNode {
  x: number;
  y: number;
}

const NODE_RADIUS = 22;
const STAGE_GAP = 60;
const NODE_COL_GAP = 64;
const NODE_ROW_GAP = 48;
const PADDING = 64;

/**
 * Stage-clustered process diagram.
 * Sensors are laid out in stage columns left→right, mirroring physical flow.
 * Cleaner than a force-directed hairball for industrial topology.
 */
export function GraphCanvas({ nodes, edges, liveAttribution }: GraphCanvasProps) {
  const setHovered = useSystemStore((s) => s.setHoveredSensor);
  const setSelected = useSystemStore((s) => s.setSelectedSensor);
  const hoveredFromOther = useSystemStore((s) => s.hoveredSensor);
  const [localHover, setLocalHover] = useState<string | null>(null);

  const { positioned, stages, width, height, edgeMap } = useMemo(() => {
    // Group by stage (preserve first-encountered order)
    const stageOrder: string[] = [];
    const grouped = new Map<string, SensorNode[]>();
    for (const n of nodes) {
      if (!grouped.has(n.stage)) {
        grouped.set(n.stage, []);
        stageOrder.push(n.stage);
      }
      grouped.get(n.stage)!.push(n);
    }

    // Decide grid shape per stage — square-ish
    const stages = stageOrder.map((stageName, i) => {
      const list = grouped.get(stageName)!;
      const cols = Math.max(1, Math.ceil(Math.sqrt(list.length)));
      const rows = Math.ceil(list.length / cols);
      return { name: stageName, list, cols, rows, index: i };
    });

    // Compute X offsets for stages
    const stageXs: number[] = [];
    let cursor = PADDING;
    for (const s of stages) {
      stageXs.push(cursor);
      cursor += s.cols * NODE_COL_GAP + STAGE_GAP;
    }
    const totalWidth = cursor - STAGE_GAP + PADDING;
    const maxRows = Math.max(...stages.map((s) => s.rows));
    const totalHeight = PADDING * 2 + maxRows * NODE_ROW_GAP + 60; // header room

    const positioned = new Map<string, PositionedNode>();
    stages.forEach((s, si) => {
      const x0 = stageXs[si];
      const y0 = PADDING + 30; // below stage label
      // Center the rows vertically within the canvas
      const stageHeight = s.rows * NODE_ROW_GAP;
      const yOffset = (maxRows * NODE_ROW_GAP - stageHeight) / 2;

      s.list.forEach((n, idx) => {
        const col = idx % s.cols;
        const row = Math.floor(idx / s.cols);
        positioned.set(n.id, {
          ...n,
          x: x0 + col * NODE_COL_GAP + NODE_COL_GAP / 2,
          y: y0 + yOffset + row * NODE_ROW_GAP + NODE_ROW_GAP / 2,
        });
      });
    });

    // Index edges per node (for hover highlight)
    const edgeMap = new Map<string, Set<string>>();
    for (const e of edges) {
      if (!edgeMap.has(e.source)) edgeMap.set(e.source, new Set());
      edgeMap.get(e.source)!.add(e.target);
      if (!edgeMap.has(e.target)) edgeMap.set(e.target, new Set());
      edgeMap.get(e.target)!.add(e.source);
    }

    return {
      positioned,
      stages: stages.map((s, si) => ({ ...s, x: stageXs[si] })),
      width: totalWidth,
      height: totalHeight,
      edgeMap,
    };
  }, [nodes, edges]);

  const maxAttribution = useMemo(() => {
    let m = 0;
    for (const v of liveAttribution.values()) m = Math.max(m, v);
    return m || 1;
  }, [liveAttribution]);

  const hovered = localHover || hoveredFromOther;
  const hoveredNeighbors = hovered ? edgeMap.get(hovered) : null;

  return (
    <div className="flex-1 min-h-0 relative overflow-auto grid-dots">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="block min-w-full"
      >
        {/* Stage labels and backplates */}
        {stages.map((s) => {
          const stageWidth = s.cols * NODE_COL_GAP;
          return (
            <g key={s.name}>
              <rect
                x={s.x}
                y={PADDING}
                width={stageWidth}
                height={height - PADDING * 2}
                rx={12}
                ry={12}
                fill="var(--color-bg-elevated)"
                fillOpacity={0.35}
                stroke="var(--color-border-subtle)"
              />
              <text
                x={s.x + stageWidth / 2}
                y={PADDING - 16}
                textAnchor="middle"
                className="font-mono"
                fontSize={9}
                fill="var(--color-fg-tertiary)"
                style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}
              >
                {s.name}
              </text>
              <text
                x={s.x + stageWidth / 2}
                y={PADDING - 4}
                textAnchor="middle"
                fontSize={11}
                fill="var(--color-fg-secondary)"
                fontWeight={500}
              >
                {s.list.length} sensors
              </text>
            </g>
          );
        })}

        {/* Inter-stage flow arrows */}
        {stages.slice(0, -1).map((s, i) => {
          const next = stages[i + 1];
          const sx = s.x + s.cols * NODE_COL_GAP;
          const nx = next.x;
          const y = PADDING + (height - PADDING * 2) / 2;
          return (
            <g key={`flow-${i}`}>
              <line
                x1={sx + 6}
                y1={y}
                x2={nx - 6}
                y2={y}
                stroke="var(--color-border-strong)"
                strokeWidth={1.2}
                strokeDasharray="2 4"
              />
              <polygon
                points={`${nx - 6},${y - 3} ${nx - 1},${y} ${nx - 6},${y + 3}`}
                fill="var(--color-fg-tertiary)"
              />
            </g>
          );
        })}

        {/* Edges */}
        {edges.map((e) => {
          const a = positioned.get(e.source);
          const b = positioned.get(e.target);
          if (!a || !b) return null;
          const isHighlighted =
            hovered === e.source || hovered === e.target;
          return (
            <line
              key={`${e.source}-${e.target}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={
                isHighlighted
                  ? "var(--color-accent-400)"
                  : "var(--color-border-default)"
              }
              strokeWidth={isHighlighted ? 1.4 : 0.6}
              strokeOpacity={isHighlighted ? 0.9 : 0.5}
              style={{ transition: "stroke 200ms, stroke-width 200ms, stroke-opacity 200ms" }}
            />
          );
        })}

        {/* Nodes */}
        {Array.from(positioned.values()).map((n) => {
          const score = liveAttribution.get(n.id) ?? 0;
          const intensity = score / maxAttribution; // 0..1
          const isHovered = hovered === n.id;
          const isNeighbor = hoveredNeighbors?.has(n.id);
          const isDimmed = hovered != null && !isHovered && !isNeighbor;

          // Color by attribution intensity
          const ringColor =
            intensity > 0.7
              ? "var(--color-state-alert)"
              : intensity > 0.3
                ? "var(--color-state-warn)"
                : intensity > 0.05
                  ? "var(--color-accent-400)"
                  : "var(--color-border-strong)";

          return (
            <g
              key={n.id}
              transform={`translate(${n.x}, ${n.y})`}
              style={{
                cursor: "pointer",
                opacity: isDimmed ? 0.3 : 1,
                transition: "opacity 200ms",
              }}
              onMouseEnter={() => { setLocalHover(n.id); setHovered(n.id); }}
              onMouseLeave={() => { setLocalHover(null); setHovered(null); }}
              onClick={() => setSelected(n.id)}
            >
              {intensity > 0.05 && (
                <circle
                  r={NODE_RADIUS + 8}
                  fill={ringColor}
                  fillOpacity={0.06 + intensity * 0.18}
                />
              )}
              <circle
                r={NODE_RADIUS - 5}
                fill="var(--color-bg-surface)"
                stroke={ringColor}
                strokeWidth={isHovered ? 1.8 : 1.2}
                style={{ transition: "stroke 200ms, stroke-width 200ms" }}
              />
              <text
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={9}
                fontFamily="var(--font-mono)"
                fontWeight={500}
                fill={
                  intensity > 0.5
                    ? "var(--color-fg-primary)"
                    : "var(--color-fg-secondary)"
                }
                style={{ pointerEvents: "none" }}
              >
                {shortLabel(n.id)}
              </text>
              {intensity > 0.05 && (
                <text
                  y={NODE_RADIUS + 12}
                  textAnchor="middle"
                  fontSize={9}
                  fontFamily="var(--font-mono)"
                  fill="var(--color-fg-tertiary)"
                  style={{ pointerEvents: "none" }}
                >
                  {score.toFixed(2)}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {hovered && (
        <HoverDetails
          sensorId={hovered}
          attribution={liveAttribution.get(hovered)}
        />
      )}
    </div>
  );
}

function HoverDetails({
  sensorId,
  attribution,
}: {
  sensorId: string;
  attribution: number | undefined;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "absolute bottom-4 right-4 surface-3 rounded-lg p-3 min-w-[180px] pointer-events-none",
      )}
    >
      <div className="text-[10px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-tertiary)] mb-1">
        Sensor
      </div>
      <div className="font-mono text-[14px] text-[var(--color-fg-primary)] mb-2 truncate">
        {sensorId}
      </div>
      {attribution != null && attribution > 0 ? (
        <div>
          <div className="text-[10px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-tertiary)]">
            Live attribution
          </div>
          <div className="font-mono text-[18px] tabular-nums font-semibold text-[var(--color-state-warn)]">
            {attribution.toFixed(3)}
          </div>
        </div>
      ) : (
        <div className="text-[11px] text-[var(--color-fg-tertiary)]">
          No live attribution
        </div>
      )}
    </motion.div>
  );
}

function shortLabel(id: string): string {
  if (id.length <= 6) return id;
  return id.slice(0, 5) + "…";
}
