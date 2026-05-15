"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

interface SegmentedProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: ReadonlyArray<SegmentedOption<T>>;
  className?: string;
  size?: "sm" | "md";
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  size = "md",
}: SegmentedProps<T>) {
  const id = React.useId();
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-0.5",
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative inline-flex items-center gap-1.5 rounded px-2.5 font-medium tracking-tight transition-colors",
              size === "md" ? "h-7 text-xs" : "h-6 text-[11px]",
              active
                ? "text-[var(--color-fg-primary)]"
                : "text-[var(--color-fg-tertiary)] hover:text-[var(--color-fg-secondary)]",
              "[&_svg]:size-3.5",
            )}
          >
            {active && (
              <motion.span
                layoutId={`segmented-${id}`}
                className="absolute inset-0 rounded bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)]"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-1.5">
              {opt.icon}
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
