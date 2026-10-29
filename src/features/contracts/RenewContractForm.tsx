"use client";

import * as React from "react";
import { ApolloError, useMutation } from "@apollo/client";
import { ErrorState } from "@/components/DataState";
import { useToast } from "@/components/Toast";
import type { useJobRoles, useUnits } from "@/features/master-data/useMasterData";
import {
  EmploymentContractsDocument,
  RenewEmploymentContractDocument,
  type BandPosition,
  type RenewContractInput,
  type WorkLocation,
} from "@/generated/graphql";
import { mapSubmitError } from "@/lib/errors";
import { RenewContractAttributeFields } from "./RenewContractAttributeFields";
import { RenewContractPeriodFields } from "./RenewContractPeriodFields";
import {
  createRenewContractValues,
  validateRenewAttributes,
  validateRenewPeriod,
  type RenewContractFormErrors,
  type RenewContractFormValues,
  type SourceContract,
} from "./renewContractValues";

type RenewContractFormProps = {
  contract: SourceContract;
  formId: string;
  jobRoles: ReturnType<typeof useJobRoles>;
  onBusyChange: (busy: boolean) => void;
  onStepChange: (step: 1 | 2) => void;
  onSuccess: () => void;
  step: 1 | 2;
  units: ReturnType<typeof useUnits>;
};

const CONFLICT_MESSAGE =
  "Nomor kontrak atau nomor induk sudah dipakai, atau periode bertumpang tindih. Periksa kembali isian tersebut.";

export function RenewContractForm({
  contract,
  formId,
  jobRoles,
  onBusyChange,
  onStepChange,
  onSuccess,
  step,
  units,
}: RenewContractFormProps) {
  const [renew] = useMutation(RenewEmploymentContractDocument, {
    refetchQueries: [{ query: EmploymentContractsDocument }],
  });
  const { pushToast } = useToast();
  const [values, setValues] = React.useState<RenewContractFormValues>(() =>
    createRenewContractValues(contract)
  );
  const [errors, setErrors] = React.useState<RenewContractFormErrors>({});
  const [formError, setFormError] = React.useState<string | null>(null);

  function setField(key: keyof RenewContractFormValues, value: string) {
    setValues((current) => {
      switch (key) {
        case "bandPosition":
          return { ...current, bandPosition: value as BandPosition };
        case "workLocation":
          return { ...current, workLocation: value as WorkLocation | "" };
        default:
          return { ...current, [key]: value };
      }
    });
    setErrors((current) => ({ ...current, [key]: undefined }));
    setFormError(null);
  }

  function changeContractType(
    contractType: RenewContractFormValues["contractType"]
  ) {
    setValues((current) => ({ ...current, contractType, endDate: "" }));
    setErrors((current) => ({ ...current, endDate: undefined }));
  }

  function goToAttributes(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors = validateRenewPeriod(values, contract);
    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0) return;
    onStepChange(2);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors = validateRenewAttributes(values);
    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0) return;

    const workLocation = values.workLocation;
    if (!workLocation) return;

    const input: RenewContractInput = {
      bandPosition: values.bandPosition,
      contractNo: values.contractNo.trim(),
      contractType: values.contractType,
      jobRoleId: values.jobRoleId,
      nomorInduk: values.nomorInduk.trim(),
      predecessorContractId: contract.id,
      startDate: values.startDate,
      unitId: values.unitId,
      workLocation,
    };
    if (values.endDate) input.endDate = values.endDate;
    const optional = {
      jobLevel: values.jobLevel.trim(),
      jobTitle: values.jobTitle.trim(),
      notes: values.notes.trim(),
      officeEmail: values.officeEmail.trim(),
    };
    if (optional.officeEmail) input.officeEmail = optional.officeEmail;
    if (optional.jobTitle) input.jobTitle = optional.jobTitle;
    if (optional.jobLevel) input.jobLevel = optional.jobLevel;
    if (optional.notes) input.notes = optional.notes;

    onBusyChange(true);
    try {
      const result = await renew({ variables: { input } });
      const created = result.data?.renewEmploymentContract;
      pushToast(
        "success",
        `Kontrak perpanjangan ${
          created?.contractNo ?? values.contractNo
        } berhasil dibuat.`
      );
      onSuccess();
    } catch (error) {
      const submitError = mapSubmitError(
        error instanceof ApolloError ? error : null,
        CONFLICT_MESSAGE,
        "Gagal membuat perpanjangan kontrak."
      );
      if (submitError.field && submitError.field in values) {
        setErrors((previous) => ({
          ...previous,
          [submitError.field as keyof RenewContractFormValues]:
            submitError.message,
        }));
      } else {
        setFormError(submitError.message);
      }
    } finally {
      onBusyChange(false);
    }
  }

  return (
    <form
      className="flex flex-col gap-4"
      id={formId}
      onSubmit={step === 1 ? goToAttributes : onSubmit}
    >
      {formError ? <ErrorState message={formError} /> : null}
      <p className="text-xs font-medium text-zinc-500">
        Langkah {step} dari 2 —{" "}
        {step === 1 ? "Periode kontrak baru" : "Atribut & penempatan"}
      </p>

      {step === 1 ? (
        <RenewContractPeriodFields
          contract={contract}
          errors={errors}
          onChange={setField}
          onContractTypeChange={changeContractType}
          values={values}
        />
      ) : (
        <RenewContractAttributeFields
          errors={errors}
          jobRoles={jobRoles}
          onChange={setField}
          units={units}
          values={values}
        />
      )}
    </form>
  );
}
