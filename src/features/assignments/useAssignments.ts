"use client";

import type { Assignment, AssignmentFilter } from "@/generated/graphql/types";
import { useMockQuery } from "@/lib/mock/useMockQuery";
import { assignments, filterAssignments } from "./mock";

/**
 * Assignments feature hook (Chapter) — US2.
 *
 * Mock-backed while the backend US2 wave is unserved; swap body for the real
 * `assignments(filter)` GraphQL query when live — return type already matches
 * the `AssignmentConnection.edges[].node` shape consumed by the pages. Deps
 * mirror the query variables so changing a filter re-fetches.
 */
export function useAssignments(filter: AssignmentFilter = {}) {
  return useMockQuery<Assignment[]>(() => filterAssignments(assignments, filter), [
    filter.employeeId,
    filter.projectId,
    filter.status,
  ]);
}