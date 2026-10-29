"use client";

import { Button } from "@/components/Button";
import { ErrorState } from "@/components/DataState";
import { Input } from "@/components/Input";
import { InputControl } from "@/components/InputControl";
import {
  EmployeeDocument,
  EmploymentContractDocument,
  RetireEmployeeDocument,
} from "@/generated/graphql";
import { ContractCycleSection } from "./ContractCycleSection";
import { ContractCycleSuccess } from "./ContractCycleSuccess";
import { DEPENDENCY_WARNING, type Contract } from "./contractCycle";
import { useAcknowledgeAction } from "./useAcknowledgeAction";

export function RetireAction({ contract }: { contract: Contract }) {
  const action = useAcknowledgeAction({
    conflictMessage: "Tidak dapat mencatat pensiun.",
    fallbackMessage: "Gagal mencatat pensiun.",
    mutationDocument: RetireEmployeeDocument,
    refetchQueries: [
      { query: EmploymentContractDocument, variables: { id: contract.id } },
      {
        query: EmployeeDocument,
        variables: { id: contract.employee.id },
      },
    ],
  });

  function run(acknowledgeActiveWork: boolean) {
    return action.submit(acknowledgeActiveWork, (effectiveDate) => ({
      id: contract.employee.id,
      effectiveDate,
      acknowledgeActiveWork,
    }));
  }

  if (action.done) {
    return (
      <ContractCycleSection
        success={
          <ContractCycleSuccess>
            Pensiun tercatat. Kontrak aktif diakhiri dan status karyawan menjadi pensiun.
          </ContractCycleSuccess>
        }
        title="Pensiun"
      />
    );
  }

  return (
    <ContractCycleSection title="Pensiun">
      {action.formError ? <ErrorState message={action.formError} /> : null}
      {action.needsAck ? (
        <div className="flex flex-col gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p>{DEPENDENCY_WARNING}</p>
          <div className="flex gap-2">
            <Button
              disabled={action.loading}
              onClick={() => run(true)}
              type="button"
              variant="primary"
            >
              Ya, lanjutkan pensiun
            </Button>
            <Button onClick={() => action.setNeedsAck(false)} type="button" variant="secondary">
              Batal
            </Button>
          </div>
        </div>
      ) : (
        <>
          <InputControl error={action.dateError ?? undefined} label="Tanggal efektif">
            <Input
              onChange={(event) => action.updateEffectiveDate(event.target.value)}
              type="date"
              value={action.effectiveDate}
            />
          </InputControl>
          <div>
            <Button
              disabled={action.loading}
              onClick={() => run(false)}
              type="button"
              variant="secondary"
            >
              Catat pensiun
            </Button>
          </div>
        </>
      )}
    </ContractCycleSection>
  );
}
