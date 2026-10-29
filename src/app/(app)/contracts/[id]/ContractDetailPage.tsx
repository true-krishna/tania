"use client";

import Link from "next/link";
import * as React from "react";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { ErrorState, LoadingState } from "@/components/DataState";
import { Button } from "@/components/Button";
import { ContractEditForm } from "./ContractEditForm";
import { useEmploymentContract } from "@/features/contracts/useContract";
import {
  BAND_POSITION_LABEL,
  CONTRACT_END_REASON_LABEL,
  CONTRACT_STATUS_LABEL,
  CONTRACT_TYPE_LABEL,
  WORK_LOCATION_LABEL,
  isOpenEndedContractType,
} from "@/features/contracts/labels";
import { RecordChangeHistory } from "@/features/audit/RecordChangeHistory";
import { ContractCycleActions } from "@/features/contracts/ContractCycleActions";
import { useModuleAccess } from "@/lib/auth/access";
import {
  CONTRACTS,
  CONTRACT_DETAIL,
  CONTRACT_RENEW,
  EMPLOYEE_DETAIL,
} from "@/lib/constants/routes";

export default function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { status, data: contract, error } = useEmploymentContract(id);
  const manage = useModuleAccess("contracts").canManage;

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={error ?? "Gagal memuat data kontrak."} />;
  if (!contract) return <ErrorState message="Kontrak tidak ditemukan." />;

  return (
    <section className="flex flex-col gap-4">
      <Link className="w-fit text-sm text-zinc-500 hover:text-zinc-900" href={CONTRACTS}>
        ← Kembali ke daftar kontrak
      </Link>
      <PageHeader
        actions={
          manage && !isOpenEndedContractType(contract.contractType) ? (
            <Link className="no-underline" href={CONTRACT_RENEW(id)}>
              <Button variant="primary">Perpanjang kontrak</Button>
            </Link>
          ) : undefined
        }
        subtitle={`${contract.employee.fullName} · ${CONTRACT_TYPE_LABEL[contract.contractType]} · ${CONTRACT_STATUS_LABEL[contract.status]}`}
        title={contract.contractNo ?? "—"}
      />

      <Card className="max-w-3xl">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Detail kontrak</h2>

        <h3 className="mb-2 mt-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Identitas kontrak
        </h3>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Karyawan</dt>
            <dd className="text-zinc-900">
              <Link
                className="text-tp-brand-red-deep hover:underline"
                href={EMPLOYEE_DETAIL(contract.employee.id)}
              >
                {contract.employee.fullName}
              </Link>
              <span className="ml-2 font-mono text-xs text-zinc-500">
                {contract.employee.nikMasked}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">No. Kontrak</dt>
            <dd className="text-zinc-900">{contract.contractNo}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Jenis Kontrak</dt>
            <dd className="text-zinc-900">{CONTRACT_TYPE_LABEL[contract.contractType]}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Nomor Induk</dt>
            <dd className="text-zinc-900">{contract.nomorInduk}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Email Kantor</dt>
            <dd className="text-zinc-900">{contract.officeEmail ?? "—"}</dd>
          </div>
        </dl>

        <hr className="my-4 border-board-border" />

        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Posisi &amp; unit
        </h3>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
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
            <dd className="text-zinc-900">{contract.jobRole.chapter?.name ?? "Tanpa chapter"}</dd>
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
        </dl>

        <hr className="my-4 border-board-border" />

        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Periode &amp; status
        </h3>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Periode</dt>
            <dd className="text-zinc-900">
              {contract.startDate} — {contract.endDate ?? "tidak berbatas"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Status</dt>
            <dd className="text-zinc-900">{CONTRACT_STATUS_LABEL[contract.status]}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Alasan Berakhir</dt>
            <dd className="text-zinc-900">
              {contract.endReason ? CONTRACT_END_REASON_LABEL[contract.endReason] : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Dihentikan Pada</dt>
            <dd className="text-zinc-900">{contract.terminatedAt ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Kontrak Pendahulu</dt>
            <dd className="text-zinc-900">
              {contract.predecessor ? (
                <Link
                  className="text-tp-brand-red-deep hover:underline"
                  href={CONTRACT_DETAIL(contract.predecessor.id)}
                >
                  {contract.predecessor.contractNo}
                </Link>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Dibuat oleh</dt>
            <dd className="text-zinc-900">
              {contract.createdBy?.fullName ?? "—"} · {contract.createdAt}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Catatan</dt>
            <dd className="text-zinc-900">{contract.notes ?? "—"}</dd>
          </div>
        </dl>
      </Card>

      {manage ? <ContractCycleActions contract={contract} /> : null}

      {manage ? (
        <>
          <Card className="max-w-3xl">
            <h2 className="mb-3 text-sm font-semibold text-zinc-900">Ubah data kontrak</h2>
            <ContractEditForm contract={contract} id={id} />
          </Card>

          <Card className="max-w-3xl">
            <h2 className="mb-3 text-sm font-semibold text-zinc-900">Riwayat perubahan</h2>
            <RecordChangeHistory entityId={id} entityType="employment_contract" />
          </Card>
        </>
      ) : null}
    </section>
  );
}
