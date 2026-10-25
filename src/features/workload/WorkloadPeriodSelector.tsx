"use client";

import { Select } from "@/components/Select";
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
      <Select
        aria-label="Pilih periode workload"
        className="w-44"
        onChange={(e) => onChange(e.target.value)}
        options={WORKLOAD_PERIODS.map((period) => ({ value: period.id, label: period.label }))}
        value={value}
      />
    </label>
  );
}
