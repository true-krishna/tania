"use client";

import { WORKLOAD_PERIODS } from "./mocks";

/**
 * Period selector (design §3 item 3). Only the opaque period id travels in the
 * URL (`?period=`), never a date range (FR-027).
 */
export function WorkloadPeriodSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (periodId: string) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-[13px] font-semibold text-tp-muted">
      Periode
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Pilih periode workload"
        className="h-11 rounded-full border border-tp-line bg-tp-surface px-4 text-sm font-medium text-tp-text"
      >
        {WORKLOAD_PERIODS.map((period) => (
          <option key={period.id} value={period.id}>
            {period.label}
          </option>
        ))}
      </select>
    </label>
  );
}
