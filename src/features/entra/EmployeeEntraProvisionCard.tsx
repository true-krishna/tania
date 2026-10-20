"use client";

import { useQuery } from "@apollo/client";
import { Card } from "@/components/Card";
import { ErrorState, LoadingState } from "@/components/DataState";
import { EmployeeEntraProvisionDocument } from "@/generated/graphql";
import {
  ENTRA_PROVISION_STATUS_LABEL,
  ENTRA_PROVISION_STATUS_TONE,
} from "@/features/entra/labels";
import { orDash } from "@/lib/cell";

// Hasil provisi akun Entra pada detail karyawan (FR-44/FR-45, TAN-272 U1):
// daftar FR-44 hanya memuat talent tanpa akun Entra, jadi hasil yang berhasil
// hilang dari daftar — di sini nilai tercatatnya tetap terlihat. Field
// `entraProvision` dijaga `permEntraRead` di backend, jadi query ini hanya
// dijalankan untuk peran yang berhak; halaman detail untuk peran lain tidak
// menyertakannya sama sekali.
export function EmployeeEntraProvisionCard({ employeeId }: { employeeId: string }) {
  const { loading, error, data } = useQuery(EmployeeEntraProvisionDocument, {
    variables: { id: employeeId },
  });

  const provision = data?.employee?.entraProvision;

  return (
    <Card className="max-w-3xl">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900">Provisi akun Entra</h2>
      {loading ? (
        <LoadingState label="Memuat hasil provisi…" />
      ) : error ? (
        <ErrorState message="Gagal memuat hasil provisi akun Entra." />
      ) : !provision ? (
        <p className="text-sm text-zinc-500">Belum pernah diprovisi.</p>
      ) : (
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Status</dt>
            <dd>
              <span
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${ENTRA_PROVISION_STATUS_TONE[provision.status]}`}
              >
                {ENTRA_PROVISION_STATUS_LABEL[provision.status]}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Aksi</dt>
            <dd className="text-zinc-900">{provision.action}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">UPN</dt>
            <dd className="font-mono text-zinc-900">{orDash(provision.upn)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">
              Pesan kegagalan terakhir
            </dt>
            <dd className="text-zinc-900">{orDash(provision.lastError)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Diperbarui</dt>
            <dd className="text-zinc-900">{formatTime(provision.updatedAt)}</dd>
          </div>
        </dl>
      )}
    </Card>
  );
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
