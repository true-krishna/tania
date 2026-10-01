"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import * as React from "react";
import { ErrorState, LoadingState, StatusBadge } from "@/components/DataState";
import { useEmployee } from "@/features/employees/useEmployee";

/**
 * Detail page for one employee, with the nonaktifkan (deactivate) action.
 * The status change is a local mock toggle for now — replace with the real
 * `deactivateEmployee` mutation when the backend US1 wave lands.
 */
export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { status, data, error } = useEmployee(id);
  const [deactivated, setDeactivated] = React.useState(false);

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={error ?? "Gagal memuat data."} />;
  if (!data) return notFound();

  const employee = data;
  const isInactive = deactivated || employee.status === "INACTIVE";

  return (
    <section className="flex flex-col gap-4">
      <Link href="/employees" className="w-fit text-sm text-zinc-500 hover:text-zinc-900">
        ← Kembali ke daftar
      </Link>
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">{employee.fullName}</h1>
        <p className="mt-1 text-sm text-zinc-600">
          {employee.employeeCode} · {employee.email}
        </p>
      </div>

      <dl className="grid max-w-2xl grid-cols-1 gap-3 rounded-md border border-zinc-200 bg-white p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">Unit</dt>
          <dd className="text-zinc-900">{employee.unit.name}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">Job Role</dt>
          <dd className="text-zinc-900">{employee.jobRole.name}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">Chapter</dt>
          <dd className="text-zinc-900">{employee.chapter?.name ?? "Tanpa chapter"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">Tanggal Bergabung</dt>
          <dd className="text-zinc-900">{employee.joinedAt}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">Status</dt>
          <dd>
            <StatusBadge active={!isInactive} />
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">Assignable</dt>
          <dd className="text-zinc-900">{employee.assignable && !isInactive ? "Ya" : "Tidak"}</dd>
        </div>
      </dl>

      {isInactive ? (
        <p className="w-fit rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-500">
          Karyawan dinonaktifkan.
        </p>
      ) : (
        <div className="flex max-w-2xl flex-col gap-3 rounded-md border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">
            Menonaktifkan <strong>{employee.fullName}</strong> akan membuatnya tidak lagi
            assignable. Lanjutkan?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDeactivated(true)}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Ya, nonaktifkan
            </button>
          </div>
        </div>
      )}
    </section>

  );
}