"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ErrorState, LoadingState } from "@/components/DataState";
import { useCurrentEvaluationPeriod } from "@/features/evaluations/useCurrentEvaluationPeriod";
import { useEvaluationRoster } from "@/features/evaluations/useEvaluationRoster";
import { usePerformanceEvaluation } from "@/features/evaluations/usePerformanceEvaluation";
import { EVALUATIONS } from "@/lib/constants/routes";
import { EvaluationForm } from "./EvaluationForm";
import type { PeriodLike } from "./types";

function resolvePeriod(
  evaluated: PeriodLike | null | undefined,
  current: PeriodLike | null | undefined,
  periodId: string,
): PeriodLike | null {
  if (evaluated && evaluated.id === periodId) return evaluated;
  if (current && current.id === periodId) return current;
  return null;
}

export default function EvaluationFormPage() {
  const params = useParams<{ periodId: string; employeeId: string }>();
  const periodId = params?.periodId;
  const employeeId = params?.employeeId;
  const draft = usePerformanceEvaluation(periodId, employeeId);
  const current = useCurrentEvaluationPeriod();
  const roster = useEvaluationRoster(current.data?.id ?? null);

  if (draft.status === "loading" || current.status === "loading" || roster.status === "loading")
    return <LoadingState />;
  if (draft.status === "error")
    return <ErrorState message={draft.error ?? "Gagal memuat evaluasi."} />;
  if (current.status === "error")
    return <ErrorState message={current.error ?? "Gagal memuat periode evaluasi."} />;
  if (roster.status === "error")
    return <ErrorState message={roster.error ?? "Gagal memuat roster evaluasi."} />;

  const evaluation = draft.data;
  const rosterEntry = roster.data?.find((e) => e.talent.id === employeeId);
  const talent = evaluation?.talent ?? rosterEntry?.talent ?? null;
  const period = resolvePeriod(evaluation?.period, current.data, periodId ?? "");
  const criteria = period?.template?.criteria ?? [];

  if (!period) {
    return (
      <section className="flex flex-col gap-4">
        <ErrorState message="Periode evaluasi tidak ditemukan atau akses ditolak." />
        <Link
          className="text-sm font-medium text-tp-brand-red-deep hover:underline"
          href={EVALUATIONS}
        >
          ← Kembali ke roster
        </Link>
      </section>
    );
  }

  return (
    <EvaluationForm
      answers={evaluation?.answers ?? []}
      criteria={criteria}
      employeeId={employeeId ?? ""}
      evaluationId={evaluation?.id ?? null}
      evaluationStatus={evaluation?.status ?? null}
      key={`${period.id}-${evaluation?.id ?? "new"}`}
      period={period}
      talent={talent}
    />
  );
}
