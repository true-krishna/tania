"use client";

import Link from "next/link";
import * as React from "react";
import { useMutation } from "@apollo/client";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { ErrorState, LoadingState } from "@/components/DataState";
import { Button } from "@/components/Button";
import { useEmployee } from "@/features/employees/useEmployee";
import { EMPLOYEE_STATUS_LABEL, GENDER_LABEL } from "@/features/employees/labels";
import {
  BAND_POSITION_LABEL,
  CONTRACT_END_REASON_LABEL,
  CONTRACT_STATUS_LABEL,
  CONTRACT_TYPE_LABEL,
  WORK_LOCATION_LABEL,
} from "@/features/contracts/labels";
import { RecordChangeHistory } from "@/features/audit/RecordChangeHistory";
import { EmployeeWorkloadTab } from "@/features/workload";
import {
  DeactivateEmployeeDocument,
  EmployeeDocument,
  EmployeesDocument,
  type EmployeeQuery,
} from "@/generated/graphql";

type DetailTab = "overview" | "workload";

const DETAIL_TABS: { id: DetailTab; label: string }[] = [
  { id: "overview", label: "Ringkasan" },
  { id: "workload", label: "Workload" },
];

type ContractRow = NonNullable<EmployeeQuery["employee"]>["contracts"]["edges"][number]["node"];

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { status, data, error } = useEmployee(id);
  const [tab, setTab] = React.useState<DetailTab>("overview");
  const [deactivate, { loading: deactivating }] = useMutation(DeactivateEmployeeDocument, {
    refetchQueries: [{ query: EmployeesDocument }, { query: EmployeeDocument, variables: { id } }],
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
        subtitle={
          employee ? `${employee.nomorInduk ?? "Tanpa kontrak aktif"} · ${employee.email}` : undefined
        }
        actions={
          employee ? (
            <Link href={`/employees/${id}/edit`} className="no-underline">
              <Button variant="secondary">Ubah data</Button>
            </Link>
          ) : undefined
        }
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
                  ? "-mb-px border-b-2 border-tp-brand-navy px-1 py-2 text-sm font-semibold text-zinc-900"
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
          <Card className="max-w-3xl">
            <h2 className="mb-3 text-sm font-semibold text-zinc-900">Data diri</h2>
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-500">NIK</dt>
                <dd className="font-mono text-zinc-900">{employee.nikMasked}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-500">Email</dt>
                <dd className="text-zinc-900">{employee.email}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-500">Tanggal Lahir</dt>
                <dd className="text-zinc-900">{employee.birthDate}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-500">Jenis Kelamin</dt>
                <dd className="text-zinc-900">{GENDER_LABEL[employee.gender]}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-500">Telepon</dt>
                <dd className="text-zinc-900">{employee.phone ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-500">Alamat</dt>
                <dd className="text-zinc-900">{employee.address ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-500">Pendidikan Terakhir</dt>
                <dd className="text-zinc-900">{employee.latestEducation ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-500">Institusi</dt>
                <dd className="text-zinc-900">{employee.institutionName ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-500">Jurusan</dt>
                <dd className="text-zinc-900">{employee.major ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-500">Tanggal Bergabung</dt>
                <dd className="text-zinc-900">{employee.joinedAt}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-500">Unit / Divisi</dt>
                <dd className="text-zinc-900">{employee.unit?.name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-500">Job Role</dt>
                <dd className="text-zinc-900">{employee.jobRole?.name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-500">Chapter</dt>
                <dd className="text-zinc-900">{employee.chapter?.name ?? "Tanpa chapter"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-500">Status</dt>
                <dd className="text-zinc-900">{EMPLOYEE_STATUS_LABEL[employee.status]}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-500">Assignable</dt>
                <dd className="text-zinc-900">
                  {employee.assignable && !isInactive ? "Ya" : "Tidak"}
                </dd>
              </div>
            </dl>
          </Card>

          <Card className="max-w-3xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-900">
                Riwayat kontrak ({employee.contracts.totalCount})
              </h2>
              <Link href={`/contracts/new?employeeId=${id}`} className="no-underline">
                <Button variant="secondary">+ Tambah kontrak</Button>
              </Link>
            </div>
            {employee.contracts.edges.length === 0 ? (
              <p className="text-sm text-zinc-500">Belum ada kontrak tercatat.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {employee.contracts.edges.map((edge) => (
                  <ContractHistoryCard key={edge.node.id} contract={edge.node} />
                ))}
              </div>
            )}
          </Card>

          <Card className="max-w-3xl">
            <h2 className="mb-3 text-sm font-semibold text-zinc-900">Riwayat perubahan</h2>
            <RecordChangeHistory entityType="employee" entityId={id} />
          </Card>

          {isInactive ? (
            <Card
              padded={false}
              className="w-fit border-red-200 bg-red-50 px-4 py-2 text-sm text-zinc-500"
            >
              Karyawan dinonaktifkan.
            </Card>
          ) : (
            <Card className="max-w-3xl border-red-200 bg-red-50">
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

function ContractHistoryCard({ contract }: { contract: ContractRow }) {
  return (
    <div className="rounded-md border border-board-border bg-white px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/contracts/${contract.id}`}
          className="text-sm font-semibold text-zinc-900 hover:underline"
        >
          {contract.contractNo}
        </Link>
        <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-700">
          {CONTRACT_STATUS_LABEL[contract.status]}
        </span>
        {contract.endReason ? (
          <span className="text-xs text-zinc-500">
            {CONTRACT_END_REASON_LABEL[contract.endReason]}
          </span>
        ) : null}
      </div>
      <dl className="mt-2 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">Jenis</dt>
          <dd className="text-zinc-900">{CONTRACT_TYPE_LABEL[contract.contractType]}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">Nomor Induk</dt>
          <dd className="text-zinc-900">{contract.nomorInduk}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">Unit</dt>
          <dd className="text-zinc-900">{contract.unit.name}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">Posisi / Job Role</dt>
          <dd className="text-zinc-900">{contract.jobRole.name}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">Job Title</dt>
          <dd className="text-zinc-900">{contract.jobTitle ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">Job Level</dt>
          <dd className="text-zinc-900">{contract.jobLevel ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">Band Position</dt>
          <dd className="text-zinc-900">{BAND_POSITION_LABEL[contract.bandPosition]}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">Work Location</dt>
          <dd className="text-zinc-900">{WORK_LOCATION_LABEL[contract.workLocation]}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">Email Kantor</dt>
          <dd className="text-zinc-900">{contract.officeEmail ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">Periode</dt>
          <dd className="text-zinc-900">
            {contract.startDate} — {contract.endDate ?? "tidak berbatas"}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">Berakhir</dt>
          <dd className="text-zinc-900">{contract.terminatedAt ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">Catatan</dt>
          <dd className="text-zinc-900">{contract.notes ?? "—"}</dd>
        </div>
      </dl>
    </div>
  );
}
