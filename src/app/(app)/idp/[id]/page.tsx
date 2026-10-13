"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import * as React from "react";
import { useMutation } from "@apollo/client";
import { ErrorState, LoadingState } from "@/components/DataState";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { PageHeader } from "@/components/PageHeader";
import { Select } from "@/components/Select";
import { ToastStack } from "@/components/Toast";
import { useIdp } from "@/features/idp/useIdp";
import {
  AddDevelopmentActionDocument,
  AddIdpReviewDocument,
  CloseIdpDocument,
  IdpDocument,
  UpdateDevelopmentActionStatusDocument,
} from "@/generated/graphql";
import { cn } from "@/lib/cn";
import type {
  DevelopmentActionStatus,
  DevelopmentMethod,
  IdpStatus,
} from "@/generated/graphql/types";

const STATUS_LABEL: Record<IdpStatus, string> = {
  IN_PROGRESS: "Berjalan",
  NEEDS_REVIEW: "Perlu review",
  COMPLETED: "Selesai",
};

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

const BLOCK =
  "w-full rounded-md border border-surface-border bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm";

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</span>
      {children}
    </div>
  );
}

function Definition({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-wrap text-sm text-zinc-900">{value}</dd>
    </div>
  );
}

type ToastItem = { id: number; variant: "error" | "success"; message: string };

export default function IdpDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { status, data, error } = useIdp(id);

  const [addAction, { loading: addingAction }] = useMutation(AddDevelopmentActionDocument, {
    refetchQueries: [{ query: IdpDocument, variables: { id } }],
  });
  const [updateActionStatus] = useMutation(UpdateDevelopmentActionStatusDocument, {
    refetchQueries: [{ query: IdpDocument, variables: { id } }],
  });
  const [addReview, { loading: addingReview }] = useMutation(AddIdpReviewDocument, {
    refetchQueries: [{ query: IdpDocument, variables: { id } }],
  });
  const [closeIdp, { loading: closing }] = useMutation(CloseIdpDocument, {
    refetchQueries: [{ query: IdpDocument, variables: { id } }],
  });

  // Local form state — one per collapsible section so interactions stay independent.
  const [actionDesc, setActionDesc] = React.useState("");
  const [actionMethod, setActionMethod] = React.useState<DevelopmentMethod>("TRAINING");
  const [actionDue, setActionDue] = React.useState("");
  const [actionError, setActionError] = React.useState<string | null>(null);

  const [reviewDate, setReviewDate] = React.useState("");
  const [reviewSummary, setReviewSummary] = React.useState("");
  const [reviewFollowUp, setReviewFollowUp] = React.useState("");
  const [reviewError, setReviewError] = React.useState<string | null>(null);

  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const toastId = React.useRef(0);

  function addToast(variant: ToastItem["variant"], message: string) {
    toastId.current += 1;
    const id = toastId.current;
    setToasts((prev) => [...prev, { id, variant, message }]);
    setTimeout(() => dismissToast(id), 4000);
    return id;
  }

  function dismissToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={error ?? "Gagal memuat data."} />;
  if (!data) return notFound();

  const idp = data;
  const completedActions = idp.actions.filter((a) => a.status === "COMPLETED").length;

  async function handleAddAction(e: React.FormEvent) {
    e.preventDefault();
    if (!actionDesc.trim()) {
      setActionError("Deskripsi aksi wajib diisi.");
      return;
    }
    setActionError(null);
    try {
      await addAction({
        variables: {
          idpId: id,
          input: { description: actionDesc.trim(), method: actionMethod, dueDate: actionDue || undefined },
        },
      });
      setActionDesc("");
      setActionDue("");
      addToast("success", "Aksi pengembangan ditambahkan.");
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Gagal menambah aksi.");
    }
  }

  async function handleAddReview(e: React.FormEvent) {
    e.preventDefault();
    if (!reviewDate || !reviewSummary.trim()) {
      setReviewError("Tanggal dan ringkasan hasil wajib diisi.");
      return;
    }
    setReviewError(null);
    try {
      await addReview({
        variables: {
          idpId: id,
          input: { reviewDate, summary: reviewSummary.trim(), followUp: reviewFollowUp.trim() || undefined },
        },
      });
      setReviewDate("");
      setReviewSummary("");
      setReviewFollowUp("");
      addToast("success", "Hasil review dicatat.");
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Gagal mencatat review.");
    }
  }

  async function handleClose() {
    try {
      await closeIdp({ variables: { id } });
      addToast("success", "IDP ditutup.");
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Gagal menutup IDP.");
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <Link href="/idp" className="w-fit text-sm text-zinc-500 hover:text-zinc-900">
        ← Kembali ke daftar
      </Link>
      <PageHeader
        title={`IDP — ${idp.talent.fullName}`}
        subtitle={`${idp.id} · ${idp.talent.jobRole?.name ?? "—"}`}
        actions={
          <span
            className={cn(
              "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold",
              idp.status === "COMPLETED" && "bg-green-100 text-green-700",
              idp.status === "NEEDS_REVIEW" && "bg-amber-100 text-amber-700",
              idp.status === "IN_PROGRESS" && "bg-tp-tint-info text-tp-ink-info",
            )}
          >
            {STATUS_LABEL[idp.status]}
          </span>
        }
      />

      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      <Card className="max-w-3xl">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">Komponen IDP</h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Definition label="Development Objective" value={idp.developmentObjective} />
          <Definition label="Penilaian Kondisi Saat Ini" value={idp.currentAssessment} />
          <Definition label="Identifikasi Gap" value={idp.gapAnalysis} />
          <Definition label="Success Indicators" value={idp.successIndicators} />
          <Definition label="Timeline & Milestone" value={`${idp.timelineStart} — ${idp.timelineEnd}`} />
        </dl>
      </Card>

      <Card className="max-w-3xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Aksi Pengembangan ({completedActions}/{idp.actions.length})
          </h2>
        </div>

        {idp.actions.length === 0 ? (
          <p className="text-sm text-zinc-500">Belum ada aksi pengembangan.</p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {idp.actions.map((action) => (
              <li key={action.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex-1">
                  <p className="text-sm text-zinc-900">{action.description}</p>
                  <p className="text-xs text-zinc-500">
                    {METHOD_LABEL[action.method]}
                    {action.dueDate ? ` · tenggat ${action.dueDate}` : ""}
                  </p>
                </div>
                <Select
                  aria-label={`Status aksi ${action.description}`}
                  className="w-auto py-1 text-xs"
                  value={action.status}
                  onChange={(e) => {
                    const status = e.target.value as DevelopmentActionStatus;
                    updateActionStatus({ variables: { id: action.id, status } }).catch((err: unknown) => {
                      addToast("error", err instanceof Error ? err.message : "Gagal memperbarui status aksi.");
                    });
                  }}
                >
                  {(["TODO", "IN_PROGRESS", "COMPLETED"] as DevelopmentActionStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {ACTION_STATUS_LABEL[s]}
                    </option>
                  ))}
                </Select>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleAddAction} className="mt-4 flex flex-col gap-3 border-t border-zinc-100 pt-4">
          <h3 className="text-sm font-medium text-zinc-700">Tambah aksi pengembangan</h3>
          <Field label="Deskripsi / tindakan">
            <Input value={actionDesc} onChange={(e) => setActionDesc(e.target.value)} placeholder="Mis. Ikuti training Go lanjutan" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Metode">
              <Select value={actionMethod} onChange={(e) => setActionMethod(e.target.value as DevelopmentMethod)}>
                {(Object.keys(METHOD_LABEL) as DevelopmentMethod[]).map((m) => (
                  <option key={m} value={m}>
                    {METHOD_LABEL[m]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Tenggat (opsional)">
              <Input type="date" value={actionDue} onChange={(e) => setActionDue(e.target.value)} />
            </Field>
          </div>
          {actionError ? <p className="text-xs text-red-600">{actionError}</p> : null}
          <div>
            <Button type="submit" disabled={addingAction}>
              Tambah aksi
            </Button>
          </div>
        </form>
      </Card>

      <Card className="max-w-3xl">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">Riwayat Review</h2>
        {idp.reviews.length === 0 ? (
          <p className="text-sm text-zinc-500">Belum ada catatan review.</p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {idp.reviews.map((review) => (
              <li key={review.id} className="py-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-900">
                    {review.reviewDate}
                    {review.createdBy ? ` · ${review.createdBy.fullName ?? "Chapter"}` : ""}
                  </p>
                </div>
                <p className="mt-1 text-sm text-zinc-600">{review.summary}</p>
                {review.followUp ? (
                  <p className="mt-1 text-xs text-zinc-500">Tindak lanjut: {review.followUp}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleAddReview} className="mt-4 flex flex-col gap-3 border-t border-zinc-100 pt-4">
          <h3 className="text-sm font-medium text-zinc-700">Catat hasil review</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Tanggal review">
              <Input type="date" aria-label="Tanggal review" value={reviewDate} onChange={(e) => setReviewDate(e.target.value)} />
            </Field>
          </div>
          <Field label="Ringkasan hasil">
            <textarea
              className={BLOCK}
              rows={3}
              aria-label="Ringkasan hasil"
              value={reviewSummary}
              onChange={(e) => setReviewSummary(e.target.value)}
              placeholder="Catat perkembangan talent sejak review terakhir…"
            />
          </Field>
          <Field label="Tindak lanjut (opsional)">
            <textarea
              className={BLOCK}
              rows={2}
              aria-label="Tindak lanjut"
              value={reviewFollowUp}
              onChange={(e) => setReviewFollowUp(e.target.value)}
            />
          </Field>
          {reviewError ? <p className="text-xs text-red-600">{reviewError}</p> : null}
          <div>
            <Button type="submit" disabled={addingReview}>
              Simpan review
            </Button>
          </div>
        </form>
      </Card>

      <Card className="max-w-3xl">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">Riwayat Revisi</h2>
        {idp.revisions.length === 0 ? (
          <p className="text-sm text-zinc-500">Belum ada revisi dokumen.</p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {idp.revisions.map((rev) => (
              <li key={rev.id} className="py-2.5">
                <p className="text-sm text-zinc-900">
                  Revisi #{rev.revisionNo}
                  <span className="text-xs text-zinc-500"> · {rev.createdAt}</span>
                </p>
                {rev.changeNote ? <p className="mt-0.5 text-sm text-zinc-600">{rev.changeNote}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {idp.status !== "COMPLETED" ? (
        <Card className="flex max-w-3xl flex-col gap-3 border-amber-200 bg-amber-50">
          <p className="text-sm text-amber-800">
            Tutup IDP ini saat success indicators sudah dievaluasi pada review (status →{" "}
            <strong>selesai</strong>).
          </p>
          <div>
            <Button
              type="button"
              variant="secondary"
              disabled={closing}
              onClick={handleClose}
              className="border-amber-300 bg-white text-amber-900 hover:bg-amber-100"
            >
              Tutup IDP
            </Button>
          </div>
        </Card>
      ) : (
        <p className="w-fit rounded-full bg-green-100 px-4 py-1.5 text-sm text-green-700">IDP selesai.</p>
      )}
    </section>
  );
}