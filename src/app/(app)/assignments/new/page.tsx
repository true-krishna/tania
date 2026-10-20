"use client";

import Link from "next/link";
import * as React from "react";
import { ApolloError, useMutation } from "@apollo/client";
import { ErrorState, LoadingState } from "@/components/DataState";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { InputControl } from "@/components/InputControl";
import { PageHeader } from "@/components/PageHeader";
import { Select } from "@/components/Select";
import { useAssignableTalents } from "@/features/employees/useEmployees";
import { useProjects } from "@/features/master-data/useMasterData";
import { CreateAssignmentDocument } from "@/generated/graphql";
import { AuthGuard } from "@/lib/auth/guard";
import { mapAssignmentSubmitError } from "@/lib/errors";
import { TALENT_ASSIGNMENT } from "@/lib/constants/routes";

type FormValues = {
  employeeId: string;
  projectId: string;
  periodStart: string;
  periodEnd: string;
};

const EMPTY: FormValues = {
  employeeId: "",
  projectId: "",
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
  const talents = useAssignableTalents();
  const [createAssignment, { data, error, loading }] = useMutation(CreateAssignmentDocument);
  const [values, setValues] = React.useState<FormValues>(EMPTY);
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormValues, string>>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitted, setSubmitted] = React.useState(false);

  if (projects.status === "loading" || talents.status === "loading")
    return <LoadingState />;
  if (projects.status === "error")
    return <ErrorState message={projects.error ?? "Gagal memuat project."} />;
  if (talents.status === "error")
    return <ErrorState message={talents.error ?? "Gagal memuat talent."} />;

  function set<K extends keyof FormValues>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
    setFormError(null);
  }

  function validate(valuesToCheck: FormValues): Partial<Record<keyof FormValues, string>> {
    const next: Partial<Record<keyof FormValues, string>> = {};
    if (!valuesToCheck.employeeId) next.employeeId = "Talent wajib dipilih.";
    if (!valuesToCheck.projectId) next.projectId = "Project wajib dipilih.";
    if (!valuesToCheck.periodStart) next.periodStart = "Tanggal mulai wajib diisi.";
    // US1-4/FR-09 — perbandingan string ISO (YYYY-MM-DD), tanpa konversi Date
    // yang rawan geser zona waktu; aturan yang sama dengan form ubah & akhiri.
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
    try {
      await createAssignment({
        variables: {
          input: {
            employeeId: values.employeeId,
            projectId: values.projectId,
            periodStart: values.periodStart,
            periodEnd: values.periodEnd || undefined,
          },
        },
      });
      setSubmitted(true);
    } catch (err) {
      // G5/K4 — penolakan server dipetakan ke pesan per field/pesan aksi
      // Indonesia (tanggal, duplikat aktif, cakupan) — konstitusi §IX.
      const submitError = mapAssignmentSubmitError(
        err instanceof ApolloError ? err : null,
        "Gagal membuat assignment."
      );
      if (submitError.field && submitError.field in values) {
        setErrors((prev) => ({
          ...prev,
          [submitError.field as keyof FormValues]: submitError.message,
        }));
      } else {
        setFormError(submitError.message);
      }
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
            setFormError(null);
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
        {formError ? (
          <p role="alert" className="text-sm text-red-700">
            {formError}
          </p>
        ) : null}
        <InputControl label="Talent" error={errors.employeeId}>
          <Select
            value={values.employeeId}
            onChange={(e) => set("employeeId", e.target.value)}
            options={[
              { value: "", label: "— pilih talent (assignable) —" },
              ...(talents.data ?? []).map((emp) => ({
                value: emp.id,
                label: `${emp.fullName} (${emp.nomorInduk ?? "—"})`,
              })),
            ]}
          />
        </InputControl>
        <InputControl label="Project" error={errors.projectId}>
          <Select
            value={values.projectId}
            onChange={(e) => set("projectId", e.target.value)}
            options={[
              { value: "", label: "— pilih project —" },
              // US1-3 — pilihan hanya Master Data Project aktif.
              ...(projects.data ?? []).filter((p) => p.isActive).map((p) => ({ value: p.id, label: p.name })),
            ]}
          />
        </InputControl>
        <InputControl label="Tanggal Mulai" error={errors.periodStart}>
          <Input
            type="date"
            value={values.periodStart}
            onChange={(e) => set("periodStart", e.target.value)}
          />
        </InputControl>
        <InputControl
          label="Tanggal Selesai"
          error={errors.periodEnd}
          helper="(opsional, kosong = aktif)"
        >
          <Input
            type="date"
            value={values.periodEnd}
            onChange={(e) => set("periodEnd", e.target.value)}
          />
        </InputControl>

        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            Simpan
          </Button>
          <Link
            href={TALENT_ASSIGNMENT}
            className="inline-flex items-center rounded-md border border-surface-border bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-50"
          >
            Batal
          </Link>
        </div>
      </form>
    </section>
  );
}