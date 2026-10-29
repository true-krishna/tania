import { StatCard } from "@/components/StatCard";
import { LoadStatusBadge } from "./LoadStatusBadge";
import type { WorkloadReportSummary } from "./types";

export function ExecutiveAnalyticsKpis({ summary }: { summary: WorkloadReportSummary }) {
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        hint={`Beban ${summary.loadEstimate}%`}
        label="Estimasi status beban"
        value={<LoadStatusBadge status={summary.statusLoadEstimate} />}
      />
      <StatCard hint="jam" label="Estimasi time spent" value={summary.totalTimespentEstimate} />
      <StatCard label="Kepatuhan TTD" value={`${summary.ttdCompliance}%`} />
      <StatCard
        hint={`dari ${summary.totalTalent} talent`}
        label="Talent memenuhi TTD ≥ 100%"
        value={summary.talentComplyTtd}
      />
    </div>
  );
}
