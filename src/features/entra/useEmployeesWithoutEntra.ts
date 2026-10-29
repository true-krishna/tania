"use client";

import * as React from "react";
import { useQuery } from "@apollo/client";
import {
  EmployeesWithoutEntraDocument,
  type EmployeesWithoutEntraQuery,
  type EmployeesWithoutEntraQueryVariables,
} from "@/generated/graphql";
import type { EntraEmployeeSortField, SortDirection } from "@/generated/graphql/types";

type EmployeeNode = EmployeesWithoutEntraQuery["employeesWithoutEntra"]["edges"][number]["node"];

/** Default page size of the FR-44 list — shared with refetches after provisioning. */
export const ENTRA_LIST_VARIABLES = {
  first: 100,
  after: null,
  search: null,
  sortBy: "FULL_NAME",
  sortDirection: "ASC",
} as const;

export type EmployeesWithoutEntraOptions = {
  search?: string;
  sortBy?: EntraEmployeeSortField;
  sortDirection?: SortDirection;
};

export type EmployeesWithoutEntraState = {
  status: "loading" | "ready" | "error";
  employees: EmployeeNode[] | undefined;
  totalCount: number;
  hasNextPage: boolean;
  loadingMore: boolean;
  error: string | null;
  loadMore: () => void;
};

/**
 * FR-44 list: active talent without a linked Entra account — never provisioned
 * or the last attempt failed. Rows carry the recorded provisioning outcome so
 * a failed attempt is visible and can be retried (T034). Search and sort are
 * server-side so cursor pagination stays consistent across pages.
 */
export function useEmployeesWithoutEntra(
  options: EmployeesWithoutEntraOptions = {},
): EmployeesWithoutEntraState {
  const { search = "", sortBy = "FULL_NAME", sortDirection = "ASC" } = options;
  const variables = React.useMemo<EmployeesWithoutEntraQueryVariables>(
    () => ({
      first: ENTRA_LIST_VARIABLES.first,
      after: null,
      search: search.trim() || null,
      sortBy,
      sortDirection,
    }),
    [search, sortBy, sortDirection],
  );

  const { loading, error, data, fetchMore } = useQuery<
    EmployeesWithoutEntraQuery,
    EmployeesWithoutEntraQueryVariables
  >(EmployeesWithoutEntraDocument, {
    variables,
    notifyOnNetworkStatusChange: true,
    nextFetchPolicy: (current, { reason }) =>
      reason === "variables-changed" ? "network-only" : current,
  });

  const connection = data?.employeesWithoutEntra;
  const employees = connection?.edges.map((edge) => edge.node);
  const hasNextPage = connection?.pageInfo.hasNextPage ?? false;
  const endCursor = connection?.pageInfo.endCursor;

  function loadMore() {
    if (!endCursor) return;
    void fetchMore({
      variables: { ...variables, after: endCursor },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult?.employeesWithoutEntra) return prev;
        const seen = new Set(prev.employeesWithoutEntra.edges.map((edge) => edge.node.id));
        const appended = fetchMoreResult.employeesWithoutEntra.edges.filter(
          (edge) => !seen.has(edge.node.id),
        );
        return {
          employeesWithoutEntra: {
            ...fetchMoreResult.employeesWithoutEntra,
            edges: [...prev.employeesWithoutEntra.edges, ...appended],
            totalCount: fetchMoreResult.employeesWithoutEntra.totalCount,
          },
        };
      },
    });
  }

  return {
    status: error ? "error" : loading && !data ? "loading" : "ready",
    employees,
    totalCount: connection?.totalCount ?? 0,
    hasNextPage,
    loadingMore: loading && !!data,
    error: error?.message ?? null,
    loadMore,
  };
}
