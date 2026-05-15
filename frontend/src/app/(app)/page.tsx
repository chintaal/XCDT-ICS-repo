import { PageHeader } from "@/components/shell/page-header";
import { ScoreGauge } from "@/components/live/score-gauge";
import { ScoreChart } from "@/components/live/score-chart";
import { TopSensors } from "@/components/live/top-sensors";
import { RecentIncidents } from "@/components/live/recent-incidents";
import { SystemMeta } from "@/components/live/system-meta";
import { KpiStrip } from "@/components/live/kpi-strip";
import { InferenceControls } from "@/components/live/inference-controls";

export default function LiveOperationsPage() {
  return (
    <div className="flex flex-col gap-6 pb-10">
      <PageHeader
        eyebrow="Live operations"
        title="Real-time anomaly detection"
        description="Self-supervised deep learning monitors every sensor window. Below is the live view of the running inference pipeline."
        actions={<InferenceControls />}
      />

      <div className="px-6 space-y-6">
        <KpiStrip />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 auto-rows-min">
          <ScoreGauge />
          <div className="lg:col-span-3 flex flex-col gap-5">
            <ScoreChart />
            <TopSensors />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <RecentIncidents />
          <SystemMeta />
        </div>
      </div>
    </div>
  );
}
