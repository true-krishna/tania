"use client";

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
      <select
        aria-label={ariaLabel}
        className="h-11 rounded-full border border-tp-line bg-tp-surface px-4 text-sm font-medium text-tp-text"
        onChange={(e) => onChange(e.target.value)}
        value={value}
      >
        {REPORT_PERIODS.map((period) => (
          <option key={period.id} value={period.id}>
            {formatPeriodLabel(period.id)}
          </option>
        ))}
      </select>
    </label>
  );
}
