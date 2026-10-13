"use client";

import Link from "next/link";
import * as React from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { BoardTable, type Column } from "@/components/BoardTable";
import { Button } from "@/components/Button";
import { FilterButton } from "@/components/FilterButton";
import { Input } from "@/components/Input";
import { PageHeader } from "@/components/PageHeader";
import { Select } from "@/components/Select";
import { useEmployees } from "@/features/employees/useEmployees";
import { EMPLOYEE_STATUS_LABEL } from "@/features/employees/labels";
import { useUnits } from "@/features/master-data/useMasterData";
import type { EmployeeStatus } from "@/generated/graphql/types";

type EmployeeRowData = {
  id: string;
  fullName: string;
  nikMasked: string;
  email: string;
  status: EmployeeStatus;
  nomorInduk: string | null;
  unit: { name: string } | null;
  jobRole: { name: string } | null;
};

const COLUMNS: Column[] = [
  { key: "name", label: "Nama" },
  { key: "nik", label: "NIK" },
  { key: "email", label: "Email" },
  { key: "unit", label: "Divisi" },
  { key: "jobRole", label: "Job Role" },
  { key: "status", label: "Status" },
];

function EmployeeRow({ employee }: { employee: EmployeeRowData }) {
  return (
    <tr className="border-b border-board-border transition-colors hover:bg-zinc-50">
      <td className="px-4 py-2.5">
        <Link
          href={`/employees/${employee.id}`}
          className="font-medium text-zinc-900 hover:underline"
        >
          {employee.fullName}
        </Link>
        <span className="block text-xs text-zinc-500">{employee.nomorInduk ?? "—"}</span>
      </td>
      <td className="px-4 py-2.5 font-mono text-xs text-zinc-600">{employee.nikMasked}</td>
      <td className="px-4 py-2.5 text-zinc-600">{employee.email}</td>
      <td className="px-4 py-2.5 text-zinc-600">{employee.unit?.name ?? "—"}</td>
      <td className="px-4 py-2.5 text-zinc-600">{employee.jobRole?.name ?? "—"}</td>
      <td className="px-4 py-2.5">
        <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-700">
          {EMPLOYEE_STATUS_LABEL[employee.status]}
        </span>
      </td>
    </tr>
  );
}

export default function EmployeesPage() {
  const [search, setSearch] = React.useState("");
  const [unitId, setUnitId] = React.useState("");
  const [status, setStatus] = React.useState<EmployeeStatus | "ALL">("ALL");
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const units = useUnits();
  const { status: query, employees, totalCount, hasNextPage, loadingMore, error, loadMore } =
    useEmployees({
      search: search || undefined,
      unitId: unitId || undefined,
      status: status === "ALL" ? undefined : status,
    });
  const activeFilters = (unitId ? 1 : 0) + (status !== "ALL" ? 1 : 0);

  return (
    <section className="flex flex-col gap-4">
      <PageHeader
        title="Data Karyawan"
        subtitle="Kelola data karyawan, pencarian, dan filter (Operation)."
        actions={
          <Link href="/employees/new" className="no-underline">
            <Button variant="primary">+ Tambah Karyawan</Button>
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex flex-1 items-center gap-2 text-sm text-zinc-700">
          <span className="sr-only">Cari karyawan</span>
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, email, atau nomor induk…"
            className="max-w-xs"
          />
        </label>
        <FilterButton
          activeCount={activeFilters}
          expanded={filtersOpen}
          onClick={() => setFiltersOpen((open) => !open)}
          panelId="employee-filter-panel"
        />
      </div>

      {filtersOpen ? (
        <div id="employee-filter-panel" className="tp-card flex flex-wrap items-end gap-4">
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <span>Divisi</span>
            <Select
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              className="w-auto"
            >
              <option value="">Semua</option>
              {(units.data ?? []).map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <span>Status</span>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as EmployeeStatus | "ALL")}
              className="w-auto"
            >
              <option value="ALL">Semua</option>
              {(Object.keys(EMPLOYEE_STATUS_LABEL) as Array<keyof typeof EMPLOYEE_STATUS_LABEL>).map(
                (value) => (
                  <option key={value} value={value}>
                    {EMPLOYEE_STATUS_LABEL[value]}
                  </option>
                )
              )}
            </Select>
          </label>
        </div>
      ) : null}

      {query === "loading" ? (
        <LoadingState />
      ) : query === "error" ? (
        <ErrorState message={error ?? "Gagal memuat data."} />
      ) : !employees || employees.length === 0 ? (
        <EmptyState message="Tidak ada karyawan yang cocok dengan pencarian/filter." />
      ) : (
        <>
          <BoardTable caption="Daftar karyawan" columns={COLUMNS}>
            {employees.map((employee) => (
              <EmployeeRow key={employee.id} employee={employee} />
            ))}
          </BoardTable>
          {hasNextPage ? (
            <Button variant="secondary" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? "Memuat…" : "Muat lebih banyak"}
            </Button>
          ) : null}
        </>
      )}
      <p className="text-xs text-zinc-500">
        {employees ? `${employees.length} dari ${totalCount} karyawan ditampilkan.` : ""}
      </p>
    </section>
  );
}
