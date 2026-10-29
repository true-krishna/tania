"use client";

import { useQuery } from "@apollo/client";
import { MyIdpDocument, type MyIdpQuery } from "@/generated/graphql";
import { toQueryState, type RefetchableQueryState } from "@/lib/apollo/toQueryState";

export type MyIdp = NonNullable<MyIdpQuery["myIdp"]>;

/**
 * Talent's own IDP (FR-14) — US3.
 * `myIdp` is null until a Chapter creates an IDP for the talent; that is an
 * empty state (FR-14), not an error.
 */
export function useMyIdp(enabled = true): RefetchableQueryState<MyIdp | undefined> {
  const result = useQuery(MyIdpDocument, { skip: !enabled });
  return {
    ...toQueryState({
      ...result,
      data: result.data?.myIdp ?? undefined,
    }),
    refetch: () => {
      void result.refetch();
    },
  };
}
