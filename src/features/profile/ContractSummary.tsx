import { Chip } from "@/components/Chip";
import {
  BAND_POSITION_LABEL,
  CONTRACT_STATUS_LABEL,
  CONTRACT_STATUS_VARIANT,
  CONTRACT_TYPE_LABEL,
} from "@/features/contracts/labels";
import type { ProfileContract } from "./useProfile";

export function ContractSummary({ contract }: { contract: ProfileContract }) {
  const period = contract.endDate
    ? `${contract.startDate} s.d. ${contract.endDate}`
    : `sejak ${contract.startDate} (tanpa akhir)`;

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <p className="min-w-0 break-words text-sm font-semibold text-tp-text">
          {`${contract.contractNo} · ${CONTRACT_TYPE_LABEL[contract.contractType]}`}
        </p>
        <Chip size="small" variant={CONTRACT_STATUS_VARIANT[contract.status]}>
          {CONTRACT_STATUS_LABEL[contract.status]}
        </Chip>
      </div>
      <p className="text-[13px] text-tp-muted">
        {`${period} · ${contract.jobTitle ?? contract.jobRole.name} (${BAND_POSITION_LABEL[contract.bandPosition]})`}
      </p>
    </div>
  );
}
