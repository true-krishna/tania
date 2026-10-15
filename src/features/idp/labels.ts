import type { ChipVariant } from "@/components/Chip";
import type { IdpStatus } from "@/generated/graphql/types";

export const IDP_STATUS_LABEL: Record<IdpStatus, string> = {
  IN_PROGRESS: "Berjalan",
  NEEDS_REVIEW: "Perlu review",
  COMPLETED: "Selesai",
};

export const IDP_STATUS_VARIANT: Record<IdpStatus, ChipVariant> = {
  IN_PROGRESS: "info",
  NEEDS_REVIEW: "warning",
  COMPLETED: "success",
};
