import { cn } from "@/lib/cn";
import type { EvaluationFillState } from "@/generated/graphql/types";

export function PeriodStateBadge({ state }: { state: "SCHEDULED" | "RUNNING" | "CLOSED" }) {
  const label = { SCHEDULED: "Terjadwal", RUNNING: "Berjalan", CLOSED: "Berakhir" }[state];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold",
        state === "RUNNING" && "bg-green-100 text-green-700",
        state === "SCHEDULED" && "bg-amber-100 text-amber-700",
        state === "CLOSED" && "bg-zinc-100 text-zinc-600",
      )}
    >
      {label}
    </span>
  );
}

export function FillStateBadge({ fillState }: { fillState: EvaluationFillState }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold",
        fillState === "EVALUATED"
          ? "bg-green-100 text-green-700"
          : "bg-amber-100 text-amber-700",
      )}
    >
      {fillState === "EVALUATED" ? "Dinilai" : "Belum dinilai"}
    </span>
  );
}
