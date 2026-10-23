"use client";

import { useQuery } from "@apollo/client";
import {
  IdpsDocument,
  type IdpsQuery,
} from "@/generated/graphql";
import type { IdpFilter } from "@/generated/graphql/types";
import { toQueryState, type QueryState } from "@/lib/apollo/toQueryState";

type IdpNode = IdpsQuery["idps"]["edges"][number]["node"];

/**
 * IDP list feature hook (Chapter) — US3.
 * Backed by the served `idps(filter, first, after)` query (connection).
 * Edges are mapped to a plain `Idp[]` so pages keep their existing shape.
 */
export function useIdps(filter: IdpFilter = {}): QueryState<
  Array<IdpNode> | undefined
> & { refetch: () => Promise<void> } {
  const clean = Object.fromEntries(
    Object.entries(filter ?? {}).filter(([, v]) => v !== undefined)
  ) as typeof filter;
  const result = useQuery(IdpsDocument, { variables: { filter: clean, first: 100 } });
  return {
    ...toQueryState({
      ...result,
      data: result.data?.idps?.edges.map((edge) => edge.node),
    }),
    refetch: async () => {
      await result.refetch();
    },
  };
}