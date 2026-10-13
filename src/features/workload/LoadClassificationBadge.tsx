import type { LoadClassification } from "./types";
import { Chip, type ChipTone } from "./Chip";

/**
 * Status is never colour-only (design §9): every classification carries text.
 * Mapping follows the meaning-based table in the design spec §5.2.
 */
const MAP: Record<LoadClassification, { label: string; tone: ChipTone }> = {
  OPTIMAL: { label: "Optimal", tone: "mint" },
  OVERLOAD: { label: "Kelebihan beban", tone: "peach" },
  UNDERLOAD: { label: "Beban kurang", tone: "info" },
  UNDEFINED_ACTIVITY: { label: "Data tidak lengkap", tone: "neutral" },
  UNDEFINED_TIME_SPENT: { label: "Data tidak lengkap", tone: "neutral" },
};

export function LoadClassificationBadge({
  classification,
}: {
  classification: LoadClassification;
}) {
  const { label, tone } = MAP[classification];
  return <Chip tone={tone}>{label}</Chip>;
}

/** `Data lama` marker attached to figures served from a stale/unavailable source. */
export function DataLamaChip() {
  return <Chip tone="peach">Data lama</Chip>;
}

/** Read-only marker on the employee workload tab. */
export function HanyaBacaChip() {
  return <Chip tone="neutral">Hanya baca</Chip>;
}
