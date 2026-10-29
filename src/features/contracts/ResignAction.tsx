"use client";

import * as React from "react";
import { Button } from "@/components/Button";
import { ErrorState } from "@/components/DataState";
import { Input } from "@/components/Input";
import { InputControl } from "@/components/InputControl";
import {
  EmployeeDocument,
  EmploymentContractDocument,
  ResignEmployeeDocument,
} from "@/generated/graphql";
import {
  ContractCycleSection,
  ContractCycleSuccess,
} from "./ContractCycleSection";
import { DEPENDENCY_WARNING, type Contract } from "./contractCycle";
import { useAcknowledgeAction } from "./useAcknowledgeAction";

export function ResignAction({ contract }: { contract: Contract }) {
  const [reason, setReason] = React.useState("");
  const action = useAcknowledgeAction({
    conflictMessage: "Tidak dapat mencatat resign.",
    fallbackMessage: "Gagal mencatat resign.",
    mutationDocument: ResignEmployeeDocument,
    refetchQueries: [
      { query: EmploymentContractDocument, variables: { id: contract.id } },
      {
        query: EmployeeDocument,
        variables: { id: contract.employee.id },
      },
    ],
  });

  function run(acknowledgeActiveWork: boolean) {
    const trimmedReason = reason.trim();
    return action.submit(acknowledgeActiveWork, (effectiveDate) => ({
      id: contract.employee.id,
      effectiveDate,
      acknowledgeActiveWork,
      ...(trimmedReason ? { reason: trimmedReason } : {}),
    }));
  }

  if (action.done) {
    return (
      <ContractCycleSection
        success={
          <ContractCycleSuccess>
            Resign tercatat. Kontrak aktif diakhiri dan akun karyawan
            dinonaktifkan.
          </ContractCycleSuccess>
        }
        title="Resign"
      />
    );
  }

  return (
    <ContractCycleSection title="Resign">
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
              Ya, lanjutkan resign
            </Button>
            <Button
              onClick={() => action.setNeedsAck(false)}
              type="button"
              variant="secondary"
            >
              Batal
            </Button>
          </div>
        </div>
      ) : (
        <>
          <InputControl
            error={action.dateError ?? undefined}
            label="Tanggal efektif"
          >
            <Input
              onChange={(event) =>
                action.updateEffectiveDate(event.target.value)
              }
              type="date"
              value={action.effectiveDate}
            />
          </InputControl>
          <InputControl helper="(opsional)" label="Alasan">
            <Input
              onChange={(event) => setReason(event.target.value)}
              type="text"
              value={reason}
            />
          </InputControl>
          <div>
            <Button
              disabled={action.loading}
              onClick={() => run(false)}
              type="button"
              variant="secondary"
            >
              Catat resign
            </Button>
          </div>
        </>
      )}
    </ContractCycleSection>
  );
}
