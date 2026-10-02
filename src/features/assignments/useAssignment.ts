"use client";

import { useQuery } from "@apollo/client";
import {
  AssignmentsDocument,
  type AssignmentsQuery,
} from "@/generated/graphql";
import { toQueryState, type QueryState } from "@/lib/apollo/toQueryState";

type AssignmentNode = AssignmentsQuery["assignments"]["edges"][number]["node"];

/**
 * Single-assignment lookup hook (Chapter) — US2.
 *
 * The served schema exposes `assignments(filter)` (connection) but no
 * `assignment(id)`; the `AssignmentFilter` has no `id` either. Fetch the list
 * and select the matching node.
 */
export function useAssignment(id: string): QueryState<AssignmentNode | undefined> {
  const result = useQuery(AssignmentsDocument, {
    variables: { first: 100 },
    skip: !id,
  });
  const found = result.data?.assignments?.edges.find((edge) => edge.node.id === id)?.node;
  return toQueryState({ ...result, data: found });
}