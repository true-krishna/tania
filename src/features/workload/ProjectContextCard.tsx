import { LoadPercentageBar } from "./LoadPercentageBar";
import type { ProjectPlacement } from "./types";

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
            className="mt-1.5"
            label={`${placement.projectName} ${placement.loadPercentage} persen dari beban`}
            max={100}
            value={placement.loadPercentage}
          />
        </li>
      ))}
    </ul>
  );
}
