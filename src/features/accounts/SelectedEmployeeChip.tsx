"use client";

import { orDash } from "@/lib/cell";
import type { EmployeeOption } from "./EmployeeOptionList";

export function SelectedEmployeeChip({
  employee,
}: {
  employee: EmployeeOption;
}) {
  return (
    <div className="mt-1.5 inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-700">
      <span className="font-medium">{employee.fullName}</span>
      <span className="text-zinc-500">({orDash(employee.nomorInduk)})</span>
    </div>
  );
}
