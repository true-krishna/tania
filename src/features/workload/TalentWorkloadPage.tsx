"use client";

import { AccessDenied } from "@/components/AccessDenied";
import { Card } from "@/components/Card";
import { Chip } from "@/components/Chip";
import { EmptyState } from "@/components/DataState";
import { PageHeader } from "@/components/PageHeader";
import { ProfileErrorState } from "@/features/profile/ProfileErrorState";
import { useMyProfileMetrics } from "@/features/profile/useSelfProfile";
import { useSessionRole } from "@/lib/auth/guard";
import { UtilizationBand } from "./UtilizationBand";

export function TalentWorkloadPage() {
  const role = useSessionRole();
  const metrics = useMyProfileMetrics();

  if (role && role !== "TALENT") return <AccessDenied />;

  const percent = metrics.data?.utilizationPercent ?? null;

  return (
    <section className="flex min-w-0 flex-col gap-4">
      <PageHeader
        actions={
          <Chip size="small" variant="neutral">
            Hanya baca
          </Chip>
        }
        subtitle="Utilisasi dari assignment terdaftar, dihitung atas hari kerja enam bulan terakhir."
        title="Workload saya"
      />

      {metrics.status === "error" ? (
        <ProfileErrorState
          message={metrics.error ?? "Gagal memuat utilisasi."}
          onRetry={metrics.refetch}
        />
      ) : null}

      <div className="grid grid-cols-1 gap-3 min-[860px]:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-2">
            <h2 className="tp-h3">Utilisasi rata-rata</h2>
            <span className="tp-label">6 bulan terakhir</span>
          </div>
          {metrics.status === "loading" ? (
            <div aria-busy="true" className="mt-3 animate-pulse">
              <span className="sr-only">Memuat utilisasi…</span>
              <div aria-hidden className="h-12 w-28 rounded-tp-sm bg-tp-bg" />
            </div>
          ) : null}
          {metrics.status === "ready" && percent === null ? (
            <div className="mt-3">
              <EmptyState message="Belum ada data workload untuk periode ini." />
            </div>
          ) : null}
          {metrics.status === "ready" && percent !== null ? (
            <>
              <p className="mt-2 text-[40px] font-bold leading-none text-tp-text">{`${percent}%`}</p>
              <UtilizationBand percent={percent} />
              <p className="mt-4 border-t border-tp-line pt-3 text-[13px] leading-5 text-tp-muted">
                Rata-rata mencakup assignment yang sudah selesai dalam periode ini, jadi tidak sama
                dengan utilisasi assignment yang masih aktif.
              </p>
            </>
          ) : null}
        </Card>

        <Card className="min-w-0">
          <h2 className="tp-h3">Per assignment aktif</h2>
          <p className="tp-label mt-1">Rincian utilisasi tiap assignment belum tersedia.</p>
          <div className="mt-3">
            <EmptyState message="Sumber angka per assignment menunggu agregat WAD (TAN-378). Sementara itu, pakai rata-rata enam bulan di samping." />
          </div>
        </Card>
      </div>

      <Card className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
          <h2 className="tp-h3">Ketepatan sumber data</h2>
          <Chip size="small" variant="info">
            Pemberitahuan
          </Chip>
        </div>
        <p className="mt-2 text-[13px] leading-5 text-tp-muted">
          Data workload berasal dari cakupan hari kerja assignment, bukan input manual aktivitas.
          Jika assignment baru saja ditetapkan atau diakhiri, angka mengikuti pembacaan berikutnya.
          Assignment ditetapkan oleh Chapter atau Operation.
        </p>
      </Card>
    </section>
  );
}
