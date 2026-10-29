"use client";

import Link from "next/link";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { ErrorState, LoadingState } from "@/components/DataState";
import { EmployeeEntraProvisionCard } from "@/features/entra/EmployeeEntraProvisionCard";
import { EmployeeCvContent } from "@/features/cv/EmployeeCvContent";
import { RecordChangeHistory } from "@/features/audit/RecordChangeHistory";
import { EMPLOYEE_STATUS_LABEL, GENDER_LABEL } from "@/features/employees/labels";
import type { EmployeeQuery } from "@/generated/graphql";
import type { QueryStatus } from "@/lib/apollo/toQueryState";
import { CONTRACT_NEW } from "@/lib/constants/routes";
import { ContractHistoryCard } from "./ContractHistoryCard";
import { EmployeeDeactivateCard } from "./EmployeeDeactivateCard";

type EmployeeDetail = NonNullable<EmployeeQuery["employee"]>;

export function EmployeeDetailContent({
  id,
  tab,
  status,
  data,
  error,
  manage,
  showEntra,
  showHistory,
  linkContracts,
  deactivating,
  onDeactivate,
}: {
  id: string;
  tab: "overview" | "cv";
  status: QueryStatus;
  data: EmployeeDetail | undefined;
  error: string | null;
  manage: boolean;
  showEntra: boolean;
  showHistory: boolean;
  linkContracts: boolean;
  deactivating: boolean;
  onDeactivate: () => void;
}) {
  if (tab === "cv") return <EmployeeCvContent employeeId={id} />;
  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={error ?? "Gagal memuat data."} />;
  if (!data) return <ErrorState message="Karyawan tidak ditemukan." />;

  return (
    <>
      <Card className="max-w-3xl">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Data diri</h2>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">NIK</dt>
            <dd className="font-mono text-zinc-900">{data.nikMasked}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Email</dt>
            <dd className="text-zinc-900">{data.email}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Tanggal Lahir</dt>
            <dd className="text-zinc-900">{data.birthDate ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Jenis Kelamin</dt>
            <dd className="text-zinc-900">{data.gender ? GENDER_LABEL[data.gender] : "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Telepon</dt>
            <dd className="text-zinc-900">{data.phone ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Alamat</dt>
            <dd className="text-zinc-900">{data.address ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Pendidikan Terakhir</dt>
            <dd className="text-zinc-900">{data.latestEducation ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Institusi</dt>
            <dd className="text-zinc-900">{data.institutionName ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Jurusan</dt>
            <dd className="text-zinc-900">{data.major ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Tanggal Bergabung</dt>
            <dd className="text-zinc-900">{data.joinedAt}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Status</dt>
            <dd className="text-zinc-900">{EMPLOYEE_STATUS_LABEL[data.status]}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Assignable</dt>
            <dd className="text-zinc-900">
              {data.assignable && data.status !== "INACTIVE" ? "Ya" : "Tidak"}
            </dd>
          </div>
        </dl>
      </Card>

      {showEntra ? <EmployeeEntraProvisionCard employeeId={id} /> : null}

      <Card className="max-w-3xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">
            Riwayat kontrak ({data.contracts.totalCount})
          </h2>
          {manage ? (
            <Link className="no-underline" href={`${CONTRACT_NEW}?employeeId=${id}`}>
              <Button variant="secondary">+ Tambah kontrak</Button>
            </Link>
          ) : null}
        </div>
        {data.contracts.edges.length === 0 ? (
          <p className="text-sm text-zinc-500">Belum ada kontrak tercatat.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {data.contracts.edges.map((edge) => (
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

      <EmployeeDeactivateCard
        deactivating={deactivating}
        fullName={data.fullName}
        inactive={data.status === "INACTIVE"}
        manage={manage}
        onDeactivate={onDeactivate}
      />
    </>
  );
}
