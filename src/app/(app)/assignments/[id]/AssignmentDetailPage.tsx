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
import { useModuleAccess } from "@/lib/auth/access";
import { TALENT_ASSIGNMENT } from "@/lib/constants/routes";

type AssignmentNode = AssignmentsQuery["assignments"]["edges"][number]["node"];

export default function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { status, data, error } = useAssignment(id);
  const manage = useModuleAccess("assignments").canManage;

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={error ?? "Gagal memuat data."} />;
  if (!data) return notFound();

  const assignment = data;
  const isActive = assignment.status === "ACTIVE";

  return (
    <section className="flex flex-col gap-4">
      <Link className="w-fit text-sm text-zinc-500 hover:text-zinc-900" href={TALENT_ASSIGNMENT}>
        ← Kembali ke daftar
      </Link>
      <PageHeader
        subtitle={assignment.id}
        title={`${assignment.talent.fullName} — ${assignment.project.name}`}
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

function EditAssignmentForm({ assignment }: { assignment: AssignmentNode }) {
  const projects = useProjects();
  const [updateAssignment, { loading: saving }] = useUpdateAssignment();
  const [values, setValues] = React.useState<EditFormValues>(() => toEditFormValues(assignment));
  const [errors, setErrors] = React.useState<Partial<Record<keyof EditFormValues, string>>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  if (projects.status === "loading") return <LoadingState label="Memuat master data…" />;
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
        Mengakhiri assignment ini akan menandainya <strong>selesai</strong> dan mengosongkan talent
        untuk tugas berikutnya. Isi tanggal selesai terlebih dahulu.
      </p>
      <form className="flex flex-col gap-3" onSubmit={onSubmit}>
        <InputControl error={error} label="Tanggal Selesai">
          <Input
            onChange={(e) => {
              setPeriodEnd(e.target.value);
              setError(null);
            }}
            type="date"
            value={periodEnd}
          />
        </InputControl>
        <div className="flex gap-2">
          <Button disabled={loading} type="submit">
            Akhiri assignment
          </Button>
        </div>
      </form>
      {endError ? (
        <p className="text-sm text-red-700" role="alert">
          {errorMessage(endError, "Gagal mengakhiri assignment.")}
        </p>
      ) : null}
    </Card>
  );
}
