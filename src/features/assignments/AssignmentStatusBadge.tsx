import { Chip } from "@/components/Chip";
import type { AssignmentStatus } from "@/generated/graphql/types";

export function AssignmentStatusBadge({ status }: { status: AssignmentStatus }) {
  const active = status === "ACTIVE";
  return (
    <Chip dot size="small" variant={active ? "success" : "neutral"}>
      {active ? "Berjalan" : "Selesai"}
    </Chip>
  );
}
