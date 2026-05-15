"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  className?: string;
  showThreshold?: number | null;
}

/**
 * Tiny inline sparkline. SVG-based, no external lib.
 * Designed for live updates — pure rendering, no animation.
 */
export function Sparkline({
  values,
  width = 80,
  height = 24,
  stroke = "currentColor",
  fill = "none",
  className,
  showThreshold = null,
}: SparklineProps) {
  const { d, area, thresholdY } = useMemo(() => {
    if (values.length < 2) return { d: "", area: "", thresholdY: null };
    const min = Math.min(...values, showThreshold ?? Infinity);
    const max = Math.max(...values, showThreshold ?? -Infinity);
    const range = max - min || 1;
    const step = width / (values.length - 1);
    const points = values.map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const d = `M ${points.join(" L ")}`;
    const area = `${d} L ${width.toFixed(1)},${height} L 0,${height} Z`;
    const thresholdY =
      showThreshold != null
        ? height - ((showThreshold - min) / range) * height
        : null;
    return { d, area, thresholdY };
  }, [values, width, height, showThreshold]);

  if (!d) {
    return (
      <svg width={width} height={height} className={className} aria-hidden>
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="currentColor"
          strokeOpacity={0.15}
          strokeDasharray="2 3"
        />
      </svg>
    );
  }

  return (
    <svg
      width={width}
      height={height}
      className={cn("overflow-visible", className)}
      aria-hidden
    >
      {fill !== "none" && <path d={area} fill={fill} />}
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {thresholdY != null && (
        <line
          x1={0}
          y1={thresholdY}
          x2={width}
          y2={thresholdY}
          stroke="var(--color-state-alert)"
          strokeOpacity={0.5}
          strokeDasharray="2 2"
          strokeWidth={1}
        />
      )}
    </svg>
  );
}
