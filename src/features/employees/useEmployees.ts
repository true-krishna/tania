"use client";

import * as React from "react";
import { useQuery } from "@apollo/client";
import {
  AssignableTalentsDocument,
  EmployeesDocument,
  type AssignableTalentsQuery,
  type AssignableTalentsQueryVariables,
  type EmployeesQuery,
} from "@/generated/graphql";
import type {
  EmployeeFilter,
  EmployeeListSortField,
  SortDirection,
} from "@/generated/graphql/types";
import {
  usePaginatedConnection,
  type PaginatedConnectionState,
} from "@/lib/apollo/usePaginatedConnection";
import { queryStatus, type QueryState } from "@/lib/apollo/toQueryState";

type AssignableTalentNode = AssignableTalentsQuery["assignableTalents"]["edges"][number]["node"];

type EmployeeNode = EmployeesQuery["employees"]["edges"][number]["node"];

export type EmployeesState = Omit<PaginatedConnectionState<EmployeeNode>, "items"> & {
  /** Employee rows accumulated across fetched pages. */
  employees: EmployeeNode[] | undefined;
};

/**
 * Employees feature hook (Operation) — US1.
 * Cursor pagination over `employees(filter, first, after)` via the shared
 * accumulate-pages machinery, so the list can grow past one page (T021).
 */
export function useEmployees(filter: EmployeeFilter = {}, first = 25): EmployeesState {
  const { items, ...rest } = usePaginatedConnection({
    document: EmployeesDocument,
    filter,
    first,
    getConnection: (data) => data?.employees,
    withConnection: (previous, employees) => ({ employees }),
  });
  return { ...rest, employees: items };
}

/** Default variables of the assignable-talent list, shared with refetches. */
export const ASSIGNABLE_TALENTS_VARIABLES = {
  first: 100,
  after: null,
  search: null,
  sortBy: "FULL_NAME",
  sortDirection: "ASC",
} as const;

export type AssignableTalentsOptions = {
  skip?: boolean;
  search?: string;
  sortBy?: EmployeeListSortField;
  sortDirection?: SortDirection;
};

export type AssignableTalentsState = QueryState<Array<AssignableTalentNode> | undefined> & {
  totalCount: number;
  hasNextPage: boolean;
  loadingMore: boolean;
  loadMore: () => void;
};

/**
 * Talent dalam cakupan (picker assignment/IDP) dan daftar Data Karyawan role
 * Chapter (TAN-384). Search dan sort server-side, halaman diakumulasi lewat
 * fetchMore sehingga urutan konsisten lintas halaman.
 */
export function useAssignableTalents(
  options: AssignableTalentsOptions = {},
): AssignableTalentsState {
  const { skip = false, search = "", sortBy = "FULL_NAME", sortDirection = "ASC" } = options;
  const variables = React.useMemo<AssignableTalentsQueryVariables>(
    () => ({
      first: ASSIGNABLE_TALENTS_VARIABLES.first,
      after: null,
      search: search.trim() || null,
      sortBy,
      sortDirection,
    }),
    [search, sortBy, sortDirection],
  );

  const { loading, error, data, fetchMore } = useQuery(AssignableTalentsDocument, {
    variables,
    skip,
    notifyOnNetworkStatusChange: true,
    nextFetchPolicy: (current, { reason }) =>
      reason === "variables-changed" ? "network-only" : current,
  });

  const connection = data?.assignableTalents;
  const talents = connection?.edges.map((edge) => edge.node);
  const hasNextPage = connection?.pageInfo?.hasNextPage ?? false;
  const endCursor = connection?.pageInfo?.endCursor;

  function loadMore() {
    if (!endCursor) return;
    void fetchMore({
      variables: { ...variables, after: endCursor },
      updateQuery: (previous, { fetchMoreResult }) => {
        if (!fetchMoreResult?.assignableTalents) return previous;
        const seen = new Set(previous.assignableTalents.edges.map((edge) => edge.node.id));
        const appended = fetchMoreResult.assignableTalents.edges.filter(
          (edge) => !seen.has(edge.node.id),
        );
        return {
          assignableTalents: {
            ...fetchMoreResult.assignableTalents,
            edges: [...previous.assignableTalents.edges, ...appended],
            totalCount: fetchMoreResult.assignableTalents.totalCount,
          },
        };
      },
    });
  }

  return {
    status: queryStatus(loading, error, data),
    data: talents,
    totalCount: connection?.totalCount ?? 0,
    hasNextPage,
    loadingMore: loading && !!data,
    error: error?.message ?? null,
    loadMore,
  };
}
