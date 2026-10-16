"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/Card";
import { Select } from "@/components/Select";
import { EmptyState } from "@/components/DataState";
import { PageHeader } from "@/components/PageHeader";
import { useSessionRole } from "@/lib/auth/guard";
import { WORKLOAD_TALENT } from "@/lib/constants/routes";
import {
  WorkloadErrorState,
  WorkloadFreshnessNotice,
  WorkloadReflectionNotice,
} from "@/features/workload";
import { IndividualCharts } from "./IndividualCharts";
import { IndividualLeavesCard, IndividualSummaryCards } from "./IndividualSummaryCards";
import { BacklogTable } from "./BacklogTable";
import { TalentTable } from "./TalentTable";
import {
  DEFAULT_REPORT_PERIOD,
  DEFAULT_TALENT_ID,
  REPORT_TALENT_OPTIONS,
  formatPeriodLabel,
  isReportPeriod,
} from "./mocks";
import { ReportPeriodSelector } from "./ReportPeriodSelector";
import { ReportSkeleton } from "./ReportSkeleton";
import { useExecutiveReport } from "./useExecutiveReport";
import { useTalentWorkload } from "./useTalentWorkload";
import { WORKLOAD_REPORT_ROLES } from "./types";

type TalentPageMode = "detail" | "table";

const MODE_BUTTON =
  "w-fit rounded-full border-[1.5px] border-tp-text px-4 py-2 text-sm font-semibold text-tp-text transition-colors hover:bg-tp-bg";

/**
 * Halaman workload per talent (TAN-227/233/234 + umpan balik pemilik produk):
 * tampilan utamanya adalah detail workload talent terpilih; tabel talent
 * dengan workload tetap tersedia sebagai mode untuk memilih talent. Konteks
 * talent tidak pernah ditaruh di URL atau query string (TAN-233) — hanya
 * `?period=` yang menjelajah URL.
 */
export function TalentWorkloadView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = useSessionRole();

  const [talentId, setTalentId] = React.useState<string>(DEFAULT_TALENT_ID);
  const [mode, setMode] = React.useState<TalentPageMode>("detail");
  const [reloadKey, setReloadKey] = React.useState(0);
  const retry = React.useCallback(() => setReloadKey((k) => k + 1), []);

  const periodParam = searchParams.get("period");
  const period = isReportPeriod(periodParam) ? periodParam : DEFAULT_REPORT_PERIOD;
  // Sumber tabel talent pada mode tabel: baris talent dari tabel distribusi
  // WAD — stand-in untuk query tabel talent sampai GraphQL tersedia.
  const listState = useExecutiveReport(period, reloadKey);
  const detailState = useTalentWorkload(period, talentId, reloadKey);

  function setPeriod(next: string) {
    router.replace(`${WORKLOAD_TALENT}?period=${next}`);
  }

  function openDetail(nextTalentId: string) {
    setTalentId(nextTalentId);
    setMode("detail");
  }

  if (!role || !WORKLOAD_REPORT_ROLES.includes(role)) {
    return null;
  }

  const selectedTalent = REPORT_TALENT_OPTIONS.find((t) => t.talentId === talentId) ?? null;
  const listFixture = listState.status === "ready" ? listState.fixture : null;
  const detailFixture = detailState.status === "ready" ? detailState.fixture : null;

  let content: React.ReactNode;
  if (mode === "table") {
    if (listState.status === "loading") {
      content = <ReportSkeleton variant="talent" />;
    } else if (listState.status === "error" || !listFixture) {
      content = <WorkloadErrorState onRetry={retry} />;
    } else if (listFixture.state === "empty" || !listFixture.distribution) {
      content = (
        <EmptyState
          message={`Belum ada data workload untuk periode ${formatPeriodLabel(listFixture.period)}. Tabel talent akan muncul begitu periode ini terisi di sumber data.`}
        />
      );
    } else {
      content = (
        <div className="flex flex-col gap-4">
          <button type="button" onClick={() => setMode("detail")} className={MODE_BUTTON}>
            Kembali ke detail talent
          </button>
          <TalentTable rows={listFixture.distribution.rows.talent} onView={openDetail} />
        </div>
      );
    }
  } else if (detailState.status === "loading") {
    content = <ReportSkeleton variant="talent" />;
  } else if (detailState.status === "error") {
    content = <WorkloadErrorState onRetry={retry} />;
  } else if (!selectedTalent || !detailFixture) {
    content = <EmptyState message="Talent tidak ditemukan pada periode ini." />;
  } else if (detailFixture.state === "empty" || !detailFixture.summary) {
    content = (
      <EmptyState
        message={`Belum ada data workload untuk ${selectedTalent.name} pada periode ${formatPeriodLabel(detailFixture.period)}.`}
      />
    );
  } else {
    content = (
      <div className="flex flex-col gap-4">
        <IndividualSummaryCards summary={detailFixture.summary} />
        {detailFixture.assignedProjects ? (
          <Card className="flex flex-col gap-4">
            <div>
              <h2 className="tp-h3">Assignments</h2>
              <p className="tp-label mt-1">Penempatan project talent pada periode terpilih.</p>
            </div>
            <div className="table-panel">
              <div className="table-scroll">
                <table className="w-full min-w-[720px]">
                  <caption className="sr-only">Tabel assignment project talent</caption>
                  <thead>
                    <tr>
                      <th scope="col" className="text-left">Project</th>
                      <th scope="col" className="text-left">Tribe</th>
                      <th scope="col" className="text-left">Product</th>
                      <th scope="col" className="text-left">Squad</th>
                      <th scope="col" className="text-right">Availability</th>
                      <th scope="col" className="text-right">Time Spent</th>
                      <th scope="col" className="text-left">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailFixture.assignedProjects.map((row) => (
                      <tr key={`${row.projectKey}-${row.squad}`}>
                        <td className="font-medium text-tp-text">{row.projectKey}</td>
                        <td>{row.tribe}</td>
                        <td>{row.product}</td>
                        <td>{row.squad}</td>
                        <td className="text-right">{row.availability}%</td>
                        <td className="text-right">{row.timespent} jam</td>
                        <td className="max-w-[320px]">{row.category}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        ) : null}
        {detailFixture.summary.leaves && detailFixture.summary.leaves.leavesList.length > 0 ? (
          <Card className="flex flex-col gap-3">
            <h2 className="tp-h3">Cuti & ketidakhadiran</h2>
            <IndividualLeavesCard leaves={detailFixture.summary.leaves} />
          </Card>
        ) : null}
        {detailFixture.statusBacklog && detailFixture.timespentPerProject && detailFixture.trendBacklog ? (
          <IndividualCharts
            statusBacklog={detailFixture.statusBacklog}
            timespentPerProject={detailFixture.timespentPerProject}
            trendBacklog={detailFixture.trendBacklog}
          />
        ) : null}
        {detailFixture.backlog && detailFixture.backlogNormalized ? (
          <BacklogTable backlog={detailFixture.backlog} backlogNormalized={detailFixture.backlogNormalized} />
        ) : null}
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <PageHeader
        title="Workload Talent"
        subtitle={
          mode === "table"
            ? `Tabel talent dengan workload — periode ${formatPeriodLabel(period)}.`
            : selectedTalent
              ? `Laporan per talent — ${selectedTalent.name} · ${selectedTalent.tribe} · ${selectedTalent.squad} · periode ${formatPeriodLabel(period)}.`
              : "Laporan workload per talent."
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {mode === "detail" ? (
            <label className="flex items-center gap-2 text-[13px] font-semibold text-tp-muted">
              Talent
              <Select
                aria-label="Pilih talent"
                className="h-11 w-64"
                value={talentId}
                onChange={(e) => setTalentId(e.target.value)}
                options={REPORT_TALENT_OPTIONS.map((t) => ({ value: t.talentId, label: t.name }))}
              />
            </label>
          ) : null}
          {mode === "detail" ? (
            <button type="button" onClick={() => setMode("table")} className={MODE_BUTTON}>
              Tabel talent
            </button>
          ) : null}
        </div>
        <ReportPeriodSelector
          value={period}
          onChange={setPeriod}
          ariaLabel={mode === "table" ? "Pilih periode tabel talent" : "Pilih periode laporan talent"}
        />
      </div>

      {mode === "table" && listFixture ? (
        <>
          <WorkloadFreshnessNotice freshness={listFixture.freshness} onRetry={retry} />
          {listFixture.freshness.expectedReflectionHours !== null ? (
            <WorkloadReflectionNotice hours={listFixture.freshness.expectedReflectionHours} />
          ) : null}
        </>
      ) : null}
      {mode === "detail" && detailFixture ? (
        <>
          <WorkloadFreshnessNotice freshness={detailFixture.freshness} onRetry={retry} />
          {detailFixture.freshness.expectedReflectionHours !== null ? (
            <WorkloadReflectionNotice hours={detailFixture.freshness.expectedReflectionHours} />
          ) : null}
        </>
      ) : null}

      {content}
    </section>
  );
}