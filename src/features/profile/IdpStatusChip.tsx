import { Chip } from "@/components/Chip";
import { IDP_STATUS_LABEL, IDP_STATUS_VARIANT } from "@/features/idp/labels";
import type { IdpStatus } from "@/generated/graphql/types";

export function IdpStatusChip({ status }: { status: IdpStatus }) {
  return (
    <Chip size="small" variant={IDP_STATUS_VARIANT[status]}>
      {IDP_STATUS_LABEL[status]}
    </Chip>
  );
}
