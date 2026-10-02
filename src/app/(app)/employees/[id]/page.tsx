"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import * as React from "react";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { ErrorState, LoadingState, StatusBadge } from "@/components/DataState";
import { useEmployee } from "@/features/employees/useEmployee";

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
      <PageHeader
        title={employee.fullName}
        subtitle={`${employee.employeeCode} · ${employee.email}`}
      />

      <Card className="max-w-2xl">
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
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
      </Card>
      {isInactive ? (
        <Card padded={false} className="w-fit border-red-200 bg-red-50 px-4 py-2 text-sm text-zinc-500">
          Karyawan dinonaktifkan.
        </Card>
      ) : (
        <Card className="max-w-2xl border-red-200 bg-red-50">
          <div className="flex flex-col gap-3">
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
        </Card>
      )}
    </section>

  );
}