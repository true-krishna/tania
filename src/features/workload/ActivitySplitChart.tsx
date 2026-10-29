import type { ActivitySplit } from "./types";

export function ActivitySplitChart({ split }: { split: ActivitySplit | null }) {
  if (!split) {
    return (
      <p className="text-sm text-tp-muted">
        Data tidak lengkap — rincian alokasi aktivitas belum tersedia untuk periode ini.
      </p>
    );
  }

  const { workingPercentage, trainingPercentage } = split;

  return (
    <div>
      <div
        aria-label={`Bekerja ${workingPercentage} persen, pelatihan ${trainingPercentage} persen`}
        className="flex h-3.5 gap-0.5 overflow-hidden rounded-full bg-tp-bg"
        role="img"
      >
        <span
          className="block h-full bg-tp-brand-navy"
          style={{ width: `${workingPercentage}%` }}
        />
        <span
          className="block h-full bg-tp-brand-navy"
          style={{ width: `${trainingPercentage}%`, opacity: 0.35 }}
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-[13px] text-tp-muted">
        <span className="inline-flex items-center gap-1.5">
          <i aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-[3px] bg-tp-brand-navy" />
          Bekerja {workingPercentage}%
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i
            aria-hidden
            className="h-2.5 w-2.5 shrink-0 rounded-[3px] bg-tp-brand-navy"
            style={{ opacity: 0.35 }}
          />
          Pelatihan {trainingPercentage}%
        </span>
      </div>
    </div>
  );
}
