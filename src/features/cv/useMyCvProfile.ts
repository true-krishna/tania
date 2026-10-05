"use client";

import { useQuery } from "@apollo/client";
import {
  MyCvProfileDocument,
  type CvFieldsFragment,
} from "@/generated/graphql";
import { toQueryState, type QueryState } from "@/lib/apollo/toQueryState";

/**
 * Talent's own CV profile (FR-12/FR-13).
 * `myCvProfile` is null until the talent saves their first CV section; that is
 * an empty state, not an error.
 */
export function useMyCvProfile(): QueryState<CvFieldsFragment | undefined> {
  const result = useQuery(MyCvProfileDocument);
  return toQueryState({
    ...result,
    data: result.data?.myCvProfile as CvFieldsFragment | undefined,
  });
}