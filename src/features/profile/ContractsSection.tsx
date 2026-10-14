import Link from "next/link";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/DataState";
import {
  BAND_POSITION_LABEL,
  CONTRACT_END_REASON_LABEL,
  CONTRACT_STATUS_LABEL,
  CONTRACT_TYPE_LABEL,
  WORK_LOCATION_LABEL,
} from "@/features/contracts/labels";
import { canAccess } from "@/lib/auth/matrix";
import { useSessionRole } from "@/lib/auth/guard";
import type { ProfileContract } from "./useProfile";

/**
 * Contract-history section of `/profile` (TAN-188) — the user's own contracts,
 * read-only. Links into the contract module only for roles that can open it;
 * final authorization stays server-side.
 */
export function ContractsSection({
  contracts,
}: {
  contracts: readonly ProfileContract[];
}) {
  const linked = canAccess(useSessionRole(), "contracts");

  if (contracts.length === 0) {
    return <EmptyState message="Belum ada kontrak tercatat." />;
  }

  return (
    <Card className="max-w-3xl">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900">
        Riwayat kontrak ({contracts.length})
      </h2>
      <div className="flex flex-col gap-3">
        {contracts.map((contract) => (
          <ContractRow key={contract.id} contract={contract} linked={linked} />
        ))}
      </div>
    </Card>
  );
}

function ContractRow({ contract, linked }: { contract: ProfileContract; linked: boolean }) {
  return (
    <div className="rounded-md border border-board-border bg-white px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        {linked ? (
          <Link
            href={`/contracts/${contract.id}`}
            className="text-sm font-semibold text-zinc-900 hover:underline"
          >
            {contract.contractNo}
          </Link>
        ) : (
          <span className="text-sm font-semibold text-zinc-900">{contract.contractNo}</span>
        )}
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
        <Field label="Jenis" value={CONTRACT_TYPE_LABEL[contract.contractType]} />
        <Field label="Nomor Induk" value={contract.nomorInduk} />
        <Field label="Unit" value={contract.unit.name} />
        <Field label="Posisi / Job Role" value={contract.jobRole.name} />
        <Field label="Job Title" value={contract.jobTitle ?? "—"} />
        <Field label="Job Level" value={contract.jobLevel ?? "—"} />
        <Field label="Band Position" value={BAND_POSITION_LABEL[contract.bandPosition]} />
        <Field label="Work Location" value={WORK_LOCATION_LABEL[contract.workLocation]} />
        <Field label="Email Kantor" value={contract.officeEmail ?? "—"} />
        <Field
          label="Periode"
          value={`${contract.startDate} — ${contract.endDate ?? "tidak berbatas"}`}
        />
        <Field label="Berakhir" value={contract.terminatedAt ?? "—"} />
        <Field label="Catatan" value={contract.notes ?? "—"} />
      </dl>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="text-zinc-900">{value}</dd>
    </div>
  );
}