"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, FileWarning, GitBranch, Loader2, Play } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiEndpoints } from "@/lib/api/endpoints";
import type { DatasetInfo, StartInferenceRequest } from "@/lib/api/types";
import { cn } from "@/lib/utils";

interface DatasetCardProps {
  dataset: DatasetInfo;
}

export function DatasetCard({ dataset }: DatasetCardProps) {
  const qc = useQueryClient();
  const [thresholdPct, setThresholdPct] = useState(99);
  const [emitInterval, setEmitInterval] = useState(0.05);

  const startMut = useMutation({
    mutationFn: (req: StartInferenceRequest) => apiEndpoints.inference.start(req),
    onSuccess: () => {
      toast.success("Inference started", { description: dataset.key });
      qc.invalidateQueries({ queryKey: ["inference-status"] });
    },
    onError: (e) => toast.error("Could not start", { description: String(e) }),
  });

  return (
    <Card className="h-full">
      <CardContent className="space-y-4 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--color-fg-tertiary)]">
              Dataset
            </div>
            <h3 className="text-[20px] font-semibold tracking-tight text-[var(--color-fg-primary)]">
              {dataset.key}
            </h3>
            <p className="text-[12px] text-[var(--color-fg-tertiary)]">
              {dataset.display_name}
            </p>
          </div>
          {dataset.assets_ok ? (
            <Badge variant="ok">
              <CheckCircle2 size={11} />
              Ready
            </Badge>
          ) : (
            <Badge variant="warn">
              <FileWarning size={11} />
              Missing assets
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[var(--color-border-faint)]">
          <Stat label="Sensors" value={dataset.n_sensors != null ? String(dataset.n_sensors) : "—"} />
          <Stat label="Status" value={dataset.assets_ok ? "Available" : "Incomplete"} />
        </div>

        {dataset.missing_files.length > 0 && (
          <div className="text-[11px] space-y-1 mt-2 pt-3 border-t border-[var(--color-border-faint)]">
            <div className="text-[10px] uppercase tracking-[0.12em] font-medium text-[var(--color-state-warn)]">
              Missing files
            </div>
            {dataset.missing_files.slice(0, 3).map((p) => (
              <div key={p} className="font-mono text-[var(--color-fg-tertiary)] truncate">
                {p}
              </div>
            ))}
          </div>
        )}

        {dataset.assets_ok && (
          <div className="space-y-3 pt-3 border-t border-[var(--color-border-faint)]">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor={`thr-${dataset.key}`}>Threshold pct</Label>
                <Input
                  id={`thr-${dataset.key}`}
                  type="number"
                  min={50}
                  max={100}
                  step={0.5}
                  value={thresholdPct}
                  onChange={(e) => setThresholdPct(Number(e.target.value))}
                  className="font-mono tabular-nums h-8"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`emit-${dataset.key}`}>Emit interval (s)</Label>
                <Input
                  id={`emit-${dataset.key}`}
                  type="number"
                  min={0}
                  max={5}
                  step={0.01}
                  value={emitInterval}
                  onChange={(e) => setEmitInterval(Number(e.target.value))}
                  className="font-mono tabular-nums h-8"
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className={cn(!dataset.assets_ok && "opacity-50")}>
        <Link
          href={`/sensor-graph?d=${encodeURIComponent(dataset.key)}`}
          className="inline-flex items-center gap-1 text-[12px] tracking-tight text-[var(--color-fg-secondary)] hover:text-[var(--color-fg-primary)] transition-colors"
        >
          <GitBranch size={12} />
          View topology
        </Link>
        <Button
          variant="primary"
          size="sm"
          disabled={!dataset.assets_ok || startMut.isPending}
          onClick={() =>
            startMut.mutate({
              dataset: dataset.key,
              threshold_pct: thresholdPct,
              emit_interval: emitInterval,
            })
          }
        >
          {startMut.isPending ? <Loader2 className="animate-spin" /> : <Play strokeWidth={1.8} />}
          Start
        </Button>
      </CardFooter>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--color-fg-tertiary)] mb-0.5">
        {label}
      </div>
      <div className="font-mono text-[14px] tabular-nums text-[var(--color-fg-primary)]">
        {value}
      </div>
    </div>
  );
}
