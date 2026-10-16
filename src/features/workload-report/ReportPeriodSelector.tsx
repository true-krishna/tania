"use client";

import { REPORT_PERIODS, formatPeriodLabel } from "./mocks";

/**
 * Period selector untuk dashboard workload-report. Id `YYYYMM` dari data yang
 * menjalani URL (`?period=`) — satu id periode, bukan rentang tanggal (FR-027).
 */
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        className="h-11 rounded-full border border-tp-line bg-tp-surface px-4 text-sm font-medium text-tp-text"
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
