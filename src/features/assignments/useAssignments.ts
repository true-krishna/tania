"use client";

import { useQuery } from "@apollo/client";
import { AssignmentsDocument, type AssignmentsQuery } from "@/generated/graphql";
import type { AssignmentFilter } from "@/generated/graphql/types";
import { toQueryState, type QueryState } from "@/lib/apollo/toQueryState";

type AssignmentNode = AssignmentsQuery["assignments"]["edges"][number]["node"];

/**
 * Assignments feature hook (Chapter) — US2.
 * Backed by the served `assignments(filter, first, after)` query (connection).
 * Edges are mapped to a plain `Assignment[]` so pages keep their existing shape.
 */
export function useAssignments(
  filter: AssignmentFilter = {},
): QueryState<Array<AssignmentNode> | undefined> {
  const clean = Object.fromEntries(
    Object.entries(filter ?? {}).filter(([, v]) => v !== undefined),
  ) as typeof filter;
  const result = useQuery(AssignmentsDocument, { variables: { filter: clean, first: 100 } });
  return toQueryState({
    ...result,
    data: result.data?.assignments?.edges.map((edge) => edge.node),
  });
}
