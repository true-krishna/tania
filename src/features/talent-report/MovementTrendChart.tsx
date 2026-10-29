"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import type { EChartsCoreOption } from "echarts/core";
import { resolveChartTheme, type ChartTheme } from "./chart-theme";
import type { EChartHandle } from "./EChart";
import type { ReportMonthlyMovement } from "@/generated/graphql/types";

const EChart = dynamic(() => import("./EChart").then((m) => ({ default: m.EChart })), {
  ssr: false,
});

export type MovementView = "line" | "diverging";

export const MAX_DIVERGING_MONTHS = 12;

const VIEWS: readonly { id: MovementView; label: string }[] = [
  { id: "line", label: "Line" },
  { id: "diverging", label: "Bar divergen" },
];

export function canUseDivergingBars(data: readonly ReportMonthlyMovement[]): boolean {
  return data.length > 0 && data.length <= MAX_DIVERGING_MONTHS;
}

export function buildMovementOption(
  data: readonly ReportMonthlyMovement[],
  view: MovementView,
  theme: ChartTheme,
  title?: string,
  periodLabel?: string,
): EChartsCoreOption {
  const months = data.map((m) => m.month);
  const axisLabel = { color: theme.textColor, fontFamily: theme.fontFamily };
  const common = {
    textStyle: { fontFamily: theme.fontFamily, color: theme.textColor },
    title: title
      ? {
          text: title,
          subtext: periodLabel,
          left: "center",
          top: 0,
          textStyle: {
            color: theme.textColor,
            fontFamily: theme.fontFamily,
            fontSize: 14,
            fontWeight: 600 as const,
          },
          subtextStyle: { color: theme.mutedColor, fontFamily: theme.fontFamily, fontSize: 11 },
        }
      : undefined,
    legend: {
      top: title ? 44 : undefined,
      data: ["New talent", "Churn"],
      textStyle: { color: theme.textColor },
    },
    grid: { left: 8, right: 16, top: title ? 72 : 24, bottom: 8, containLabel: true },
    tooltip: { trigger: "axis" as const },
    xAxis: {
      type: "category" as const,
      data: months,
      axisLabel,
      axisLine: { lineStyle: { color: theme.lineColor } },
    },
    yAxis: {
      type: "value" as const,
      axisLabel: {
        ...axisLabel,
        formatter: (value: number) => String(Math.abs(value)),
      },
      splitLine: { lineStyle: { color: theme.lineColor } },
    },
  };

  if (view === "diverging") {
    return {
      ...common,
      series: [
        {
          name: "New talent",
          type: "bar",
          data: data.map((m) => m.newTalent),
          itemStyle: { color: theme.newTalentColor },
          barMaxWidth: 28,
        },
        {
          name: "Churn",
          type: "bar",
          data: data.map((m) => -m.churn),
          itemStyle: { color: theme.churnColor },
          barMaxWidth: 28,
        },
      ],
    };
  }

  return {
    ...common,
    series: [
      {
        name: "New talent",
        type: "line",
        data: data.map((m) => m.newTalent),
        itemStyle: { color: theme.newTalentColor },
        lineStyle: { color: theme.newTalentColor },
      },
      {
        name: "Churn",
        type: "line",
        data: data.map((m) => m.churn),
        itemStyle: { color: theme.churnColor },
        lineStyle: { color: theme.churnColor },
      },
    ],
  };
}

interface MovementTrendChartProps {
  data: readonly ReportMonthlyMovement[];
  ariaLabel?: string;
  className?: string;
  title?: string;
  periodLabel?: string;
  chartRef?: React.Ref<EChartHandle>;
}

export function MovementTrendChart({
  data,
  ariaLabel,
  className,
  title,
  periodLabel,
  chartRef,
}: MovementTrendChartProps) {
  const theme = React.useMemo(() => resolveChartTheme(), []);
  const [view, setView] = React.useState<MovementView>("line");
  const divergingAvailable = canUseDivergingBars(data);
  const effectiveView = divergingAvailable ? view : "line";
  const panelId = React.useId();
  const tabId = (candidate: MovementView) => `${panelId}-${candidate}`;
  const option = React.useMemo(
    () => buildMovementOption(data, effectiveView, theme, title, periodLabel),
    [data, effectiveView, theme, title, periodLabel],
  );

  const selectView = (next: MovementView) => {
    if (next === "diverging" && !divergingAvailable) return;
    setView(next);
  };

  return (
    <div className="flex flex-col gap-2">
      <div aria-label="Tampilan grafik tren" className="tp-tabs" role="tablist">
        {VIEWS.map((item) => {
          const selected = effectiveView === item.id;
          const disabled = item.id === "diverging" && !divergingAvailable;
          return (
            <button
              aria-controls={panelId}
              aria-disabled={disabled || undefined}
              aria-selected={selected}
              className={`tp-tab${disabled ? " cursor-not-allowed opacity-50" : ""}`}
              id={tabId(item.id)}
              key={item.id}
              onClick={() => selectView(item.id)}
              onKeyDown={(event) => {
                if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
                event.preventDefault();
                selectView(effectiveView === "line" ? "diverging" : "line");
              }}
              role="tab"
              title={disabled ? "Bar divergen hanya untuk rentang maksimal 12 bulan" : undefined}
              type="button"
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div aria-labelledby={tabId(effectiveView)} id={panelId} role="tabpanel">
        <EChart
          ariaLabel={ariaLabel}
          className={className ?? "h-64 w-full"}
          option={option}
          ref={chartRef}
        />
      </div>
    </div>
  );
}
