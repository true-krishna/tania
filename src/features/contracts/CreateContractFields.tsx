"use client";

import type * as React from "react";
import { Input } from "@/components/Input";
import { InputControl } from "@/components/InputControl";
import { ErrorState } from "@/components/DataState";
import { Select } from "@/components/Select";
import type { ContractType } from "@/generated/graphql";
import {
  CONTRACT_TYPE_LABEL,
  CONTRACT_TYPE_ORDER,
  isOpenEndedContractType,
} from "@/features/contracts/labels";
import type { FormValues } from "./CreateContractModal";

type JobRoleOption = { id: string; name: string; chapter?: { name: string } | null };

export function CreateContractFields({
  values,
  errors,
  employees,
  units,
  jobRoles,
  formId,
  formError,
  onChange,
  onContractTypeChange,
  onSubmit,
}: {
  values: FormValues;
  errors: Partial<Record<keyof FormValues, string>>;
  formId: string;
  formError: string | null;
  employees: readonly { id: string; fullName: string; nomorInduk: string | null }[];
  units: readonly { id: string; name: string }[];
  jobRoles: readonly JobRoleOption[];
  onChange: (key: keyof FormValues, value: string) => void;
  onContractTypeChange: (next: ContractType) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const selectedJobRole = values.jobRoleId
    ? (jobRoles.find((jobRole) => jobRole.id === values.jobRoleId) ?? null)
    : null;

  return (
    <form className="flex flex-col gap-4" id={formId} onSubmit={onSubmit}>
      {formError ? <ErrorState message={formError} /> : null}
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Identitas kontrak
      </h3>
      <InputControl error={errors.employeeId} label="Karyawan">
        <Select
          onChange={(e) => onChange("employeeId", e.target.value)}
          options={[
            { value: "", label: "— pilih karyawan —" },
            ...employees.map((emp) => ({
              value: emp.id,
              label: `${emp.fullName} (${emp.nomorInduk ?? "—"})`,
            })),
          ]}
          value={values.employeeId}
        />
      </InputControl>
      <InputControl error={errors.contractNo} label="No. Kontrak">
        <Input
          onChange={(e) => onChange("contractNo", e.target.value)}
          placeholder="cth. PKWT/2026/001"
          type="text"
          value={values.contractNo}
        />
      </InputControl>
      <InputControl error={errors.contractType} label="Jenis kontrak">
        <Select
          onChange={(e) => onContractTypeChange(e.target.value as ContractType)}
          options={CONTRACT_TYPE_ORDER.map((type) => ({
            value: type,
            label: CONTRACT_TYPE_LABEL[type],
          }))}
          value={values.contractType}
        />
      </InputControl>
      <InputControl error={errors.nomorInduk} label="Nomor induk karyawan">
        <Input
          onChange={(e) => onChange("nomorInduk", e.target.value)}
          placeholder="cth. EMP-0100"
          type="text"
          value={values.nomorInduk}
        />
      </InputControl>
      <InputControl error={errors.officeEmail} helper="(opsional)" label="Email kantor">
        <Input
          onChange={(e) => onChange("officeEmail", e.target.value)}
          type="email"
          value={values.officeEmail}
        />
      </InputControl>
      <h3 className="mt-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Posisi &amp; unit
      </h3>
      <InputControl error={errors.unitId} label="Unit">
        <Select
          onChange={(e) => onChange("unitId", e.target.value)}
          options={[
            { value: "", label: "— pilih unit —" },
            ...units.map((unit) => ({ value: unit.id, label: unit.name })),
          ]}
          value={values.unitId}
        />
      </InputControl>
      <InputControl
        error={errors.jobRoleId}
        helper={
          selectedJobRole
            ? `Chapter: ${selectedJobRole.chapter?.name ?? "Tanpa chapter"}`
            : undefined
        }
        label="Posisi / Job Role"
      >
        <Select
          onChange={(e) => onChange("jobRoleId", e.target.value)}
          options={[
            { value: "", label: "— pilih job role —" },
            ...jobRoles.map((role) => ({ value: role.id, label: role.name })),
          ]}
          value={values.jobRoleId}
        />
      </InputControl>
      <InputControl error={errors.jobTitle} helper="(opsional)" label="Job title">
        <Input
          onChange={(e) => onChange("jobTitle", e.target.value)}
          type="text"
          value={values.jobTitle}
        />
      </InputControl>
      <InputControl error={errors.jobLevel} helper="(opsional)" label="Job level">
        <Input
          onChange={(e) => onChange("jobLevel", e.target.value)}
          type="text"
          value={values.jobLevel}
        />
      </InputControl>
      <InputControl error={errors.bandPosition} label="Band position">
        <Select
          onChange={(e) => onChange("bandPosition", e.target.value)}
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
          onChange={(e) => onChange("workLocation", e.target.value)}
          options={[
            { value: "", label: "— pilih lokasi kerja —" },
            { value: "JAKARTA", label: "Jakarta" },
            { value: "BANDUNG", label: "Bandung" },
          ]}
          value={values.workLocation}
        />
      </InputControl>
      <h3 className="mt-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Periode &amp; status
      </h3>
      <InputControl error={errors.startDate} label="Tanggal mulai">
        <Input
          onChange={(e) => onChange("startDate", e.target.value)}
          type="date"
          value={values.startDate}
        />
      </InputControl>
      {!isOpenEndedContractType(values.contractType) ? (
        <InputControl error={errors.endDate} label="Tanggal selesai">
          <Input
            onChange={(e) => onChange("endDate", e.target.value)}
            type="date"
            value={values.endDate}
          />
        </InputControl>
      ) : null}
      <InputControl error={errors.notes} helper="(opsional)" label="Catatan">
        <Input
          onChange={(e) => onChange("notes", e.target.value)}
          type="text"
          value={values.notes}
        />
      </InputControl>
    </form>
  );
}
