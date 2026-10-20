import { Chip, type ChipVariant } from "@/components/Chip";
import type { TtdComplianceLevel, WorkloadStatus } from "./types";

/**
 * Status tidak pernah hanya warna (design §9) — badge selalu memuat teks nilai
 * dari data. Pemetaan varian mengikuti makna WAD: Overload merah, Stretch biru
 * (primary WAD), Fit hijau, Underload jingga/warn, Undefined* netral.
 */
const STATUS_VARIANT: Record<WorkloadStatus, ChipVariant> = {
  Overload: "danger",
  Stretch: "info",
  Fit: "success",
  Underload: "warning",
  "Undefined Time Spent": "neutral",
  "Undefined Activity": "neutral",
};

export function LoadStatusBadge({ status }: { status: WorkloadStatus }) {
  return <Chip variant={STATUS_VARIANT[status]}>{status}</Chip>;
}

const TTD_VARIANT: Record<TtdComplianceLevel, ChipVariant> = {
  "Need Improvement": "danger",
  Fair: "warning",
  Good: "info",
  "Very Good": "success",
};

export function TtdLevelBadge({ level }: { level: TtdComplianceLevel }) {
  return <Chip variant={TTD_VARIANT[level]}>{level}</Chip>;
}
