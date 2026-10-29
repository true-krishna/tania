"use client";

import Link from "next/link";
import * as React from "react";
import { useMutation } from "@apollo/client";
import { Button } from "@/components/Button";
import { InputControl } from "@/components/InputControl";
import { PageHeader } from "@/components/PageHeader";
import { useToast } from "@/components/Toast";
import { useModuleAccess } from "@/lib/auth/access";
import {
  SubmitPerformanceEvaluationDocument,
  UpsertPerformanceEvaluationDocument,
} from "@/generated/graphql";
import { EVALUATIONS } from "@/lib/constants/routes";
import { errorText } from "@/lib/errors";
import { answerToString, parseBool, parseNumeric, valueText } from "./answers";
import { CriterionInput } from "./CriterionInput";
import type { AnswerLike, CriterionLike, PeriodLike, TalentLike } from "./types";

const TEXTAREA =
  "rounded-md border border-surface-border bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-tp-brand-red focus:outline-none focus:ring-1 focus:ring-tp-brand-red disabled:bg-zinc-50 disabled:text-zinc-400";

export function EvaluationForm({
  period,
  criteria,
  talent,
  answers,
  evaluationId,
  evaluationStatus,
  employeeId,
}: {
  period: PeriodLike;
  criteria: CriterionLike[];
  talent: TalentLike | null;
  answers: AnswerLike[];
  evaluationId: string | null;
  evaluationStatus: string | null;
  employeeId: string;
}) {
  const [upsert, upsertState] = useMutation(UpsertPerformanceEvaluationDocument);
  const [submit, submitState] = useMutation(SubmitPerformanceEvaluationDocument);
  const { pushToast } = useToast();
  const canManageEvaluations = useModuleAccess("evaluations").canManage;

  const readOnly = period.state === "CLOSED" || !canManageEvaluations;

  const [answersState, setAnswersState] = React.useState<Record<string, string>>(() =>
    Object.fromEntries(answers.map((a) => [a.criterion.id, answerToString(a)])),
  );
  const [summary, setSummary] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [touched, setTouched] = React.useState(false);
  const busy = upsertState.loading || submitState.loading;

  function setAnswer(criterionId: string, value: string) {
    setAnswersState((a) => ({ ...a, [criterionId]: value }));
    setTouched(true);
  }

  function buildInput() {
    return {
      periodId: period.id,
      employeeId,
      summaryAchievement: summary || undefined,
      developmentNotes: notes || undefined,
      answers: criteria.map((criterion) => ({
        criterionId: criterion.id,
        valueNumeric: parseNumeric(answersState[criterion.id]),
        valueBool: parseBool(answersState[criterion.id]),
        valueText: valueText(answersState[criterion.id]),
      })),
    };
  }

  async function handleUpsert() {
    try {
      await upsert({ variables: { input: buildInput() } });
      pushToast("success", "Evaluasi disimpan sebagai draf.");
      setTouched(false);
    } catch (err) {
      pushToast("error", errorText(err, "Gagal menyimpan evaluasi."));
    }
  }

  async function handleSubmit() {
    try {
      const { data } = await upsert({ variables: { input: buildInput() } });
      const id = data?.upsertPerformanceEvaluation?.id ?? evaluationId;
      if (!id) throw new Error("Evaluasi belum tersimpan.");
      await submit({ variables: { id } });
      pushToast("success", "Evaluasi diserahkan.");
      setTouched(false);
    } catch (err) {
      pushToast("error", errorText(err, "Gagal menyerahkan evaluasi."));
    }
  }

  return (
    <section className="flex max-w-3xl flex-col gap-4">
      <PageHeader
        actions={
          <Link
            className="inline-flex items-center rounded-md border border-surface-border bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-50"
            href={EVALUATIONS}
          >
            ← Kembali
          </Link>
        }
        subtitle={`${period.name} · ${period.startDate} — ${period.endDate} · status: ${period.state}${readOnly ? " · hanya-baca" : ""}`}
        title={talent?.fullName ?? "Evaluasi Talent"}
      />

      <div className="flex flex-col gap-3 rounded-lg border border-board-border bg-board p-4 shadow-sm">
        {criteria.length === 0 ? (
          <p className="text-sm text-zinc-500">Template periode ini tidak memiliki kriteria.</p>
        ) : (
          criteria
            .slice()
            .sort((a, b) => a.position - b.position)
            .map((criterion) => (
              <div className="flex flex-col gap-1" key={criterion.id}>
                <InputControl label={`${criterion.position}. ${criterion.label}`}>
                  <CriterionInput
                    answerType={criterion.answerType}
                    disabled={readOnly || busy}
                    onChange={(v) => setAnswer(criterion.id, v)}
                    value={answersState[criterion.id] ?? ""}
                  />
                </InputControl>
              </div>
            ))
        )}

        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InputControl label="Ringkasan pencapaian">
            <textarea
              className={TEXTAREA}
              disabled={readOnly || busy}
              onChange={(e) => {
                setSummary(e.target.value);
                setTouched(true);
              }}
              rows={3}
              value={summary}
            />
          </InputControl>
          <InputControl label="Catatan pengembangan">
            <textarea
              className={TEXTAREA}
              disabled={readOnly || busy}
              onChange={(e) => {
                setNotes(e.target.value);
                setTouched(true);
              }}
              rows={3}
              value={notes}
            />
          </InputControl>
        </div>
      </div>

      {readOnly ? (
        <p className="text-xs text-zinc-500">{readOnlyNotice(period.state)}</p>
      ) : (
        <div className="flex gap-2">
          <Button
            disabled={busy || !touched}
            onClick={handleUpsert}
            type="button"
            variant="secondary"
          >
            Simpan draf
          </Button>
          <Button disabled={busy} onClick={handleSubmit} type="button">
            {evaluationStatus === "SUBMITTED" ? "Perbarui & serahkan" : "Serahkan"}
          </Button>
        </div>
      )}
    </section>
  );
}

function readOnlyNotice(state: PeriodLike["state"]): string {
  if (state === "CLOSED") return "Periode telah berakhir — evaluasi hanya-baca (FR-28).";
  return "Peran Anda hanya-baca untuk evaluasi ini (FR-15).";
}
