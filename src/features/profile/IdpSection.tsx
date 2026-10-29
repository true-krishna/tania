"use client";

import Link from "next/link";
import { Card } from "@/components/Card";
import { Chip, type ChipVariant } from "@/components/Chip";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { IDP_STATUS_LABEL, IDP_STATUS_VARIANT } from "@/features/idp/labels";
import { useMyIdp } from "@/features/idp/talent/useMyIdp";
import { IDP_MY } from "@/lib/constants/routes";
import type {
  DevelopmentActionStatus,
  DevelopmentMethod,
  IdpStatus,
} from "@/generated/graphql/types";

const ACTION_STATUS_LABEL: Record<DevelopmentActionStatus, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
};

const ACTION_STATUS_VARIANT: Record<DevelopmentActionStatus, ChipVariant> = {
  TODO: "neutral",
  IN_PROGRESS: "info",
  COMPLETED: "success",
};

const METHOD_LABEL: Record<DevelopmentMethod, string> = {
  PROJECT_ASSIGNMENT: "Penugasan project",
  MENTORING: "Mentoring",
  TRAINING: "Training",
  CROSS_FUNCTIONAL_EXPOSURE: "Exposure lintas fungsi",
  SELF_STUDY: "Belajar mandiri",
};

export function IdpSection() {
  const { status, data, error } = useMyIdp();

  if (status === "loading") return <LoadingState label="Memuat IDP…" />;
  if (status === "error") return <ErrorState message={error ?? "Gagal memuat IDP."} />;
  if (!data) {
    return (
      <EmptyState message="Chapter belum membuat IDP untuk Anda. IDP akan muncul di sini setelah dibuat." />
    );
  }

  const completedActions = data.actions.filter((a) => a.status === "COMPLETED").length;

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <Card className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-zinc-900">Rencana pengembangan individu</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">
              {`${completedActions}/${data.actions.length} aksi selesai`}
            </span>
            <IdpStatusChip status={data.status} />
          </div>
        </div>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <Field label="Tujuan pengembangan" value={data.developmentObjective} />
          <Field label="Asesmen saat ini" value={data.currentAssessment} />
          <Field label="Analisis gap" value={data.gapAnalysis} />
          <Field label="Indikator keberhasilan" value={data.successIndicators} />
          <Field label="Periode" value={`${data.timelineStart} — ${data.timelineEnd}`} />
        </dl>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-zinc-900">Aksi pengembangan</h2>
        {data.actions.length ? (
          <ul className="flex flex-col gap-2">
            {data.actions.map((action) => (
              <li
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-board-border px-3 py-2"
                key={action.id}
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900">{action.description}</p>
                  <p className="text-xs text-zinc-500">
                    {METHOD_LABEL[action.method]} · Tenggat {action.dueDate ?? "—"}
                  </p>
                </div>
                <Chip size="small" variant={ACTION_STATUS_VARIANT[action.status]}>
                  {ACTION_STATUS_LABEL[action.status]}
                </Chip>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">Belum ada aksi pengembangan.</p>
        )}
        <Link className="text-sm font-medium text-zinc-900 hover:underline" href={IDP_MY}>
          Kelola IDP saya →
        </Link>
      </Card>
    </div>
  );
}

function IdpStatusChip({ status }: { status: IdpStatus }) {
  return (
    <Chip size="small" variant={IDP_STATUS_VARIANT[status]}>
      {IDP_STATUS_LABEL[status]}
    </Chip>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="text-zinc-900">{value}</dd>
    </div>
  );
}
