import { DataLamaChip } from "./DataLamaChip";
import { LoadClassificationBadge } from "./LoadClassificationBadge";
import type { LoadClassification } from "./types";

export function WorkloadHeroChips({
  classification,
  stale,
  caption,
}: {
  classification: LoadClassification | null;
  stale: boolean;
  caption?: string;
}) {
  return (
    <div className="mt-3.5 flex flex-wrap items-center gap-2.5 text-[13px]">
      {classification ? <LoadClassificationBadge classification={classification} /> : null}
      {stale ? <DataLamaChip /> : null}
      {caption ? (
        <span className="text-tp-on-nav" style={{ opacity: 0.85 }}>
          {caption}
        </span>
      ) : null}
    </div>
  );
}
