import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow?: React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-end sm:justify-between border-b border-[var(--color-border-subtle)]",
        className,
      )}
    >
      <div className="flex flex-col gap-1.5 min-w-0">
        {eyebrow && (
          <span className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-[var(--color-fg-tertiary)]">
            {eyebrow}
          </span>
        )}
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--color-fg-primary)] text-balance">
          {title}
        </h1>
        {description && (
          <p className="text-[13px] text-[var(--color-fg-secondary)] max-w-2xl text-pretty">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-wrap">{actions}</div>
      )}
    </div>
  );
}
