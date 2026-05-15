import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.08em] tabular-nums",
  {
    variants: {
      variant: {
        neutral:
          "bg-[var(--color-bg-elevated)] text-[var(--color-fg-secondary)] border border-[var(--color-border-subtle)]",
        ok:
          "bg-[color-mix(in_srgb,var(--color-state-ok)_12%,transparent)] text-[var(--color-state-ok)] border border-[color-mix(in_srgb,var(--color-state-ok)_25%,transparent)]",
        warn:
          "bg-[color-mix(in_srgb,var(--color-state-warn)_12%,transparent)] text-[var(--color-state-warn)] border border-[color-mix(in_srgb,var(--color-state-warn)_25%,transparent)]",
        alert:
          "bg-[color-mix(in_srgb,var(--color-state-alert)_15%,transparent)] text-[var(--color-state-alert)] border border-[color-mix(in_srgb,var(--color-state-alert)_30%,transparent)]",
        accent:
          "bg-[color-mix(in_srgb,var(--color-accent-400)_12%,transparent)] text-[var(--color-accent-200)] border border-[color-mix(in_srgb,var(--color-accent-400)_25%,transparent)]",
        outline:
          "bg-transparent text-[var(--color-fg-secondary)] border border-[var(--color-border-default)]",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
