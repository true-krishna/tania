"use client";

import { useQuery } from "@apollo/client";
import {
  PreRetirementCandidatesDocument,
  type PreRetirementCandidatesQuery,
} from "@/generated/graphql";
import { toQueryState, type QueryState } from "@/lib/apollo/toQueryState";

type CandidateNode =
  PreRetirementCandidatesQuery["employees"]["edges"][number]["node"];

/**
 * Active employees with `birthDate` so the dashboard can derive who is inside
 * the pre-retirement window (FR-40) using the Admin-managed retirement age.
 * The served SDL has no dedicated pre-retirement query, so the window is
 * computed client-side from the birth date (T027).
 */
export function usePreRetirementCandidates(): QueryState<CandidateNode[] | undefined> {
  const result = useQuery<PreRetirementCandidatesQuery>(PreRetirementCandidatesDocument, {
    variables: { first: 100 },
  });
  return toQueryState({
    ...result,
    data: result.data?.employees?.edges.map((edge) => edge.node),
  });
}
