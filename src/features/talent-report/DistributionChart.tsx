"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import type { EChartsCoreOption } from "echarts/core";
import { resolveChartTheme, type ChartTheme } from "./chart-theme";
import type { ReportCategoryCount } from "@/generated/graphql/types";

const EChart = dynamic(
  () => import("./EChart").then((m) => ({ default: m.EChart })),
  { ssr: false },
);

/**
 * Urutan intrinsik kategori ordinal (spek — Bentuk Visual). Label mengikuti
 * konstanta backend (D8 generasi, D11 jenjang) — label tak dikenal tetap tampil,
 * disusun setelah label terurut (stabil), sehingga total n tetap terjelaskan.
 */
export const GENERATION_ORDER = ["Baby Boomer", "Gen X", "Milenial", "Gen Z"] as const;
export const EDUCATION_ORDER = ["SMA/SMK Sederajat", "D3", "S1", "S2", "S3"] as const;

/** "bar" = bar mendatar (V-1 role, V-4 lokasi); "column" = kolom (V-2, V-3). */
export type DistributionOrientation = "bar" | "column";

export interface DistributionDatum {
  label: string;
  count: number;
  isMissing: boolean;
}

/**
 * T020 — data-prep distribusi (aturan tampil spek):
 * - kategori tak berurut → nilai terbesar dulu (stabil; urutan backend untuk seri);
 * - kategori ordinal → urutan intrinsik dipertahankan;
 * - `OTHER` berlabel "Lainnya"; `MISSING` ("Belum diisi") selalu terakhir & abu-abu.
 * Hasil sudah dalam urutan tampil (index 0 = atas untuk bar mendatar, kiri untuk kolom).
 */
export function prepareDistribution(
  data: readonly ReportCategoryCount[],
  ordinal?: readonly string[],
): DistributionDatum[] {
  const rank = (label: string): number => {
    const index = ordinal ? ordinal.indexOf(label) : -1;
    return index === -1 ? (ordinal?.length ?? 0) : index;
  };
  const items: DistributionDatum[] = data.map((item) => ({
    label: item.kind === "OTHER" ? "Lainnya" : item.label,
    count: item.count,
    isMissing: item.kind === "MISSING",
  }));
  return items.sort((a, b) => {
    if (a.isMissing !== b.isMissing) return a.isMissing ? 1 : -1;
    if (ordinal) {
      const diff = rank(a.label) - rank(b.label);
      if (diff !== 0) return diff;
    } else if (a.count !== b.count) {
      return b.count - a.count;
    }
    return 0;
  });
}

/** Opsi ECharts V-1…V-4: warna per-datum (MISSING abu-abu) dari tema (D1).
 * T034: judul & rentang dirender `TitleComponent` DI DALAM kanvas (plan §2)
 * agar PNG unduhan memuat judul + rentang — identik dengan tampilan (SC-03). */
export function buildDistributionOption(
  data: readonly DistributionDatum[],
  orientation: DistributionOrientation,
  theme: ChartTheme,
  title?: string,
  periodLabel?: string,
): EChartsCoreOption {
  const categories = data.map((d) => d.label);
  const values = data.map((d) => ({
    value: d.count,
    itemStyle: { color: d.isMissing ? theme.missingColor : theme.distributionColor },
  }));
  const categoryAxis = {
    type: "category" as const,
    data: categories,
    axisLabel: { color: theme.textColor, fontFamily: theme.fontFamily },
    axisLine: { lineStyle: { color: theme.lineColor } },
  };
  const valueAxis = {
    type: "value" as const,
    axisLabel: { color: theme.mutedColor, fontFamily: theme.fontFamily },
    splitLine: { lineStyle: { color: theme.lineColor } },
  };
  return {
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
    grid: { left: 8, right: 16, top: title ? 52 : 8, bottom: 8, containLabel: true },
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    xAxis: orientation === "bar" ? valueAxis : categoryAxis,
    yAxis: orientation === "bar" ? { ...categoryAxis, inverse: true } : valueAxis,
    series: [{ type: "bar", data: values, barMaxWidth: 28 }],
  };
}

interface DistributionChartProps {
  data: readonly ReportCategoryCount[];
  orientation: DistributionOrientation;
  ordinal?: readonly string[];
  ariaLabel?: string;
  className?: string;
  /** Judul grafik — dirender TitleComponent di dalam kanvas (T034/SC-03). */
  title?: string;
  /** Label rentang periode — subtext judul di dalam kanvas (T034/FR-13). */
  periodLabel?: string;
  /** Ref handle `getDataURL` untuk tombol Unduh PNG (T027). */
  chartRef?: React.Ref<import("./EChart").EChartHandle>;
}

export function DistributionChart({
  data,
  orientation,
  ordinal,
  ariaLabel,
  className,
  title,
  periodLabel,
  chartRef,
}: DistributionChartProps) {
  const theme = React.useMemo(() => resolveChartTheme(), []);
  const option = React.useMemo(
    () =>
      buildDistributionOption(
        prepareDistribution(data, ordinal),
        orientation,
        theme,
        title,
        periodLabel,
      ),
    [data, ordinal, orientation, theme, title, periodLabel],
  );
  return (
    <EChart
      ref={chartRef}
      option={option}
      ariaLabel={ariaLabel}
      className={className ?? "h-64 w-full"}
    />
  );
}
