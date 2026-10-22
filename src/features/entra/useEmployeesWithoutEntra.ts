"use client";

import { useQuery } from "@apollo/client";
import {
  EmployeesWithoutEntraDocument,
  type EmployeesWithoutEntraQuery,
  type EmployeesWithoutEntraQueryVariables,
} from "@/generated/graphql";

type EmployeeNode =
  EmployeesWithoutEntraQuery["employeesWithoutEntra"]["edges"][number]["node"];

/** Page size of the FR-44 list — shared with refetches after provisioning. */
export const ENTRA_LIST_VARIABLES = { first: 100, after: null } as const;

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
 * a failed attempt is visible and can be retried (T034). Cursor pagination
 * accumulates pages with the same fetchMore pattern as the employees and
 * contracts lists (TAN-272), so the table can reach talent past the first 100
 * rows instead of showing empty pages.
 */
export function useEmployeesWithoutEntra(): EmployeesWithoutEntraState {
  const { loading, error, data, fetchMore } = useQuery<
    EmployeesWithoutEntraQuery,
    EmployeesWithoutEntraQueryVariables
  >(EmployeesWithoutEntraDocument, {
    variables: { first: ENTRA_LIST_VARIABLES.first, after: ENTRA_LIST_VARIABLES.after },
    notifyOnNetworkStatusChange: true,
  });

  const connection = data?.employeesWithoutEntra;
  const employees = connection?.edges.map((edge) => edge.node);
  const hasNextPage = connection?.pageInfo.hasNextPage ?? false;
  const endCursor = connection?.pageInfo.endCursor;

  function loadMore() {
    if (!endCursor) return;
    void fetchMore({
      variables: { first: ENTRA_LIST_VARIABLES.first, after: endCursor },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult?.employeesWithoutEntra) return prev;
        const seen = new Set(prev.employeesWithoutEntra.edges.map((edge) => edge.node.id));
        const appended = fetchMoreResult.employeesWithoutEntra.edges.filter(
          (edge) => !seen.has(edge.node.id)
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
