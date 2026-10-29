"use client";

import * as React from "react";
import { useMutation, ApolloError } from "@apollo/client";
import { ErrorState } from "@/components/DataState";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { InputControl } from "@/components/InputControl";
import {
  EmploymentContractDocument,
  UpdateEmploymentContractDocument,
  type BandPosition,
  type EmploymentContractQuery,
  type UpdateEmploymentContractInput,
  type WorkLocation,
} from "@/generated/graphql";
import { mapSubmitError } from "@/lib/errors";

type FormValues = {
  contractNo: string;
  officeEmail: string;
  bandPosition: BandPosition;
  jobTitle: string;
  jobLevel: string;
  workLocation: WorkLocation;
  notes: string;
};

const CONFLICT_MESSAGE = "Nomor kontrak sudah dipakai. Periksa kembali isian tersebut.";

export function ContractEditForm({
  id,
  contract,
}: {
  id: string;
  contract: NonNullable<EmploymentContractQuery["employmentContract"]>;
}) {
  const [updateContract, { loading: saving, data: saved }] = useMutation(
    UpdateEmploymentContractDocument,
    {
      refetchQueries: [{ query: EmploymentContractDocument, variables: { id } }],
    },
  );
  const [values, setValues] = React.useState<FormValues>(() => ({
    contractNo: contract.contractNo ?? "",
    officeEmail: contract.officeEmail ?? "",
    bandPosition: contract.bandPosition,
    jobTitle: contract.jobTitle ?? "",
    jobLevel: contract.jobLevel ?? "",
    workLocation: contract.workLocation,
    notes: contract.notes ?? "",
  }));
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormValues, string>>>({});
  const [formError, setFormError] = React.useState<string | null>(null);

  function set<K extends keyof FormValues>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
    setFormError(null);
  }

  function validate(toCheck: FormValues): Partial<Record<keyof FormValues, string>> {
    const next: Partial<Record<keyof FormValues, string>> = {};
    if (!toCheck.contractNo.trim()) next.contractNo = "Nomor kontrak wajib diisi.";
    return next;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0) return;
    const input: UpdateEmploymentContractInput = {
      contractNo: values.contractNo.trim(),
      bandPosition: values.bandPosition,
      workLocation: values.workLocation,
    };
    const optional = {
      officeEmail: values.officeEmail.trim(),
      jobTitle: values.jobTitle.trim(),
      jobLevel: values.jobLevel.trim(),
      notes: values.notes.trim(),
    };
    if (optional.officeEmail) input.officeEmail = optional.officeEmail;
    if (optional.jobTitle) input.jobTitle = optional.jobTitle;
    if (optional.jobLevel) input.jobLevel = optional.jobLevel;
    if (optional.notes) input.notes = optional.notes;
    try {
      await updateContract({ variables: { id, input } });
    } catch (err) {
      const submitError = mapSubmitError(
        err instanceof ApolloError ? err : null,
        CONFLICT_MESSAGE,
        "Gagal menyimpan perubahan.",
      );
      if (submitError.field && submitError.field in values) {
        setErrors((prev) => ({
          ...prev,
          [submitError.field as keyof FormValues]: submitError.message,
        }));
      } else {
        setFormError(submitError.message);
      }
    }
  }

  return (
    <form className="flex max-w-xl flex-col gap-4" onSubmit={onSubmit}>
      {formError ? <ErrorState message={formError} /> : null}
      {saved?.updateEmploymentContract ? (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Perubahan kontrak berhasil disimpan.
        </div>
      ) : null}
      <InputControl error={errors.contractNo} label="No. Kontrak">
        <Input
          onChange={(e) => set("contractNo", e.target.value)}
          type="text"
          value={values.contractNo}
        />
      </InputControl>
      <InputControl error={errors.officeEmail} helper="(opsional)" label="Email kantor">
        <Input
          onChange={(e) => set("officeEmail", e.target.value)}
          type="email"
          value={values.officeEmail}
        />
      </InputControl>
      <InputControl error={errors.jobTitle} helper="(opsional)" label="Job title">
        <Input
          onChange={(e) => set("jobTitle", e.target.value)}
          type="text"
          value={values.jobTitle}
        />
      </InputControl>
      <InputControl error={errors.jobLevel} helper="(opsional)" label="Job level">
        <Input
          onChange={(e) => set("jobLevel", e.target.value)}
          type="text"
          value={values.jobLevel}
        />
      </InputControl>
      <InputControl error={errors.bandPosition} label="Band position">
        <Select
          onChange={(e) => set("bandPosition", e.target.value)}
          options={[
            { value: "UNDEFINED", label: "Belum ditetapkan" },
            { value: "I", label: "I" },
            { value: "II", label: "II" },
            { value: "III", label: "III" },
            { value: "IV", label: "IV" },
            { value: "V", label: "V" },
            { value: "VI", label: "VI" },
          ]}
          value={values.bandPosition}
        />
      </InputControl>
      <InputControl error={errors.workLocation} label="Work location">
        <Select
          onChange={(e) => set("workLocation", e.target.value)}
          options={[
            { value: "UNDEFINED", label: "Belum ditetapkan" },
            { value: "JAKARTA", label: "Jakarta" },
            { value: "BANDUNG", label: "Bandung" },
          ]}
          value={values.workLocation}
        />
      </InputControl>
      <InputControl error={errors.notes} helper="(opsional)" label="Catatan">
        <Input onChange={(e) => set("notes", e.target.value)} type="text" value={values.notes} />
      </InputControl>
      <div className="flex gap-2">
        <Button disabled={saving} type="submit">
          Simpan perubahan
        </Button>
      </div>
    </form>
  );
}
