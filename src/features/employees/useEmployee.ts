"use client";

import { useQuery } from "@apollo/client";
import { EmployeeDocument, type EmployeeQuery } from "@/generated/graphql";
import { toQueryState, type QueryState } from "@/lib/apollo/toQueryState";

/**
 * Single-employee lookup hook (Operation) — US1.
 * Backed by the served `employee(id)` query.
 */
export function useEmployee(
  id: string,
): QueryState<NonNullable<EmployeeQuery["employee"]> | undefined> {
  const result = useQuery(EmployeeDocument, {
    variables: { id },
    skip: !id,
  });
  return toQueryState({ ...result, data: result.data?.employee ?? undefined });
}
