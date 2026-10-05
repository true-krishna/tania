"use client";

import { useQuery } from "@apollo/client";
import {
  DashboardDocument,
  type DashboardQuery,
} from "@/generated/graphql";
import { toQueryState, type QueryState } from "@/lib/apollo/toQueryState";

type Dashboard = DashboardQuery["dashboard"];

/**
 * Role-scoped dashboard union (FR-30) — US4.
 * The served SDL models the dashboard as a `Dashboard` union; the server
 * guarantees exactly one member per session role. `cache-and-network` keeps the
 * summary fresh while rendering the cached snapshot immediately (FR-30).
 */
export function useDashboard(): QueryState<Dashboard | undefined> {
  const result = useQuery(DashboardDocument, {
    fetchPolicy: "cache-and-network",
  });
  return toQueryState({
    ...result,
    data: result.data?.dashboard ?? undefined,
  });
}