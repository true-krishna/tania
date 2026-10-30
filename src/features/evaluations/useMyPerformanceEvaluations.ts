"use client";

import { useQuery } from "@apollo/client";
import {
  MyPerformanceEvaluationsDocument,
  type MyPerformanceEvaluationsQuery,
} from "@/generated/graphql";
import { toQueryState, type RefetchableQueryState } from "@/lib/apollo/toQueryState";

type Node = MyPerformanceEvaluationsQuery["myPerformanceEvaluations"][number];

/**
 * Talent's own evaluations (read-only) — US7 / FR-27.
 * Backed by the served `myPerformanceEvaluations` query.
 */
export function useMyPerformanceEvaluations(): RefetchableQueryState<Array<Node> | undefined> {
  const result = useQuery(MyPerformanceEvaluationsDocument);
  return {
    ...toQueryState({
      ...result,
      data: result.data?.myPerformanceEvaluations,
    }),
    refetch: () => {
      void result.refetch();
    },
  };
}
