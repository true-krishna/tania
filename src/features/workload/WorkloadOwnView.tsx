import Link from "next/link";
import { ACTIVITIES } from "@/lib/constants/routes";
import { ActivitySplitChart } from "./ActivitySplitChart";
import { DataLamaChip } from "./LoadClassificationBadge";
import { ProjectContextCard } from "./ProjectContextCard";
import { WorkloadCard, CardCaption } from "./WorkloadCard";
import { WorkloadEmptyState } from "./WorkloadEmptyState";
import { WorkloadErrorState } from "./WorkloadErrorState";
import { WorkloadHero } from "./WorkloadHero";
import { WorkloadTrendChart } from "./WorkloadTrendChart";
import type { OwnWorkloadView } from "./types";

const HERO_LABEL = "Beban kerja periode ini";

export function WorkloadOwnView({
  view,
  stale,
  variant,
  onRetry,
}: {
  view: OwnWorkloadView;
  stale: boolean;
  variant: "self" | "employee";
  onRetry?: () => void;
}) {
  if (view.state === "error") {
    return <WorkloadErrorState onRetry={onRetry ?? (() => {})} />;
  }

  if (view.state === "no-data") {
    return <WorkloadEmptyState variant="no-data" />;
  }

  if (view.state === "tms-null") {
    return <WorkloadEmptyState variant={variant === "self" ? "tms-null-self" : "tms-null-other"} />;
  }

  const metrics = view.metrics;
  if (!metrics) return <WorkloadErrorState onRetry={onRetry ?? (() => {})} />;

  return (
    <div className="flex flex-col gap-4">
      <WorkloadHero
        capacityTotalHours={metrics.capacityTotalHours}
        capacityUsedHours={metrics.capacityUsedHours}
        caption={
          variant === "employee"
            ? "Sesuai angka yang dilihat talent bersangkutan"
            : "Klasifikasi dari WAD"
        }
        classification={metrics.classification}
        label={HERO_LABEL}
        loadPercentage={metrics.loadPercentage}
        stale={stale}
      />

      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
        <WorkloadCard
          action={stale ? <DataLamaChip /> : <CardCaption>Periode ini</CardCaption>}
          title="Alokasi aktivitas"
        >
          <ActivitySplitChart split={metrics.split} />
        </WorkloadCard>

        <WorkloadCard
          action={stale ? <DataLamaChip /> : <CardCaption>6 periode terakhir</CardCaption>}
          title="Tren beban kerja"
        >
          <WorkloadTrendChart stale={stale} trend={metrics.trend} />
        </WorkloadCard>

        {variant === "self" ? (
          <WorkloadCard title="Kelola aktivitas">
            <p className="text-sm text-tp-muted">
              Aktivitas kerja dan pelatihan yang Anda catat adalah sumber angka workload.
            </p>
            <Link
              className="mt-3.5 inline-flex min-h-10 items-center gap-2 rounded-full border-[1.5px] border-tp-brand-navy bg-tp-brand-navy px-[18px] text-sm font-semibold text-white transition-colors hover:bg-tp-brand-navy-deep"
              href={ACTIVITIES}
            >
              Buka aktivitas
            </Link>
          </WorkloadCard>
        ) : (
          <>
            <WorkloadCard
              action={<CardCaption>Kontribusi terhadap beban</CardCaption>}
              title="Konteks penempatan proyek"
            >
              <ProjectContextCard placements={view.projectPlacements} />
            </WorkloadCard>

            <WorkloadCard title="Aktivitas talent">
              <p className="text-sm text-tp-muted">
                Lihat aktivitas yang mendasari angka beban talent ini — tersedia untuk peran dalam
                lingkup chapter.
              </p>
              <button
                className="mt-3.5 inline-flex min-h-10 items-center rounded-full border-[1.5px] border-tp-text px-4 text-sm font-semibold text-tp-text transition-colors hover:bg-tp-bg"
                type="button"
              >
                Lihat aktivitas
              </button>
            </WorkloadCard>
          </>
        )}
      </div>
    </div>
  );
}
