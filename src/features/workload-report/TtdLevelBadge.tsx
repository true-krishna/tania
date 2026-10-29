import { Chip, type ChipVariant } from "@/components/Chip";
import type { TtdComplianceLevel } from "./types";

const TTD_VARIANT: Record<TtdComplianceLevel, ChipVariant> = {
  "Need Improvement": "danger",
  Fair: "warning",
  Good: "info",
  "Very Good": "success",
};

export function TtdLevelBadge({ level }: { level: TtdComplianceLevel }) {
  return <Chip variant={TTD_VARIANT[level]}>{level}</Chip>;
}
