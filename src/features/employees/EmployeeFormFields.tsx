"use client";

import { Input } from "@/components/Input";
import { InputControl } from "@/components/InputControl";
import { Select } from "@/components/Select";
import { GENDER_LABEL } from "@/features/employees/labels";
import type { FormErrors } from "./employeeFormValidation";
import type { PersonalFormValues } from "./employeeFormValues";

export type PersonalFieldPlaceholders = Partial<Record<keyof PersonalFormValues, string>>;

type EmployeeFormFieldsProps = {
  errors: FormErrors<PersonalFormValues>;
  onChange: (key: keyof PersonalFormValues, value: string) => void;
  placeholders?: PersonalFieldPlaceholders;
  values: PersonalFormValues;
};

export function EmployeeFormFields({
  errors,
  onChange,
  placeholders,
  values,
}: EmployeeFormFieldsProps) {
  return (
    <>
      <InputControl error={errors.fullName} label="Nama lengkap">
        <Input
          onChange={(event) => onChange("fullName", event.target.value)}
          placeholder={placeholders?.fullName}
          type="text"
          value={values.fullName}
        />
      </InputControl>
      <InputControl error={errors.email} label="Email">
        <Input
          autoComplete="email"
          onChange={(event) => onChange("email", event.target.value)}
          placeholder={placeholders?.email}
          type="email"
          value={values.email}
        />
      </InputControl>
      <InputControl error={errors.birthDate} label="Tanggal lahir">
        <Input
          onChange={(event) => onChange("birthDate", event.target.value)}
          placeholder={placeholders?.birthDate}
          type="date"
          value={values.birthDate}
        />
      </InputControl>
      <InputControl error={errors.gender} label="Jenis kelamin">
        <Select
          onChange={(event) => onChange("gender", event.target.value)}
          options={[
            { label: "— pilih jenis kelamin —", value: "" },
            ...(Object.keys(GENDER_LABEL) as Array<keyof typeof GENDER_LABEL>).map((value) => ({
              label: GENDER_LABEL[value],
              value,
            })),
          ]}
          value={values.gender}
        />
      </InputControl>
      <InputControl error={errors.phone} label="Telepon">
        <Input
          onChange={(event) => onChange("phone", event.target.value)}
          placeholder={placeholders?.phone}
          type="text"
          value={values.phone}
        />
      </InputControl>
      <InputControl error={errors.address} label="Alamat">
        <Input
          onChange={(event) => onChange("address", event.target.value)}
          placeholder={placeholders?.address}
          type="text"
          value={values.address}
        />
      </InputControl>
      <InputControl error={errors.latestEducation} helper="(opsional)" label="Pendidikan terakhir">
        <Input
          onChange={(event) => onChange("latestEducation", event.target.value)}
          placeholder={placeholders?.latestEducation}
          type="text"
          value={values.latestEducation}
        />
      </InputControl>
      <InputControl error={errors.institutionName} helper="(opsional)" label="Nama institusi">
        <Input
          onChange={(event) => onChange("institutionName", event.target.value)}
          placeholder={placeholders?.institutionName}
          type="text"
          value={values.institutionName}
        />
      </InputControl>
      <InputControl error={errors.major} helper="(opsional)" label="Jurusan">
        <Input
          onChange={(event) => onChange("major", event.target.value)}
          placeholder={placeholders?.major}
          type="text"
          value={values.major}
        />
      </InputControl>
      <InputControl error={errors.joinedAt} label="Tanggal Bergabung">
        <Input
          onChange={(event) => onChange("joinedAt", event.target.value)}
          placeholder={placeholders?.joinedAt}
          type="date"
          value={values.joinedAt}
        />
      </InputControl>
    </>
  );
}
