import { Chip, type ChipVariant } from "@/components/Chip";
import type { LoadClassification } from "./types";

const MAP: Record<LoadClassification, { label: string; variant: ChipVariant }> = {
  OPTIMAL: { label: "Optimal", variant: "success" },
  OVERLOAD: { label: "Kelebihan beban", variant: "danger" },
  UNDERLOAD: { label: "Beban kurang", variant: "info" },
  UNDEFINED_ACTIVITY: { label: "Data tidak lengkap", variant: "neutral" },
  UNDEFINED_TIME_SPENT: { label: "Data tidak lengkap", variant: "neutral" },
};

export function LoadClassificationBadge({
  classification,
}: {
  classification: LoadClassification;
}) {
  const { label, variant } = MAP[classification];
  return <Chip variant={variant}>{label}</Chip>;
}
