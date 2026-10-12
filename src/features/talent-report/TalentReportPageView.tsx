"use client";

import * as React from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { ChartCard } from "./ChartCard";
import {
  DistributionChart,
  EDUCATION_ORDER,
  GENERATION_ORDER,
} from "./DistributionChart";
import { MovementTrendChart } from "./MovementTrendChart";
import { chartFileName, downloadChart } from "./downloadChart";
import type { EChartHandle } from "./EChart";
import { formatMonthLabel, PeriodFilter } from "./PeriodFilter";
import { useTalentReport } from "./useTalentReport";
import type { ReportCategoryCount, TalentReport } from "@/generated/graphql/types";

function total(data: readonly ReportCategoryCount[]): number {
  return data.reduce((sum, item) => sum + item.count, 0);
}

function movementTotal(report: TalentReport): number {
  return report.movementTrend.reduce((sum, m) => sum + m.newTalent + m.churn, 0);
}

/**
 * T023 + amandemen penempatan (2026-10-12, keputusan pemilik produk pada
 * TAN-154): konten laporan TIDAK lagi menjadi halaman tersendiri — ia
 * MENGKANTIKAN konten Dashboard untuk Operation & Chapter; entri nav
 * "Laporan Talent" dihapus dan `/reports/talent` hanya redirect ke
 * `/dashboard`. `TalentReportContent` = lima kartu + filter rentang + state
 * loading/empty/FORBIDDEN/error, tanpa PageHeader (Dashboard sudah punya).
 * FORBIDDEN (SC-05) tetap sebagai state defensif — penegakan authz di server
 * (FR-01); Dashboard memilih konten ini hanya untuk Operation/Chapter.
 */
export function TalentReportContent() {
  const { range, period, applyPeriod, status, report, message } = useTalentReport();
  const roleRef = React.useRef<EChartHandle>(null);
  const generationRef = React.useRef<EChartHandle>(null);
  const educationRef = React.useRef<EChartHandle>(null);
  const workLocationRef = React.useRef<EChartHandle>(null);
  const movementRef = React.useRef<EChartHandle>(null);

  const download = (chartRef: React.RefObject<EChartHandle | null>, chartName: string) => {
    if (!period) return;
    downloadChart(chartRef.current, chartFileName(chartName, period.startMonth, period.endMonth));
  };

  // T034: judul & rentang ikut dirender TitleComponent DI DALAM kanvas
  // sehingga PNG unduhan memuat keduanya (SC-03/FR-13).
  const periodLabel = period ? `${formatMonthLabel(period.startMonth)} – ${formatMonthLabel(period.endMonth)}` : undefined;

  return (
    <div className="flex flex-col gap-4">
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
                onDownload={() => download(roleRef, "talent-per-role")}
              >
                <DistributionChart
                  data={report.roleDistribution}
                  orientation="bar"
                  ariaLabel="Talent per role"
                  title="Talent per role"
                  periodLabel={periodLabel}
                  chartRef={roleRef}
                />
              </ChartCard>
              <ChartCard
                title="Talent per generasi"
                subtitle={`n = ${total(report.generationDistribution)}`}
                onDownload={() => download(generationRef, "talent-per-generasi")}
              >
                <DistributionChart
                  data={report.generationDistribution}
                  orientation="column"
                  ordinal={GENERATION_ORDER}
                  ariaLabel="Talent per generasi"
                  title="Talent per generasi"
                  periodLabel={periodLabel}
                  chartRef={generationRef}
                />
              </ChartCard>
              <ChartCard
                title="Talent per jenjang pendidikan"
                subtitle={`n = ${total(report.educationDistribution)}`}
                onDownload={() => download(educationRef, "talent-per-jenjang-pendidikan")}
              >
                <DistributionChart
                  data={report.educationDistribution}
                  orientation="column"
                  ordinal={EDUCATION_ORDER}
                  ariaLabel="Talent per jenjang pendidikan"
                  title="Talent per jenjang pendidikan"
                  periodLabel={periodLabel}
                  chartRef={educationRef}
                />
              </ChartCard>
              <ChartCard
                title="Talent per lokasi kerja"
                subtitle={`n = ${total(report.workLocationDistribution)}`}
                onDownload={() => download(workLocationRef, "talent-per-lokasi-kerja")}
              >
                <DistributionChart
                  data={report.workLocationDistribution}
                  orientation="bar"
                  ariaLabel="Talent per lokasi kerja"
                  title="Talent per lokasi kerja"
                  periodLabel={periodLabel}
                  chartRef={workLocationRef}
                />
              </ChartCard>
              <div className="lg:col-span-2">
                <ChartCard
                  title="Tren churn vs new talent"
                  subtitle={`n = ${movementTotal(report)}`}
                  onDownload={() => download(movementRef, "tren-churn-vs-new-talent")}
                >
                  <MovementTrendChart
                    data={report.movementTrend}
                    ariaLabel="Tren churn vs new talent"
                    title="Tren churn vs new talent"
                    periodLabel={periodLabel}
                    chartRef={movementRef}
                  />
                </ChartCard>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
