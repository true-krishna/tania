const HEALTHY_MIN = 70;
const HEALTHY_MAX = 85;

export function UtilizationBand({ percent }: { percent: number }) {
  const clamped = Math.min(Math.max(percent, 0), 100);
  return (
    <div className="mt-4 flex flex-col gap-2">
      <div
        aria-label={`Utilisasi ${percent} persen, rentang sehat ${HEALTHY_MIN} sampai ${HEALTHY_MAX} persen`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={percent}
        className="relative h-3 w-full rounded-full bg-tp-bg"
        role="meter"
      >
        <span
          aria-hidden
          className="absolute inset-y-0 rounded-sm bg-tp-tint-mint"
          style={{ left: `${HEALTHY_MIN}%`, width: `${HEALTHY_MAX - HEALTHY_MIN}%` }}
        />
        <span
          aria-hidden
          className="absolute -bottom-1 -top-1 w-[3px] rounded-full bg-tp-brand-navy"
          style={{ left: `calc(${clamped}% - 1.5px)` }}
        />
      </div>
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 text-[13px] text-tp-muted">
        <span>{`Rentang sehat ${HEALTHY_MIN}–${HEALTHY_MAX}%`}</span>
        <span className="font-semibold text-tp-text">Posisi Anda</span>
      </div>
    </div>
  );
}
