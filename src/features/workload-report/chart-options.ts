/**
 * Pure builders opsi ECharts untuk dashboard workload-report. Semua nilai
 * seri/sumbu datang dari data — builder hanya menata tampilan (TAN-227:
 * tidak ada angka yang dihitung di klien). Warna seri dari `chart-colors.ts`
 * (token `--tp-*`), teks/garis dari tema talent-report — tanpa hex baru.
 */
import type { EChartsCoreOption } from "echarts/core";
import type { ChartTheme } from "@/features/talent-report/chart-theme";
import type {
  IndividualStatusBacklogRow,
  IndividualTimespentPerProjectRow,
  IndividualTrendBacklogPoint,
  TalentCountByStatus,
  WorkloadOvertimePoint,
} from "./types";
import { WORKLOAD_STATUSES } from "./types";
import { formatPeriodShort } from "./mocks";
import { kitChartColor, neutralChartColor, workloadChartColor } from "./chart-colors";

export function buildTalentLevelBarOption(
  data: TalentCountByStatus[],
  theme: ChartTheme,
): EChartsCoreOption {
  const ordered = WORKLOAD_STATUSES.map(
    (status) => data.find((d) => d.statusLoad === status) ?? { statusLoad: status, total: 0 },
  );

  return {
    textStyle: { fontFamily: theme.fontFamily, color: theme.textColor },
    grid: { left: 8, right: 24, top: 8, bottom: 8, containLabel: true },
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    xAxis: { type: "value", splitLine: { lineStyle: { color: theme.lineColor } } },
    yAxis: {
      type: "category",
      data: ordered.map((d) => d.statusLoad),
      axisLine: { lineStyle: { color: theme.lineColor } },
    },
    series: [
      {
        name: "Total Talent",
        type: "bar",
        barMaxWidth: 18,
        data: ordered.map((d) => ({
          value: d.total,
          itemStyle: { color: workloadChartColor(d.statusLoad), borderRadius: 3 },
        })),
        label: { show: true, position: "right", color: theme.textColor },
      },
    ],
  };
}

export function buildOvertimeLineOption(
  points: WorkloadOvertimePoint[],
  theme: ChartTheme,
): EChartsCoreOption {
  const seriesFor = (
    key: keyof Omit<WorkloadOvertimePoint, "periode">,
    status: (typeof WORKLOAD_STATUSES)[number],
  ) => ({
    name: status,
    type: "line",
    symbolSize: 5,
    lineStyle: { width: 2 },
    data: points.map((p) => p[key]),
    itemStyle: { color: workloadChartColor(status) },
  });

  return {
    textStyle: { fontFamily: theme.fontFamily, color: theme.textColor },
    grid: { left: 8, right: 16, top: 28, bottom: 8, containLabel: true },
    legend: { top: 0, textStyle: { color: theme.textColor } },
    tooltip: { trigger: "axis" },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: points.map((p) => formatPeriodShort(p.periode)),
      axisLine: { lineStyle: { color: theme.lineColor } },
    },
    yAxis: { type: "value", minInterval: 1, splitLine: { lineStyle: { color: theme.lineColor } } },
    series: [
      seriesFor("undefinedActivity", "Undefined Activity"),
      seriesFor("undefinedTimespent", "Undefined Time Spent"),
      seriesFor("underload", "Underload"),
      seriesFor("fit", "Fit"),
      seriesFor("stretch", "Stretch"),
      seriesFor("overload", "Overload"),
    ],
  };
}

export function buildTimespentBarOption(
  rows: IndividualTimespentPerProjectRow[],
  theme: ChartTheme,
): EChartsCoreOption {
  return {
    textStyle: { fontFamily: theme.fontFamily, color: theme.textColor },
    grid: { left: 8, right: 16, top: 24, bottom: 8, containLabel: true },
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    xAxis: {
      type: "category",
      data: rows.map((r) => r.projectName ?? r.squad ?? "—"),
      axisLine: { lineStyle: { color: theme.lineColor } },
    },
    yAxis: { type: "value", splitLine: { lineStyle: { color: theme.lineColor } } },
    series: [
      {
        name: "Time Spent",
        type: "bar",
        barMaxWidth: 48,
        data: rows.map((r) => r.timespentTotalAct ?? 0),
        itemStyle: { color: kitChartColor(2), borderRadius: 3 },
        label: { show: true, position: "top", color: theme.textColor },
      },
    ],
  };
}

const BACKLOG_STATUS_COLOR: Record<string, 2 | 3 | null> = {
  "To Do": null,
  "In Progress": 2,
  Done: 3,
};

export function buildBacklogPieOption(
  rows: IndividualStatusBacklogRow[],
  theme: ChartTheme,
): EChartsCoreOption {
  return {
    textStyle: { fontFamily: theme.fontFamily, color: theme.textColor },
    tooltip: { trigger: "item" },
    legend: { bottom: 0, textStyle: { color: theme.textColor } },
    series: [
      {
        name: "Status Backlog",
        type: "pie",
        radius: "62%",
        center: ["50%", "44%"],
        data: rows.map((r) => {
          const kit = BACKLOG_STATUS_COLOR[r.statusCategory];
          return {
            name: r.statusCategory,
            value: r.total,
            itemStyle: { color: kit ? kitChartColor(kit) : neutralChartColor() },
          };
        }),
        label: { formatter: "{b}: {c}", color: theme.textColor },
      },
    ],
  };
}

export function buildTrendOption(
  points: IndividualTrendBacklogPoint[],
  theme: ChartTheme,
): EChartsCoreOption {
  return {
    textStyle: { fontFamily: theme.fontFamily, color: theme.textColor },
    grid: { left: 8, right: 8, top: 28, bottom: 8, containLabel: true },
    legend: { top: 0, textStyle: { color: theme.textColor } },
    tooltip: { trigger: "axis" },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: points.map((p) => formatPeriodShort(p.periode)),
      axisLine: { lineStyle: { color: theme.lineColor } },
    },
    yAxis: [
      {
        type: "value",
        name: "Activities",
        minInterval: 1,
        splitLine: { lineStyle: { color: theme.lineColor } },
      },
      { type: "value", name: "Workload %", min: 0, max: 200, splitLine: { show: false } },
    ],
    series: [
      {
        name: "Total Activities",
        type: "line",
        symbolSize: 5,
        lineStyle: { width: 2 },
        data: points.map((p) => p.totalBacklog),
        itemStyle: { color: kitChartColor(2) },
      },
      {
        name: "Workload Percentage",
        type: "line",
        yAxisIndex: 1,
        symbolSize: 5,
        lineStyle: { width: 2 },
        data: points.map((p) => p.fte),
        itemStyle: { color: kitChartColor(1) },
      },
    ],
  };
}
