"use client";

import { useQuery } from "@apollo/client";
import {
  EmploymentContractDocument,
  type EmploymentContractQuery,
} from "@/generated/graphql";
import { toQueryState, type QueryState } from "@/lib/apollo/toQueryState";

/**
 * Single-contract lookup hook (Operation) — US9.
 * Backed by the served `employmentContract(id)` query.
 */
export function useEmploymentContract(
  id: string
): QueryState<NonNullable<EmploymentContractQuery["employmentContract"]> | undefined> {
  const result = useQuery(EmploymentContractDocument, {
    variables: { id },
    skip: !id,
  });
  return toQueryState({ ...result, data: result.data?.employmentContract ?? undefined });
}
