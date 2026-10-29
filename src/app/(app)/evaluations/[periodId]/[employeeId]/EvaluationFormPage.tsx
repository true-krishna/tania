"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import * as React from "react";
import { useMutation } from "@apollo/client";
import { Button } from "@/components/Button";
import { ErrorState, LoadingState } from "@/components/DataState";
import { Input } from "@/components/Input";
import { InputControl } from "@/components/InputControl";
import { PageHeader } from "@/components/PageHeader";
import { useToast } from "@/components/Toast";
import { useCurrentEvaluationPeriod } from "@/features/evaluations/useCurrentEvaluationPeriod";
import { useEvaluationRoster } from "@/features/evaluations/useEvaluationRoster";
import { usePerformanceEvaluation } from "@/features/evaluations/usePerformanceEvaluation";
import {
  SubmitPerformanceEvaluationDocument,
  UpsertPerformanceEvaluationDocument,
} from "@/generated/graphql";
import { useModuleAccess } from "@/lib/auth/access";
import type { EvaluationAnswerType, EvaluationPeriodState } from "@/generated/graphql/types";
import { EVALUATIONS } from "@/lib/constants/routes";
import { errorText } from "@/lib/errors";

type CriterionLike = {
  id: string;
  label: string;
  answerType: EvaluationAnswerType;
  position: number;
};

type PeriodLike = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  state: EvaluationPeriodState;
  template: { criteria: CriterionLike[] } | null;
};

type TalentLike = { id: string; fullName: string; nomorInduk?: string | null };

type AnswerLike = {
  criterion: Pick<CriterionLike, "id" | "answerType">;
  valueNumeric?: number | null;
  valueBool?: boolean | null;
  valueText?: string | null;
};

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
  const evalPeriod = evaluation?.period;
  const currentPeriod = current.data;
  const rosterEntry = roster.data?.find((e) => e.talent.id === employeeId);
  const talent = evaluation?.talent ?? rosterEntry?.talent ?? null;

  const period =
    evalPeriod && evalPeriod.id === periodId
      ? evalPeriod
      : currentPeriod && currentPeriod.id === periodId
        ? currentPeriod
        : null;
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

function EvaluationForm({
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
    Object.fromEntries(
      answers.map((a) => [a.criterion.id, answerToString(a.criterion.answerType, a)]),
    ),
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
              className="rounded-md border border-surface-border bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-tp-brand-red focus:outline-none focus:ring-1 focus:ring-tp-brand-red disabled:bg-zinc-50 disabled:text-zinc-400"
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
              className="rounded-md border border-surface-border bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-tp-brand-red focus:outline-none focus:ring-1 focus:ring-tp-brand-red disabled:bg-zinc-50 disabled:text-zinc-400"
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
        <p className="text-xs text-zinc-500">
          {period.state === "CLOSED"
            ? "Periode telah berakhir — evaluasi hanya-baca (FR-28)."
            : "Peran Anda hanya-baca untuk evaluasi ini (FR-15)."}
        </p>
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

function CriterionInput({
  answerType,
  value,
  disabled,
  onChange,
}: {
  answerType: EvaluationAnswerType;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  if (answerType === "YES_NO") {
    return (
      <select
        className="rounded-md border border-surface-border bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-tp-brand-red focus:outline-none focus:ring-1 focus:ring-tp-brand-red disabled:bg-zinc-50 disabled:text-zinc-400"
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        value={value}
      >
        <option value="">— pilih —</option>
        <option value="yes">Ya</option>
        <option value="no">Tidak</option>
      </select>
    );
  }
  if (answerType === "SCALE_1_5" || answerType === "SCALE_1_10") {
    const max = answerType === "SCALE_1_5" ? 5 : 10;
    return (
      <select
        className="rounded-md border border-surface-border bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-tp-brand-red focus:outline-none focus:ring-1 focus:ring-tp-brand-red disabled:bg-zinc-50 disabled:text-zinc-400"
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        value={value}
      >
        <option value="">— pilih —</option>
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <option key={n} value={String(n)}>
            {n}
          </option>
        ))}
      </select>
    );
  }
  return (
    <Input
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Jawaban teks bebas"
      value={value}
    />
  );
}

function answerToString(
  answerType: EvaluationAnswerType,
  value: { valueNumeric?: number | null; valueBool?: boolean | null; valueText?: string | null },
): string {
  if (value.valueBool !== null && value.valueBool !== undefined)
    return value.valueBool ? "yes" : "no";
  if (value.valueNumeric !== null && value.valueNumeric !== undefined)
    return String(value.valueNumeric);
  return value.valueText ?? "";
}

function parseNumeric(raw?: string): number | undefined {
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isNaN(n) ? undefined : n;
}

function parseBool(raw?: string): boolean | undefined {
  if (raw === "yes") return true;
  if (raw === "no") return false;
  return undefined;
}

function valueText(raw?: string): string | undefined {
  if (!raw) return undefined;
  if (raw === "yes" || raw === "no") return undefined;
  const n = Number(raw);
  if (!Number.isNaN(n)) return undefined;
  return raw;
}
