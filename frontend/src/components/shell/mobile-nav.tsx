"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertOctagon,
  Database,
  GitBranch,
  LayoutDashboard,
  Settings,
  Shield,
  TestTube2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/",             icon: Activity,     label: "Live"      },
  { href: "/replay-dashboard", icon: LayoutDashboard, label: "Replay" },
  { href: "/attack-strip",   icon: TestTube2,    label: "Strip"   },
  { href: "/incidents",    icon: AlertOctagon, label: "Incidents" },
  { href: "/sensor-graph", icon: GitBranch,    label: "Graph"     },
  { href: "/datasets",     icon: Database,     label: "Datasets"  },
  { href: "/sandbox",      icon: Shield,       label: "Sandbox"   },
  { href: "/settings",     icon: Settings,     label: "Settings"  },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav
      className="md:hidden flex items-center justify-around shrink-0 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-base)]/90 backdrop-blur-xl px-2 py-1.5 sticky bottom-0 z-30"
      aria-label="Mobile navigation"
    >
      {NAV.map(({ href, icon: Icon, label }) => {
        const active =
          href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-md transition-colors",
              active
                ? "text-[var(--color-fg-primary)]"
                : "text-[var(--color-fg-tertiary)]",
            )}
          >
            <Icon
              size={16}
              strokeWidth={active ? 2 : 1.5}
              className={cn(
                active && "text-[var(--color-accent-400)]",
              )}
            />
            <span className="text-[9px] font-medium tracking-tight uppercase">
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
