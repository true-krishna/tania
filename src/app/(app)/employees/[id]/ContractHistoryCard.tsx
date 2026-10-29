import Link from "next/link";
import { Chip } from "@/components/Chip";
import type { EmployeeQuery } from "@/generated/graphql";
import {
  BAND_POSITION_LABEL,
  CONTRACT_END_REASON_LABEL,
  CONTRACT_STATUS_LABEL,
  CONTRACT_STATUS_VARIANT,
  CONTRACT_TYPE_LABEL,
  WORK_LOCATION_LABEL,
} from "@/features/contracts/labels";
import { CONTRACT_DETAIL } from "@/lib/constants/routes";

export type ContractRow = NonNullable<
  EmployeeQuery["employee"]
>["contracts"]["edges"][number]["node"];

export function ContractHistoryCard({
  contract,
  linked,
}: {
  contract: ContractRow;
  linked: boolean;
}) {
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
