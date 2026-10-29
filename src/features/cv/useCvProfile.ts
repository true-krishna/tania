"use client";

import { useQuery } from "@apollo/client";
import { CvProfileDocument, type CvFieldsFragment } from "@/generated/graphql";
import { toQueryState, type QueryState } from "@/lib/apollo/toQueryState";

/**
 * A talent's CV profile, read-only for Chapter within scope (FR-13).
 * Backed by the served `cvProfile(employeeId)` query; skipped until a talent
 * is selected.
 */
export function useCvProfile(
  employeeId: string | null | undefined,
): QueryState<CvFieldsFragment | undefined> {
  const result = useQuery(CvProfileDocument, {
    skip: !employeeId,
    variables: employeeId ? { employeeId } : undefined,
  });
  return toQueryState({
    ...result,
    data: result.data?.cvProfile as CvFieldsFragment | undefined,
  });
}
