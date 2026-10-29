import { StatCard } from "@/components/StatCard";
import { orDash } from "@/lib/cell";
import type { WorkloadReportSummary } from "./types";

export function ExecutiveCostKpis({ summary }: { summary: WorkloadReportSummary }) {
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard hint="per bulan" label="Estimasi total biaya talent" value={orDash(summary.cost)} />
      <StatCard
        hint="per bulan"
        label="Rata-rata biaya per talent"
        value={orDash(summary.avgCost)}
      />
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
      <StatCard
        label="Revenue per bulan per talent"
        value={orDash(summary.revenuePerMonthPerTalent)}
      />
      <StatCard label="RBV per bulan" value={orDash(summary.rbvPerMonth)} />
      <StatCard label="RBV per bulan per talent" value={orDash(summary.rbvPerMonthPerTalent)} />
    </div>
  );
}
