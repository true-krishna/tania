"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import * as React from "react";
import { useMutation } from "@apollo/client";
import { ErrorState, LoadingState } from "@/components/DataState";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { InputControl } from "@/components/InputControl";
import { PageHeader } from "@/components/PageHeader";
import { Select } from "@/components/Select";
import { useProjects } from "@/features/master-data/useMasterData";
import { AssignmentStatusBadge } from "@/features/assignments/AssignmentStatusBadge";
import { useAssignment, useUpdateAssignment } from "@/features/assignments/useAssignment";
import { EndAssignmentDocument, type AssignmentsQuery } from "@/generated/graphql";
import { errorMessage, mapAssignmentSubmitError } from "@/lib/errors";
import { useSessionRole } from "@/lib/auth/guard";
import { canManage } from "@/lib/auth/matrix";
import { TALENT_ASSIGNMENT } from "@/lib/constants/routes";

type AssignmentNode = AssignmentsQuery["assignments"]["edges"][number]["node"];

export default function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { status, data, error } = useAssignment(id);
  const manage = canManage(useSessionRole(), "assignments");

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={error ?? "Gagal memuat data."} />;
  if (!data) return notFound();

  const assignment = data;
  const isActive = assignment.status === "ACTIVE";

  return (
    <section className="flex flex-col gap-4">
      <Link href={TALENT_ASSIGNMENT} className="w-fit text-sm text-zinc-500 hover:text-zinc-900">
        ← Kembali ke daftar
      </Link>
      <PageHeader
        title={`${assignment.talent.fullName} — ${assignment.project.name}`}
        subtitle={assignment.id}
      />

      <Card className="max-w-2xl">
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Talent</dt>
            <dd className="text-zinc-900">
              {assignment.talent.fullName} ({assignment.talent.nomorInduk ?? "—"})
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Project</dt>
            <dd className="text-zinc-900">{assignment.project.name}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Periode</dt>
            <dd className="text-zinc-900">
              {assignment.periodStart} — {assignment.periodEnd ?? "sekarang"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Status</dt>
            <dd>
              <AssignmentStatusBadge status={assignment.status} />
            </dd>
          </div>
        </dl>
      </Card>

      {isActive && manage ? (
        <>
          <EditAssignmentForm assignment={assignment} />
          <EndAssignmentCard assignment={assignment} />
        </>
      ) : isActive ? null : (
        <p className="w-fit rounded-full bg-tp-tint-info px-4 py-1.5 text-sm text-tp-ink-info">
          Assignment selesai.
        </p>
      )}
    </section>
  );
}

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

/**
 * Form ubah assignment (gelombang K2 — G1/FR-05): hanya untuk assignment
 * berjalan. Project dipilih dari master data aktif; talent tidak
 * dapat diganti (bukan bagian `UpdateAssignmentInput`). Setelah simpan, entity
 * terbaru tertulis ke cache sehingga detail menampilkan versi terbaru.
 */
function EditAssignmentForm({ assignment }: { assignment: AssignmentNode }) {
  const projects = useProjects();
  const [updateAssignment, { loading: saving }] = useUpdateAssignment();
  const [values, setValues] = React.useState<EditFormValues>(() => toEditFormValues(assignment));
  const [errors, setErrors] = React.useState<Partial<Record<keyof EditFormValues, string>>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  if (projects.status === "loading")
    return <LoadingState label="Memuat master data…" />;
  if (projects.status === "error")
    return <ErrorState message={projects.error ?? "Gagal memuat project."} />;

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
    // FR-09 — perbandingan string ISO (YYYY-MM-DD), tanpa konversi Date yang
    // rawan geser zona waktu.
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
        // G5/K4 — penolakan server dipetakan ke pesan per field/pesan aksi
        // Indonesia (tanggal, duplikat aktif, cakupan) — konstitusi §IX.
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
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <InputControl label="Project" error={errors.projectId}>
          <Select
            value={values.projectId}
            onChange={(e) => set("projectId", e.target.value)}
            options={[
              { value: "", label: "— pilih project —" },
              ...activeProjects.map((p) => ({ value: p.id, label: p.name })),
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
        <InputControl label="Tanggal Selesai" error={errors.periodEnd} helper="(opsional)">
          <Input
            type="date"
            value={values.periodEnd}
            onChange={(e) => set("periodEnd", e.target.value)}
          />
        </InputControl>
        {formError ? (
          <p role="alert" className="text-sm text-red-700">
            {formError}
          </p>
        ) : null}
        {saved ? (
          <p role="status" className="text-sm text-green-700">
            Perubahan tersimpan.
          </p>
        ) : null}
        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            Simpan
          </Button>
        </div>
      </form>
    </Card>
  );
}

/**
 * Aksi akhiri assignment (gelombang K3 — G2+G6/FR-06, FR-09): Chapter
 * mengisi tanggal selesai — tanpa default otomatis, tanpa `toISOString()`.
 * Tanggal lebih awal dari mulai ditolak di klien sebelum dikirim.
 */
function EndAssignmentCard({ assignment }: { assignment: AssignmentNode }) {
  const [endAssignment, { loading, error: endError }] = useMutation(EndAssignmentDocument);
  const [periodEnd, setPeriodEnd] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!periodEnd) {
      setError("Tanggal selesai wajib diisi.");
      return;
    }
    if (periodEnd < assignment.periodStart) {
      setError("Tanggal selesai tidak boleh lebih awal dari tanggal mulai.");
      return;
    }
    setError(null);
    await endAssignment({
      onError: () => undefined,
      variables: { id: assignment.id, periodEnd },
    });
  }

  return (
    <Card className="flex max-w-2xl flex-col gap-3 border-amber-200 bg-amber-50">
      <p className="text-sm text-amber-800">
        Mengakhiri assignment ini akan menandainya <strong>selesai</strong> dan mengosongkan
        talent untuk tugas berikutnya. Isi tanggal selesai terlebih dahulu.
      </p>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <InputControl label="Tanggal Selesai" error={error}>
          <Input
            type="date"
            value={periodEnd}
            onChange={(e) => {
              setPeriodEnd(e.target.value);
              setError(null);
            }}
          />
        </InputControl>
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            Akhiri assignment
          </Button>
        </div>
      </form>
      {endError ? (
        <p role="alert" className="text-sm text-red-700">
          {errorMessage(endError, "Gagal mengakhiri assignment.")}
        </p>
      ) : null}
    </Card>
  );
}
