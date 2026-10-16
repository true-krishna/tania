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

/** Chart per-talent (TAN-233): trend, timespent per project, status backlog. */
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
        title="Workload & Activity Trends"
        subtitle="12 periode terakhir"
        className="h-64 w-full"
        option={buildTrendOption(trendBacklog, theme)}
        ariaLabel="Grafik garis tren backlog dan persentase beban"
      />
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        <ReportChartCard
          title="Time Spent by Assignment"
          option={buildTimespentBarOption(timespentPerProject, theme)}
          ariaLabel="Grafik batang time spent per project"
        />
        <ReportChartCard
          title="Status Progress Activity"
          option={buildBacklogPieOption(statusBacklog, theme)}
          ariaLabel="Grafik pie status progress aktivitas"
        />
      </div>
    </div>
  );
}