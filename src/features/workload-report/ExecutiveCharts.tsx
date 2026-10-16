"use client";

import * as React from "react";
import { resolveChartTheme } from "@/features/talent-report/chart-theme";
import { buildOvertimeLineOption, buildTalentLevelBarOption } from "./chart-options";
import { ReportChartCard } from "./ReportChartCard";
import type { ExecutiveChartsData } from "./types";

/** Dua chart overview executive (TAN-230): distribusi beban & status overtime. */
export function ExecutiveCharts({ charts }: { charts: ExecutiveChartsData }) {
  const theme = React.useMemo(() => resolveChartTheme(), []);

  return (
    <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
      <ReportChartCard
        title="Total Talent berdasarkan Klasifikasi Beban"
        subtitle="Periode terpilih"
        option={buildTalentLevelBarOption(charts.talentByWorkloadLevel, theme)}
        ariaLabel="Grafik batang total talent per klasifikasi beban"
      />
      <ReportChartCard
        title="Status Workload Overtime"
        subtitle="12 periode terakhir"
        option={buildOvertimeLineOption(charts.workloadOvertime, theme)}
        ariaLabel="Grafik garis status workload dari waktu ke waktu"
      />
    </div>
  );
}
