import { StatCard } from "@/components/StatCard";
import { LoadStatusBadge } from "./LoadStatusBadge";
import type { IndividualSummary } from "./types";

export function IndividualSummaryCards({ summary }: { summary: IndividualSummary }) {
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
      <StatCard
        hint={summary.jiraName ? `Jira: ${summary.jiraName}` : undefined}
        label="Status beban"
        value={summary.statusLoad ? <LoadStatusBadge status={summary.statusLoad} /> : "—"}
      />
      <StatCard label="Beban (FTE)" value={`${summary.fte}%`} />
      <StatCard label="Kepatuhan aktivitas" value={summary.jiraCompliance ?? "—"} />
      <StatCard
        hint={[
          summary.totalWorkHours ? `Jam kerja ${summary.totalWorkHours}` : null,
          summary.totalTraining ? `Training ${summary.totalTraining}` : null,
        ]
          .filter(Boolean)
          .join(" · ")}
        label="Jam kerja tersedia"
        value={summary.totalAvailableTime}
      />
      <StatCard hint="jam" label="Time spent" value={summary.totalTimespent} />
      <StatCard
        hint={`${summary.totalActivityNormalized} ternormalisasi (${summary.percentageNormalized}%)`}
        label="Aktivitas"
        value={summary.totalActivity}
      />
    </div>
  );
}
