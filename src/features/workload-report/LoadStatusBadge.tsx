import { Chip, type ChipVariant } from "@/components/Chip";
import type { WorkloadStatus } from "./types";

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
