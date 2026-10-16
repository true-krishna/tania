import { Chip } from "@/components/Chip";
import type { AssignmentStatus } from "@/generated/graphql/types";

/**
 * O4 — label status assignment seragam di seluruh permukaan assignment
 * (daftar, detail, profil, Profil CV): "Berjalan" untuk ACTIVE, "Selesai"
 * untuk COMPLETED. Nilai server tidak berubah.
 */
export function AssignmentStatusBadge({ status }: { status: AssignmentStatus }) {
  const active = status === "ACTIVE";
  return (
    <Chip variant={active ? "success" : "neutral"} size="small" dot>
      {active ? "Berjalan" : "Selesai"}
    </Chip>
  );
}
