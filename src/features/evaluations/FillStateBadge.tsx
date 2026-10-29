import { Chip } from "@/components/Chip";
import type { EvaluationFillState } from "@/generated/graphql/types";

export function FillStateBadge({ fillState }: { fillState: EvaluationFillState }) {
  const evaluated = fillState === "EVALUATED";
  return (
    <Chip size="small" variant={evaluated ? "success" : "warning"}>
      {evaluated ? "Dinilai" : "Belum dinilai"}
    </Chip>
  );
}
