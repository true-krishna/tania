"use client";

import * as React from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { InputControl } from "@/components/InputControl";
import { Select } from "@/components/Select";
import { ACTIVITY_TYPE_LABEL } from "./mocks";
import type {
  ActivityInput,
  ActivityProject,
  ActivityReference,
  ActivityType,
  PersonalWorkActivity,
} from "./types";

interface FormValues {
  title: string;
  activityType: ActivityType;
  startDate: string;
  endDate: string;
  projectId: string;
  priorityId: string;
  statusId: string;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

export interface ActivityFormProps {
  initial?: PersonalWorkActivity | null;
  projects: ActivityProject[];
  priorities: ActivityReference[];
  statuses: ActivityReference[];
  submitting?: boolean;
  serverError?: string | null;
  successMessage?: string | null;
  onSubmit: (input: ActivityInput) => void | Promise<void>;
  onCancel?: () => void;
}

function toValues(initial?: PersonalWorkActivity | null): FormValues {
  return {
    title: initial?.title ?? "",
    activityType: initial?.activityType ?? "working",
    startDate: initial?.startDate ?? "",
    endDate: initial?.endDate ?? "",
    projectId: initial?.project?.id ?? "",
    priorityId: initial?.priority.id ?? "",
    statusId: initial?.status.id ?? "",
  };
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (!values.title.trim()) errors.title = "Judul aktivitas wajib diisi.";
  if (!values.startDate) errors.startDate = "Tanggal mulai wajib diisi.";
  if (values.endDate && values.startDate && values.endDate < values.startDate) {
    errors.endDate = "Tanggal selesai tidak boleh mendahului tanggal mulai.";
  }
  if (values.activityType !== "training" && !values.projectId) {
    errors.projectId = "Project wajib dipilih untuk aktivitas bekerja.";
  }
  if (!values.priorityId) errors.priorityId = "Prioritas wajib dipilih.";
  if (!values.statusId) errors.statusId = "Status wajib dipilih.";
  return errors;
}

export function ActivityForm({
  initial,
  projects,
  priorities,
  statuses,
  submitting = false,
  serverError = null,
  successMessage = null,
  onSubmit,
  onCancel,
}: ActivityFormProps) {
  const [values, setValues] = React.useState<FormValues>(() => toValues(initial));
  const [errors, setErrors] = React.useState<FormErrors>({});
  const isTraining = values.activityType === "training";

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function onTypeChange(value: string) {
    const activityType = value as ActivityType;
    setValues((prev) => ({
      ...prev,
      activityType,
      projectId: activityType === "training" ? "" : prev.projectId,
    }));
    setErrors((prev) => ({ ...prev, projectId: undefined }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    await onSubmit({
      title: values.title.trim(),
      activityType: values.activityType,
      startDate: values.startDate,
      endDate: values.endDate || null,
      projectId: isTraining ? null : values.projectId || null,
      priorityId: values.priorityId,
      statusId: values.statusId,
    });
  }

  return (
    <form className="flex flex-col gap-4" noValidate onSubmit={handleSubmit}>
      {successMessage ? (
        <p
          className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800"
          role="status"
        >
          {successMessage}
        </p>
      ) : null}
      {serverError ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
          {serverError}
        </p>
      ) : null}

      <InputControl error={errors.title} htmlFor="activity-title" label="Judul aktivitas">
        <Input
          aria-invalid={Boolean(errors.title)}
          id="activity-title"
          onChange={(e) => set("title", e.target.value)}
          placeholder="cth. Implementasi form aktivitas"
          type="text"
          value={values.title}
        />
      </InputControl>

      <div className="grid gap-4 sm:grid-cols-2">
        <InputControl error={errors.activityType} htmlFor="activity-type" label="Jenis aktivitas">
          <Select
            id="activity-type"
            onChange={(e) => onTypeChange(e.target.value)}
            options={[
              { value: "working", label: ACTIVITY_TYPE_LABEL.working },
              { value: "training", label: ACTIVITY_TYPE_LABEL.training },
            ]}
            value={values.activityType}
          />
        </InputControl>

        <InputControl error={errors.priorityId} htmlFor="activity-priority" label="Prioritas">
          <Select
            aria-invalid={Boolean(errors.priorityId)}
            id="activity-priority"
            onChange={(e) => set("priorityId", e.target.value)}
            options={[
              { value: "", label: "— pilih prioritas —" },
              ...priorities.map((priority) => ({ value: priority.id, label: priority.name })),
            ]}
            value={values.priorityId}
          />
        </InputControl>

        <InputControl error={errors.startDate} htmlFor="activity-start" label="Tanggal mulai">
          <Input
            aria-invalid={Boolean(errors.startDate)}
            id="activity-start"
            onChange={(e) => set("startDate", e.target.value)}
            type="date"
            value={values.startDate}
          />
        </InputControl>

        <InputControl error={errors.endDate} htmlFor="activity-end" label="Tanggal selesai (opsional)">
          <Input
            aria-invalid={Boolean(errors.endDate)}
            id="activity-end"
            onChange={(e) => set("endDate", e.target.value)}
            type="date"
            value={values.endDate}
          />
        </InputControl>

        <InputControl
          error={errors.projectId}
          helper={isTraining ? "Pelatihan tidak terikat project." : undefined}
          htmlFor="activity-project"
          label="Project"
        >
          <Select
            aria-invalid={Boolean(errors.projectId)}
            disabled={isTraining}
            id="activity-project"
            onChange={(e) => set("projectId", e.target.value)}
            options={[
              { value: "", label: isTraining ? "— tidak berlaku —" : "— pilih project —" },
              ...projects.map((project) => ({ value: project.id, label: project.name })),
            ]}
            value={values.projectId}
          />
        </InputControl>

        <InputControl error={errors.statusId} htmlFor="activity-status" label="Status">
          <Select
            aria-invalid={Boolean(errors.statusId)}
            id="activity-status"
            onChange={(e) => set("statusId", e.target.value)}
            options={[
              { value: "", label: "— pilih status —" },
              ...statuses.map((status) => ({ value: status.id, label: status.name })),
            ]}
            value={values.statusId}
          />
        </InputControl>
      </div>

      <div className="flex gap-2">
        <Button disabled={submitting} type="submit">
          {submitting ? "Menyimpan…" : initial ? "Simpan perubahan" : "Simpan aktivitas"}
        </Button>
        {onCancel ? (
          <Button disabled={submitting} onClick={onCancel} type="button" variant="secondary">
            Batal
          </Button>
        ) : null}
      </div>
    </form>
  );
}
