"use client";

import { useEffect, useRef } from "react";
import { animate } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

/**
 * Smoothly tweens a numeric value with framer's `animate` (rAF-driven).
 * Imperatively updates the DOM — no React re-renders per frame.
 */
export function AnimatedNumber({
  value,
  decimals = 2,
  duration = 0.45,
  className,
  prefix,
  suffix,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const prevRef = useRef<number>(value);

  useEffect(() => {
    const from = prevRef.current;
    const to = Number.isFinite(value) ? value : 0;
    prevRef.current = to;

    const controls = animate(from, to, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        if (ref.current) {
          ref.current.textContent = latest.toFixed(decimals);
        }
      },
    });
    return () => controls.stop();
  }, [value, decimals, duration]);

  return (
    <span className={cn("font-mono tabular-nums", className)} data-numeric>
      {prefix}
      <span ref={ref}>{Number.isFinite(value) ? value.toFixed(decimals) : "—"}</span>
      {suffix}
    </span>
  );
}
