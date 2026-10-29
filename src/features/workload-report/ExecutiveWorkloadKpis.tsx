import { StatCard } from "@/components/StatCard";
import { LoadStatusBadge } from "./LoadStatusBadge";
import type { WorkloadReportSummary } from "./types";

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
