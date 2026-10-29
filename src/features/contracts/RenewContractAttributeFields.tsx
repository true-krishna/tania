"use client";

import { Input } from "@/components/Input";
import { InputControl } from "@/components/InputControl";
import { Select } from "@/components/Select";
import type { useJobRoles, useUnits } from "@/features/master-data/useMasterData";
import type {
  RenewContractFormErrors,
  RenewContractFormValues,
} from "./renewContractValues";

type RenewContractAttributeFieldsProps = {
  errors: RenewContractFormErrors;
  jobRoles: ReturnType<typeof useJobRoles>;
  onChange: (key: keyof RenewContractFormValues, value: string) => void;
  units: ReturnType<typeof useUnits>;
  values: RenewContractFormValues;
};

export function RenewContractAttributeFields({
  errors,
  jobRoles,
  onChange,
  units,
  values,
}: RenewContractAttributeFieldsProps) {
  const selectedJobRole = values.jobRoleId
    ? (jobRoles.data ?? []).find(
        (jobRole) => jobRole.id === values.jobRoleId
      ) ?? null
    : null;

  return (
    <>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Identitas kontrak
      </h3>
      <InputControl error={errors.nomorInduk} label="Nomor induk karyawan">
        <Input
          onChange={(event) => onChange("nomorInduk", event.target.value)}
          type="text"
          value={values.nomorInduk}
        />
      </InputControl>
      <InputControl
        error={errors.officeEmail}
        helper="(opsional)"
        label="Email kantor"
      >
        <Input
          onChange={(event) => onChange("officeEmail", event.target.value)}
          type="email"
          value={values.officeEmail}
        />
      </InputControl>
      <h3 className="mt-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Posisi & unit
      </h3>
      <InputControl
        error={errors.unitId}
        helper="(pindah unit bila diubah)"
        label="Unit"
      >
        <Select
          onChange={(event) => onChange("unitId", event.target.value)}
          options={[
            { label: "— pilih unit —", value: "" },
            ...(units.data ?? []).map((unit) => ({
              label: unit.name,
              value: unit.id,
            })),
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
          onChange={(event) => onChange("jobRoleId", event.target.value)}
          options={[
            { label: "— pilih job role —", value: "" },
            ...(jobRoles.data ?? []).map((jobRole) => ({
              label: jobRole.name,
              value: jobRole.id,
            })),
          ]}
          value={values.jobRoleId}
        />
      </InputControl>
      <InputControl error={errors.jobTitle} helper="(opsional)" label="Job title">
        <Input
          onChange={(event) => onChange("jobTitle", event.target.value)}
          type="text"
          value={values.jobTitle}
        />
      </InputControl>
      <InputControl error={errors.jobLevel} helper="(opsional)" label="Job level">
        <Input
          onChange={(event) => onChange("jobLevel", event.target.value)}
          type="text"
          value={values.jobLevel}
        />
      </InputControl>
      <InputControl error={errors.bandPosition} label="Band position">
        <Select
          onChange={(event) => onChange("bandPosition", event.target.value)}
          options={[
            { label: "Belum ditetapkan", value: "UNDEFINED" },
            { label: "I", value: "I" },
            { label: "II", value: "II" },
            { label: "III", value: "III" },
            { label: "IV", value: "IV" },
            { label: "V", value: "V" },
            { label: "VI", value: "VI" },
          ]}
          value={values.bandPosition}
        />
      </InputControl>
      <InputControl error={errors.workLocation} label="Work location">
        <Select
          onChange={(event) => onChange("workLocation", event.target.value)}
          options={[
            { label: "— pilih lokasi kerja —", value: "" },
            { label: "Jakarta", value: "JAKARTA" },
            { label: "Bandung", value: "BANDUNG" },
          ]}
          value={values.workLocation}
        />
      </InputControl>
      <InputControl error={errors.notes} helper="(opsional)" label="Catatan">
        <Input
          onChange={(event) => onChange("notes", event.target.value)}
          type="text"
          value={values.notes}
        />
      </InputControl>
    </>
  );
}
