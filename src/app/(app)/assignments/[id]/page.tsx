"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import * as React from "react";
import { ErrorState, LoadingState, StatusBadge } from "@/components/DataState";
import { useAssignment } from "@/features/assignments/useAssignment";

export default function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { status, data, error } = useAssignment(id);
  const [ended, setEnded] = React.useState(false);

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={error ?? "Gagal memuat data."} />;
  if (!data) return notFound();

  const assignment = data;
  const isActive = !ended && assignment.status === "ACTIVE";

  return (
    <section className="flex flex-col gap-4">
      <Link href="/assignments" className="w-fit text-sm text-zinc-500 hover:text-zinc-900">
        ← Kembali ke daftar
      </Link>
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">
          {assignment.talent.fullName} — {assignment.project.name}
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          {assignment.id} · {assignment.jobRole.name}
        </p>
      </div>

      <dl className="grid max-w-2xl grid-cols-1 gap-3 rounded-md border border-zinc-200 bg-white p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">Talent</dt>
          <dd className="text-zinc-900">
            {assignment.talent.fullName} ({assignment.talent.employeeCode})
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">Project</dt>
          <dd className="text-zinc-900">{assignment.project.name}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">Job Role</dt>
          <dd className="text-zinc-900">{assignment.jobRole.name}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">Periode</dt>
          <dd className="text-zinc-900">
            {assignment.periodStart} — {ended ? "sekarang" : assignment.periodEnd ?? "sekarang"}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">Status</dt>
          <dd>
            <StatusBadge active={isActive} />
          </dd>
        </div>
      </dl>

      {isActive ? (
        <div className="flex max-w-2xl flex-col gap-3 rounded-md border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">
            Mengakhiri assignment ini akan menandainya <strong>selesai</strong> dan mengosongkan
            talent untuk tugas berikutnya. Lanjutkan?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEnded(true)}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
            >
              Ya, akhiri assignment
            </button>
          </div>
        </div>
      ) : (
        <p className="w-fit rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-500">
          Assignment selesai.
        </p>
      )}
    </section>
  );
}