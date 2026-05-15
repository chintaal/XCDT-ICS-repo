"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Activity,
  AlertOctagon,
  Database,
  GitBranch,
  LayoutDashboard,
  Settings,
  Shield,
  Sparkles,
  TestTube2,
  Waves,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/",             label: "Live Operations", icon: Activity,     hint: "Realtime detection" },
  { href: "/replay-dashboard", label: "Methodology replay", icon: LayoutDashboard, hint: "Streamlit parity · XAI" },
  { href: "/attack-strip",   label: "Attack strip lab",  icon: TestTube2,    hint: "validate_attack_injection" },
  { href: "/incidents",    label: "Incidents",       icon: AlertOctagon, hint: "Forensic intelligence" },
  { href: "/sensor-graph", label: "Sensor Graph",    icon: GitBranch,    hint: "Process topology" },
  { href: "/datasets",     label: "Datasets",        icon: Database,     hint: "Models & assets" },
  { href: "/sandbox",      label: "Attack Sandbox",  icon: Shield,       hint: "Red-team simulation" },
  { href: "/settings",     label: "Settings",        icon: Settings,     hint: "Calibration" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden md:flex w-[244px] shrink-0 flex-col border-r border-[var(--color-border-subtle)] bg-[var(--color-bg-base)]/60 backdrop-blur-xl"
      aria-label="Primary"
    >
      {/* Brand */}
      <div className="px-5 py-5 border-b border-[var(--color-border-subtle)]">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <Logo
            size={22}
            className="text-[var(--color-fg-primary)] transition-transform group-hover:rotate-6"
          />
          <div className="flex flex-col leading-none">
            <span className="text-[13px] font-semibold tracking-tight text-[var(--color-fg-primary)]">
              XCDT-ICS
            </span>
            <span className="text-[10px] font-medium tracking-[0.12em] uppercase text-[var(--color-fg-tertiary)] mt-0.5">
              Command Center
            </span>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item, idx) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              className={cn(
                "relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium tracking-tight transition-colors",
                isActive
                  ? "text-[var(--color-fg-primary)]"
                  : "text-[var(--color-fg-secondary)] hover:text-[var(--color-fg-primary)] hover:bg-[var(--color-bg-elevated)]/60",
              )}
              style={{ animationDelay: `${idx * 30}ms` }}
            >
              {isActive && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-md bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)]"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <Icon
                strokeWidth={1.6}
                className={cn(
                  "relative z-10 size-[15px] transition-colors",
                  isActive
                    ? "text-[var(--color-accent-400)]"
                    : "text-[var(--color-fg-tertiary)]",
                )}
              />
              <span className="relative z-10 flex-1">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer — meta */}
      <div className="px-5 py-4 border-t border-[var(--color-border-subtle)] space-y-2">
        <div className="flex items-center gap-2 text-[10px] tracking-[0.12em] uppercase text-[var(--color-fg-tertiary)] font-medium">
          <Waves size={11} strokeWidth={1.8} />
          <span>SS-Encoder · v1.0</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] tracking-tight text-[var(--color-fg-quaternary)]">
          <Sparkles size={10} strokeWidth={1.8} />
          <span>Self-supervised · Mahalanobis + Variance-Collapse</span>
        </div>
      </div>
    </aside>
  );
}
