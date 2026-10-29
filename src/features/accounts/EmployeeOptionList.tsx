"use client";

import * as React from "react";
import { orDash } from "@/lib/cell";
import { cn } from "@/lib/cn";
import type { EmployeeLookupState } from "./useEmployeeLookup";

export type EmployeeOption = NonNullable<
  EmployeeLookupState["items"]
>[number];

type EmployeeOptionListProps = {
  activeIndex: number;
  error: string | null;
  items: EmployeeOption[];
  listboxId: string;
  listRef: React.RefObject<HTMLUListElement | null>;
  onActiveIndexChange: (index: number) => void;
  onSelect: (employeeId: string) => void;
  status: EmployeeLookupState["status"];
};

export function EmployeeOptionList({
  activeIndex,
  error,
  items,
  listboxId,
  listRef,
  onActiveIndexChange,
  onSelect,
  status,
}: EmployeeOptionListProps) {
  function renderOptions() {
    if (status === "loading" && items.length === 0) {
      return <li className="px-3 py-2 text-sm text-zinc-500">Memuat…</li>;
    }
    if (status === "error") {
      return (
        <li className="px-3 py-2 text-sm text-red-600">
          {error ?? "Gagal memuat daftar karyawan."}
        </li>
      );
    }
    if (items.length === 0) {
      return <li className="px-3 py-2 text-sm text-zinc-500">Tidak ada karyawan yang cocok.</li>;
    }
    return items.map((employee, optionIndex) => {
      const isActive = optionIndex === activeIndex;
      return (
        <li
          aria-selected={isActive}
          className={cn(
            "cursor-pointer rounded-md px-3 py-1.5 text-sm",
            isActive ? "bg-zinc-100 text-zinc-900" : "text-zinc-700 hover:bg-zinc-50",
          )}
          data-option-index={optionIndex}
          id={`${listboxId}-option-${optionIndex}`}
          key={employee.id}
          onMouseDown={(event) => {
            event.preventDefault();
            onSelect(employee.id);
          }}
          onMouseEnter={() => onActiveIndexChange(optionIndex)}
          role="option"
        >
          <div className="font-medium">{employee.fullName}</div>
          <div className="text-xs text-zinc-500">
            {orDash(employee.nomorInduk)} · {orDash(employee.email)}
          </div>
        </li>
      );
    });
  }

  return (
    <ul
      aria-label="Pilih karyawan"
      className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 list-none overflow-auto rounded-tp-lg border border-tp-line bg-tp-surface p-1 shadow-card"
      id={listboxId}
      ref={listRef}
      role="listbox"
    >
      {renderOptions()}
    </ul>
  );
}
