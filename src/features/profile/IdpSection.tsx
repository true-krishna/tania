"use client";

import Link from "next/link";
import { Card } from "@/components/Card";
import { Chip, type ChipVariant } from "@/components/Chip";
import { DescriptionItem } from "@/components/DescriptionItem";
import { EmptyState } from "@/components/DataState";
import type { MyIdp } from "@/features/idp/talent/useMyIdp";
import type { RefetchableQueryState } from "@/lib/apollo/toQueryState";
import { IDP_MY } from "@/lib/constants/routes";
import type { DevelopmentActionStatus, DevelopmentMethod } from "@/generated/graphql/types";
import { IdpStatusChip } from "./IdpStatusChip";
import { ProfileErrorState } from "./ProfileErrorState";
import { ProfilePanelSkeleton } from "./ProfilePanelSkeleton";

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

export function IdpSection({ idp }: { idp: RefetchableQueryState<MyIdp | undefined> }) {
  if (idp.status === "loading") return <ProfilePanelSkeleton label="Memuat IDP…" />;
  if (idp.status === "error") {
    return <ProfileErrorState message={idp.error ?? "Gagal memuat IDP."} onRetry={idp.refetch} />;
  }

  const data = idp.data;
  if (!data) {
    return (
      <EmptyState message="Chapter belum membuat IDP untuk Anda. IDP akan muncul di sini setelah dibuat." />
    );
  }

  const completedActions = data.actions.filter((action) => action.status === "COMPLETED").length;

  return (
    <div className="flex min-w-0 max-w-3xl flex-col gap-4">
      <Card className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-tp-text">Rencana pengembangan individu</h2>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-tp-muted">
              {`${completedActions}/${data.actions.length} aksi selesai`}
            </span>
            <IdpStatusChip status={data.status} />
          </div>
        </div>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <DescriptionItem label="Tujuan pengembangan" value={data.developmentObjective} />
          <DescriptionItem label="Asesmen saat ini" value={data.currentAssessment} />
          <DescriptionItem label="Analisis gap" value={data.gapAnalysis} />
          <DescriptionItem label="Indikator keberhasilan" value={data.successIndicators} />
          <DescriptionItem label="Periode" value={`${data.timelineStart} — ${data.timelineEnd}`} />
        </dl>
      </Card>

      <Card className="flex min-w-0 flex-col gap-3">
        <h2 className="text-sm font-semibold text-tp-text">Aksi pengembangan</h2>
        {data.actions.length ? (
          <ul className="flex flex-col gap-2">
            {data.actions.map((action) => (
              <li
                className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-tp-md border border-tp-line px-3 py-2"
                key={action.id}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-tp-text">{action.description}</p>
                  <p className="text-xs text-tp-muted">
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
          <p className="text-sm text-tp-muted">Belum ada aksi pengembangan.</p>
        )}
        <Link className="text-sm font-medium text-tp-brand-red-ink hover:underline" href={IDP_MY}>
          Kelola IDP saya →
        </Link>
      </Card>
    </div>
  );
}
