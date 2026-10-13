"use client";

import Link from "next/link";
import * as React from "react";
import { useMutation } from "@apollo/client";
import { ErrorState, LoadingState } from "@/components/DataState";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { PageHeader } from "@/components/PageHeader";
import { Select } from "@/components/Select";
import { useAssignableTalents } from "@/features/employees/useEmployees";
import { useJobRoles, useProjects } from "@/features/master-data/useMasterData";
import { CreateAssignmentDocument } from "@/generated/graphql";
import { AuthGuard } from "@/lib/auth/guard";

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

export default function NewAssignmentPage() {
  return (
    <AuthGuard module="assignments" manage>
      <NewAssignmentForm />
    </AuthGuard>
  );
}

function NewAssignmentForm() {
  const projects = useProjects();
  const jobRoles = useJobRoles();
  const talents = useAssignableTalents();
  const [createAssignment, { data, error, loading }] = useMutation(CreateAssignmentDocument);
  const [values, setValues] = React.useState<FormValues>(EMPTY);
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormValues, string>>>({});
  const [submitted, setSubmitted] = React.useState(false);

  if (projects.status === "loading" || jobRoles.status === "loading" || talents.status === "loading")
    return <LoadingState />;
  if (projects.status === "error")
    return <ErrorState message={projects.error ?? "Gagal memuat project."} />;
  if (jobRoles.status === "error")
    return <ErrorState message={jobRoles.error ?? "Gagal memuat job role."} />;
  if (talents.status === "error")
    return <ErrorState message={talents.error ?? "Gagal memuat talent."} />;

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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    try {
      await createAssignment({
        variables: {
          input: {
            employeeId: values.employeeId,
            projectId: values.projectId,
            jobRoleId: values.jobRoleId,
            periodStart: values.periodStart,
            periodEnd: values.periodEnd || undefined,
          },
        },
      });
      setSubmitted(true);
    } catch (err) {
      setErrors({ employeeId: err instanceof Error ? err.message : "Gagal membuat assignment." });
    }
  }

  if (submitted && !loading) {
    const talentName = talents.data?.find((e) => e.id === values.employeeId)?.fullName;
    const projectName = projects.data?.find((p) => p.id === values.projectId)?.name;
    const ok = Boolean(data?.createAssignment);
    return (
      <section className="flex max-w-xl flex-col gap-4">
        <div
          className={`rounded-md border p-4 text-sm ${
            ok ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {ok
            ? `Assignment ${talentName ?? ""} → ${projectName ?? ""} berhasil dibuat.`
            : error?.message ?? "Terjadi kesalahan saat membuat assignment."}
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setValues(EMPTY);
            setErrors({});
            setSubmitted(false);
          }}
        >
          Buat assignment lain
        </Button>
      </section>
    );
  }

  return (
    <section className="flex max-w-xl flex-col gap-4">
      <PageHeader title="Buat Assignment" subtitle="Tugaskan talent ke project (Chapter)." />

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Label error={errors.employeeId}>
          Talent
          <Select value={values.employeeId} onChange={(e) => set("employeeId", e.target.value)}>
            <option value="">— pilih talent (assignable) —</option>
            {talents.data?.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.fullName} ({emp.nomorInduk ?? "—"})
              </option>
            ))}
          </Select>
        </Label>
        <Label error={errors.projectId}>
          Project
          <Select value={values.projectId} onChange={(e) => set("projectId", e.target.value)}>
            <option value="">— pilih project —</option>
            {projects.data?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Label>
        <Label error={errors.jobRoleId}>
          Job Role
          <Select value={values.jobRoleId} onChange={(e) => set("jobRoleId", e.target.value)}>
            <option value="">— pilih job role —</option>
            {jobRoles.data?.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </Select>
        </Label>
        <Label error={errors.periodStart}>
          Tanggal Mulai
          <Input
            type="date"
            value={values.periodStart}
            onChange={(e) => set("periodStart", e.target.value)}
          />
        </Label>
        <Label>
          Tanggal Selesai{" "}
          <span className="text-xs font-normal text-zinc-500">(opsional, kosong = aktif)</span>
          <Input
            type="date"
            value={values.periodEnd}
            onChange={(e) => set("periodEnd", e.target.value)}
          />
        </Label>

        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            Simpan
          </Button>
          <Link
            href="/assignments"
            className="inline-flex items-center rounded-md border border-surface-border bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-50"
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
    <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
      {children}
      {error ? <span className="text-xs font-normal text-red-600">{error}</span> : null}
    </label>
  );
}