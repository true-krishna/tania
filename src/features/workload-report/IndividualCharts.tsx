"use client";

import * as React from "react";
import { resolveChartTheme } from "@/features/talent-report/chart-theme";
import { buildBacklogPieOption, buildTimespentBarOption, buildTrendOption } from "./chart-options";
import { ReportChartCard } from "./ReportChartCard";
import type {
  IndividualStatusBacklogRow,
  IndividualTimespentPerProjectRow,
  IndividualTrendBacklogPoint,
} from "./types";

export function IndividualCharts({
  statusBacklog,
  timespentPerProject,
  trendBacklog,
}: {
  statusBacklog: IndividualStatusBacklogRow[];
  timespentPerProject: IndividualTimespentPerProjectRow[];
  trendBacklog: IndividualTrendBacklogPoint[];
}) {
  const theme = React.useMemo(() => resolveChartTheme(), []);

  return (
    <div className="flex flex-col gap-3.5">
      <ReportChartCard
        ariaLabel="Grafik garis tren backlog dan persentase beban"
        className="h-64 w-full"
        option={buildTrendOption(trendBacklog, theme)}
        subtitle="12 periode terakhir"
        title="Workload & Activity Trends"
      />
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        <ReportChartCard
          ariaLabel="Grafik batang time spent per project"
          option={buildTimespentBarOption(timespentPerProject, theme)}
          title="Time Spent by Assignment"
        />
        <ReportChartCard
          ariaLabel="Grafik pie status progress aktivitas"
          option={buildBacklogPieOption(statusBacklog, theme)}
          title="Status Progress Activity"
        />
      </div>
    </div>
  );
}
