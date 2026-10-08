import { DataLamaChip, LoadClassificationBadge } from "./LoadClassificationBadge";
import type { LoadClassification } from "./types";

function Gauge({ loadPercentage }: { loadPercentage: number }) {
  const capped = Math.min(Math.max(loadPercentage, 0), 100);
  // Half-circle arc length ≈ π·r with r = 44 (see design §3 gauge recipe).
  const arc = 138;
  const filled = (capped / 100) * arc;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width="120" height="70" viewBox="0 0 120 70" aria-hidden>
        <path
          d="M16 62 A44 44 0 0 1 104 62"
          fill="none"
          stroke="var(--tp-on-nav)"
          strokeOpacity={0.25}
          strokeWidth={10}
          strokeLinecap="round"
        />
        <path
          d="M16 62 A44 44 0 0 1 104 62"
          fill="none"
          stroke="var(--tp-on-nav)"
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${arc}`}
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

/** Own-view hero: the one dark indigo card per screen (design §3 item 4). */
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
        <Chips classification={classification} stale={stale} caption={caption} />
      </div>
      {loadPercentage !== null ? <Gauge loadPercentage={loadPercentage} /> : null}
    </section>
  );
}

export interface HeroKpi {
  value: string;
  caption: string;
}

/** Multi-KPI hero for the chapter list and org distribution (design §4). */
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
