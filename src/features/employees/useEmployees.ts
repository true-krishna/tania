"use client";

import { useMemo } from "react";
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
  error: string | null;
  loadMore: () => void;
};

/**
 * Employees feature hook (Operation) — US1.
 * Cursor pagination over `employees(filter, first, after)`; `fetchMore` +
 * `updateQuery` accumulate pages so the list can grow past one page (T021).
 */
export function useEmployees(filter: EmployeeFilter = {}, first = 25): EmployeesState {
  const clean = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(filter ?? {}).filter(([, v]) => v !== undefined)
      ) as EmployeeFilter,
    [filter]
  );

  const { loading, error, data, fetchMore } = useQuery<
    EmployeesQuery,
    EmployeesQueryVariables
  >(EmployeesDocument, {
    variables: { filter: clean, first, after: null },
    notifyOnNetworkStatusChange: true,
  });

  const connection = data?.employees;
  const employees = connection?.edges.map((edge) => edge.node);
  const totalCount = connection?.totalCount ?? 0;
  const hasNextPage = connection?.pageInfo.hasNextPage ?? false;
  const endCursor = connection?.pageInfo.endCursor;

  function loadMore() {
    if (!endCursor) return;
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

  const loadingMore = loading && !!data;

  return {
    status: error ? "error" : loading && !data ? "loading" : "ready",
    employees,
    totalCount,
    hasNextPage,
    loadingMore,
    error: error?.message ?? null,
    loadMore,
  };
}

export function useAssignableTalents(): QueryState<Array<AssignableTalentNode> | undefined> {
  const result = useQuery(AssignableTalentsDocument, { variables: { first: 100 } });
  return toQueryState({
    ...result,
    data: result.data?.assignableTalents?.edges.map((edge) => edge.node),
  });
}
