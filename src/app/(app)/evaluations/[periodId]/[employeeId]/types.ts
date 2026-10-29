import type { EvaluationAnswerType, EvaluationPeriodState } from "@/generated/graphql/types";

export type CriterionLike = {
  id: string;
  label: string;
  answerType: EvaluationAnswerType;
  position: number;
};

export type PeriodLike = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  state: EvaluationPeriodState;
  template: { criteria: CriterionLike[] } | null;
};

export type TalentLike = { id: string; fullName: string; nomorInduk?: string | null };

export type AnswerLike = {
  criterion: Pick<CriterionLike, "id" | "answerType">;
  valueNumeric?: number | null;
  valueBool?: boolean | null;
  valueText?: string | null;
};
