"use client";

import { Select } from "@/components/Select";
import { useAssignableTalents } from "@/features/employees/useEmployees";

export function ChapterTalentOptions({
  labelledBy,
  value,
  onChange,
}: {
  labelledBy?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const talents = useAssignableTalents();
  return (
    <Select
      aria-labelledby={labelledBy}
      className="w-64"
      onChange={(e) => onChange(e.target.value)}
      options={[
        { value: "", label: "Semua" },
        ...(talents.data ?? []).map((emp) => ({ value: emp.id, label: emp.fullName })),
      ]}
      value={value}
    />
  );
}
