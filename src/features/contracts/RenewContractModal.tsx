"use client";

import { useQuery } from "@apollo/client";
import { useJobRoles, useUnits } from "@/features/master-data/useMasterData";
import { EmploymentContractDocument } from "@/generated/graphql";
import { RenewContractDialog } from "./RenewContractDialog";

export function RenewContractModal({
  contractId,
  onClose,
  open,
}: {
  contractId: string | null;
  onClose: () => void;
  open: boolean;
}) {
  const units = useUnits();
  const jobRoles = useJobRoles();
  const { data: contractData, loading: contractLoading } = useQuery(
    EmploymentContractDocument,
    {
      skip: !open || !contractId,
      variables: { id: contractId ?? "" },
    }
  );

  return (
    <RenewContractDialog
      contract={contractData?.employmentContract ?? null}
      contractLoading={contractLoading}
      jobRoles={jobRoles}
      key={`${contractId ?? "none"}-${open ? "open" : "closed"}`}
      onClose={onClose}
      open={open}
      units={units}
    />
  );
}
