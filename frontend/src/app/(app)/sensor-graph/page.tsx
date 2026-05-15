"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GitBranch } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty";
import { Segmented } from "@/components/ui/segmented";
import { Badge } from "@/components/ui/badge";
import { apiEndpoints } from "@/lib/api/endpoints";
import { GraphCanvas } from "@/components/graph/graph-canvas";
import { useSystemStore } from "@/lib/store/system-store";

export default function SensorGraphPage() {
  const datasetsQ = useQuery({
    queryKey: ["datasets"],
    queryFn: () => apiEndpoints.datasets.list(),
  });

  const status = useQuery({
    queryKey: ["inference-status"],
    queryFn: () => apiEndpoints.inference.status(),
    refetchInterval: 5_000,
  });

  const [selected, setSelected] = useState<string>("");

  // Compute effective dataset selection in render — defaults to running
  // dataset, then first OK dataset, then empty.
  const effectiveSelected = useMemo(() => {
    if (selected && datasetsQ.data?.some((d) => d.key === selected)) return selected;
    const running = status.data?.dataset;
    if (running && datasetsQ.data?.some((d) => d.key === running)) return running;
    return datasetsQ.data?.find((d) => d.assets_ok)?.key ?? "";
  }, [selected, datasetsQ.data, status.data?.dataset]);

  const graphQ = useQuery({
    queryKey: ["sensor-graph", effectiveSelected],
    queryFn: () => apiEndpoints.datasets.graph(effectiveSelected),
    enabled: !!effectiveSelected,
  });

  const current = useSystemStore((s) => s.current);
  const liveAttribution = useMemo(() => {
    const map = new Map<string, number>();
    if (current?.dataset !== effectiveSelected) return map;
    const arr = (current?.top_sensors ?? current?.top_3_sensors) as
      | { sensor: string; score: number }[]
      | undefined;
    if (!arr) return map;
    arr.forEach((a) => map.set(a.sensor, a.score));
    return map;
  }, [current, effectiveSelected]);

  const datasetOptions =
    datasetsQ.data?.filter((d) => d.assets_ok).map((d) => ({
      value: d.key,
      label: d.key,
    })) ?? [];

  return (
    <div className="flex flex-col gap-6 pb-10 min-h-0 flex-1">
      <PageHeader
        eyebrow="Process topology"
        title="Sensor dependency graph"
        description="Sensors grouped by process stage. Live attribution scores from the running pipeline overlay automatically when the dataset matches."
        actions={
          datasetOptions.length > 0 && (
            <Segmented<string>
              value={effectiveSelected || datasetOptions[0]?.value || ""}
              onChange={setSelected}
              options={datasetOptions}
            />
          )
        }
      />

      <div className="px-6 flex flex-1 min-h-0">
        <Card className="flex-1 min-h-0">
          <CardContent className="px-0 pb-0 flex-1 min-h-0 flex flex-col">
            {graphQ.isLoading ? (
              <Skeleton className="flex-1 m-5" />
            ) : graphQ.isError || !graphQ.data ? (
              <EmptyState
                icon={<GitBranch />}
                title="Could not load graph"
                description="Verify the dataset assets are present and try again."
              />
            ) : graphQ.data.nodes.length === 0 ? (
              <EmptyState
                icon={<GitBranch />}
                title="Empty graph"
                description="No sensors registered for this dataset."
              />
            ) : (
              <>
                <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-[var(--color-border-subtle)]">
                  <div className="flex items-center gap-2 text-[12px]">
                    <Badge variant="outline">
                      {graphQ.data.nodes.length} nodes
                    </Badge>
                    <Badge variant="outline">
                      {graphQ.data.edges.length} edges
                    </Badge>
                    {liveAttribution.size > 0 && (
                      <Badge variant="accent">live</Badge>
                    )}
                  </div>
                  <div className="text-[11px] text-[var(--color-fg-tertiary)] hidden sm:block">
                    Drag nodes · scroll to zoom · click to inspect
                  </div>
                </div>
                <GraphCanvas
                  nodes={graphQ.data.nodes}
                  edges={graphQ.data.edges}
                  liveAttribution={liveAttribution}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
