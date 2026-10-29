"use client";

import { Input } from "@/components/Input";
import { InputControl } from "@/components/InputControl";
import { Select } from "@/components/Select";

type AssignmentFormValues = {
  employeeId: string;
  projectId: string;
  periodStart: string;
  periodEnd: string;
};

type TalentOption = { id: string; fullName: string; nomorInduk: string | null | undefined };
type ProjectOption = { id: string; name: string; isActive: boolean };

export function AssignmentFormFields({
  loading,
  dataError,
  formError,
  errors,
  values,
  talents,
  projects,
  onChange,
}: {
  loading: boolean;
  dataError: string | null;
  formError: string | null;
  errors: Partial<Record<keyof AssignmentFormValues, string>>;
  values: AssignmentFormValues;
  talents: readonly TalentOption[];
  projects: readonly ProjectOption[];
  onChange: (key: keyof AssignmentFormValues, value: string) => void;
}) {
  if (loading) return <p className="text-sm text-tp-muted">Memuat data…</p>;
  if (dataError) {
    return (
      <p className="text-sm text-red-700" role="alert">
        {dataError}
      </p>
    );
  }

  return (
    <>
      {formError ? (
        <p className="text-sm text-red-700" role="alert">
          {formError}
        </p>
      ) : null}
      <InputControl error={errors.employeeId} label="Talent">
        <Select
          onChange={(e) => onChange("employeeId", e.target.value)}
          options={[
            { value: "", label: "— pilih talent (assignable) —" },
            ...talents.map((emp) => ({
              value: emp.id,
              label: `${emp.fullName} (${emp.nomorInduk ?? "—"})`,
            })),
          ]}
          value={values.employeeId}
        />
      </InputControl>
      <InputControl error={errors.projectId} label="Project">
        <Select
          onChange={(e) => onChange("projectId", e.target.value)}
          options={[
            { value: "", label: "— pilih project —" },
            ...projects.filter((p) => p.isActive).map((p) => ({ value: p.id, label: p.name })),
          ]}
          value={values.projectId}
        />
      </InputControl>
      <InputControl error={errors.periodStart} label="Tanggal Mulai">
        <Input
          onChange={(e) => onChange("periodStart", e.target.value)}
          type="date"
          value={values.periodStart}
        />
      </InputControl>
      <InputControl
        error={errors.periodEnd}
        helper="(opsional, kosong = aktif)"
        label="Tanggal Selesai"
      >
        <Input
          onChange={(e) => onChange("periodEnd", e.target.value)}
          type="date"
          value={values.periodEnd}
        />
      </InputControl>
    </>
  );
}
