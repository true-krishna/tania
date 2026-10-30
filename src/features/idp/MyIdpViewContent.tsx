"use client";

import { useMutation } from "@apollo/client";
import { AccessDenied } from "@/components/AccessDenied";
import { Card } from "@/components/Card";
import { Chip } from "@/components/Chip";
import { EmptyState, LoadingState } from "@/components/DataState";
import { DescriptionItem } from "@/components/DescriptionItem";
import { PageHeader } from "@/components/PageHeader";
import { useToast } from "@/components/Toast";
import { ProfileErrorState } from "@/features/profile/ProfileErrorState";
import { IdpProgressBar } from "@/features/idp/IdpProgressBar";
import { useModuleAccess } from "@/lib/auth/access";
import { IDP_STATUS_LABEL, IDP_STATUS_VARIANT } from "@/features/idp/labels";
import { useMyIdp } from "@/features/idp/talent/useMyIdp";
import { MyIdpDocument, UpdateDevelopmentActionStatusDocument } from "@/generated/graphql";
import type { DevelopmentActionStatus, DevelopmentMethod } from "@/generated/graphql/types";
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
  const access = useModuleAccess("idp");
  const { status, data, error, refetch } = useMyIdp({ skip: access.pending || !access.canRead });

  const [updateActionStatus] = useMutation(UpdateDevelopmentActionStatusDocument, {
    refetchQueries: [{ query: MyIdpDocument }],
  });

  const { pushToast } = useToast();

  if (access.pending) return null;
  if (!access.canRead) return <AccessDenied />;

  if (status === "loading") {
    return (
      <section className="flex min-w-0 flex-col gap-4">
        <PageHeader subtitle="Rencana pengembangan individu Anda." title="IDP saya" />
        <LoadingState label="Memuat IDP…" />
      </section>
    );
  }
  if (status === "error") {
    return (
      <section className="flex min-w-0 flex-col gap-4">
        <PageHeader subtitle="Rencana pengembangan individu Anda." title="IDP saya" />
        <ProfileErrorState message={error ?? "Gagal memuat IDP."} onRetry={refetch} />
      </section>
    );
  }
  if (!data) {
    return (
      <section className="flex min-w-0 flex-col gap-4">
        <PageHeader subtitle="Rencana pengembangan individu Anda." title="IDP saya" />
        <EmptyState message="Chapter belum membuat IDP untuk Anda. IDP akan muncul di sini setelah dibuat." />
      </section>
    );
  }

  const idp = data;
  const completedActions = idp.actions.filter((action) => action.status === "COMPLETED").length;
  const totalActions = idp.actions.length;

  async function handleUpdateStatus(actionId: string, next: DevelopmentActionStatus) {
    try {
      await updateActionStatus({ variables: { id: actionId, status: next } });
      pushToast("success", "Status aksi diperbarui.");
    } catch (err) {
      pushToast("error", errorText(err, "Gagal memperbarui status aksi."));
    }
  }

  return (
    <section className="flex min-w-0 flex-col gap-4">
      <PageHeader
        actions={
          <Chip variant={IDP_STATUS_VARIANT[idp.status]}>{IDP_STATUS_LABEL[idp.status]}</Chip>
        }
        subtitle="Rencana pengembangan individu, dibuat dan direview Chapter."
        title="IDP saya"
      />

      <div className="grid grid-cols-1 gap-3 min-[860px]:grid-cols-2">
        <Card className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-2">
            <h2 className="tp-h3">Periode & progres aksi</h2>
            <span className="tp-label">{`${completedActions}/${totalActions} selesai`}</span>
          </div>
          <p className="mt-2 text-sm text-tp-text">{`${idp.timelineStart} s.d. ${idp.timelineEnd}`}</p>
          <div className="mt-3">
            <IdpProgressBar completed={completedActions} total={totalActions} />
          </div>
          <p className="tp-label mt-3 leading-5">
            Progres dihitung dari status aksi di bawah; Anda memperbarui status tiap aksi, Chapter
            menyetujui penyelesaian IDP.
          </p>
        </Card>

        <Card className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
            <h2 className="tp-h3">Tujuan & asesmen</h2>
            <Chip size="small" variant="neutral">
              Disusun Chapter
            </Chip>
          </div>
          <dl className="mt-3 grid grid-cols-1 gap-4">
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
          </dl>
        </Card>
      </div>

      <Card className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
          <h2 className="tp-h3">Aksi pengembangan</h2>
          <span className="tp-label">{`${completedActions}/${totalActions} selesai`}</span>
        </div>
        {totalActions > 0 ? (
          <ul className="mt-3 flex flex-col">
            {idp.actions.map((action) => (
              <li
                className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-t border-tp-line py-3 first:border-t-0 first:pt-0 last:pb-0"
                key={action.id}
              >
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold text-tp-text">
                    {action.description}
                  </p>
                  <p className="text-[13px] text-tp-muted">
                    {`${METHOD_LABEL[action.method]} · Tenggat ${action.dueDate ?? "—"}`}
                  </p>
                </div>
                <label className="flex min-w-0 items-center gap-2">
                  <span className="sr-only">{`Status aksi: ${action.description}`}</span>
                  <select
                    className="min-h-[44px] rounded-full border border-tp-line bg-tp-surface px-3 text-sm font-semibold text-tp-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tp-brand-red"
                    onChange={(event) =>
                      handleUpdateStatus(action.id, event.target.value as DevelopmentActionStatus)
                    }
                    value={action.status}
                  >
                    {(Object.keys(ACTION_STATUS_LABEL) as DevelopmentActionStatus[]).map(
                      (state) => (
                        <option key={state} value={state}>
                          {ACTION_STATUS_LABEL[state]}
                        </option>
                      ),
                    )}
                  </select>
                </label>
              </li>
            ))}
          </ul>
        ) : (
          <p className="tp-empty mt-3">
            <strong>Belum ada aksi pengembangan</strong>
            Chapter belum menambahkan aksi pada IDP ini.
          </p>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-3 min-[860px]:grid-cols-2">
        <Card className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
            <h2 className="tp-h3">Review Chapter</h2>
            <span className="tp-label">{`${idp.reviews.length} terdata`}</span>
          </div>
          {idp.reviews.length ? (
            <ul className="mt-3 flex flex-col">
              {idp.reviews.map((review) => (
                <li
                  className="min-w-0 border-t border-tp-line py-3 first:border-t-0 first:pt-0 last:pb-0"
                  key={review.id}
                >
                  <p className="text-sm font-semibold text-tp-text">
                    {`Review ${review.reviewDate} · ${review.createdBy?.fullName ?? "Chapter"}`}
                  </p>
                  <p className="mt-1 text-[13px] leading-5 text-tp-text">{review.summary}</p>
                  {review.followUp ? (
                    <p className="mt-1 text-[13px] leading-5 text-tp-muted">
                      {`Tindak lanjut: ${review.followUp}`}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="tp-empty mt-3">Belum ada review dari Chapter.</p>
          )}
        </Card>

        <Card className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
            <h2 className="tp-h3">Revisi rencana</h2>
            <Chip size="small" variant="neutral">
              Hanya baca
            </Chip>
          </div>
          {idp.revisions.length ? (
            <ul className="mt-3 flex flex-col">
              {idp.revisions.map((revision) => (
                <li
                  className="min-w-0 border-t border-tp-line py-3 first:border-t-0 first:pt-0 last:pb-0"
                  key={revision.id}
                >
                  <p className="text-sm font-semibold text-tp-text">
                    {`Revisi ${revision.revisionNo}: ${revision.changeNote}`}
                  </p>
                  <p className="mt-1 text-[13px] text-tp-muted">
                    {`${revision.createdAt} · ${revision.changedBy?.fullName ?? "Chapter"}`}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="tp-empty mt-3">Belum ada revisi rencana.</p>
          )}
        </Card>
      </div>
    </section>
  );
}
