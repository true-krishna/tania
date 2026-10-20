import { StatCard } from "@/components/StatCard";
import { LoadStatusBadge } from "./LoadStatusBadge";
import type { IndividualLeaves, IndividualSummary } from "./types";

/** Kartu summary per-talent (TAN-233) — semua angka dari data. */
export function IndividualSummaryCards({ summary }: { summary: IndividualSummary }) {
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
      <StatCard
        label="Status beban"
        value={summary.statusLoad ? <LoadStatusBadge status={summary.statusLoad} /> : "—"}
        hint={summary.jiraName ? `Jira: ${summary.jiraName}` : undefined}
      />
      <StatCard label="Beban (FTE)" value={`${summary.fte}%`} />
      <StatCard label="Kepatuhan aktivitas" value={summary.jiraCompliance ?? "—"} />
      <StatCard
        label="Jam kerja tersedia"
        value={summary.totalAvailableTime}
        hint={[
          summary.totalWorkHours ? `Jam kerja ${summary.totalWorkHours}` : null,
          summary.totalTraining ? `Training ${summary.totalTraining}` : null,
        ]
          .filter(Boolean)
          .join(" · ")}
      />
      <StatCard label="Time spent" value={summary.totalTimespent} hint="jam" />
      <StatCard
        label="Aktivitas"
        value={summary.totalActivity}
        hint={`${summary.totalActivityNormalized} ternormalisasi (${summary.percentageNormalized}%)`}
      />
    </div>
  );
}

/** Info cuti/leaves bila ada (TAN-233) — kosong saat tidak ada data cuti. */
export function IndividualLeavesCard({ leaves }: { leaves: IndividualLeaves | null }) {
  if (!leaves || leaves.leavesList.length === 0) {
    return (
      <p className="text-sm text-tp-muted">Tidak ada catatan cuti atau ketidakhadiran pada periode ini.</p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-tp-muted">
        Total cuti: <strong className="font-semibold text-tp-text">{leaves.totalHoursHumanReadable}</strong> (
        {leaves.totalHours} jam)
      </p>
      <ul className="flex flex-col divide-y divide-tp-line">
        {leaves.leavesList.map((item) => (
          <li key={item.leavesDate} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
            <span className="font-medium text-tp-text">{item.leavesDateHumanReadable}</span>
            <span className="flex items-center gap-3 text-tp-muted">
              <span>{item.leavesDescription}</span>
              <span>{item.source}</span>
              <span>{item.totalHours} jam</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
