"use client";

import * as React from "react";
import { resolveChartTheme } from "@/features/talent-report/chart-theme";
import { buildOvertimeLineOption, buildTalentLevelBarOption } from "./chart-options";
import { ReportChartCard } from "./ReportChartCard";
import type { ExecutiveChartsData } from "./types";

export function ExecutiveCharts({ charts }: { charts: ExecutiveChartsData }) {
  const theme = React.useMemo(() => resolveChartTheme(), []);

  return (
    <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
      <ReportChartCard
        ariaLabel="Grafik batang total talent per klasifikasi beban"
        option={buildTalentLevelBarOption(charts.talentByWorkloadLevel, theme)}
        subtitle="Periode terpilih"
        title="Total Talent berdasarkan Klasifikasi Beban"
      />
      <ReportChartCard
        ariaLabel="Grafik garis status workload dari waktu ke waktu"
        option={buildOvertimeLineOption(charts.workloadOvertime, theme)}
        subtitle="12 periode terakhir"
        title="Status Workload Overtime"
      />
    </div>
  );
}
