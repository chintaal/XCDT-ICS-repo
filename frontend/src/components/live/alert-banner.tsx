"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { useSystemStore } from "@/lib/store/system-store";
import { formatFixed, formatTime } from "@/lib/utils";

export function AlertBanner() {
  const current = useSystemStore((s) => s.current);
  const isAlert = current?.is_alert === true;

  return (
    <AnimatePresence initial={false}>
      {isAlert && current && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden"
        >
          <div className="bg-[color-mix(in_srgb,var(--color-state-alert)_8%,transparent)] border-b border-[color-mix(in_srgb,var(--color-state-alert)_25%,transparent)]">
            <div className="flex items-center gap-3 px-6 py-2.5 text-[13px]">
              <AlertTriangle
                size={15}
                strokeWidth={2}
                className="text-[var(--color-state-alert)] shrink-0"
              />
              <span className="font-semibold tracking-tight text-[var(--color-fg-primary)]">
                Anomaly detected
              </span>
              <span className="text-[var(--color-fg-secondary)] hidden sm:inline">
                Score{" "}
                <span className="font-mono text-[var(--color-fg-primary)]">
                  {formatFixed(current.anomaly_score, 2)}
                </span>{" "}
                · Threshold{" "}
                <span className="font-mono">{formatFixed(current.threshold, 2)}</span>
              </span>
              <span className="text-[var(--color-fg-tertiary)] font-mono text-[11px] hidden md:inline">
                {formatTime(current.timestamp)}
              </span>
              <Link
                href="/incidents"
                className="ml-auto inline-flex items-center gap-1 text-[12px] font-medium tracking-tight text-[var(--color-fg-primary)] hover:opacity-80 transition-opacity"
              >
                View incidents
                <ArrowRight size={13} strokeWidth={1.8} />
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
