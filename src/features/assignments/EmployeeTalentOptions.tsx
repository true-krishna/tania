"use client";

import { Select } from "@/components/Select";
import { useEmployees } from "@/features/employees/useEmployees";

export function EmployeeTalentOptions({
  labelledBy,
  value,
  onChange,
}: {
  labelledBy?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const employees = useEmployees();
  return (
    <Select
      aria-labelledby={labelledBy}
      className="w-64"
      onChange={(e) => onChange(e.target.value)}
      options={[
        { value: "", label: "Semua" },
        ...(employees.employees ?? []).map((emp) => ({ value: emp.id, label: emp.fullName })),
      ]}
      value={value}
    />
  );
}
