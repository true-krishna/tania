"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import type { EChartsCoreOption } from "echarts/core";
import { resolveChartTheme, type ChartTheme } from "./chart-theme";
import type { EChartHandle } from "./EChart";
import type { ReportMonthlyMovement } from "@/generated/graphql/types";

const EChart = dynamic(
  () => import("./EChart").then((m) => ({ default: m.EChart })),
  { ssr: false },
);

/** T026 — V-5: line dua seri default; bar divergen hanya untuk rentang ≤12 bulan (plan §7). */
export type MovementView = "line" | "diverging";

export const MAX_DIVERGING_MONTHS = 12;

/** Opsi toggle tampilan (V-5) — urutan tampil di tablist. */
const VIEWS: readonly { id: MovementView; label: string }[] = [
  { id: "line", label: "Line" },
  { id: "diverging", label: "Bar divergen" },
];

export function canUseDivergingBars(data: readonly ReportMonthlyMovement[]): boolean {
  return data.length > 0 && data.length <= MAX_DIVERGING_MONTHS;
}

/** Opsi ECharts V-5. `"diverging"`: new talent di atas nol, churn di bawah nol (churn tampil sebagai nilai negatif). */
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
    // T034: judul & rentang di dalam kanvas (plan §2) — PNG identik tampilan (SC-03).
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
    legend: { top: title ? 44 : undefined, data: ["New talent", "Churn"], textStyle: { color: theme.textColor } },
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
        // Sumbu divergen memakai nilai negatif untuk churn; label tampil absolut.
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
  /** Judul grafik — dirender TitleComponent di dalam kanvas (T034/SC-03). */
  title?: string;
  /** Label rentang periode — subtext judul di dalam kanvas (T034/FR-13). */
  periodLabel?: string;
  chartRef?: React.Ref<EChartHandle>;
}

/**
 * T026 — grafik tren bulanan churn vs new talent (V-5): line dua seri default,
 * toggle bar divergen aktif hanya untuk rentang ≤12 bulan (spesifikasi bentuk
 * visual V-5). Warna: hijau new talent, merah churn (D1/O-R4).
 */
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

  /** V-5: pilihan bar divergen hanya sah bila rentangnya ≤12 bulan. */
  const selectView = (next: MovementView) => {
    if (next === "diverging" && !divergingAvailable) return;
    setView(next);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Toggle tampilan memakai resep tab kanon (.tp-tabs/.tp-tab) dengan
          aria-selected sebagai sumber status (VI), bukan warna saja. */}
      <div className="tp-tabs" role="tablist" aria-label="Tampilan grafik tren">
        {VIEWS.map((item) => {
          const selected = effectiveView === item.id;
          const disabled = item.id === "diverging" && !divergingAvailable;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={tabId(item.id)}
              className={`tp-tab${disabled ? " cursor-not-allowed opacity-50" : ""}`}
              aria-selected={selected}
              aria-controls={panelId}
              aria-disabled={disabled || undefined}
              title={
                disabled ? "Bar divergen hanya untuk rentang maksimal 12 bulan" : undefined
              }
              onClick={() => selectView(item.id)}
              onKeyDown={(event) => {
                if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
                event.preventDefault();
                selectView(effectiveView === "line" ? "diverging" : "line");
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" id={panelId} aria-labelledby={tabId(effectiveView)}>
        <EChart
          ref={chartRef}
          option={option}
          ariaLabel={ariaLabel}
          className={className ?? "h-64 w-full"}
        />
      </div>
    </div>
  );
}
