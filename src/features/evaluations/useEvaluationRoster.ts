"use client";

import { useQuery } from "@apollo/client";
import { EvaluationRosterDocument, type EvaluationRosterQuery } from "@/generated/graphql";
import { toQueryState, type QueryState } from "@/lib/apollo/toQueryState";

type Entry = EvaluationRosterQuery["evaluationRoster"][number];

/**
 * Evaluation roster hook (Chapter) — US7.
 * Backed by the served `evaluationRoster(periodId)` query: one entry per
 * talent in the chapter's scope, flagged NOT_EVALUATED/EVALUATED (FR-28).
 */
export function useEvaluationRoster(
  periodId: string | null | undefined,
): QueryState<Array<Entry> | undefined> {
  const result = useQuery(EvaluationRosterDocument, {
    skip: !periodId,
    variables: periodId ? { periodId } : undefined,
  });
  return toQueryState({ ...result, data: result.data?.evaluationRoster });
}
