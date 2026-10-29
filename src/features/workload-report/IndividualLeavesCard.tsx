import type { IndividualLeaves } from "./types";

export function IndividualLeavesCard({ leaves }: { leaves: IndividualLeaves | null }) {
  if (!leaves || leaves.leavesList.length === 0) {
    return (
      <p className="text-sm text-tp-muted">
        Tidak ada catatan cuti atau ketidakhadiran pada periode ini.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-tp-muted">
        Total cuti:{" "}
        <strong className="font-semibold text-tp-text">{leaves.totalHoursHumanReadable}</strong> (
        {leaves.totalHours} jam)
      </p>
      <ul className="flex flex-col divide-y divide-tp-line">
        {leaves.leavesList.map((item) => (
          <li
            className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
            key={item.leavesDate}
          >
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
