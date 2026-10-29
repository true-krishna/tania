"use client";

import { useMutation } from "@apollo/client";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { Card } from "@/components/Card";
import { Chip } from "@/components/Chip";
import { useToast } from "@/components/Toast";
import { AuthGuard } from "@/lib/auth/guard";
import { IDP_STATUS_LABEL, IDP_STATUS_VARIANT } from "@/features/idp/labels";
import { useMyIdp } from "@/features/idp/talent/useMyIdp";
import { MyIdpDocument, UpdateDevelopmentActionStatusDocument } from "@/generated/graphql";
import type { DevelopmentActionStatus, DevelopmentMethod } from "@/generated/graphql/types";
import { DescriptionItem } from "@/components/DescriptionItem";
import { errorText } from "@/lib/errors";

const ACTION_STATUS_LABEL: Record<DevelopmentActionStatus, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
};

const METHOD_LABEL: Record<DevelopmentMethod, string> = {
  PROJECT_ASSIGNMENT: "Penugasan project",
  MENTORING: "Mentoring",
  TRAINING: "Training",
  CROSS_FUNCTIONAL_EXPOSURE: "Exposure lintas fungsi",
  SELF_STUDY: "Belajar mandiri",
};

export function MyIdpViewContent() {
  const { status, data, error } = useMyIdp();

  const [updateActionStatus] = useMutation(UpdateDevelopmentActionStatusDocument, {
    refetchQueries: [{ query: MyIdpDocument }],
  });

  const { pushToast } = useToast();

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={error ?? "Gagal memuat IDP."} />;
  if (!data)
    return (
      <AuthGuard module="idp">
        <section className="flex flex-col gap-4">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">IDP Saya</h1>
          <EmptyState message="Chapter belum membuat IDP untuk Anda. IDP akan muncul di sini setelah dibuat." />
        </section>
      </AuthGuard>
    );

  const idp = data;
  const completedActions = idp.actions.filter((a) => a.status === "COMPLETED").length;

  async function handleUpdateStatus(actionId: string, next: DevelopmentActionStatus) {
    try {
      await updateActionStatus({ variables: { id: actionId, status: next } });
      pushToast("success", "Status aksi diperbarui.");
    } catch (err) {
      pushToast("error", errorText(err, "Gagal memperbarui status aksi."));
    }
  }

  return (
    <AuthGuard module="idp">
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">IDP Saya</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Rencana pengembangan individu Anda ({idp.id}).
            </p>
          </div>
          <Chip size="small" variant={IDP_STATUS_VARIANT[idp.status]}>
            {IDP_STATUS_LABEL[idp.status]}
          </Chip>
        </div>

        <Card className="flex flex-col gap-4">
          <h2 className="text-base font-semibold text-zinc-900">Tujuan & Asesmen</h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DescriptionItem
              label="Tujuan pengembangan"
              value={idp.developmentObjective}
              variant="compact"
            />
            <DescriptionItem
              label="Asesmen saat ini"
              value={idp.currentAssessment}
              variant="compact"
            />
            <DescriptionItem label="Analisis gap" value={idp.gapAnalysis} variant="compact" />
            <DescriptionItem
              label="Indikator keberhasilan"
              value={idp.successIndicators}
              variant="compact"
            />
            <DescriptionItem
              label="Periode"
              value={`${idp.timelineStart} — ${idp.timelineEnd}`}
              variant="compact"
            />
          </dl>
        </Card>

        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-900">Aksi Pengembangan</h2>
            <span className="text-xs text-zinc-500">
              {`${completedActions}/${idp.actions.length} selesai`}
            </span>
          </div>
          {idp.actions.length ? (
            <ul className="flex flex-col gap-2">
              {idp.actions.map((action) => (
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
                  <select
                    aria-label={`Status aksi: ${action.description}`}
                    className="rounded-md border border-surface-border bg-white px-2 py-1 text-xs font-medium text-zinc-700 shadow-sm focus:border-tp-brand-red"
                    onChange={(e) =>
                      handleUpdateStatus(action.id, e.target.value as DevelopmentActionStatus)
                    }
                    value={action.status}
                  >
                    {(Object.keys(ACTION_STATUS_LABEL) as DevelopmentActionStatus[]).map((s) => (
                      <option key={s} value={s}>
                        {ACTION_STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500">Belum ada aksi pengembangan.</p>
          )}
        </Card>

        <Card className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-zinc-900">Riwayat Review</h2>
          {idp.reviews.length ? (
            <ul className="flex flex-col gap-2">
              {idp.reviews.map((review) => (
                <li
                  className="rounded-md border border-board-border px-3 py-2 text-sm"
                  key={review.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-zinc-900">
                      {review.reviewDate} · {review.createdBy?.fullName ?? "—"}
                    </span>
                  </div>
                  <p className="mt-1 text-zinc-700">{review.summary}</p>
                  {review.followUp ? (
                    <p className="mt-1 text-xs text-zinc-500">Tindak lanjut: {review.followUp}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500">Belum ada review.</p>
          )}
        </Card>

        <Card className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-zinc-900">Riwayat Revisi</h2>
          {idp.revisions.length ? (
            <ul className="flex flex-col gap-2">
              {idp.revisions.map((rev) => (
                <li
                  className="rounded-md border border-board-border px-3 py-2 text-sm"
                  key={rev.id}
                >
                  <span className="font-medium text-zinc-900">Revisi {rev.revisionNo}</span>
                  <p className="mt-1 text-zinc-700">{rev.changeNote}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {rev.createdAt} · {rev.changedBy?.fullName ?? "—"}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500">Belum ada revisi.</p>
          )}
        </Card>
      </section>
    </AuthGuard>
  );
}
