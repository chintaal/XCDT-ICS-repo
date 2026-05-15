"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Play, Square } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { apiEndpoints } from "@/lib/api/endpoints";

export function InferenceControls() {
  const qc = useQueryClient();
  const [dataset, setDataset] = useState<string>("SWaT");

  const datasetsQ = useQuery({
    queryKey: ["datasets"],
    queryFn: () => apiEndpoints.datasets.list(),
  });

  const statusQ = useQuery({
    queryKey: ["inference-status"],
    queryFn: () => apiEndpoints.inference.status(),
    refetchInterval: 5_000,
  });

  const startMut = useMutation({
    mutationFn: () =>
      apiEndpoints.inference.start({
        dataset,
        emit_interval: 0.05,
        threshold_pct: 99,
      }),
    onSuccess: () => {
      toast.success(`Started inference`, { description: `Dataset: ${dataset}` });
      qc.invalidateQueries({ queryKey: ["inference-status"] });
    },
    onError: (e: unknown) =>
      toast.error("Could not start", {
        description: e instanceof Error ? e.message : "Unknown error",
      }),
  });

  const stopMut = useMutation({
    mutationFn: () => apiEndpoints.inference.stop(),
    onSuccess: () => {
      toast.success("Inference stopped.");
      qc.invalidateQueries({ queryKey: ["inference-status"] });
    },
  });

  const isRunning =
    statusQ.data?.status === "running" || statusQ.data?.status === "initializing";

  const datasetOptions =
    datasetsQ.data?.filter((d) => d.assets_ok).map((d) => ({
      value: d.key,
      label: d.key,
    })) ?? [];

  return (
    <div className="flex items-center gap-2">
      {datasetOptions.length > 0 && (
        <Segmented<string>
          value={
            datasetOptions.some((o) => o.value === dataset)
              ? dataset
              : datasetOptions[0]?.value ?? "SWaT"
          }
          onChange={setDataset}
          options={datasetOptions}
          size="md"
        />
      )}

      {isRunning ? (
        <Button
          variant="secondary"
          onClick={() => stopMut.mutate()}
          disabled={stopMut.isPending}
        >
          {stopMut.isPending ? <Loader2 className="animate-spin" /> : <Square strokeWidth={1.8} />}
          Stop
        </Button>
      ) : (
        <Button
          variant="primary"
          onClick={() => startMut.mutate()}
          disabled={startMut.isPending}
        >
          {startMut.isPending ? <Loader2 className="animate-spin" /> : <Play strokeWidth={1.8} />}
          Start inference
        </Button>
      )}
    </div>
  );
}
