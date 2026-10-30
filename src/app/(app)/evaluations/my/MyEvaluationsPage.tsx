"use client";

import { Card } from "@/components/Card";
import { Chip } from "@/components/Chip";
import { EmptyState, LoadingState } from "@/components/DataState";
import { PageHeader } from "@/components/PageHeader";
import { ProfileErrorState } from "@/features/profile/ProfileErrorState";
import { useMyPerformanceEvaluations } from "@/features/evaluations/useMyPerformanceEvaluations";
import {
  ANSWER_TYPE_NOTE,
  EvaluationAnswerValue,
} from "@/features/evaluations/EvaluationAnswerValue";

export default function MyEvaluationsPage() {
  const { status, data, error, refetch } = useMyPerformanceEvaluations();

  if (status === "loading") {
    return (
      <section className="flex min-w-0 flex-col gap-4">
        <PageHeader subtitle="Evaluasi performa per periode." title="Evaluasi saya" />
        <LoadingState label="Memuat evaluasi…" />
      </section>
    );
  }
  if (status === "error") {
    return (
      <section className="flex min-w-0 flex-col gap-4">
        <PageHeader subtitle="Evaluasi performa per periode." title="Evaluasi saya" />
        <ProfileErrorState message={error ?? "Gagal memuat evaluasi."} onRetry={refetch} />
      </section>
    );
  }
  if (!data || data.length === 0) {
    return (
      <section className="flex min-w-0 flex-col gap-4">
        <PageHeader subtitle="Evaluasi performa per periode." title="Evaluasi saya" />
        <EmptyState message="Belum ada evaluasi performa untuk Anda pada periode ini." />
      </section>
    );
  }

  return (
    <section className="flex min-w-0 flex-col gap-4">
      <PageHeader
        actions={
          <Chip size="small" variant="neutral">
            Hanya baca · diisi evaluator
          </Chip>
        }
        subtitle="Evaluasi performa per periode."
        title="Evaluasi saya"
      />
      {data.map((evaluation) => {
        const submitted = evaluation.status === "SUBMITTED";
        return (
          <Card className="flex min-w-0 flex-col gap-4" key={evaluation.id}>
            <header className="flex min-w-0 flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <h2 className="tp-h3 break-words">{evaluation.period.name}</h2>
                <p className="tp-label">
                  {`${evaluation.period.startDate} s.d. ${evaluation.period.endDate} · diperbarui ${evaluation.updatedAt}`}
                </p>
              </div>
              <Chip size="small" variant={submitted ? "success" : "warning"}>
                {submitted ? "Diserahkan" : "Draf"}
              </Chip>
            </header>

            <dl className="grid grid-cols-1 gap-3 min-[860px]:grid-cols-2">
              <div className="min-w-0">
                <dt className="tp-label">Ringkasan pencapaian</dt>
                <dd className="mt-1 break-words text-sm leading-6 text-tp-text">
                  {evaluation.summaryAchievement?.trim() || "–"}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="tp-label">Catatan pengembangan</dt>
                <dd className="mt-1 break-words text-sm leading-6 text-tp-text">
                  {evaluation.developmentNotes?.trim() || "–"}
                </dd>
              </div>
            </dl>

            {evaluation.answers.length > 0 ? (
              <div className="min-w-0">
                <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-sm font-semibold text-tp-text">Kriteria</h3>
                  <span className="tp-label">
                    {`Skala mengikuti template periode · ${ANSWER_TYPE_NOTE[evaluation.answers[0].criterion.answerType]}`}
                  </span>
                </div>
                <ul className="mt-2 flex flex-col">
                  {evaluation.answers.map((answer) => (
                    <li
                      className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-t border-tp-line py-2.5 first:border-t-0 first:pt-0 last:pb-0"
                      key={answer.criterion.id}
                    >
                      <span className="min-w-0 break-words text-sm text-tp-text">
                        {answer.criterion.label}
                      </span>
                      <EvaluationAnswerValue
                        answer={answer}
                        answerType={answer.criterion.answerType}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {!submitted ? (
              <p className="border-t border-tp-line pt-3 text-[13px] leading-5 text-tp-muted">
                Status Draf berarti evaluator belum menyerahkan hasil; isinya tampil setelah
                diserahkan.
              </p>
            ) : null}
          </Card>
        );
      })}
    </section>
  );
}
