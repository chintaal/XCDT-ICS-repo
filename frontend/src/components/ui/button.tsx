import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium tracking-tight transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent-400)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-void)] disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--color-fg-primary)] text-[var(--color-bg-void)] hover:bg-[color-mix(in_srgb,var(--color-fg-primary)_92%,transparent)] active:scale-[0.98]",
        secondary:
          "bg-[var(--color-bg-elevated)] text-[var(--color-fg-primary)] border border-[var(--color-border-default)] hover:bg-[var(--color-bg-hover)] hover:border-[var(--color-border-strong)] active:scale-[0.98]",
        ghost:
          "text-[var(--color-fg-secondary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-fg-primary)]",
        outline:
          "border border-[var(--color-border-default)] bg-transparent text-[var(--color-fg-primary)] hover:bg-[var(--color-bg-elevated)] hover:border-[var(--color-border-strong)]",
        accent:
          "bg-[var(--color-accent-500)] text-white hover:bg-[var(--color-accent-400)] active:scale-[0.98]",
        danger:
          "bg-[var(--color-state-alert)] text-white hover:opacity-90 active:scale-[0.98]",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4",
        lg: "h-10 px-5",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
