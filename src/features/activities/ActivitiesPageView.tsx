"use client";

import * as React from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/PageHeader";
import { Select } from "@/components/Select";
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

interface FilterValues {
  activityType: ActivityType | "";
  statusId: string;
  projectId: string;
  startDate: string;
  endDate: string;
}

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

  const { status, data, error, reload } = useActivities(toFilter(filter));
  const { create, loading: creating, error: createError } = useCreateActivity();
  const { update, loading: updating, error: updateError } = useUpdateActivity();
  const { remove, loading: deleting, error: deleteError } = useDeleteActivity();

  function setFilterValue<K extends keyof FilterValues>(key: K, value: FilterValues[K]) {
    setFilter((prev) => ({ ...prev, [key]: value }));
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
        filters={
          <>
            <div className="flex items-center gap-2 text-sm text-zinc-700">
              <span>Jenis</span>
              <Select
                aria-label="Filter jenis aktivitas"
                onChange={(e) => setFilterValue("activityType", e.target.value as ActivityType | "")}
                options={[
                  { value: "", label: "Semua" },
                  { value: "working", label: "Bekerja" },
                  { value: "training", label: "Pelatihan" },
                ]}
                value={filter.activityType}
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-700">
              <span>Status</span>
              <Select
                aria-label="Filter status aktivitas"
                onChange={(e) => setFilterValue("statusId", e.target.value)}
                options={[
                  { value: "", label: "Semua" },
                  ...ACTIVITY_STATUSES.map((status) => ({ value: status.id, label: status.name })),
                ]}
                value={filter.statusId}
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-700">
              <span>Project</span>
              <Select
                aria-label="Filter project aktivitas"
                onChange={(e) => setFilterValue("projectId", e.target.value)}
                options={[
                  { value: "", label: "Semua" },
                  ...ACTIVITY_PROJECTS.map((project) => ({ value: project.id, label: project.name })),
                ]}
                value={filter.projectId}
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-700">
              <span>Dari tanggal</span>
              <Input
                aria-label="Filter tanggal mulai dari"
                onChange={(e) => setFilterValue("startDate", e.target.value)}
                type="date"
                value={filter.startDate}
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-700">
              <span>Sampai tanggal</span>
              <Input
                aria-label="Filter tanggal mulai sampai"
                onChange={(e) => setFilterValue("endDate", e.target.value)}
                type="date"
                value={filter.endDate}
              />
            </div>
          </>
        }
        subtitle="Catat aktivitas kerja dan pelatihan yang menjadi sumber angka workload."
        title="Aktivitas saya"
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
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
          {deleteError}
        </p>
      ) : null}

      <Modal
        onClose={closeForm}
        open={formOpen}
        size="md"
        title={editing ? "Ubah aktivitas" : "Catat aktivitas"}
      >
        <ActivityForm
          initial={editing}
          key={editing?.id ?? "new"}
          onCancel={closeForm}
          onSubmit={handleSubmit}
          priorities={ACTIVITY_PRIORITIES}
          projects={ACTIVITY_PROJECTS}
          serverError={editing ? updateError : createError}
          statuses={ACTIVITY_STATUSES}
          submitting={creating || updating}
        />
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
