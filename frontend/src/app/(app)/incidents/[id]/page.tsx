"use client";

import { use } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  Clock,
  Database,
  HelpCircle,
  Loader2,
  Sigma,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty";
import { apiEndpoints } from "@/lib/api/endpoints";
import { formatFixed, formatTime } from "@/lib/utils";
import type { IncidentResponse } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export default function IncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = use(params);
  const id = Number(idStr);
  const router = useRouter();
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["incident", id],
    queryFn: () => apiEndpoints.incidents.get(id),
    enabled: Number.isFinite(id),
  });

  const feedbackMut = useMutation({
    mutationFn: (gt: number | null) =>
      apiEndpoints.incidents.feedback(id, { ground_truth: gt }),
    onSuccess: (next) => {
      qc.setQueryData(["incident", id], next);
      qc.invalidateQueries({ queryKey: ["incidents"] });
      qc.invalidateQueries({ queryKey: ["incident-stats"] });
      toast.success("Feedback recorded");
    },
    onError: () => toast.error("Could not save feedback"),
  });

  const deleteMut = useMutation({
    mutationFn: () => apiEndpoints.incidents.delete(id),
    onSuccess: () => {
      toast.success("Incident deleted");
      router.push("/incidents");
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 pb-10">
        <PageHeader title={`Incident #${id}`} eyebrow="Forensic intelligence" />
        <div className="px-6">
          <Skeleton className="h-[500px]" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col gap-6 pb-10">
        <PageHeader title={`Incident #${id}`} eyebrow="Forensic intelligence" />
        <div className="px-6">
          <Card>
            <CardContent>
              <EmptyState
                title="Could not load incident"
                description="It may have been deleted, or the API is unreachable."
                action={
                  <Link href="/incidents">
                    <Button variant="secondary" size="sm">
                      <ArrowLeft size={14} /> Back to incidents
                    </Button>
                  </Link>
                }
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      <PageHeader
        eyebrow={
          <Link
            href="/incidents"
            className="inline-flex items-center gap-1 hover:text-[var(--color-fg-primary)] transition-colors"
          >
            <ArrowLeft size={11} /> All incidents
          </Link>
        }
        title={`Incident #${data.id}`}
        description={`${data.dataset} · started at ${formatTime(data.start_time)}${
          data.end_time ? ` · ended at ${formatTime(data.end_time)}` : ""
        }`}
        actions={
          <div className="flex items-center gap-2">
            <FeedbackBlock
              current={data.ground_truth}
              onSelect={(gt) => feedbackMut.mutate(gt)}
              isPending={feedbackMut.isPending}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteMut.mutate()}
              disabled={deleteMut.isPending}
              aria-label="Delete incident"
              title="Delete incident"
            >
              {deleteMut.isPending ? <Loader2 className="animate-spin" /> : <Trash2 size={14} />}
            </Button>
          </div>
        }
      />

      <div className="px-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 flex flex-col gap-5">
          <SummaryCard incident={data} />
          <SensorsCard incident={data} />
        </div>

        <div className="flex flex-col gap-5">
          <MetadataCard incident={data} />
          <NarrativeCard incident={data} />
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ incident }: { incident: IncidentResponse }) {
  const ratio = incident.threshold > 0 ? incident.peak_score / incident.threshold : 0;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Detection summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <BigStat
            icon={<Sigma size={14} strokeWidth={1.6} />}
            label="Peak score"
            value={formatFixed(incident.peak_score, 2)}
          />
          <BigStat
            icon={<Sigma size={14} strokeWidth={1.6} />}
            label="Threshold"
            value={formatFixed(incident.threshold, 2)}
            sub={`${(ratio * 100).toFixed(0)}% of threshold`}
          />
          <BigStat
            icon={<Clock size={14} strokeWidth={1.6} />}
            label="Duration"
            value={`${incident.duration_windows}`}
            sub="windows"
          />
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12.5px]">
          <Row label="Start" value={formatTime(incident.start_time)} mono />
          <Row label="End" value={incident.end_time ? formatTime(incident.end_time) : "—"} mono />
          <Row label="Method" value={formatMethod(incident.attribution_method)} />
          <Row label="Created" value={formatTime(incident.created_at)} mono />
        </div>
      </CardContent>
    </Card>
  );
}

function SensorsCard({ incident }: { incident: IncidentResponse }) {
  const sensors = incident.top_sensors ?? [];
  const max = sensors.reduce((m, s) => Math.max(m, s.score), 0) || 1;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top contributing sensors</CardTitle>
        <Badge variant="outline">{sensors.length}</Badge>
      </CardHeader>
      <CardContent className="space-y-2">
        {sensors.length === 0 ? (
          <EmptyState title="No attribution data" />
        ) : (
          sensors.map((s, idx) => {
            const pct = (s.score / max) * 100;
            return (
              <div
                key={s.sensor}
                className="flex items-center gap-3 rounded-md py-2 px-3 hover:bg-[var(--color-bg-elevated)]/50 transition-colors"
              >
                <span className="w-6 font-mono text-[11px] tabular-nums text-[var(--color-fg-quaternary)]">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span className="font-mono text-[13px] tracking-tight text-[var(--color-fg-primary)] truncate flex-1">
                  {s.sensor}
                </span>
                <span className="font-mono tabular-nums text-[12px] text-[var(--color-fg-secondary)] w-14 text-right">
                  {formatFixed(s.score, 2)}
                </span>
                <div className="w-32 h-1 rounded-full bg-[var(--color-bg-elevated)] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      background:
                        idx === 0
                          ? "var(--color-state-warn)"
                          : "var(--color-accent-400)",
                    }}
                  />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function MetadataCard({ incident }: { incident: IncidentResponse }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Metadata</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Row
          label="Dataset"
          value={
            <span className="inline-flex items-center gap-1.5">
              <Database size={11} className="text-[var(--color-fg-tertiary)]" />
              {incident.dataset}
            </span>
          }
        />
        <Row
          label="Status"
          value={
            <Badge
              variant={
                incident.ground_truth === 1
                  ? "alert"
                  : incident.ground_truth === 0
                    ? "warn"
                    : "outline"
              }
            >
              {incident.ground_truth === 1
                ? "True positive"
                : incident.ground_truth === 0
                  ? "False positive"
                  : "Unlabeled"}
            </Badge>
          }
        />
        {incident.heatmap_path && (
          <Row
            label="Heatmap"
            value={
              <span className="font-mono text-[11px] truncate max-w-[200px] inline-block">
                {incident.heatmap_path.split("/").slice(-1)[0]}
              </span>
            }
          />
        )}
        {incident.notes && (
          <div className="pt-3 border-t border-[var(--color-border-faint)]">
            <div className="text-[10px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-tertiary)] mb-1">
              Operator notes
            </div>
            <p className="text-[12.5px] text-[var(--color-fg-secondary)]">
              {incident.notes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function NarrativeCard({ incident }: { incident: IncidentResponse }) {
  const top = incident.top_sensors?.[0]?.sensor;
  const stage = top?.match(/\d/)?.[0];
  const ratio = incident.threshold > 0 ? incident.peak_score / incident.threshold : 1;
  const severity = ratio > 2 ? "severe" : ratio > 1.4 ? "elevated" : "moderate";

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI narrative</CardTitle>
        <Badge variant="accent">Synthesized</Badge>
      </CardHeader>
      <CardContent className="text-[12.5px] leading-relaxed text-[var(--color-fg-secondary)] space-y-3">
        <p className="text-pretty">
          A <span className="text-[var(--color-fg-primary)] font-medium">{severity}</span> anomaly
          {stage ? <> was detected in <span className="text-[var(--color-fg-primary)] font-medium">stage {stage}</span></> : " was detected"}{" "}
          of the {incident.dataset} pipeline. Peak fused score reached{" "}
          <span className="font-mono text-[var(--color-fg-primary)]">{formatFixed(incident.peak_score, 2)}</span>,
          {" "}exceeding the operating threshold of{" "}
          <span className="font-mono">{formatFixed(incident.threshold, 2)}</span>{" "}
          for {incident.duration_windows} consecutive windows.
        </p>
        {top && (
          <p className="text-pretty">
            Variance-collapse attribution highlights{" "}
            <span className="font-mono text-[var(--color-fg-primary)]">{top}</span>{" "}
            as the principal driver, suggesting localized deviation rather than a coordinated multi-sensor event.
          </p>
        )}
        <p className="text-pretty text-[var(--color-fg-tertiary)]">
          Recommended actions: verify the relevant sensor for hardware fault, inspect connected actuators, and review access logs around the start window.
        </p>
      </CardContent>
    </Card>
  );
}

function BigStat({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--color-fg-tertiary)] mb-1.5">
        {icon}
        {label}
      </div>
      <div className="font-mono text-[28px] tabular-nums font-semibold tracking-tight text-[var(--color-fg-primary)]">
        {value}
      </div>
      {sub && (
        <div className="text-[11px] text-[var(--color-fg-tertiary)] mt-0.5">{sub}</div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-[12.5px] gap-3">
      <span className="text-[10.5px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-tertiary)]">
        {label}
      </span>
      <span
        className={cn(
          "text-[var(--color-fg-primary)]",
          mono && "font-mono tabular-nums",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function FeedbackBlock({
  current,
  onSelect,
  isPending,
}: {
  current: number | null;
  onSelect: (gt: number | null) => void;
  isPending: boolean;
}) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-0.5">
      <FeedbackButton
        active={current === 1}
        onClick={() => onSelect(1)}
        disabled={isPending}
        tone="alert"
        icon={<Check size={12} strokeWidth={2} />}
        label="True positive"
      />
      <FeedbackButton
        active={current === 0}
        onClick={() => onSelect(0)}
        disabled={isPending}
        tone="warn"
        icon={<X size={12} strokeWidth={2} />}
        label="False positive"
      />
      <FeedbackButton
        active={current == null}
        onClick={() => onSelect(null)}
        disabled={isPending}
        tone="neutral"
        icon={<HelpCircle size={12} strokeWidth={2} />}
        label="Unlabeled"
      />
    </div>
  );
}

function FeedbackButton({
  active,
  onClick,
  disabled,
  tone,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  disabled: boolean;
  tone: "alert" | "warn" | "neutral";
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={cn(
        "h-7 px-2 inline-flex items-center gap-1.5 rounded text-[11px] font-medium tracking-tight transition-colors",
        active
          ? tone === "alert"
            ? "bg-[color-mix(in_srgb,var(--color-state-alert)_15%,transparent)] text-[var(--color-state-alert)]"
            : tone === "warn"
              ? "bg-[color-mix(in_srgb,var(--color-state-warn)_15%,transparent)] text-[var(--color-state-warn)]"
              : "bg-[var(--color-bg-elevated)] text-[var(--color-fg-primary)]"
          : "text-[var(--color-fg-tertiary)] hover:text-[var(--color-fg-primary)]",
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function formatMethod(m: string): string {
  return m.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
