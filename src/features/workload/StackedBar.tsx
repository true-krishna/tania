import { LEGEND, SEGMENT_CLASS, distributionAriaLabel } from "./distributionSegments";
import type { DistributionRowData } from "./types";

export function StackedBar({ row }: { row: DistributionRowData }) {
  const total =
    row.counts.optimal + row.counts.underload + row.counts.overload + row.counts.undefined;
  if (total === 0) return <div className="h-3 rounded-full bg-tp-bg" />;

  return (
    <div
      aria-label={distributionAriaLabel(row)}
      className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-tp-bg"
      role="img"
    >
      {LEGEND.map((segment) => {
        const count = row.counts[segment.key];
        if (count === 0) return null;
        return (
          <span
            className={`block h-full ${SEGMENT_CLASS[segment.key]}`}
            key={segment.key}
            style={{ width: `${(count / total) * 100}%` }}
          />
        );
      })}
    </div>
  );
}
