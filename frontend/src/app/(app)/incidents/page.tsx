"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertOctagon, ChevronRight, Filter, Inbox } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty";
import { Segmented } from "@/components/ui/segmented";
import { apiEndpoints } from "@/lib/api/endpoints";
import { formatFixed, formatRelative, formatTime } from "@/lib/utils";

type Filter = "all" | "tp" | "fp" | "pending";

export default function IncidentsPage() {
  const [filter, setFilter] = useState<Filter>("all");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["incidents", { limit: 100 }],
    queryFn: () => apiEndpoints.incidents.list({ limit: 100 }),
    refetchInterval: 15_000,
  });

  const stats = useQuery({
    queryKey: ["incident-stats"],
    queryFn: () => apiEndpoints.incidents.stats(),
    refetchInterval: 15_000,
  });

  const filtered = (data ?? []).filter((inc) => {
    if (filter === "tp") return inc.ground_truth === 1;
    if (filter === "fp") return inc.ground_truth === 0;
    if (filter === "pending") return inc.ground_truth == null;
    return true;
  });

  return (
    <div className="flex flex-col gap-6 pb-10">
      <PageHeader
        eyebrow="Forensic intelligence"
        title="Incidents"
        description="Persisted alerts emitted by the inference engine. Triage, label, and review incidents to improve calibration over time."
        actions={
          <Segmented<Filter>
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all",     label: <><Inbox  size={12} /> All ({stats.data?.total ?? 0})</> },
              { value: "tp",      label: `True Positive (${stats.data?.true_positives ?? 0})` },
              { value: "fp",      label: `False Positive (${stats.data?.false_positives ?? 0})` },
              { value: "pending", label: `Pending (${stats.data?.pending ?? 0})` },
            ]}
          />
        }
      />

      <div className="px-6">
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-[120px]" />
            ))}
          </div>
        ) : isError ? (
          <Card>
            <CardContent>
              <EmptyState
                icon={<AlertOctagon />}
                title="Could not load incidents"
                description="Check that the API is reachable."
              />
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent>
              <EmptyState
                icon={filter === "all" ? <Inbox /> : <Filter />}
                title={filter === "all" ? "No incidents yet" : "No incidents match this filter"}
                description={
                  filter === "all"
                    ? "Once the engine emits an alert, it will be persisted here."
                    : "Try a different filter."
                }
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {filtered.map((inc, idx) => (
              <motion.div
                key={inc.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(0.4, idx * 0.025), duration: 0.3 }}
              >
                <Link
                  href={`/incidents/${inc.id}`}
                  className="block tile p-4 transition-all hover:border-[var(--color-border-strong)] hover:bg-[var(--color-bg-elevated)]/40 group"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="size-2 rounded-full mt-1.5 shrink-0"
                      style={{
                        background:
                          inc.ground_truth === 1
                            ? "var(--color-state-alert)"
                            : inc.ground_truth === 0
                              ? "var(--color-state-warn)"
                              : "var(--color-fg-tertiary)",
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-mono text-[11px] text-[var(--color-fg-tertiary)]">
                          #{inc.id}
                        </span>
                        <span className="font-medium tracking-tight text-[15px] text-[var(--color-fg-primary)]">
                          {inc.dataset}
                        </span>
                        {inc.ground_truth != null && (
                          <Badge variant={inc.ground_truth === 1 ? "alert" : "warn"}>
                            {inc.ground_truth === 1 ? "TP" : "FP"}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-baseline gap-3 mb-2">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase tracking-[0.1em] text-[var(--color-fg-tertiary)]">
                            Peak
                          </span>
                          <span className="font-mono text-[18px] tabular-nums font-semibold text-[var(--color-fg-primary)]">
                            {formatFixed(inc.peak_score, 2)}
                          </span>
                        </div>
                        <div className="text-[var(--color-fg-quaternary)]">/</div>
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase tracking-[0.1em] text-[var(--color-fg-tertiary)]">
                            Threshold
                          </span>
                          <span className="font-mono text-[14px] tabular-nums text-[var(--color-fg-secondary)]">
                            {formatFixed(inc.threshold, 2)}
                          </span>
                        </div>
                        <div className="ml-auto text-right">
                          <span className="text-[10px] uppercase tracking-[0.1em] text-[var(--color-fg-tertiary)] block">
                            Duration
                          </span>
                          <span className="font-mono text-[12px] tabular-nums text-[var(--color-fg-secondary)]">
                            {inc.duration_windows}w
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--color-fg-tertiary)]">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono">{formatTime(inc.start_time)}</span>
                          {inc.top_sensors?.[0]?.sensor && (
                            <>
                              <span>·</span>
                              <span className="font-mono truncate max-w-[160px] text-[var(--color-fg-secondary)]">
                                {inc.top_sensors[0].sensor}
                              </span>
                            </>
                          )}
                        </div>
                        <span>{formatRelative(inc.created_at)}</span>
                      </div>
                    </div>
                    <ChevronRight
                      size={14}
                      className="text-[var(--color-fg-quaternary)] mt-2 group-hover:text-[var(--color-fg-secondary)] group-hover:translate-x-0.5 transition-all"
                    />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
