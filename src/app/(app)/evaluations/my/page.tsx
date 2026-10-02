"use client";

import * as React from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { Card } from "@/components/Card";
import { useMyPerformanceEvaluations } from "@/features/evaluations/useMyPerformanceEvaluations";
import type { EvaluationAnswerType } from "@/generated/graphql/types";

/**
 * Talent's own evaluations (read-only) — US7 / FR-27.
 * Renders every evaluation for the logged-in talent; answers are formatted per
 * answer type. Read-only by construction (no mutations here).
 */
export default function MyEvaluationsPage() {
  const { status, data, error } = useMyPerformanceEvaluations();

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={error ?? "Gagal memuat evaluasi."} />;
  if (!data || data.length === 0)
    return (
      <EmptyState message="Belum ada evaluasi performa untuk Anda pada periode ini." />
    );

  return (
    <section className="flex flex-col gap-4">
      {data.map((evaluation) => (
        <Card key={evaluation.id} className="flex flex-col gap-3">
          <header className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-zinc-900">{evaluation.period.name}</h2>
              <p className="text-xs text-zinc-500">
                {evaluation.period.startDate} — {evaluation.period.endDate}
              </p>
            </div>
            <span className="rounded-md bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
              {evaluation.status === "SUBMITTED" ? "Diserahkan" : "Draf"}
            </span>
          </header>

          <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-zinc-500">Ringkasan pencapaian</dt>
              <dd className="text-sm text-zinc-800">{evaluation.summaryAchievement || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Catatan pengembangan</dt>
              <dd className="text-sm text-zinc-800">{evaluation.developmentNotes || "—"}</dd>
            </div>
          </dl>

          <ul className="flex flex-col gap-1.5">
            {evaluation.answers.map((answer) => (
              <li key={answer.criterion.id} className="flex items-start justify-between gap-3 text-sm">
                <span className="text-zinc-700">{answer.criterion.label}</span>
                <span className="font-medium text-zinc-900">
                  {formatAnswer(answer.criterion.answerType, answer)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </section>
  );
}

function formatAnswer(
  answerType: EvaluationAnswerType,
  answer: { valueNumeric?: number | null; valueBool?: boolean | null; valueText?: string | null },
): string {
  if (answer.valueBool !== null && answer.valueBool !== undefined) return answer.valueBool ? "Ya" : "Tidak";
  if (answer.valueNumeric !== null && answer.valueNumeric !== undefined) return String(answer.valueNumeric);
  return answer.valueText || "—";
}