import Link from "next/link";
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

/**
 * `Workload saya` body (design §3 item 5). `variant="self"` is the employee's
 * own screen; `variant="employee"` is the same components inside the employee
 * profile tab, with the project-context card swapped in — no forks (TAN-117).
 */
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
        label={HERO_LABEL}
        loadPercentage={metrics.loadPercentage}
        classification={metrics.classification}
        capacityUsedHours={metrics.capacityUsedHours}
        capacityTotalHours={metrics.capacityTotalHours}
        stale={stale}
        caption={
          variant === "employee"
            ? "Sesuai angka yang dilihat talent bersangkutan"
            : "Klasifikasi dari WAD"
        }
      />

      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
        <WorkloadCard
          title="Alokasi aktivitas"
          action={stale ? <DataLamaChip /> : <CardCaption>Periode ini</CardCaption>}
        >
          <ActivitySplitChart split={metrics.split} />
        </WorkloadCard>

        <WorkloadCard
          title="Tren beban kerja"
          action={stale ? <DataLamaChip /> : <CardCaption>6 periode terakhir</CardCaption>}
        >
          <WorkloadTrendChart trend={metrics.trend} stale={stale} />
        </WorkloadCard>

        {variant === "self" ? (
          <WorkloadCard title="Kelola aktivitas">
            <p className="text-sm text-tp-muted">
              Aktivitas kerja dan pelatihan yang Anda catat adalah sumber angka workload.
            </p>
            <Link
              href="/activities"
              className="mt-3.5 inline-flex min-h-10 items-center gap-2 rounded-full border-[1.5px] border-tp-primary bg-tp-primary px-[18px] text-sm font-semibold text-white transition-colors hover:bg-tp-primary-deep"
            >
              Buka aktivitas
            </Link>
          </WorkloadCard>
        ) : (
          <>
            <WorkloadCard
              title="Konteks penempatan proyek"
              action={<CardCaption>Kontribusi terhadap beban</CardCaption>}
            >
              <ProjectContextCard placements={view.projectPlacements} />
            </WorkloadCard>

            <WorkloadCard title="Aktivitas talent">
              <p className="text-sm text-tp-muted">
                Lihat aktivitas yang mendasari angka beban talent ini — tersedia untuk peran dalam
                lingkup chapter.
              </p>
              <button
                type="button"
                className="mt-3.5 inline-flex min-h-10 items-center rounded-full border-[1.5px] border-tp-text px-4 text-sm font-semibold text-tp-text transition-colors hover:bg-tp-bg"
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
