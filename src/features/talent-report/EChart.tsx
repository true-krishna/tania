"use client";

import * as React from "react";
import * as echarts from "echarts/core";
import { BarChart, LineChart, PieChart } from "echarts/charts";
import {
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { EChartsCoreOption, EChartsType } from "echarts/core";

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  GridComponent,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer,
]);

export interface ChartImageOptions {
  type?: "png" | "jpeg" | "svg";
  pixelRatio?: number;
  backgroundColor?: string;
}

export interface EChartHandle {
  /** Kanvas → data URL (T027 memakai `pixelRatio: 2` untuk PNG ≥2×). */
  getDataURL(options?: ChartImageOptions): string;
}

interface EChartProps {
  option: EChartsCoreOption;
  className?: string;
  ariaLabel?: string;
}

/**
 * T018 — wrapper klien ECharts (D1): init/setOption/dispose + ResizeObserver,
 * registrasi selektif di atas, ref `getDataURL` untuk ekspor PNG.
 * Dimuat client-side tanpa SSR — konsumen memakai `next/dynamic(..., { ssr: false })`.
 */
export const EChart = React.forwardRef<EChartHandle, EChartProps>(function EChart(
  { option, className, ariaLabel },
  ref,
) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const chartRef = React.useRef<EChartsType | null>(null);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const chart = echarts.init(el);
    chartRef.current = chart;
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(el);
    return () => {
      observer.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    chartRef.current?.setOption(option);
  }, [option]);

  React.useImperativeHandle(
    ref,
    () => ({
      getDataURL: (options) => chartRef.current?.getDataURL(options ?? {}) ?? "",
    }),
    [],
  );

  return <div ref={containerRef} className={className} role="img" aria-label={ariaLabel} />;
});
