"use client";

import { useQuery } from "@apollo/client";
import {
  PerformanceEvaluationForTalentDocument,
  type PerformanceEvaluationForTalentQuery,
} from "@/generated/graphql";
import { toQueryState, type QueryState } from "@/lib/apollo/toQueryState";

type Node = NonNullable<
  PerformanceEvaluationForTalentQuery["performanceEvaluations"]["edges"][number]["node"]
>;

/**
 * Single performance evaluation (Chapter) — US7.
 * Backed by `performanceEvaluations(periodId, employeeId)` (one per talent per
 * period, FR-26). The first (and only) edge is the talent's evaluation for the
 * period; absent when the chapter has not scored the talent yet.
 */
export function usePerformanceEvaluation(
  periodId: string | null | undefined,
  employeeId: string | null | undefined,
): QueryState<Node | null> {
  const result = useQuery(PerformanceEvaluationForTalentDocument, {
    skip: !periodId || !employeeId,
    variables:
      periodId && employeeId ? { periodId, employeeId } : undefined,
  });
  const node = result.data?.performanceEvaluations?.edges?.[0]?.node ?? null;
  return toQueryState({ ...result, data: node });
}