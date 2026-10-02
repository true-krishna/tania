"use client";

import { useQuery } from "@apollo/client";
import { IdpDocument, type IdpQuery } from "@/generated/graphql";
import { toQueryState, type QueryState } from "@/lib/apollo/toQueryState";

type IdpDetail = IdpQuery["idp"];

/**
 * Single-IDP lookup hook (Chapter) — US3.
 * Backed by the served `idp(id)` query.
 */
export function useIdp(id: string): QueryState<IdpDetail | undefined> {
  const result = useQuery(IdpDocument, {
    variables: { id },
    skip: !id,
  });
  return toQueryState({ ...result, data: result.data?.idp });
}