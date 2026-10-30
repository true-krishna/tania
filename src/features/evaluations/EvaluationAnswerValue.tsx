import { Chip } from "@/components/Chip";
import type { EvaluationAnswerType } from "@/generated/graphql/types";

export const ANSWER_TYPE_NOTE: Record<EvaluationAnswerType, string> = {
  SCALE_1_5: "Skala 1–5",
  SCALE_1_10: "Skala 1–10",
  YES_NO: "Ya / Tidak",
  FREE_TEXT: "Teks",
};

function scaleMax(answerType: EvaluationAnswerType): number {
  return answerType === "SCALE_1_10" ? 10 : 5;
}

function renderScale(value: number, max: number) {
  return (
    <span className="flex items-center gap-2">
      <span aria-hidden className="flex gap-1">
        {Array.from({ length: max }, (_, index) => (
          <span
            className={
              index < Math.round(value)
                ? "h-2 w-4 rounded-full bg-tp-brand-navy min-[400px]:w-5"
                : "h-2 w-4 rounded-full bg-tp-bg min-[400px]:w-5"
            }
            key={index}
          />
        ))}
      </span>
      <span className="text-sm font-semibold text-tp-text">{value}</span>
    </span>
  );
}

function renderBoolean(value: boolean) {
  return (
    <Chip size="small" variant={value ? "success" : "neutral"}>
      {value ? "Ya" : "Tidak"}
    </Chip>
  );
}

export function EvaluationAnswerValue({
  answer,
  answerType,
}: {
  answer: { valueBool?: boolean | null; valueNumeric?: number | null; valueText?: string | null };
  answerType: EvaluationAnswerType;
}) {
  if (answerType === "SCALE_1_5" || answerType === "SCALE_1_10") {
    return answer.valueNumeric === null || answer.valueNumeric === undefined ? (
      <span className="text-sm text-tp-muted">–</span>
    ) : (
      renderScale(answer.valueNumeric, scaleMax(answerType))
    );
  }
  if (answerType === "YES_NO") {
    return answer.valueBool === null || answer.valueBool === undefined ? (
      <span className="text-sm text-tp-muted">–</span>
    ) : (
      renderBoolean(answer.valueBool)
    );
  }
  const text = answer.valueText?.trim();
  return <span className="min-w-0 break-words text-sm text-tp-text">{text || "–"}</span>;
}
