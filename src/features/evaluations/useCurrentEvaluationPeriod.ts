"use client";

import { useQuery } from "@apollo/client";
import {
  CurrentEvaluationPeriodDocument,
  type CurrentEvaluationPeriodQuery,
} from "@/generated/graphql";
import { toQueryState, type QueryState } from "@/lib/apollo/toQueryState";

type Period = CurrentEvaluationPeriodQuery["currentEvaluationPeriod"];

/**
 * Current evaluation period (shared) — US7.
 * Backed by the served `currentEvaluationPeriod` query; null when no period
 * is running. The Chapter roster is rooted on this period.
 */
export function useCurrentEvaluationPeriod(): QueryState<Period> {
  const result = useQuery(CurrentEvaluationPeriodDocument);
  return toQueryState({ ...result, data: result.data?.currentEvaluationPeriod });
}
