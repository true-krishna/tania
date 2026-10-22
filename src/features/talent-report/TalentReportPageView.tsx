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
          <PeriodFilter onApply={applyPeriod} range={range} value={period} />
          {status === "empty" ? (
            <EmptyState message="Tidak ada data pada rentang ini. Pilih rentang bulan lain untuk melihat laporan." />
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ChartCard
                onDownload={() => download(roleRef, "talent-per-role")}
                subtitle={`n = ${total(report.roleDistribution)}`}
                title="Talent per role"
              >
                <DistributionChart
                  ariaLabel="Talent per role"
                  chartRef={roleRef}
                  data={report.roleDistribution}
                  orientation="bar"
                  periodLabel={periodLabel}
                  title="Talent per role"
                />
              </ChartCard>
              <ChartCard
                onDownload={() => download(generationRef, "talent-per-generasi")}
                subtitle={`n = ${total(report.generationDistribution)}`}
                title="Talent per generasi"
              >
                <DistributionChart
                  ariaLabel="Talent per generasi"
                  chartRef={generationRef}
                  data={report.generationDistribution}
                  ordinal={GENERATION_ORDER}
                  orientation="column"
                  periodLabel={periodLabel}
                  title="Talent per generasi"
                />
              </ChartCard>
              <ChartCard
                onDownload={() => download(educationRef, "talent-per-jenjang-pendidikan")}
                subtitle={`n = ${total(report.educationDistribution)}`}
                title="Talent per jenjang pendidikan"
              >
                <DistributionChart
                  ariaLabel="Talent per jenjang pendidikan"
                  chartRef={educationRef}
                  data={report.educationDistribution}
                  ordinal={EDUCATION_ORDER}
                  orientation="column"
                  periodLabel={periodLabel}
                  title="Talent per jenjang pendidikan"
                />
              </ChartCard>
              <ChartCard
                onDownload={() => download(workLocationRef, "talent-per-lokasi-kerja")}
                subtitle={`n = ${total(report.workLocationDistribution)}`}
                title="Talent per lokasi kerja"
              >
                <DistributionChart
                  ariaLabel="Talent per lokasi kerja"
                  chartRef={workLocationRef}
                  data={report.workLocationDistribution}
                  orientation="bar"
                  periodLabel={periodLabel}
                  title="Talent per lokasi kerja"
                />
              </ChartCard>
              <div className="lg:col-span-2">
                <ChartCard
                  onDownload={() => download(movementRef, "tren-churn-vs-new-talent")}
                  subtitle={`n = ${movementTotal(report)}`}
                  title="Tren churn vs new talent"
                >
                  <MovementTrendChart
                    ariaLabel="Tren churn vs new talent"
                    chartRef={movementRef}
                    data={report.movementTrend}
                    periodLabel={periodLabel}
                    title="Tren churn vs new talent"
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
