"use client";

import Link from "next/link";
import * as React from "react";
import { EmptyState, ErrorState, LoadingState, StatusBadge } from "@/components/DataState";
import { employees } from "@/features/employees/mock";
import { useEmployees } from "@/features/employees/useEmployees";
import type { Employee, EmployeeStatus } from "@/generated/graphql/types";

function EmployeeRow({ employee }: { employee: Employee }) {
  return (
    <tr className="border-b border-zinc-100">
      <td className="py-2 pr-4">
        <Link
          href={`/employees/${employee.id}`}
          className="font-medium text-zinc-900 hover:underline"
        >
          {employee.fullName}
        </Link>
        <span className="block text-xs text-zinc-500">{employee.employeeCode}</span>
      </td>
      <td className="py-2 pr-4 text-zinc-600">{employee.email}</td>
      <td className="py-2 pr-4 text-zinc-600">{employee.unit.name}</td>
      <td className="py-2 pr-4 text-zinc-600">{employee.jobRole.name}</td>
      <td className="py-2">
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
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Data Karyawan</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Kelola data karyawan, pencarian, dan filter (Operation).
          </p>
        </div>
        <Link
          href="/employees/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          + Tambah Karyawan
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex flex-1 items-center gap-2 text-sm text-zinc-700">
          <span className="sr-only">Cari karyawan</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, email, atau kode…"
            className="w-full max-w-xs rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <span>Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as EmployeeStatus | "ALL")}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="ALL">Semua</option>
            <option value="ACTIVE">Aktif</option>
            <option value="INACTIVE">Nonaktif</option>
          </select>
        </label>
      </div>

      {query === "loading" ? (
        <LoadingState />
      ) : query === "error" ? (
        <ErrorState message={error ?? "Gagal memuat data."} />
      ) : !data || data.length === 0 ? (
        <EmptyState message="Tidak ada karyawan yang cocok dengan pencarian/filter." />
      ) : (
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">Daftar karyawan</caption>
          <thead>
            <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500">
              <th scope="col" className="py-2 pr-4 font-medium">
                Nama
              </th>
              <th scope="col" className="py-2 pr-4 font-medium">
                Email
              </th>
              <th scope="col" className="py-2 pr-4 font-medium">
                Unit
              </th>
              <th scope="col" className="py-2 pr-4 font-medium">
                Job Role
              </th>
              <th scope="col" className="py-2 font-medium">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((employee) => (
              <EmployeeRow key={employee.id} employee={employee} />
            ))}
          </tbody>
        </table>
      )}
      <p className="text-xs text-zinc-500">
        {data ? `${data.length} dari ${employees.length} karyawan ditampilkan.` : ""}
      </p>
    </section>
  );
}