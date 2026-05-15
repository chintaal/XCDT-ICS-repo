import * as React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center grid-dots",
        className,
      )}
    >
      {icon && (
        <div className="flex size-10 items-center justify-center rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] text-[var(--color-fg-tertiary)] [&_svg]:size-5">
          {icon}
        </div>
      )}
      <div className="space-y-1 max-w-sm">
        <h3 className="text-sm font-medium text-[var(--color-fg-primary)] tracking-tight">{title}</h3>
        {description && (
          <p className="text-xs text-[var(--color-fg-tertiary)] text-balance">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
