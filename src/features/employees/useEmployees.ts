"use client";

import * as React from "react";
import { useQuery } from "@apollo/client";
import {
  AssignableTalentsDocument,
  EmployeesDocument,
  type AssignableTalentsQuery,
  type EmployeesQuery,
  type EmployeesQueryVariables,
} from "@/generated/graphql";
import type { EmployeeFilter } from "@/generated/graphql/types";
import { toQueryState, type QueryState } from "@/lib/apollo/toQueryState";

type AssignableTalentNode =
  AssignableTalentsQuery["assignableTalents"]["edges"][number]["node"];

type EmployeeNode = EmployeesQuery["employees"]["edges"][number]["node"];

export type EmployeesState = {
  status: "loading" | "ready" | "error";
  /** Employee rows accumulated across fetched pages. */
  employees: EmployeeNode[] | undefined;
  totalCount: number;
  hasNextPage: boolean;
  loadingMore: boolean;
  /** A fetchMore returned no new rows while the server still claims hasNextPage. */
  stalled: boolean;
  error: string | null;
  loadMore: () => void;
  /** Refetches page 1 with fresh data and clears the stall state. */
  reload: () => void;
};

/**
 * Employees feature hook (Operation) — US1.
 * Cursor pagination over `employees(filter, first, after)`; `fetchMore` +
 * `updateQuery` accumulate pages so the list can grow past one page (T021).
 */
export function useEmployees(filter: EmployeeFilter = {}, first = 25): EmployeesState {
  const clean = React.useMemo(
    () =>
      Object.fromEntries(
        Object.entries(filter ?? {}).filter(([, v]) => v !== undefined)
      ) as EmployeeFilter,
    [filter]
  );

  const { loading, error, data, fetchMore, refetch } = useQuery<
    EmployeesQuery,
    EmployeesQueryVariables
  >(EmployeesDocument, {
    variables: { filter: clean, first, after: null },
    notifyOnNetworkStatusChange: true,
    // Refetch from the network whenever variables change (search/filter edits),
    // so returning to a previous filter serves fresh data, not the stale
    // accumulated cache entry. The function form is required: a string
    // nextFetchPolicy reverts to the initial policy on variables change.
    nextFetchPolicy: (current, { reason }) =>
      reason === "variables-changed" ? "network-only" : current,
  });

  const connection = data?.employees;
  const employees = connection?.edges.map((edge) => edge.node);
  const totalCount = connection?.totalCount ?? 0;
  const hasNextPage = connection?.pageInfo.hasNextPage ?? false;
  const endCursor = connection?.pageInfo.endCursor;
  const loadingMore = loading && !!data;

  // A fetch that grows nothing while the server still claims hasNextPage means
  // the accumulated window can never reach the advertised total (e.g. the
  // keyset window shifted). Stop paging and let the UI offer a reload. The
  // stall is keyed to the filter it happened under, so changing the filter
  // implicitly clears it.
  const filterKey = JSON.stringify(clean ?? {});
  const [stall, setStall] = React.useState({ key: filterKey, stalled: false });
  const stalled = stall.key === filterKey && stall.stalled;
  const beforeFetchRef = React.useRef<{ count: number; key: string } | null>(null);
  React.useEffect(() => {
    if (loadingMore) {
      if (beforeFetchRef.current === null) {
        beforeFetchRef.current = { count: employees?.length ?? 0, key: filterKey };
      }
      return;
    }
    const before = beforeFetchRef.current;
    beforeFetchRef.current = null;
    if (
      before !== null &&
      (employees?.length ?? 0) === before.count &&
      hasNextPage &&
      !stalled
    ) {
      setStall({ key: before.key, stalled: true });
    }
  }, [loadingMore, employees, hasNextPage, filterKey, stalled]);

  function loadMore() {
    if (!endCursor || stalled) return;
    void fetchMore({
      variables: { filter: clean, first, after: endCursor },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult?.employees) return prev;
        const seen = new Set(prev.employees.edges.map((e) => e.node.id));
        const appended = fetchMoreResult.employees.edges.filter(
          (edge) => !seen.has(edge.node.id)
        );
        return {
          employees: {
            ...fetchMoreResult.employees,
            edges: [...prev.employees.edges, ...appended],
            totalCount: fetchMoreResult.employees.totalCount,
          },
        };
      },
    });
  }

  function reload() {
    setStall({ key: filterKey, stalled: false });
    void refetch();
  }

  return {
    status: error ? "error" : loading && !data ? "loading" : "ready",
    employees,
    totalCount,
    hasNextPage,
    loadingMore,
    stalled,
    error: error?.message ?? null,
    loadMore,
    reload,
  };
}

export function useAssignableTalents(): QueryState<Array<AssignableTalentNode> | undefined> {
  const result = useQuery(AssignableTalentsDocument, { variables: { first: 100 } });
  return toQueryState({
    ...result,
    data: result.data?.assignableTalents?.edges.map((edge) => edge.node),
  });
}
