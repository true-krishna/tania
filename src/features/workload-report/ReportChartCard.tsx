"use client";

import dynamic from "next/dynamic";
import { Card } from "@/components/Card";
import type { EChartsCoreOption } from "echarts/core";

const EChart = dynamic(
  () => import("@/features/talent-report/EChart").then((m) => ({ default: m.EChart })),
  { ssr: false },
);

/** Kartu chart standar dashboard workload-report — EChart tanpa SSR. */
export function ReportChartCard({
  title,
  subtitle,
  option,
  ariaLabel,
  className = "h-72 w-full",
}: {
  title: string;
  subtitle?: string;
  option: EChartsCoreOption;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="tp-h3">{title}</h2>
        {subtitle ? <p className="tp-label mt-1">{subtitle}</p> : null}
      </div>
      <EChart option={option} className={className} ariaLabel={ariaLabel} />
    </Card>
  );
}
