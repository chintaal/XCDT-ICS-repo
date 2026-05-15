import { cn } from "@/lib/utils";

type Tone = "ok" | "warn" | "alert" | "neutral" | "accent";

const toneClasses: Record<Tone, string> = {
  ok:      "bg-[var(--color-state-ok)]",
  warn:    "bg-[var(--color-state-warn)]",
  alert:   "bg-[var(--color-state-alert)]",
  neutral: "bg-[var(--color-fg-tertiary)]",
  accent:  "bg-[var(--color-accent-400)]",
};

interface StatusDotProps {
  tone?: Tone;
  pulse?: boolean;
  className?: string;
  size?: "xs" | "sm" | "md";
}

const sizeMap = {
  xs: "size-1.5",
  sm: "size-2",
  md: "size-2.5",
};

export function StatusDot({
  tone = "neutral",
  pulse = false,
  className,
  size = "sm",
}: StatusDotProps) {
  return (
    <span
      className={cn(
        "relative inline-block rounded-full",
        sizeMap[size],
        toneClasses[tone],
        pulse && "pulse-dot",
        className,
      )}
      aria-hidden
    />
  );
}
