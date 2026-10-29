import { Gauge } from "./Gauge";
import { WorkloadHeroChips } from "./WorkloadHeroChips";
import type { LoadClassification } from "./types";

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
        <WorkloadHeroChips caption={caption} classification={classification} stale={stale} />
      </div>
      {loadPercentage !== null ? <Gauge loadPercentage={loadPercentage} /> : null}
    </section>
  );
}
