"use client";

import { useQuery } from "@apollo/client";
import { MyEmployeeDocument } from "@/generated/graphql";
import { toQueryState, type QueryState } from "@/lib/apollo/toQueryState";

export function useMyEmployeeId(skip = false): QueryState<string | null | undefined> {
  const result = useQuery(MyEmployeeDocument, { skip });
  return toQueryState({
    ...result,
    data: result.data ? (result.data.me.employee?.id ?? null) : undefined,
  });
}
