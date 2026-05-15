"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertOctagon,
  Database,
  GitBranch,
  Play,
  Search,
  Settings,
  Shield,
  Square,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiEndpoints } from "@/lib/api/endpoints";
import { cn } from "@/lib/utils";

type Cmd = {
  id: string;
  group: "Navigate" | "Inference" | "Sandbox";
  label: string;
  hint?: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  run: () => void | Promise<void>;
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const stopMut = useMutation({
    mutationFn: () => apiEndpoints.inference.stop(),
    onSuccess: () => toast.success("Inference stopped."),
    onError:   (e) => toast.error("Failed to stop inference", { description: String(e) }),
  });

  const startSwatMut = useMutation({
    mutationFn: () => apiEndpoints.inference.start({ dataset: "SWaT" }),
    onSuccess: () => toast.success("Started SWaT inference."),
    onError:   (e) => toast.error("Could not start", { description: String(e) }),
  });

  // Open/close shortcut
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <PaletteOverlay
          onClose={() => setOpen(false)}
          router={router}
          stopMut={stopMut}
          startSwatMut={startSwatMut}
        />
      )}
    </AnimatePresence>
  );
}

interface PaletteOverlayProps {
  onClose: () => void;
  router: ReturnType<typeof useRouter>;
  stopMut: ReturnType<typeof useMutation<unknown, unknown, void>>;
  startSwatMut: ReturnType<typeof useMutation<unknown, unknown, void>>;
}

// Inner component — gets remounted (state reset) every time the palette opens.
function PaletteOverlay({ onClose, router, stopMut, startSwatMut }: PaletteOverlayProps) {
  const [query, setQuery]   = useState("");
  const [active, setActive] = useState(0);

  const allCommands: Cmd[] = [
    { id: "nav-live",      group: "Navigate", label: "Live Operations",  icon: Activity,     run: () => router.push("/") },
    { id: "nav-incidents", group: "Navigate", label: "Incidents",        icon: AlertOctagon, run: () => router.push("/incidents") },
    { id: "nav-graph",     group: "Navigate", label: "Sensor Graph",     icon: GitBranch,    run: () => router.push("/sensor-graph") },
    { id: "nav-datasets",  group: "Navigate", label: "Datasets",         icon: Database,     run: () => router.push("/datasets") },
    { id: "nav-sandbox",   group: "Navigate", label: "Attack Sandbox",   icon: Shield,       run: () => router.push("/sandbox") },
    { id: "nav-settings",  group: "Navigate", label: "Settings",         icon: Settings,     run: () => router.push("/settings") },
    { id: "inf-start",     group: "Inference", label: "Start SWaT inference", hint: "default config", icon: Play,   run: () => startSwatMut.mutate() },
    { id: "inf-stop",      group: "Inference", label: "Stop inference",       icon: Square, run: () => stopMut.mutate() },
  ];

  const q = query.trim().toLowerCase();
  const filtered = q
    ? allCommands.filter(
        (c) =>
          c.label.toLowerCase().includes(q) || c.group.toLowerCase().includes(q),
      )
    : allCommands;

  // Group by .group preserving order
  const groups = filtered.reduce<Record<string, Cmd[]>>((acc, c) => {
    (acc[c.group] ??= []).push(c);
    return acc;
  }, {});

  function runActive() {
    const cmd = filtered[active];
    if (!cmd) return;
    onClose();
    Promise.resolve(cmd.run());
  }

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[14vh] px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/50 backdrop-blur-md"
        onClick={onClose}
      />

      <motion.div
        initial={{ y: -8, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -4, opacity: 0, scale: 0.99 }}
        transition={{ type: "spring", stiffness: 400, damping: 32 }}
        className="surface-3 relative w-full max-w-xl rounded-xl overflow-hidden"
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(filtered.length - 1, a + 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(0, a - 1));
          } else if (e.key === "Enter") {
            e.preventDefault();
            runActive();
          }
        }}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border-subtle)]">
          <Search size={15} strokeWidth={1.8} className="text-[var(--color-fg-tertiary)]" />
          <input
            autoFocus
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActive(0); }}
            placeholder="Type a command or search…"
            className="flex-1 bg-transparent text-sm text-[var(--color-fg-primary)] placeholder:text-[var(--color-fg-quaternary)] focus:outline-none"
          />
          <kbd className="rounded border border-[var(--color-border-subtle)] bg-[var(--color-bg-base)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--color-fg-tertiary)]">
            ESC
          </kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto py-1.5">
          {filtered.length === 0 && (
            <div className="px-4 py-6 text-center text-xs text-[var(--color-fg-tertiary)]">
              No matching commands.
            </div>
          )}
          {Object.entries(groups).map(([groupName, items]) => (
            <div key={groupName} className="py-1.5">
              <div className="px-4 py-1 text-[10px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-quaternary)]">
                {groupName}
              </div>
              {items.map((cmd) => {
                const idx = filtered.indexOf(cmd);
                const isActive = idx === active;
                const Icon = cmd.icon;
                return (
                  <button
                    key={cmd.id}
                    type="button"
                    onMouseEnter={() => setActive(idx)}
                    onClick={() => { onClose(); cmd.run(); }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors",
                      isActive
                        ? "bg-[var(--color-bg-elevated)] text-[var(--color-fg-primary)]"
                        : "text-[var(--color-fg-secondary)]",
                    )}
                  >
                    <Icon size={14} strokeWidth={1.6} />
                    <span className="flex-1 tracking-tight">{cmd.label}</span>
                    {cmd.hint && (
                      <span className="text-[11px] text-[var(--color-fg-tertiary)]">
                        {cmd.hint}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
