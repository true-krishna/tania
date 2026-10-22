import { StatCard } from "@/components/StatCard";
import { orDash } from "@/lib/cell";
import type { WorkloadReportSummary } from "./types";
import { LoadStatusBadge } from "./LoadStatusBadge";

export function ExecutiveWorkloadKpis({ summary }: { summary: WorkloadReportSummary }) {
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        hint={`FTE ${summary.fte}%`}
        label="Status beban"
        value={<LoadStatusBadge status={summary.statusLoad} />}
      />
      <StatCard label="Total talent" value={summary.totalTalent} />
      <StatCard label="Total backlog" value={summary.totalBacklog} />
      <StatCard label="Total aktivitas" value={summary.totalTaskSubtask} />
      <StatCard label="Aktivitas dengan time spent" value={summary.totalTaskSubtaskWithTimespent} />
      <StatCard hint="jam" label="Jam kerja tersedia" value={summary.totalAvailableTime} />
      <StatCard hint="jam" label="Total time spent" value={summary.totalTimespent} />
      <StatCard
        hint="jam/talent"
        label="Rata-rata time spent harian per talent"
        value={summary.dailyTimespentPerTalent}
      />
      <StatCard
        hint={`${summary.totalTalentNormalized} talent`}
        label="Ternormalisasi"
        value={summary.totalActivityNormalized}
      />
    </div>
  );
}

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

export function ExecutiveCostKpis({ summary }: { summary: WorkloadReportSummary }) {
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard hint="per bulan" label="Estimasi total biaya talent" value={orDash(summary.cost)} />
      <StatCard hint="per bulan" label="Rata-rata biaya per talent" value={orDash(summary.avgCost)} />
      <StatCard
        hint="jam/talent"
        label="Time spent mingguan per talent"
        value={summary.weeklyTimespentPerTalent}
      />
      <StatCard
        hint="jam/talent"
        label="Time spent harian per talent"
        value={summary.dailyTimespentPerTalent}
      />
      <StatCard label="Kepatuhan TTD" value={`${summary.ttdCompliance}%`} />
      <StatCard
        hint={`dari ${summary.totalTalent} talent`}
        label="Talent memenuhi TTD ≥ 100%"
        value={summary.talentComplyTtd}
      />
      <StatCard label="Revenue per bulan" value={orDash(summary.revenuePerMonth)} />
      <StatCard label="Revenue per bulan per talent" value={orDash(summary.revenuePerMonthPerTalent)} />
      <StatCard label="RBV per bulan" value={orDash(summary.rbvPerMonth)} />
      <StatCard label="RBV per bulan per talent" value={orDash(summary.rbvPerMonthPerTalent)} />
    </div>
  );
}
