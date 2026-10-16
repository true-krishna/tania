import { Chip, type ChipVariant } from "@/components/Chip";
import type { LoadClassification } from "./types";

/**
 * Status is never colour-only (design §9): every classification carries text.
 * Mapping follows the meaning-based table in the design spec §5.2.
 */
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

/** `Data lama` marker attached to figures served from a stale/unavailable source. */
export function DataLamaChip() {
  return <Chip variant="danger">Data lama</Chip>;
}

/** Read-only marker on the employee workload tab. */
export function HanyaBacaChip() {
  return <Chip variant="neutral">Hanya baca</Chip>;
}
