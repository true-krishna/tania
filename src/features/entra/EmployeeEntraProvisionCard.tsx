"use client";

import { useQuery } from "@apollo/client";
import { Card } from "@/components/Card";
import { ErrorState, LoadingState } from "@/components/DataState";
import { EmployeeEntraProvisionDocument } from "@/generated/graphql";
import {
  ENTRA_NOTIFY_STATUS_LABEL,
  ENTRA_NOTIFY_STATUS_TONE,
  ENTRA_PROVISION_STATUS_LABEL,
  ENTRA_PROVISION_STATUS_TONE,
} from "@/features/entra/labels";
import { orDash } from "@/lib/cell";

export function EmployeeEntraProvisionCard({ employeeId }: { employeeId: string }) {
  const { loading, error, data } = useQuery(EmployeeEntraProvisionDocument, {
    variables: { id: employeeId },
  });

  const provision = data?.employee?.entraProvision;

  if (loading) {
    return (
      <Card className="max-w-3xl">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Provisi akun Entra</h2>
        <LoadingState label="Memuat hasil provisi…" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="max-w-3xl">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Provisi akun Entra</h2>
        <ErrorState message="Gagal memuat hasil provisi akun Entra." />
      </Card>
    );
  }

  if (!provision) {
    return (
      <Card className="max-w-3xl">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Provisi akun Entra</h2>
        <p className="text-sm text-zinc-500">Belum pernah diprovisi.</p>
      </Card>
    );
  }

  return (
    <Card className="max-w-3xl">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900">Provisi akun Entra</h2>
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
        {provision.notifyStatus ? (
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Email aktivasi</dt>
            <dd>
              <span
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${ENTRA_NOTIFY_STATUS_TONE[provision.notifyStatus]}`}
              >
                {ENTRA_NOTIFY_STATUS_LABEL[provision.notifyStatus]}
              </span>
              {provision.notifyStatus === "FAILED" && provision.notifyError ? (
                <span className="mt-1 block text-xs text-zinc-500">{provision.notifyError}</span>
              ) : null}
            </dd>
          </div>
        ) : null}
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
      {provision.needsReprovision ? (
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-zinc-600">
          Perlu provisi ulang — jenis akun tidak cocok dengan contract_type kontrak aktif. Jalankan
          provisi ulang dari halaman Provisi Akun Entra.
        </p>
      ) : null}
      {provision.status === "CREATED" ? (
        <p className="mt-3 rounded-md border border-tp-tint-info bg-tp-surface px-3 py-2 text-xs text-zinc-600">
          Akun dibuat dengan password sementara yang dikirim ke email pribadi karyawan; wajib ganti
          password pada login pertama. Bila email gagal terkirim, gunakan kirim ulang email
          aktivasi.
        </p>
      ) : null}
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
