"use client";

import { WORKLOAD_PERIODS } from "./mocks";

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
        aria-label="Pilih periode workload"
        className="h-11 rounded-full border border-tp-line bg-tp-surface px-4 text-sm font-medium text-tp-text"
        onChange={(e) => onChange(e.target.value)}
        value={value}
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
