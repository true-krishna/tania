import { LoadPercentageBar } from "./LoadPercentageBar";
import type { ProjectPlacement } from "./types";

/**
 * Project placement rows (FR-022; design §3 item 5): per-project share of the
 * talent's load, read-only. Bars use a 0–100 scale because these are shares,
 * not the 0–120 capacity scale.
 */
export function ProjectContextCard({ placements }: { placements: ProjectPlacement[] }) {
  if (placements.length === 0) {
    return <p className="text-sm text-tp-muted">Belum ada konteks penempatan proyek.</p>;
  }

  return (
    <ul className="flex flex-col gap-3.5">
      {placements.map((placement) => (
        <li key={placement.id}>
          <div className="flex justify-between gap-2.5 text-sm">
            <span className="font-semibold text-tp-text">{placement.projectName}</span>
            <span className="text-tp-muted">{placement.loadPercentage}%</span>
          </div>
          <LoadPercentageBar
            value={placement.loadPercentage}
            max={100}
            label={`${placement.projectName} ${placement.loadPercentage} persen dari beban`}
            className="mt-1.5"
          />
        </li>
      ))}
    </ul>
  );
}
