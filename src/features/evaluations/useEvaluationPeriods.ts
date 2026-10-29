"use client";

import { useQuery } from "@apollo/client";
import { EvaluationPeriodsDocument, type EvaluationPeriodsQuery } from "@/generated/graphql";
import { toQueryState, type QueryState } from "@/lib/apollo/toQueryState";

type PeriodNode = EvaluationPeriodsQuery["evaluationPeriods"][number];

/**
 * Evaluation period hook (Admin) — US7.
 * Backed by the served `evaluationPeriods(includeInactive)` query.
 */
export function useEvaluationPeriods(): QueryState<Array<PeriodNode> | undefined> {
  const result = useQuery(EvaluationPeriodsDocument, {
    variables: { includeInactive: true },
  });
  return toQueryState({ ...result, data: result.data?.evaluationPeriods });
}
