import Link from "next/link";
import { Chip } from "@/components/Chip";
import { DescriptionItem } from "@/components/DescriptionItem";
import {
  BAND_POSITION_LABEL,
  CONTRACT_END_REASON_LABEL,
  CONTRACT_STATUS_LABEL,
  CONTRACT_STATUS_VARIANT,
  CONTRACT_TYPE_LABEL,
  WORK_LOCATION_LABEL,
} from "@/features/contracts/labels";
import { CONTRACT_DETAIL } from "@/lib/constants/routes";
import type { ProfileContract } from "./useProfile";

export function ContractRow({ contract, linked }: { contract: ProfileContract; linked: boolean }) {
  return (
    <div className="rounded-md border border-tp-line bg-tp-surface px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        {linked ? (
          <Link
            className="text-sm font-semibold text-tp-text hover:underline"
            href={CONTRACT_DETAIL(contract.id)}
          >
            {contract.contractNo}
          </Link>
        ) : (
          <span className="text-sm font-semibold text-tp-text">{contract.contractNo}</span>
        )}
        <Chip size="small" variant={CONTRACT_STATUS_VARIANT[contract.status]}>
          {CONTRACT_STATUS_LABEL[contract.status]}
        </Chip>
        {contract.endReason ? (
          <span className="text-xs text-tp-muted">
            {CONTRACT_END_REASON_LABEL[contract.endReason]}
          </span>
        ) : null}
      </div>
      <dl className="mt-2 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
        <DescriptionItem label="Jenis" value={CONTRACT_TYPE_LABEL[contract.contractType]} />
        <DescriptionItem label="Nomor Induk" value={contract.nomorInduk} />
        <DescriptionItem label="Unit" value={contract.unit.name} />
        <DescriptionItem label="Posisi / Job Role" value={contract.jobRole.name} />
        <DescriptionItem label="Job Title" value={contract.jobTitle ?? "—"} />
        <DescriptionItem label="Job Level" value={contract.jobLevel ?? "—"} />
        <DescriptionItem label="Band Position" value={BAND_POSITION_LABEL[contract.bandPosition]} />
        <DescriptionItem label="Work Location" value={WORK_LOCATION_LABEL[contract.workLocation]} />
        <DescriptionItem label="Email Kantor" value={contract.officeEmail ?? "—"} />
        <DescriptionItem
          label="Periode"
          value={`${contract.startDate} — ${contract.endDate ?? "tidak berbatas"}`}
        />
        <DescriptionItem label="Berakhir" value={contract.terminatedAt ?? "—"} />
        <DescriptionItem label="Catatan" value={contract.notes ?? "—"} />
      </dl>
    </div>
  );
}
