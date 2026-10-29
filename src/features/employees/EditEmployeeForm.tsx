"use client";

import * as React from "react";
import { useMutation } from "@apollo/client";
import { ErrorState } from "@/components/DataState";
import { Input } from "@/components/Input";
import { InputControl } from "@/components/InputControl";
import { Select } from "@/components/Select";
import { useToast } from "@/components/Toast";
import { UpdateEmployeeDocument, type EmployeeStatus } from "@/generated/graphql";
import { EMPLOYEE_STATUS_LABEL } from "@/features/employees/labels";
import { EmployeeFormFields } from "./EmployeeFormFields";
import {
  buildUpdateEmployeeInput,
  createEditFormValues,
  type EditFormValues,
  type EmployeeData,
} from "./employeeFormValues";
import {
  applyEmployeeSubmitError,
  type FormErrors,
  validateEditForm,
} from "./employeeFormValidation";

type EditEmployeeFormProps = {
  employee: EmployeeData;
  employeeId: string;
  formId: string;
  onBusyChange: (busy: boolean) => void;
  onClose: () => void;
};

export function EditEmployeeForm({
  employee,
  employeeId,
  formId,
  onBusyChange,
  onClose,
}: EditEmployeeFormProps) {
  const { pushToast } = useToast();
  const [updateEmployee] = useMutation(UpdateEmployeeDocument, {
    refetchQueries: ["Employees"],
  });

  const [values, setValues] = React.useState<EditFormValues>(() => createEditFormValues(employee));
  const [errors, setErrors] = React.useState<FormErrors<EditFormValues>>({});
  const [formError, setFormError] = React.useState<string | null>(null);

  function setField<Key extends keyof EditFormValues>(key: Key, value: EditFormValues[Key]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setFormError(null);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors = validateEditForm(values);
    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0) return;

    const gender = values.gender;
    if (!gender) return;

    onBusyChange(true);
    try {
      await updateEmployee({
        variables: {
          id: employeeId,
          input: buildUpdateEmployeeInput({ ...values, gender }),
        },
      });
      pushToast("success", `Perubahan data ${values.fullName} berhasil disimpan.`);
      onClose();
    } catch (error) {
      applyEmployeeSubmitError({
        error,
        fallbackMessage: "Gagal menyimpan perubahan.",
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
      <div className="flex flex-col gap-1 text-sm font-medium text-zinc-800">
        <span>NIK saat ini</span>
        <span className="font-mono text-sm font-normal text-zinc-700">{employee.nikMasked}</span>
      </div>
      <InputControl
        error={errors.nikBaru}
        helper="(opsional — kosongkan bila tidak berubah)"
        label="NIK baru"
      >
        <Input
          inputMode="numeric"
          onChange={(event) => setField("nikBaru", event.target.value)}
          placeholder="16 digit nomor KTP"
          type="text"
          value={values.nikBaru}
        />
      </InputControl>
      <EmployeeFormFields
        errors={errors}
        onChange={(key, value) => setField(key, value)}
        values={values}
      />
      <InputControl label="Status kepegawaian">
        <Select
          onChange={(event) => setField("status", event.target.value as EmployeeStatus)}
          options={(
            Object.keys(EMPLOYEE_STATUS_LABEL) as Array<keyof typeof EMPLOYEE_STATUS_LABEL>
          ).map((value) => ({ label: EMPLOYEE_STATUS_LABEL[value], value }))}
          value={values.status}
        />
      </InputControl>
    </form>
  );
}
