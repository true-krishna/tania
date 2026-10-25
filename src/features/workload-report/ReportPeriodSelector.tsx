"use client";

import { Select } from "@/components/Select";
import { REPORT_PERIODS, formatPeriodLabel } from "./mocks";

export function ReportPeriodSelector({
  value,
  onChange,
  ariaLabel = "Pilih periode laporan workload",
}: {
  value: string;
  onChange: (period: string) => void;
  ariaLabel?: string;
}) {
  return (
    <label className="flex items-center gap-2 text-[13px] font-semibold text-tp-muted">
      Periode
      <Select
        aria-label={ariaLabel}
        className="w-44"
        onChange={(e) => onChange(e.target.value)}
        options={REPORT_PERIODS.map((period) => ({
          value: period.id,
          label: formatPeriodLabel(period.id),
        }))}
        value={value}
      />
    </label>
  );
}
