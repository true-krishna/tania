"use client";

import * as React from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
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
  /** Prefill for edit; omit/null for create. Remount (via `key`) when it changes. */
  initial?: PersonalWorkActivity | null;
  projects: ActivityProject[];
  priorities: ActivityReference[];
  statuses: ActivityReference[];
  submitting?: boolean;
  /** Server/action error — shown verbatim, input is preserved. */
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
  // Project is conditionally required (FR-004): only for non-training.
  if (values.activityType !== "training" && !values.projectId) {
    errors.projectId = "Project wajib dipilih untuk aktivitas bekerja.";
  }
  if (!values.priorityId) errors.priorityId = "Prioritas wajib dipilih.";
  if (!values.statusId) errors.statusId = "Status wajib dipilih.";
  return errors;
}

/**
 * Create/edit form for a PersonalWorkActivity (data-model §5.1).
 *
 * Client validation is UX only; the server stays authoritative. On a recoverable
 * error the typed values are never discarded — only `onSubmit` failures leave the
 * form mounted with the user's input intact.
 */
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
    // Switching to training clears the project field; it stays cleared when
    // switching back so the user makes a deliberate choice.
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
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

      <Field label="Judul aktivitas" error={errors.title} htmlFor="activity-title">
        <Input
          id="activity-title"
          type="text"
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="cth. Implementasi form aktivitas"
          aria-invalid={Boolean(errors.title)}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Jenis aktivitas" error={errors.activityType} htmlFor="activity-type">
          <Select
            id="activity-type"
            value={values.activityType}
            onChange={(e) => onTypeChange(e.target.value)}
          >
            <option value="working">{ACTIVITY_TYPE_LABEL.working}</option>
            <option value="training">{ACTIVITY_TYPE_LABEL.training}</option>
          </Select>
        </Field>

        <Field label="Prioritas" error={errors.priorityId} htmlFor="activity-priority">
          <Select
            id="activity-priority"
            value={values.priorityId}
            onChange={(e) => set("priorityId", e.target.value)}
            aria-invalid={Boolean(errors.priorityId)}
          >
            <option value="">— pilih prioritas —</option>
            {priorities.map((priority) => (
              <option key={priority.id} value={priority.id}>
                {priority.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Tanggal mulai" error={errors.startDate} htmlFor="activity-start">
          <Input
            id="activity-start"
            type="date"
            value={values.startDate}
            onChange={(e) => set("startDate", e.target.value)}
            aria-invalid={Boolean(errors.startDate)}
          />
        </Field>

        <Field label="Tanggal selesai (opsional)" error={errors.endDate} htmlFor="activity-end">
          <Input
            id="activity-end"
            type="date"
            value={values.endDate}
            onChange={(e) => set("endDate", e.target.value)}
            aria-invalid={Boolean(errors.endDate)}
          />
        </Field>

        <Field
          label="Project"
          error={errors.projectId}
          htmlFor="activity-project"
          hint={isTraining ? "Pelatihan tidak terikat project." : undefined}
        >
          <Select
            id="activity-project"
            value={values.projectId}
            onChange={(e) => set("projectId", e.target.value)}
            disabled={isTraining}
            aria-invalid={Boolean(errors.projectId)}
          >
            <option value="">{isTraining ? "— tidak berlaku —" : "— pilih project —"}</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Status" error={errors.statusId} htmlFor="activity-status">
          <Select
            id="activity-status"
            value={values.statusId}
            onChange={(e) => set("statusId", e.target.value)}
            aria-invalid={Boolean(errors.statusId)}
          >
            <option value="">— pilih status —</option>
            {statuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Menyimpan…" : initial ? "Simpan perubahan" : "Simpan aktivitas"}
        </Button>
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
            Batal
          </Button>
        ) : null}
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="flex flex-col gap-1 text-sm font-medium text-zinc-800">
      {label}
      {children}
      {hint ? <span className="text-xs font-normal text-zinc-500">{hint}</span> : null}
      {error ? (
        <span className="text-xs font-normal text-red-600" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}
