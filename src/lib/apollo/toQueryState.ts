"use client";

import type { QueryResult } from "@apollo/client";

/**
 * Normalized async query state that feature hooks return to pages.
 *
 * Apollo's `useQuery` exposes `{ loading, error, data }`; the feature hooks
 * (which previously returned `useMockQuery`'s `{ status, data, error }`) keep
 * this shape so page components do not care whether data comes from a live
 * query or a stub. `toQueryState` maps the Apollo result into that contract.
 */
export type QueryState<T> = {
  status: "loading" | "ready" | "error";
  data: T | undefined;
  error: string | null;
};

export function toQueryState<T>(
  result: Pick<QueryResult<T>, "loading" | "error" | "data">
): QueryState<T> {
  const status = result.loading ? "loading" : result.error ? "error" : "ready";
  return {
    status,
    data: result.data,
    error: result.error?.message ?? null,
  };
}