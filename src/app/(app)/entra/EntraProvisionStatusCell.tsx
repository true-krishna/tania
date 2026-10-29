import {
  ENTRA_NOTIFY_STATUS_LABEL,
  ENTRA_NOTIFY_STATUS_TONE,
  ENTRA_PROVISION_STATUS_LABEL,
  ENTRA_PROVISION_STATUS_TONE,
} from "@/features/entra/labels";
import { orDash } from "@/lib/cell";
import type { EntraProvision } from "./types";

export function EntraProvisionStatusCell({ outcome }: { outcome: EntraProvision | null }) {
  if (!outcome) return <span className="text-xs text-zinc-500">Belum dibuat</span>;

  return (
    <>
      {outcome.needsReprovision ? (
        <span className="mb-1 inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
          Perlu provisi ulang
        </span>
      ) : null}
      <span
        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${ENTRA_PROVISION_STATUS_TONE[outcome.status]}`}
      >
        {ENTRA_PROVISION_STATUS_LABEL[outcome.status]}
      </span>
      {outcome.notifyStatus ? (
        <span
          className={`mt-1 inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${ENTRA_NOTIFY_STATUS_TONE[outcome.notifyStatus]}`}
        >
          {ENTRA_NOTIFY_STATUS_LABEL[outcome.notifyStatus]}
        </span>
      ) : null}
      <span className="mt-1 block text-xs text-zinc-500">{orDash(provisionDetail(outcome))}</span>
    </>
  );
}

function provisionDetail(outcome: EntraProvision): string {
  if (outcome.status === "FAILED") return outcome.lastError ?? "";
  if (outcome.notifyStatus === "FAILED" && outcome.notifyError) return outcome.notifyError;
  return outcome.upn ?? outcome.action;
}
