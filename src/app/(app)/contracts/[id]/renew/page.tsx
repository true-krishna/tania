"use client";

import Link from "next/link";
import * as React from "react";
import { Card } from "@/components/Card";
import { ErrorState, LoadingState } from "@/components/DataState";
import { PageHeader } from "@/components/PageHeader";
import { useEmploymentContract } from "@/features/contracts/useContract";
import { RenewContractWizard } from "@/features/contracts/RenewContractWizard";
import { CONTRACT_STATUS_LABEL, CONTRACT_TYPE_LABEL } from "@/features/contracts/labels";

export default function RenewContractPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { status, data: contract, error } = useEmploymentContract(id);

  if (status === "loading") return <LoadingState />;
  if (status === "error")
    return <ErrorState message={error ?? "Gagal memuat data kontrak."} />;
  if (!contract) return <ErrorState message="Kontrak tidak ditemukan." />;

  return (
    <section className="flex flex-col gap-4">
      <Link
        href={`/contracts/${id}`}
        className="w-fit text-sm text-zinc-500 hover:text-zinc-900"
      >
        ← Kembali ke detail kontrak
      </Link>
      <PageHeader
        title="Perpanjang kontrak"
        subtitle={`${contract.employee.fullName} · kontrak pendahulu ${contract.contractNo}`}
      />

      <Card className="max-w-3xl">
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Kontrak lama</dt>
            <dd className="text-zinc-900">{contract.contractNo}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Jenis</dt>
            <dd className="text-zinc-900">{CONTRACT_TYPE_LABEL[contract.contractType]}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Status</dt>
            <dd className="text-zinc-900">{CONTRACT_STATUS_LABEL[contract.status]}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Periode lama</dt>
            <dd className="text-zinc-900">
              {contract.startDate} — {contract.endDate ?? "tidak berbatas"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Unit</dt>
            <dd className="text-zinc-900">{contract.unit.name}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Posisi</dt>
            <dd className="text-zinc-900">{contract.jobRole.name}</dd>
          </div>
        </dl>
      </Card>

      <Card className="max-w-3xl">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Kontrak baru</h2>
        <RenewContractWizard contract={contract} />
      </Card>
    </section>
  );
}
