"use client";

import * as React from "react";
import { ErrorState, LoadingState } from "@/components/DataState";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { InputControl } from "@/components/InputControl";
import { Select } from "@/components/Select";
import { useProjects } from "@/features/master-data/useMasterData";
import { useUpdateAssignment } from "@/features/assignments/useAssignment";
import { mapAssignmentSubmitError } from "@/lib/errors";
import type { AssignmentNode } from "./types";

type EditFormValues = {
  projectId: string;
  periodStart: string;
  periodEnd: string;
};

function toEditFormValues(assignment: {
  periodEnd: string | null | undefined;
  periodStart: string;
  project: { id: string };
}): EditFormValues {
  return {
    projectId: assignment.project.id,
    periodStart: assignment.periodStart,
    periodEnd: assignment.periodEnd ?? "",
  };
}

export function EditAssignmentForm({ assignment }: { assignment: AssignmentNode }) {
  const projects = useProjects();
  const [updateAssignment, { loading: saving }] = useUpdateAssignment();
  const [values, setValues] = React.useState<EditFormValues>(() => toEditFormValues(assignment));
  const [errors, setErrors] = React.useState<Partial<Record<keyof EditFormValues, string>>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  if (projects.status === "loading") return <LoadingState label="Memuat master data…" />;
  if (projects.status === "error") {
    return <ErrorState message={projects.error ?? "Gagal memuat project."} />;
  }

  const activeProjects = (projects.data ?? []).filter((p) => p.isActive);

  function set<K extends keyof EditFormValues>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
    setFormError(null);
    setSaved(false);
  }

  function validate(valuesToCheck: EditFormValues): Partial<Record<keyof EditFormValues, string>> {
    const next: Partial<Record<keyof EditFormValues, string>> = {};
    if (!valuesToCheck.projectId) next.projectId = "Project wajib dipilih.";
    if (!valuesToCheck.periodStart) next.periodStart = "Tanggal mulai wajib diisi.";
    if (
      valuesToCheck.periodEnd &&
      valuesToCheck.periodStart &&
      valuesToCheck.periodEnd < valuesToCheck.periodStart
    ) {
      next.periodEnd = "Tanggal selesai tidak boleh lebih awal dari tanggal mulai.";
    }
    return next;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    const result = await updateAssignment({
      onError: (err) => {
        const submitError = mapAssignmentSubmitError(err, "Gagal menyimpan perubahan.");
        if (submitError.field && submitError.field in values) {
          setErrors((prev) => ({
            ...prev,
            [submitError.field as keyof EditFormValues]: submitError.message,
          }));
        } else {
          setSaved(false);
          setFormError(submitError.message);
        }
      },
      variables: {
        id: assignment.id,
        input: {
          projectId: values.projectId,
          periodStart: values.periodStart,
          periodEnd: values.periodEnd || undefined,
        },
      },
    });
    const updated = result.data?.updateAssignment;
    if (updated) {
      setValues(toEditFormValues(updated));
      setSaved(true);
    }
  }

  return (
    <Card className="flex max-w-2xl flex-col gap-3">
      <h2 className="text-sm font-semibold text-zinc-900">Ubah assignment</h2>
      <p className="text-sm text-zinc-500">
        Talent tidak dapat diganti. Pilihan project hanya master data aktif.
      </p>
      <form className="flex flex-col gap-3" onSubmit={onSubmit}>
        <InputControl error={errors.projectId} label="Project">
          <Select
            onChange={(e) => set("projectId", e.target.value)}
            options={[
              { value: "", label: "— pilih project —" },
              ...activeProjects.map((p) => ({ value: p.id, label: p.name })),
            ]}
            value={values.projectId}
          />
        </InputControl>
        <InputControl error={errors.periodStart} label="Tanggal Mulai">
          <Input
            onChange={(e) => set("periodStart", e.target.value)}
            type="date"
            value={values.periodStart}
          />
        </InputControl>
        <InputControl error={errors.periodEnd} helper="(opsional)" label="Tanggal Selesai">
          <Input
            onChange={(e) => set("periodEnd", e.target.value)}
            type="date"
            value={values.periodEnd}
          />
        </InputControl>
        {formError ? (
          <p className="text-sm text-red-700" role="alert">
            {formError}
          </p>
        ) : null}
        {saved ? (
          <p className="text-sm text-green-700" role="status">
            Perubahan tersimpan.
          </p>
        ) : null}
        <div className="flex gap-2">
          <Button disabled={saving} type="submit">
            Simpan
          </Button>
        </div>
      </form>
    </Card>
  );
}
