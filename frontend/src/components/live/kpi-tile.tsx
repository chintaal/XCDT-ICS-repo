"use client";

import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Sparkline } from "@/components/ui/sparkline";
import { cn } from "@/lib/utils";

interface KpiTileProps {
  label: string;
  value: string;
  unit?: string;
  delta?: number;
  trend?: number[];
  tone?: "neutral" | "ok" | "warn" | "alert";
  monoValue?: boolean;
  className?: string;
}

const trendColor = {
  neutral: "var(--color-fg-tertiary)",
  ok:      "var(--color-state-ok)",
  warn:    "var(--color-state-warn)",
  alert:   "var(--color-state-alert)",
};

export function KpiTile({
  label,
  value,
  unit,
  delta,
  trend,
  tone = "neutral",
  monoValue = true,
  className,
}: KpiTileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "tile flex flex-col gap-3 px-4 py-3 min-h-[92px]",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-[var(--color-fg-tertiary)]">
          {label}
        </span>
        {trend && trend.length > 1 && (
          <Sparkline
            values={trend}
            width={56}
            height={16}
            stroke={trendColor[tone]}
            className="text-[var(--color-fg-tertiary)]"
          />
        )}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span
          className={cn(
            "text-2xl font-semibold tracking-tight tabular-nums text-[var(--color-fg-primary)] leading-none",
            monoValue && "font-mono",
          )}
        >
          {value}
        </span>
        {unit && (
          <span className="text-[11px] font-mono text-[var(--color-fg-tertiary)] tracking-tight">
            {unit}
          </span>
        )}
        {delta != null && Number.isFinite(delta) && (
          <span
            className={cn(
              "ml-auto inline-flex items-center gap-0.5 text-[11px] font-mono tabular-nums",
              delta > 0
                ? "text-[var(--color-state-warn)]"
                : delta < 0
                  ? "text-[var(--color-state-ok)]"
                  : "text-[var(--color-fg-tertiary)]",
            )}
          >
            {delta > 0 ? <ArrowUpRight size={10} /> : delta < 0 ? <ArrowDownRight size={10} /> : null}
            {delta > 0 ? "+" : ""}
            {delta.toFixed(2)}
          </span>
        )}
      </div>
    </motion.div>
  );
}
