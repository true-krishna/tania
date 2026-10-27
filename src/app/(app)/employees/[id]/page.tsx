"use client";

import Link from "next/link";
import * as React from "react";
import { useMutation } from "@apollo/client";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { ErrorState, LoadingState } from "@/components/DataState";
import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { useEmployee } from "@/features/employees/useEmployee";
import { EMPLOYEE_STATUS_LABEL, GENDER_LABEL } from "@/features/employees/labels";
import {
  BAND_POSITION_LABEL,
  CONTRACT_END_REASON_LABEL,
  CONTRACT_STATUS_LABEL,
  CONTRACT_STATUS_VARIANT,
  CONTRACT_TYPE_LABEL,
  WORK_LOCATION_LABEL,
} from "@/features/contracts/labels";
import { RecordChangeHistory } from "@/features/audit/RecordChangeHistory";
import { EmployeeWorkloadTab } from "@/features/workload";
import { EmployeeEntraProvisionCard } from "@/features/entra/EmployeeEntraProvisionCard";
import {
  DeactivateEmployeeDocument,
  EmployeeDocument,
  EmployeesDocument,
  type EmployeeQuery,
} from "@/generated/graphql";
import { useModuleAccess } from "@/lib/auth/access";
import { useSessionRole } from "@/lib/auth/guard";
import {
  CONTRACT_NEW,
  CONTRACT_DETAIL,
  EMPLOYEES,
  EMPLOYEE_EDIT,
} from "@/lib/constants/routes";

type DetailTab = "overview" | "workload";

const DETAIL_TABS: { id: DetailTab; label: string }[] = [
  { id: "overview", label: "Ringkasan" },
  { id: "workload", label: "Workload" },
];

type ContractRow = NonNullable<EmployeeQuery["employee"]>["contracts"]["edges"][number]["node"];

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const role = useSessionRole();
  const manage = useModuleAccess("employees").canManage;
  const showHistory = role === "OPERATION" || role === "ADMIN";
  const showEntra = useModuleAccess("entra").canRead;
  const linkContracts = useModuleAccess("contracts").canRead;
  const { status, data, error } = useEmployee(id);
  const [tab, setTab] = React.useState<DetailTab>("overview");
  const [deactivate, { loading: deactivating }] = useMutation(DeactivateEmployeeDocument, {
    refetchQueries: [{ query: EmployeesDocument }, { query: EmployeeDocument, variables: { id } }],
  });

  const employee = data;
  const isInactive = employee?.status === "INACTIVE";

  return (
    <section className="flex flex-col gap-4">
      {role === "TALENT" ? null : (
        <Link className="w-fit text-sm text-zinc-500 hover:text-zinc-900" href={EMPLOYEES}>
          ← Kembali ke daftar
        </Link>
      )}
      <PageHeader
        actions={
          employee && manage ? (
            <Link className="no-underline" href={EMPLOYEE_EDIT(id)}>
              <Button variant="secondary">Ubah data</Button>
            </Link>
          ) : undefined
        }
        subtitle={
          employee ? `${employee.nomorInduk ?? "Tanpa kontrak aktif"} · ${employee.email}` : undefined
        }
        title={employee?.fullName ?? "Detail karyawan"}
      />

      <div
        aria-label="Detail karyawan"
        className="flex gap-6 border-b border-board-border"
        role="tablist"
      >
        {DETAIL_TABS.map((item) => {
          const selected = item.id === tab;
          return (
            <button
              aria-selected={selected}
              className={
                selected
                  ? "-mb-px border-b-2 border-tp-brand-navy px-1 py-2 text-sm font-semibold text-zinc-900"
                  : "-mb-px border-b-2 border-transparent px-1 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-900"
              }
              key={item.id}
              onClick={() => setTab(item.id)}
              role="tab"
              type="button"
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
                <dd className="text-zinc-900">{employee.birthDate ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-500">Jenis Kelamin</dt>
                <dd className="text-zinc-900">
                  {employee.gender ? GENDER_LABEL[employee.gender] : "—"}
                </dd>
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

          {showEntra ? <EmployeeEntraProvisionCard employeeId={id} /> : null}

          <Card className="max-w-3xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-900">
                Riwayat kontrak ({employee.contracts.totalCount})
              </h2>
              {manage ? (
                <Link className="no-underline" href={`${CONTRACT_NEW}?employeeId=${id}`}>
                  <Button variant="secondary">+ Tambah kontrak</Button>
                </Link>
              ) : null}
            </div>
            {employee.contracts.edges.length === 0 ? (
              <p className="text-sm text-zinc-500">Belum ada kontrak tercatat.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {employee.contracts.edges.map((edge) => (
                  <ContractHistoryCard contract={edge.node} key={edge.node.id} linked={linkContracts} />
                ))}
              </div>
            )}
          </Card>

          {showHistory ? (
            <Card className="max-w-3xl">
              <h2 className="mb-3 text-sm font-semibold text-zinc-900">Riwayat perubahan</h2>
              <RecordChangeHistory entityId={id} entityType="employee" />
            </Card>
          ) : null}

          {!manage ? null : isInactive ? (
            <Card
              className="w-fit border-red-200 bg-red-50 px-4 py-2 text-sm text-zinc-500"
              padded={false}
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
                    className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                    disabled={deactivating}
                    onClick={() => deactivate({ variables: { id } })}
                    type="button"
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

function ContractHistoryCard({ contract, linked }: { contract: ContractRow; linked: boolean }) {
  return (
    <div className="rounded-md border border-board-border bg-white px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        {linked ? (
          <Link
            className="text-sm font-semibold text-zinc-900 hover:underline"
            href={CONTRACT_DETAIL(contract.id)}
          >
            {contract.contractNo}
          </Link>
        ) : (
          <span className="text-sm font-semibold text-zinc-900">{contract.contractNo}</span>
        )}
        <Chip size="small" variant={CONTRACT_STATUS_VARIANT[contract.status]}>
          {CONTRACT_STATUS_LABEL[contract.status]}
        </Chip>
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
          <dt className="text-xs uppercase tracking-wide text-zinc-500">Chapter</dt>
          <dd className="text-zinc-900">
            {contract.jobRole.chapter?.name ?? "Tanpa chapter"}
          </dd>
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
