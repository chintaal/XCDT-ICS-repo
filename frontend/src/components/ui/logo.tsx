import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: number;
}

/**
 * XCDT-ICS mark — a hexagonal node with an inscribed crosshair.
 * Reads as: "sensor + system + intelligence."
 */
export function Logo({ className, size = 22 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn("shrink-0", className)}
      aria-label="XCDT-ICS"
    >
      <path
        d="M12 2.5L20.5 7.25V16.75L12 21.5L3.5 16.75V7.25L12 2.5Z"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <path
        d="M12 8V16M8 12H16"
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinecap="round"
        opacity={0.55}
      />
      <circle cx={12} cy={12} r={1.6} fill="currentColor" />
    </svg>
  );
}
