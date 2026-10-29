"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import * as React from "react";
import { ErrorState, LoadingState } from "@/components/DataState";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { AssignmentStatusBadge } from "@/features/assignments/AssignmentStatusBadge";
import { useAssignment } from "@/features/assignments/useAssignment";
import { useModuleAccess } from "@/lib/auth/access";
import { TALENT_ASSIGNMENT } from "@/lib/constants/routes";
import { AssignmentActions } from "./AssignmentActions";

export default function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { status, data, error } = useAssignment(id);
  const manage = useModuleAccess("assignments").canManage;

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={error ?? "Gagal memuat data."} />;
  if (!data) return notFound();

  return (
    <section className="flex flex-col gap-4">
      <Link className="w-fit text-sm text-zinc-500 hover:text-zinc-900" href={TALENT_ASSIGNMENT}>
        ← Kembali ke daftar
      </Link>
      <PageHeader subtitle={data.id} title={`${data.talent.fullName} — ${data.project.name}`} />

      <Card className="max-w-2xl">
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Talent</dt>
            <dd className="text-zinc-900">
              {data.talent.fullName} ({data.talent.nomorInduk ?? "—"})
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Project</dt>
            <dd className="text-zinc-900">{data.project.name}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Periode</dt>
            <dd className="text-zinc-900">
              {data.periodStart} — {data.periodEnd ?? "sekarang"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Status</dt>
            <dd>
              <AssignmentStatusBadge status={data.status} />
            </dd>
          </div>
        </dl>
      </Card>

      <AssignmentActions assignment={data} manage={manage} />
    </section>
  );
}
