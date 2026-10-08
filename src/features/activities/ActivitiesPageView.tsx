"use client";

import * as React from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
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

/**
 * The `/activities` workspace: filter bar, create/edit form, and the list.
 * Uses the feature hooks only — swapping the fixture store for GraphQL is
 * contained to `ActivitiesProvider`.
 */
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
        title="Aktivitas saya"
        subtitle="Catat aktivitas kerja dan pelatihan yang menjadi sumber angka workload."
        actions={
          <Button type="button" onClick={openCreate}>
            + Catat aktivitas
          </Button>
        }
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

      {formOpen ? (
        <Card>
          <h2 className="mb-3 text-base font-semibold text-zinc-900">
            {editing ? "Ubah aktivitas" : "Catat aktivitas"}
          </h2>
          <ActivityForm
            key={editing?.id ?? "new"}
            initial={editing}
            projects={ACTIVITY_PROJECTS}
            priorities={ACTIVITY_PRIORITIES}
            statuses={ACTIVITY_STATUSES}
            submitting={creating || updating}
            serverError={editing ? updateError : createError}
            onSubmit={handleSubmit}
            onCancel={closeForm}
          />
        </Card>
      ) : null}

      <Card>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <FilterField label="Jenis">
            <Select
              aria-label="Filter jenis aktivitas"
              value={filter.activityType}
              onChange={(e) => setFilterValue("activityType", e.target.value as ActivityType | "")}
            >
              <option value="">Semua</option>
              <option value="working">Bekerja</option>
              <option value="training">Pelatihan</option>
            </Select>
          </FilterField>
          <FilterField label="Status">
            <Select
              aria-label="Filter status aktivitas"
              value={filter.statusId}
              onChange={(e) => setFilterValue("statusId", e.target.value)}
            >
              <option value="">Semua</option>
              {ACTIVITY_STATUSES.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </Select>
          </FilterField>
          <FilterField label="Project">
            <Select
              aria-label="Filter project aktivitas"
              value={filter.projectId}
              onChange={(e) => setFilterValue("projectId", e.target.value)}
            >
              <option value="">Semua</option>
              {ACTIVITY_PROJECTS.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Select>
          </FilterField>
          <FilterField label="Dari tanggal">
            <Input
              aria-label="Filter tanggal mulai dari"
              type="date"
              value={filter.startDate}
              onChange={(e) => setFilterValue("startDate", e.target.value)}
            />
          </FilterField>
          <FilterField label="Sampai tanggal">
            <Input
              aria-label="Filter tanggal mulai sampai"
              type="date"
              value={filter.endDate}
              onChange={(e) => setFilterValue("endDate", e.target.value)}
            />
          </FilterField>
        </div>
      </Card>

      <ActivityList
        status={status}
        activities={data}
        error={error}
        currentTalentId={currentTalentId}
        busy={deleting}
        onEdit={openEdit}
        onDelete={handleDelete}
        onRetry={reload}
      />

      <p className="text-xs text-zinc-500">
        {status === "ready" && data ? `${data.length} aktivitas ditampilkan.` : ""}
      </p>
    </section>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
      <span>{label}</span>
      {children}
    </div>
  );
}
