import { DataLamaChip, LoadClassificationBadge } from "./LoadClassificationBadge";
import type { LoadClassification } from "./types";

function Gauge({ loadPercentage }: { loadPercentage: number }) {
  const capped = Math.min(Math.max(loadPercentage, 0), 100);
  const arc = 138;
  const filled = (capped / 100) * arc;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg aria-hidden height="70" viewBox="0 0 120 70" width="120">
        <path
          d="M16 62 A44 44 0 0 1 104 62"
          fill="none"
          stroke="var(--tp-on-nav)"
          strokeLinecap="round"
          strokeOpacity={0.25}
          strokeWidth={10}
        />
        <path
          d="M16 62 A44 44 0 0 1 104 62"
          fill="none"
          stroke="var(--tp-on-nav)"
          strokeDasharray={`${filled} ${arc}`}
          strokeLinecap="round"
          strokeWidth={10}
        />
      </svg>
      <span className="text-[12.5px] text-tp-on-nav" style={{ opacity: 0.72 }}>
        Kapasitas terisi {loadPercentage}%
      </span>
    </div>
  );
}

function Chips({
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

export function WorkloadHero({
  label,
  loadPercentage,
  classification,
  capacityUsedHours,
  capacityTotalHours,
  stale = false,
  caption = "Klasifikasi dari WAD",
}: {
  label: string;
  loadPercentage: number | null;
  classification: LoadClassification | null;
  capacityUsedHours: number | null;
  capacityTotalHours: number | null;
  stale?: boolean;
  caption?: string;
}) {
  const hasCapacity = capacityUsedHours !== null && capacityTotalHours !== null;

  return (
    <section
      aria-label={label}
      className="flex flex-wrap items-center justify-between gap-8 rounded-[20px] bg-tp-nav p-6 text-tp-on-nav"
    >
      <div>
        <p className="text-[13px] text-tp-on-nav" style={{ opacity: 0.72 }}>
          {label}
        </p>
        <p className="mt-1.5 font-tp-display text-4xl font-extrabold leading-none">
          {loadPercentage !== null ? `${loadPercentage}%` : "—"}
        </p>
        {hasCapacity ? (
          <p className="mt-2 text-sm" style={{ opacity: 0.85 }}>
            {capacityUsedHours} dari {capacityTotalHours} jam kapasitas terisi
          </p>
        ) : null}
        <Chips caption={caption} classification={classification} stale={stale} />
      </div>
      {loadPercentage !== null ? <Gauge loadPercentage={loadPercentage} /> : null}
    </section>
  );
}

export interface HeroKpi {
  value: string;
  caption: string;
}

export function WorkloadKpiHero({ label, kpis }: { label: string; kpis: HeroKpi[] }) {
  return (
    <section
      aria-label={label}
      className="flex flex-wrap items-center justify-between gap-8 rounded-[20px] bg-tp-nav p-6 text-tp-on-nav"
    >
      <div>
        <p className="text-[13px] text-tp-on-nav" style={{ opacity: 0.72 }}>
          {label}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-x-9 gap-y-4">
          {kpis.map((kpi) => (
            <div key={kpi.caption}>
              <p className="font-tp-display text-[28px] font-extrabold leading-none">{kpi.value}</p>
              <p className="mt-1 text-sm" style={{ opacity: 0.85 }}>
                {kpi.caption}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
