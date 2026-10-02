"use client";

import Link from "next/link";
import * as React from "react";
import { ErrorState, LoadingState } from "@/components/DataState";
import { employees } from "@/features/employees/mock";
import { useJobRoles, useProjects } from "@/features/master-data/useMasterData";

type FormValues = {
  employeeId: string;
  projectId: string;
  jobRoleId: string;
  periodStart: string;
  periodEnd: string;
};

const EMPTY: FormValues = {
  employeeId: "",
  projectId: "",
  jobRoleId: "",
  periodStart: "",
  periodEnd: "",
};

/**
 * "Buat Assignment" form (Chapter) — US2.
 * Only assignable talents and registered projects are offered (FR-05/FR-07).
 * Submit is a mock for now; swap for the real `createAssignment` mutation when
 * the backend US2 wave lands.
 */
export default function NewAssignmentPage() {
  const projects = useProjects();
  const jobRoles = useJobRoles();
  const [values, setValues] = React.useState<FormValues>(EMPTY);
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormValues, string>>>({});
  const [submitted, setSubmitted] = React.useState(false);

  // FR: form hanya menawarkan talent assignable.
  const assignableTalents = employees.filter((e) => e.assignable);

  if (projects.status === "loading" || jobRoles.status === "loading") return <LoadingState />;
  if (projects.status === "error")
    return <ErrorState message={projects.error ?? "Gagal memuat project."} />;
  if (jobRoles.status === "error")
    return <ErrorState message={jobRoles.error ?? "Gagal memuat job role."} />;

  function set<K extends keyof FormValues>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(valuesToCheck: FormValues): Partial<Record<keyof FormValues, string>> {
    const next: Partial<Record<keyof FormValues, string>> = {};
    if (!valuesToCheck.employeeId) next.employeeId = "Talent wajib dipilih.";
    if (!valuesToCheck.projectId) next.projectId = "Project wajib dipilih.";
    if (!valuesToCheck.jobRoleId) next.jobRoleId = "Job role wajib dipilih.";
    if (!valuesToCheck.periodStart) next.periodStart = "Tanggal mulai wajib diisi.";
    return next;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) setSubmitted(true);
  }

  if (submitted) {
    const talentName = employees.find((e) => e.id === values.employeeId)?.fullName;
    const projectName = projects.data?.find((p) => p.id === values.projectId)?.name;
    return (
      <section className="flex max-w-xl flex-col gap-4">
        <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          Assignment <strong>{talentName}</strong> → <strong>{projectName}</strong> disiapkan
          untuk dibuat (mock). Saat backend US2 tersedia, submit ini akan memanggil mutasi{" "}
          <code>createAssignment</code>.
        </div>
        <button
          type="button"
          onClick={() => {
            setValues(EMPTY);
            setErrors({});
            setSubmitted(false);
          }}
          className="w-fit rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
        >
          Buat assignment lain
        </button>
      </section>
    );
  }

  return (
    <section className="flex max-w-xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Buat Assignment</h1>
        <p className="mt-1 text-sm text-zinc-600">Tugaskan talent ke project (Chapter).</p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Label error={errors.employeeId}>
          Talent
          <select
            value={values.employeeId}
            onChange={(e) => set("employeeId", e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="">— pilih talent (assignable) —</option>
            {assignableTalents.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.fullName} ({emp.employeeCode})
              </option>
            ))}
          </select>
        </Label>
        <Label error={errors.projectId}>
          Project
          <select
            value={values.projectId}
            onChange={(e) => set("projectId", e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="">— pilih project —</option>
            {projects.data?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Label>
        <Label error={errors.jobRoleId}>
          Job Role
          <select
            value={values.jobRoleId}
            onChange={(e) => set("jobRoleId", e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="">— pilih job role —</option>
            {jobRoles.data?.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </Label>
        <Label error={errors.periodStart}>
          Tanggal Mulai
          <input
            type="date"
            value={values.periodStart}
            onChange={(e) => set("periodStart", e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </Label>
        <Label>
          Tanggal Selesai{" "}
          <span className="text-xs font-normal text-zinc-500">(opsional, kosong = aktif)</span>
          <input
            type="date"
            value={values.periodEnd}
            onChange={(e) => set("periodEnd", e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </Label>

        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Simpan
          </button>
          <Link
            href="/assignments"
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Batal
          </Link>
        </div>
      </form>
    </section>
  );
}

function Label({ error, children }: { error?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-zinc-800">
      {children}
      {error ? (
        <span className="text-xs font-normal text-red-600" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}