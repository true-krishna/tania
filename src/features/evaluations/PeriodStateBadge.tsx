import { Chip, type ChipVariant } from "@/components/Chip";

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
    <Chip size="small" variant={variant}>
      {label}
    </Chip>
  );
}
