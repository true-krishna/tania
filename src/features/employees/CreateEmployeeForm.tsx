"use client";

import * as React from "react";
import { useMutation } from "@apollo/client";
import { ErrorState } from "@/components/DataState";
import { Input } from "@/components/Input";
import { InputControl } from "@/components/InputControl";
import { useToast } from "@/components/Toast";
import { CreateEmployeeDocument } from "@/generated/graphql";
import {
  EmployeeFormFields,
  type PersonalFieldPlaceholders,
} from "./EmployeeFormFields";
import {
  buildCreateEmployeeInput,
  createEmptyFormValues,
  type CreateFormValues,
} from "./employeeFormValues";
import {
  applyEmployeeSubmitError,
  type FormErrors,
  validateCreateForm,
} from "./employeeFormValidation";

type CreateEmployeeFormProps = {
  formId: string;
  onBusyChange: (busy: boolean) => void;
  onClose: () => void;
};

const CREATE_PLACEHOLDERS: PersonalFieldPlaceholders = {
  address: "Alamat domisili",
  email: "cth. ahmad.fauzi@tania.co.id",
  fullName: "cth. Ahmad Fauzi",
  institutionName: "cth. Universitas Telkom",
  latestEducation: "cth. S1",
  major: "cth. Teknik Informatika",
  phone: "cth. 081234567890",
};

export function CreateEmployeeForm({
  formId,
  onBusyChange,
  onClose,
}: CreateEmployeeFormProps) {
  const { pushToast } = useToast();
  const [createEmployee] = useMutation(CreateEmployeeDocument, {
    refetchQueries: ["Employees"],
  });

  const [values, setValues] = React.useState<CreateFormValues>(
    createEmptyFormValues
  );
  const [errors, setErrors] = React.useState<FormErrors<CreateFormValues>>({});
  const [formError, setFormError] = React.useState<string | null>(null);

  function setField<Key extends keyof CreateFormValues>(
    key: Key,
    value: CreateFormValues[Key]
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setFormError(null);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors = validateCreateForm(values);
    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0) return;

    const gender = values.gender;
    if (!gender) return;

    onBusyChange(true);
    try {
      await createEmployee({
        variables: { input: buildCreateEmployeeInput({ ...values, gender }) },
      });
      pushToast("success", `Karyawan ${values.fullName} berhasil dibuat.`);
      onClose();
    } catch (error) {
      applyEmployeeSubmitError({
        error,
        fallbackMessage: "Gagal membuat karyawan.",
        setErrors,
        setFormError,
        values,
      });
    } finally {
      onBusyChange(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" id={formId} onSubmit={onSubmit}>
      {formError ? <ErrorState message={formError} /> : null}
      <InputControl error={errors.nik} label="NIK">
        <Input
          inputMode="numeric"
          onChange={(event) => setField("nik", event.target.value)}
          placeholder="16 digit nomor KTP"
          type="text"
          value={values.nik}
        />
      </InputControl>
      <EmployeeFormFields
        errors={errors}
        onChange={(key, value) => setField(key, value)}
        placeholders={CREATE_PLACEHOLDERS}
        values={values}
      />
    </form>
  );
}
