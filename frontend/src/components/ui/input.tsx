import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type = "text", ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      "flex h-9 w-full rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-3 py-1 text-sm text-[var(--color-fg-primary)] placeholder:text-[var(--color-fg-quaternary)] transition-colors duration-150 focus-visible:outline-none focus-visible:border-[var(--color-accent-400)] focus-visible:ring-1 focus-visible:ring-[var(--color-accent-400)] disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:text-sm file:font-medium",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
