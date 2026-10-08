"use client";

import Link from "next/link";
import * as React from "react";
import { useMutation } from "@apollo/client";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { ErrorState, LoadingState, StatusBadge } from "@/components/DataState";
import { useEmployee } from "@/features/employees/useEmployee";
import { EmployeeWorkloadTab } from "@/features/workload";
import { DeactivateEmployeeDocument, EmployeesDocument } from "@/generated/graphql";

type DetailTab = "overview" | "workload";

const DETAIL_TABS: { id: DetailTab; label: string }[] = [
  { id: "overview", label: "Ringkasan" },
  { id: "workload", label: "Workload" },
];

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { status, data, error } = useEmployee(id);
  const [tab, setTab] = React.useState<DetailTab>("overview");
  const [deactivate, { loading: deactivating }] = useMutation(DeactivateEmployeeDocument, {
    refetchQueries: [{ query: EmployeesDocument }],
  });

  const employee = data;
  const isInactive = employee?.status === "INACTIVE";

  return (
    <section className="flex flex-col gap-4">
      <Link href="/employees" className="w-fit text-sm text-zinc-500 hover:text-zinc-900">
        ← Kembali ke daftar
      </Link>
      <PageHeader
        title={employee?.fullName ?? "Detail karyawan"}
        subtitle={employee ? `${employee.employeeCode} · ${employee.email}` : undefined}
      />

      <div
        role="tablist"
        aria-label="Detail karyawan"
        className="flex gap-6 border-b border-board-border"
      >
        {DETAIL_TABS.map((item) => {
          const selected = item.id === tab;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(item.id)}
              className={
                selected
                  ? "-mb-px border-b-2 border-brand-500 px-1 py-2 text-sm font-semibold text-zinc-900"
                  : "-mb-px border-b-2 border-transparent px-1 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-900"
              }
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {tab === "workload" ? (
        <EmployeeWorkloadTab employeeId={id} />
      ) : status === "loading" ? (
        <LoadingState />
      ) : status === "error" ? (
        <ErrorState message={error ?? "Gagal memuat data."} />
      ) : !employee ? (
        <ErrorState message="Karyawan tidak ditemukan." />
      ) : (
        <>
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
                onClick={() => deactivate({ variables: { id } })}
                disabled={deactivating}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Ya, nonaktifkan
              </button>
            </div>
          </div>
        </Card>
      )}
        </>
      )}
    </section>
  );
}