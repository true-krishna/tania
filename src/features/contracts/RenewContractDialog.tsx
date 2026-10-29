"use client";

import * as React from "react";
import { Button } from "@/components/Button";
import { ErrorState, LoadingState } from "@/components/DataState";
import type { useJobRoles, useUnits } from "@/features/master-data/useMasterData";
import { RenewContractForm } from "./RenewContractForm";
import { RenewContractModalFrame } from "./RenewContractModalFrame";
import type { SourceContract } from "./renewContractValues";

type RenewContractDialogProps = {
  contract: SourceContract | null;
  contractLoading: boolean;
  jobRoles: ReturnType<typeof useJobRoles>;
  onClose: () => void;
  open: boolean;
  units: ReturnType<typeof useUnits>;
};

export function RenewContractDialog({
  contract,
  contractLoading,
  jobRoles,
  onClose,
  open,
  units,
}: RenewContractDialogProps) {
  const [step, setStep] = React.useState<1 | 2>(1);
  const [submitting, setSubmitting] = React.useState(false);
  const formId = React.useId();

  if (contractLoading || !contract) {
    return (
      <RenewContractModalFrame onClose={onClose} open={open}>
        <LoadingState />
      </RenewContractModalFrame>
    );
  }

  if (units.status === "loading" || jobRoles.status === "loading") {
    return (
      <RenewContractModalFrame onClose={onClose} open={open}>
        <LoadingState />
      </RenewContractModalFrame>
    );
  }

  if (units.status === "error") {
    return (
      <RenewContractModalFrame onClose={onClose} open={open}>
        <ErrorState message={units.error ?? "Gagal memuat unit."} />
      </RenewContractModalFrame>
    );
  }

  if (jobRoles.status === "error") {
    return (
      <RenewContractModalFrame onClose={onClose} open={open}>
        <ErrorState message={jobRoles.error ?? "Gagal memuat job role."} />
      </RenewContractModalFrame>
    );
  }

  const actions =
    step === 1 ? (
      <Button form={formId} type="submit">
        Lanjut
      </Button>
    ) : (
      <>
        <Button onClick={() => setStep(1)} type="button" variant="secondary">
          Kembali
        </Button>
        <Button disabled={submitting} form={formId} type="submit">
          {submitting ? "Menyimpan…" : "Simpan perpanjangan"}
        </Button>
      </>
    );

  return (
    <RenewContractModalFrame actions={actions} onClose={onClose} open={open}>
      <RenewContractForm
        contract={contract}
        formId={formId}
        jobRoles={jobRoles}
        onBusyChange={setSubmitting}
        onStepChange={setStep}
        onSuccess={onClose}
        step={step}
        units={units}
      />
    </RenewContractModalFrame>
  );
}
