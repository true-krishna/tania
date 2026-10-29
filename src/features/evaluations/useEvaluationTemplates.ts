"use client";

import { useQuery } from "@apollo/client";
import { EvaluationTemplatesDocument, type EvaluationTemplatesQuery } from "@/generated/graphql";
import { toQueryState, type QueryState } from "@/lib/apollo/toQueryState";

type TemplateNode = EvaluationTemplatesQuery["evaluationTemplates"][number];

/**
 * Evaluation template hook (Admin) — US7.
 * Backed by the served `evaluationTemplates(includeInactive)` query.
 */
export function useEvaluationTemplates(): QueryState<Array<TemplateNode> | undefined> {
  const result = useQuery(EvaluationTemplatesDocument, {
    variables: { includeInactive: true },
  });
  return toQueryState({ ...result, data: result.data?.evaluationTemplates });
}
