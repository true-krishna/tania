"use client";

import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import {
  EmploymentContractsDocument,
  type EmploymentContractsQuery,
  type EmploymentContractsQueryVariables,
} from "@/generated/graphql";
import type { EmploymentContractFilter } from "@/generated/graphql/types";

type ContractNode = EmploymentContractsQuery["employmentContracts"]["edges"][number]["node"];

export type EmploymentContractsState = {
  status: "loading" | "ready" | "error";
  contracts: ContractNode[] | undefined;
  totalCount: number;
  hasNextPage: boolean;
  loadingMore: boolean;
  error: string | null;
  loadMore: () => void;
};

/**
 * Employment contracts feature hook (Operation) — US9.
 * Cursor pagination over `employmentContracts(filter, first, after)` with the
 * same accumulate-on-fetchMore pattern as the employees list (T023).
 */
export function useEmploymentContracts(
  filter: EmploymentContractFilter = {},
): EmploymentContractsState {
  const clean = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(filter ?? {}).filter(([, v]) => v !== undefined),
      ) as EmploymentContractFilter,
    [filter],
  );

  const { loading, error, data, fetchMore } = useQuery<
    EmploymentContractsQuery,
    EmploymentContractsQueryVariables
  >(EmploymentContractsDocument, {
    variables: { filter: clean, first: 25, after: null },
    notifyOnNetworkStatusChange: true,
  });

  const connection = data?.employmentContracts;
  const contracts = connection?.edges.map((edge) => edge.node);
  const totalCount = connection?.totalCount ?? 0;
  const hasNextPage = connection?.pageInfo.hasNextPage ?? false;
  const endCursor = connection?.pageInfo.endCursor;

  function loadMore() {
    if (!endCursor) return;
    void fetchMore({
      variables: { filter: clean, first: 25, after: endCursor },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult?.employmentContracts) return prev;
        const seen = new Set(prev.employmentContracts.edges.map((e) => e.node.id));
        const appended = fetchMoreResult.employmentContracts.edges.filter(
          (edge) => !seen.has(edge.node.id),
        );
        return {
          employmentContracts: {
            ...fetchMoreResult.employmentContracts,
            edges: [...prev.employmentContracts.edges, ...appended],
            totalCount: fetchMoreResult.employmentContracts.totalCount,
          },
        };
      },
    });
  }

  const loadingMore = loading && !!data;

  return {
    status: error ? "error" : loading && !data ? "loading" : "ready",
    contracts,
    totalCount,
    hasNextPage,
    loadingMore,
    error: error?.message ?? null,
    loadMore,
  };
}
