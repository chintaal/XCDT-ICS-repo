"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, AlertOctagon } from "lucide-react";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty";
import { apiEndpoints } from "@/lib/api/endpoints";
import { formatFixed, formatRelative } from "@/lib/utils";

export function RecentIncidents() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["incidents", { limit: 6 }],
    queryFn: () => apiEndpoints.incidents.list({ limit: 6 }),
    refetchInterval: 10_000,
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-1">
          <CardTitle>Recent incidents</CardTitle>
          <CardSubtitle>Persisted alerts from the inference engine</CardSubtitle>
        </div>
        <Link
          href="/incidents"
          className="text-[11px] font-medium tracking-tight text-[var(--color-fg-secondary)] hover:text-[var(--color-fg-primary)] inline-flex items-center gap-1"
        >
          All
          <ArrowRight size={11} strokeWidth={1.8} />
        </Link>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        {isLoading ? (
          <div className="space-y-2 px-5 pb-5">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : isError ? (
          <div className="px-5 pb-5">
            <EmptyState
              icon={<AlertOctagon />}
              title="Could not load incidents"
              description="The backend did not respond. Check that the API is running."
            />
          </div>
        ) : !data || data.length === 0 ? (
          <EmptyState
            icon={<AlertOctagon strokeWidth={1.6} />}
            title="No incidents yet"
            description="Once the inference engine emits alerts, they appear here."
          />
        ) : (
          <ul className="divide-y divide-[var(--color-border-subtle)]">
            {data.map((inc) => (
              <li key={inc.id}>
                <Link
                  href={`/incidents/${inc.id}`}
                  className="block px-5 py-3 transition-colors hover:bg-[var(--color-bg-elevated)]/40"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="size-1.5 rounded-full shrink-0"
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
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-[11px] text-[var(--color-fg-tertiary)]">
                          #{inc.id}
                        </span>
                        <span className="text-[12.5px] font-medium tracking-tight text-[var(--color-fg-primary)] truncate">
                          {inc.dataset}
                          <span className="text-[var(--color-fg-tertiary)] mx-1.5">·</span>
                          <span className="font-mono">{formatFixed(inc.peak_score, 2)}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[var(--color-fg-tertiary)]">
                        <span>{formatRelative(inc.created_at)}</span>
                        <span>·</span>
                        <span>{inc.duration_windows} windows</span>
                        {inc.top_sensors?.[0]?.sensor && (
                          <>
                            <span>·</span>
                            <span className="font-mono truncate max-w-[140px]">
                              {inc.top_sensors[0].sensor}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {inc.ground_truth != null && (
                      <Badge variant={inc.ground_truth === 1 ? "alert" : "warn"}>
                        {inc.ground_truth === 1 ? "TP" : "FP"}
                      </Badge>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
