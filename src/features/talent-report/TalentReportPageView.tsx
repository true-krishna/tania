"use client";

import * as React from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { PageHeader } from "@/components/PageHeader";
import { ChartCard } from "./ChartCard";
import {
  DistributionChart,
  EDUCATION_ORDER,
  GENERATION_ORDER,
} from "./DistributionChart";
import { PeriodFilter } from "./PeriodFilter";
import { useTalentReport } from "./useTalentReport";
import type { ReportCategoryCount, TalentReport } from "./types";

function total(data: readonly ReportCategoryCount[]): number {
  return data.reduce((sum, item) => sum + item.count, 0);
}

function movementTotal(report: TalentReport): number {
  return report.movementTrend.reduce((sum, m) => sum + m.newTalent + m.churn, 0);
}

/**
 * T023 — halaman laporan talent: layout 5 kartu (V-1…V-4 + slot tren V-5),
 * filter rentang (FR-11), state loading / empty / FORBIDDEN / error.
 * Nav "Laporan Talent" hanya untuk Operation & Chapter (guard UI) —
 * penegakan authz tetap di server (FR-01/SC-05).
 */
export function TalentReportPageView() {
  const { range, period, applyPeriod, status, report, message } = useTalentReport();

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Laporan Talent"
        subtitle="Komposisi talent serta gerakan churn & new talent — agregat tanpa data individual."
      />

      {status === "loading" ? <LoadingState label="Memuat laporan…" /> : null}

      {status === "forbidden" ? (
        <EmptyState message={message ?? "Akses ditolak. Laporan ini hanya untuk Operation dan Chapter."} />
      ) : null}

      {status === "error" ? (
        <ErrorState message={message ?? "Gagal memuat laporan."} />
      ) : null}

      {(status === "ready" || status === "empty") && report && period ? (
        <>
          <PeriodFilter range={range} value={period} onApply={applyPeriod} />
          {status === "empty" ? (
            <EmptyState message="Tidak ada data pada rentang ini. Pilih rentang bulan lain untuk melihat laporan." />
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ChartCard
                title="Talent per role"
                subtitle={`n = ${total(report.roleDistribution)}`}
              >
                <DistributionChart
                  data={report.roleDistribution}
                  orientation="bar"
                  ariaLabel="Talent per role"
                />
              </ChartCard>
              <ChartCard
                title="Talent per generasi"
                subtitle={`n = ${total(report.generationDistribution)}`}
              >
                <DistributionChart
                  data={report.generationDistribution}
                  orientation="column"
                  ordinal={GENERATION_ORDER}
                  ariaLabel="Talent per generasi"
                />
              </ChartCard>
              <ChartCard
                title="Talent per jenjang pendidikan"
                subtitle={`n = ${total(report.educationDistribution)}`}
              >
                <DistributionChart
                  data={report.educationDistribution}
                  orientation="column"
                  ordinal={EDUCATION_ORDER}
                  ariaLabel="Talent per jenjang pendidikan"
                />
              </ChartCard>
              <ChartCard
                title="Talent per lokasi kerja"
                subtitle={`n = ${total(report.workLocationDistribution)}`}
              >
                <DistributionChart
                  data={report.workLocationDistribution}
                  orientation="bar"
                  ariaLabel="Talent per lokasi kerja"
                />
              </ChartCard>
              <div className="lg:col-span-2">
                <ChartCard
                  title="Tren churn vs new talent"
                  subtitle={`n = ${movementTotal(report)}`}
                >
                  <div className="flex h-64 items-center justify-center rounded-md border border-dashed border-zinc-300 text-sm text-zinc-500">
                    Grafik tren menyusul (T026 — gelombang R3).
                  </div>
                </ChartCard>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
