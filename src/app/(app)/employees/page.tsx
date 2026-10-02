"use client";

import Link from "next/link";
import * as React from "react";
import { EmptyState, ErrorState, LoadingState, StatusBadge } from "@/components/DataState";
import { BoardTable, type Column } from "@/components/BoardTable";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { PageHeader } from "@/components/PageHeader";
import { Select } from "@/components/Select";
import { useEmployees } from "@/features/employees/useEmployees";
import type { EmployeeStatus } from "@/generated/graphql/types";

type EmployeeRowData = {
  id: string;
  fullName: string;
  employeeCode: string;
  email: string;
  status: EmployeeStatus;
  unit: { name: string };
  jobRole: { name: string };
};
const COLUMNS: Column[] = [
  { key: "name", label: "Nama" },
  { key: "email", label: "Email" },
  { key: "unit", label: "Unit" },
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
        <span className="block text-xs text-zinc-500">{employee.employeeCode}</span>
      </td>
      <td className="px-4 py-2.5 text-zinc-600">{employee.email}</td>
      <td className="px-4 py-2.5 text-zinc-600">{employee.unit.name}</td>
      <td className="px-4 py-2.5 text-zinc-600">{employee.jobRole.name}</td>
      <td className="px-4 py-2.5">
        <StatusBadge active={employee.status === "ACTIVE"} />
      </td>
    </tr>
  );
}

export default function EmployeesPage() {
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<EmployeeStatus | "ALL">("ALL");
  const { status: query, data, error } = useEmployees({
    search: search || undefined,
    status: status === "ALL" ? undefined : status,
  });

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
            placeholder="Cari nama, email, atau kode…"
            className="max-w-xs"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <span>Status</span>
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as EmployeeStatus | "ALL")}
            className="w-auto"
          >
            <option value="ALL">Semua</option>
            <option value="ACTIVE">Aktif</option>
            <option value="INACTIVE">Nonaktif</option>
          </Select>
        </label>
      </div>

      {query === "loading" ? (
        <LoadingState />
      ) : query === "error" ? (
        <ErrorState message={error ?? "Gagal memuat data."} />
      ) : !data || data.length === 0 ? (
        <EmptyState message="Tidak ada karyawan yang cocok dengan pencarian/filter." />
      ) : (
        <BoardTable caption="Daftar karyawan" columns={COLUMNS}>
          {data.map((employee) => (
            <EmployeeRow key={employee.id} employee={employee} />
          ))}
        </BoardTable>
      )}
      <p className="text-xs text-zinc-500">
        {data ? `${data.length} karyawan ditampilkan.` : ""}
      </p>
    </section>
  );
}