import { Chip, type ChipVariant } from "@/components/Chip";
import type { EvaluationFillState } from "@/generated/graphql/types";

const PERIOD_STATE: Record<
  "SCHEDULED" | "RUNNING" | "CLOSED",
  { label: string; variant: ChipVariant }
> = {
  SCHEDULED: { label: "Terjadwal", variant: "warning" },
  RUNNING: { label: "Berjalan", variant: "info" },
  CLOSED: { label: "Berakhir", variant: "neutral" },
};

export function PeriodStateBadge({ state }: { state: "SCHEDULED" | "RUNNING" | "CLOSED" }) {
  const { label, variant } = PERIOD_STATE[state];
  return (
    <Chip variant={variant} size="small">
      {label}
    </Chip>
  );
}

export function FillStateBadge({ fillState }: { fillState: EvaluationFillState }) {
  const evaluated = fillState === "EVALUATED";
  return (
    <Chip variant={evaluated ? "success" : "warning"} size="small">
      {evaluated ? "Dinilai" : "Belum dinilai"}
    </Chip>
  );
}
