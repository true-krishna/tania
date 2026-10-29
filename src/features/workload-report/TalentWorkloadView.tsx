"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { TalentTable } from "./TalentTable";
import { TalentWorkloadDetail } from "./TalentWorkloadDetail";
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
          <button className={MODE_BUTTON} onClick={() => setMode("detail")} type="button">
            Kembali ke detail talent
          </button>
          <TalentTable onView={openDetail} rows={listFixture.distribution.rows.talent} />
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
    content = <TalentWorkloadDetail fixture={detailFixture} />;
  }

  return (
    <section className="flex flex-col gap-4">
      <PageHeader subtitle={subtitleFor(mode, selectedTalent, period)} title="Workload Talent" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {mode === "detail" ? (
            <label className="flex items-center gap-2 text-[13px] font-semibold text-tp-muted">
              Talent
              <Select
                aria-label="Pilih talent"
                className="h-11 w-64"
                onChange={(e) => setTalentId(e.target.value)}
                options={REPORT_TALENT_OPTIONS.map((t) => ({ value: t.talentId, label: t.name }))}
                value={talentId}
              />
            </label>
          ) : null}
          {mode === "detail" ? (
            <button className={MODE_BUTTON} onClick={() => setMode("table")} type="button">
              Tabel talent
            </button>
          ) : null}
        </div>
        <ReportPeriodSelector
          ariaLabel={
            mode === "table" ? "Pilih periode tabel talent" : "Pilih periode laporan talent"
          }
          onChange={setPeriod}
          value={period}
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

function subtitleFor(
  mode: "table" | "detail",
  selectedTalent: { name: string; tribe: string; squad: string } | null,
  period: string,
): string {
  if (mode === "table") {
    return `Tabel talent dengan workload — periode ${formatPeriodLabel(period)}.`;
  }
  if (selectedTalent) {
    return `Laporan per talent — ${selectedTalent.name} · ${selectedTalent.tribe} · ${selectedTalent.squad} · periode ${formatPeriodLabel(period)}.`;
  }
  return "Laporan workload per talent.";
}
