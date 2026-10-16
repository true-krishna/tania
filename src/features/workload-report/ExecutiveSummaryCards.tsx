import { StatCard } from "@/components/StatCard";
import { orDash } from "@/lib/cell";
import type { WorkloadReportSummary } from "./types";
import { LoadStatusBadge } from "./LoadStatusBadge";

/**
 * Kartu KPI executive (TAN-229) — setiap angka nilai dari data, persen sudah
 * diskalakan server (cukup tambah "%"). Kartu cost/revenue/RBV hanya
 * dirender untuk role berhak (gate di `ExecutiveReportView`).
 */
export function ExecutiveWorkloadKpis({ summary }: { summary: WorkloadReportSummary }) {
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Status beban"
        value={<LoadStatusBadge status={summary.statusLoad} />}
        hint={`FTE ${summary.fte}%`}
      />
      <StatCard label="Total talent" value={summary.totalTalent} />
      <StatCard label="Total backlog" value={summary.totalBacklog} />
      <StatCard label="Total aktivitas" value={summary.totalTaskSubtask} />
      <StatCard label="Aktivitas dengan time spent" value={summary.totalTaskSubtaskWithTimespent} />
      <StatCard label="Jam kerja tersedia" value={summary.totalAvailableTime} hint="jam" />
      <StatCard label="Total time spent" value={summary.totalTimespent} hint="jam" />
      <StatCard
        label="Rata-rata time spent harian per talent"
        value={summary.dailyTimespentPerTalent}
        hint="jam/talent"
      />
      <StatCard
        label="Ternormalisasi"
        value={summary.totalActivityNormalized}
        hint={`${summary.totalTalentNormalized} talent`}
      />
    </div>
  );
}

export function ExecutiveAnalyticsKpis({ summary }: { summary: WorkloadReportSummary }) {
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Estimasi status beban"
        value={<LoadStatusBadge status={summary.statusLoadEstimate} />}
        hint={`Beban ${summary.loadEstimate}%`}
      />
      <StatCard label="Estimasi time spent" value={summary.totalTimespentEstimate} hint="jam" />
      <StatCard label="Kepatuhan TTD" value={`${summary.ttdCompliance}%`} />
      <StatCard
        label="Talent memenuhi TTD ≥ 100%"
        value={summary.talentComplyTtd}
        hint={`dari ${summary.totalTalent} talent`}
      />
    </div>
  );
}

export function ExecutiveCostKpis({ summary }: { summary: WorkloadReportSummary }) {
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Estimasi total biaya talent" value={orDash(summary.cost)} hint="per bulan" />
      <StatCard label="Rata-rata biaya per talent" value={orDash(summary.avgCost)} hint="per bulan" />
      <StatCard
        label="Time spent mingguan per talent"
        value={summary.weeklyTimespentPerTalent}
        hint="jam/talent"
      />
      <StatCard
        label="Time spent harian per talent"
        value={summary.dailyTimespentPerTalent}
        hint="jam/talent"
      />
      <StatCard label="Kepatuhan TTD" value={`${summary.ttdCompliance}%`} />
      <StatCard
        label="Talent memenuhi TTD ≥ 100%"
        value={summary.talentComplyTtd}
        hint={`dari ${summary.totalTalent} talent`}
      />
      <StatCard label="Revenue per bulan" value={orDash(summary.revenuePerMonth)} />
      <StatCard label="Revenue per bulan per talent" value={orDash(summary.revenuePerMonthPerTalent)} />
      <StatCard label="RBV per bulan" value={orDash(summary.rbvPerMonth)} />
      <StatCard label="RBV per bulan per talent" value={orDash(summary.rbvPerMonthPerTalent)} />
    </div>
  );
}
