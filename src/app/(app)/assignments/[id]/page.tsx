"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import * as React from "react";
import { useMutation } from "@apollo/client";
import { ErrorState, LoadingState, StatusBadge } from "@/components/DataState";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { useAssignment } from "@/features/assignments/useAssignment";
import { EndAssignmentDocument } from "@/generated/graphql";

export default function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { status, data, error } = useAssignment(id);
  const [endAssignment, { loading }] = useMutation(EndAssignmentDocument);

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={error ?? "Gagal memuat data."} />;
  if (!data) return notFound();

  const assignment = data;
  const isActive = assignment.status === "ACTIVE";

  return (
    <section className="flex flex-col gap-4">
      <Link href="/assignments" className="w-fit text-sm text-zinc-500 hover:text-zinc-900">
        ← Kembali ke daftar
      </Link>
      <PageHeader
        title={`${assignment.talent.fullName} — ${assignment.project.name}`}
        subtitle={`${assignment.id} · ${assignment.jobRole.name}`}
      />

      <Card className="max-w-2xl">
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
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
              {assignment.periodStart} — {assignment.periodEnd ?? "sekarang"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Status</dt>
            <dd>
              <StatusBadge active={isActive} />
            </dd>
          </div>
        </dl>
      </Card>

      {isActive ? (
        <Card className="flex max-w-2xl flex-col gap-3 border-amber-200 bg-amber-50">
          <p className="text-sm text-amber-800">
            Mengakhiri assignment ini akan menandainya <strong>selesai</strong> dan mengosongkan
            talent untuk tugas berikutnya. Lanjutkan?
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              disabled={loading}
              onClick={() =>
                endAssignment({
                  variables: {
                    id,
                    periodEnd: assignment.periodEnd ?? new Date().toISOString().slice(0, 10),
                  },
                })
              }
            >
              Ya, akhiri assignment
            </Button>
          </div>
        </Card>
      ) : (
        <p className="w-fit rounded-full bg-brand-50 px-4 py-1.5 text-sm text-brand-700">
          Assignment selesai.
        </p>
      )}
    </section>
  );
}