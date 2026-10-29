"use client";

import * as React from "react";
import { Button } from "@/components/Button";
import { Modal, ModalActions, ModalContent, ModalTitle } from "@/components/Modal";
import { PageHeader } from "@/components/PageHeader";
import { TableFilterBar } from "@/components/TableFilterBar";
import { ActivityForm } from "./ActivityForm";
import { ActivityList } from "./ActivityList";
import { useActivitiesStore } from "./ActivitiesProvider";
import { ACTIVITY_PROJECTS, ACTIVITY_PRIORITIES, ACTIVITY_STATUSES } from "./mocks";
import { useActivities } from "./useActivities";
import { useCreateActivity } from "./useCreateActivity";
import { useDeleteActivity } from "./useDeleteActivity";
import { useUpdateActivity } from "./useUpdateActivity";
import type {
  ActivityInput,
  ActivityType,
  PersonalWorkActivity,
  PersonalWorkActivityFilter,
} from "./types";

type FilterValues = {
  activityType: ActivityType | "";
  statusId: string;
  projectId: string;
  startDate: string;
  endDate: string;
};

const EMPTY_FILTER: FilterValues = {
  activityType: "",
  statusId: "",
  projectId: "",
  startDate: "",
  endDate: "",
};

function toFilter(values: FilterValues): PersonalWorkActivityFilter {
  return {
    activityType: values.activityType || null,
    statusId: values.statusId || null,
    projectId: values.projectId || null,
    startDate: values.startDate || null,
    endDate: values.endDate || null,
  };
}

export function ActivitiesPageView() {
  const { currentTalentId } = useActivitiesStore();
  const [filter, setFilter] = React.useState<FilterValues>(EMPTY_FILTER);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<PersonalWorkActivity | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const formId = React.useId();

  const { status, data, error, reload } = useActivities(toFilter(filter));
  const { create, loading: creating, error: createError } = useCreateActivity();
  const { update, loading: updating, error: updateError } = useUpdateActivity();
  const { remove, loading: deleting, error: deleteError } = useDeleteActivity();

  function setFilterValue(key: keyof FilterValues, value: string) {
    setFilter((prev) => ({ ...prev, [key]: value }) as FilterValues);
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
    setSuccess(null);
  }

  function openEdit(activity: PersonalWorkActivity) {
    setEditing(activity);
    setFormOpen(true);
    setSuccess(null);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  async function handleSubmit(input: ActivityInput) {
    if (editing) {
      const updated = await update(editing.id, input);
      if (updated) {
        setSuccess(`Aktivitas "${updated.title}" berhasil diperbarui.`);
        closeForm();
      }
      return;
    }
    const created = await create(input);
    if (created) {
      setSuccess(`Aktivitas "${created.title}" berhasil dicatat.`);
      closeForm();
    }
  }

  async function handleDelete(activity: PersonalWorkActivity) {
    const ok = await remove(activity.id);
    if (ok) setSuccess(`Aktivitas "${activity.title}" dihapus.`);
  }

  return (
    <section className="flex flex-col gap-4">
      <PageHeader
        actions={
          <Button onClick={openCreate} type="button">
            + Catat aktivitas
          </Button>
        }
        subtitle="Catat aktivitas kerja dan pelatihan yang menjadi sumber angka workload."
        title="Aktivitas saya"
      />

      <TableFilterBar
        fields={[
          {
            key: "activityType",
            label: "Jenis",
            options: [
              { value: "", label: "Semua" },
              { value: "working", label: "Bekerja" },
              { value: "training", label: "Pelatihan" },
            ],
            type: "select",
          },
          {
            key: "statusId",
            label: "Status",
            options: [
              { value: "", label: "Semua" },
              ...ACTIVITY_STATUSES.map((status) => ({ value: status.id, label: status.name })),
            ],
            type: "select",
          },
          {
            key: "projectId",
            label: "Project",
            options: [
              { value: "", label: "Semua" },
              ...ACTIVITY_PROJECTS.map((project) => ({ value: project.id, label: project.name })),
            ],
            type: "select",
          },
          { key: "startDate", label: "Dari tanggal", type: "date" },
          { key: "endDate", label: "Sampai tanggal", type: "date" },
        ]}
        onChange={(key, value) => setFilterValue(key as keyof FilterValues, value)}
        values={filter}
      />

      {success ? (
        <p
          className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800"
          role="status"
        >
          {success}
        </p>
      ) : null}
      {deleteError ? (
        <p
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          role="alert"
        >
          {deleteError}
        </p>
      ) : null}

      <Modal onClose={closeForm} open={formOpen} size="md">
        <ModalTitle>{editing ? "Ubah aktivitas" : "Catat aktivitas"}</ModalTitle>
        <ModalContent>
          <ActivityForm
            formId={formId}
            initial={editing}
            key={editing?.id ?? "new"}
            onSubmit={handleSubmit}
            priorities={ACTIVITY_PRIORITIES}
            projects={ACTIVITY_PROJECTS}
            serverError={editing ? updateError : createError}
            statuses={ACTIVITY_STATUSES}
          />
        </ModalContent>
        <ModalActions>
          <Button disabled={creating || updating} form={formId} type="submit">
            {creating || updating
              ? "Menyimpan…"
              : editing
                ? "Simpan perubahan"
                : "Simpan aktivitas"}
          </Button>
          <Button
            disabled={creating || updating}
            onClick={closeForm}
            type="button"
            variant="secondary"
          >
            Batal
          </Button>
        </ModalActions>
      </Modal>

      <ActivityList
        activities={data}
        busy={deleting}
        currentTalentId={currentTalentId}
        error={error}
        onDelete={handleDelete}
        onEdit={openEdit}
        onRetry={reload}
        status={status}
      />
    </section>
  );
}
