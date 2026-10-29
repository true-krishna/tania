"use client";

import * as React from "react";
import { useQuery, type MaybeMasked, type Unmasked } from "@apollo/client";
import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import type { EmployeeFilter } from "@/generated/graphql/types";

/**
 * The cursor-paginated connection shape the shared accumulate-pages machinery
 * consumes (`employees`, `employeeLookup`, …).
 */
export type PaginatedConnection<TNode> = {
  totalCount: number;
  edges: Array<{ node: TNode }>;
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
};

export type PaginatedConnectionState<TNode> = {
  status: "loading" | "ready" | "error";
  /** Rows accumulated across fetched pages. */
  items: TNode[] | undefined;
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

type ConnectionVariables = {
  filter?: EmployeeFilter | null | undefined;
  first?: number | null | undefined;
  after?: string | null | undefined;
};

type PaginatedConnectionConfig<TData, TNode> = {
  document: TypedDocumentNode<TData, ConnectionVariables>;
  filter: EmployeeFilter | undefined;
  first: number;
  /** Reads the connection to accumulate out of a query result. */
  getConnection: (
    data: MaybeMasked<TData> | null | undefined,
  ) => PaginatedConnection<TNode> | null | undefined;
  /** Rebuilds a query result around an accumulated connection (fetchMore). */
  withConnection: (
    previousData: Unmasked<TData>,
    connection: PaginatedConnection<TNode>,
  ) => Unmasked<TData>;
};

/**
 * Cursor pagination over a `{ filter, first, after }` connection query:
 * `fetchMore` + `updateQuery` accumulate pages so the list can grow past one
 * page (T021).
 */
export function usePaginatedConnection<TData, TNode extends { id: string }>({
  document,
  filter,
  first,
  getConnection,
  withConnection,
}: PaginatedConnectionConfig<TData, TNode>): PaginatedConnectionState<TNode> {
  const clean = React.useMemo(
    () =>
      Object.fromEntries(
        Object.entries(filter ?? {}).filter(([, v]) => v !== undefined),
      ) as EmployeeFilter,
    [filter],
  );

  const { loading, error, data, fetchMore, refetch } = useQuery<TData, ConnectionVariables>(
    document,
    {
      variables: { filter: clean, first, after: null },
      notifyOnNetworkStatusChange: true,
      // Refetch from the network whenever variables change (search/filter edits),
      // so returning to a previous filter serves fresh data, not the stale
      // accumulated cache entry. The function form is required: a string
      // nextFetchPolicy reverts to the initial policy on variables change.
      nextFetchPolicy: (current, { reason }) =>
        reason === "variables-changed" ? "network-only" : current,
    },
  );

  const connection = getConnection(data);
  const items = connection?.edges.map((edge) => edge.node);
  const totalCount = connection?.totalCount ?? 0;
  const hasNextPage = connection?.pageInfo.hasNextPage ?? false;
  const endCursor = connection?.pageInfo.endCursor;
  const loadingMore = loading && !!data;

  // A fetch that grows nothing while the server still claims hasNextPage means
  // the accumulated window can never reach the advertised total (e.g. the
  // keyset window shifted). Stop paging and let the UI offer a reload. The
  // stall is keyed to the variables it happened under (filter + page size), so
  // changing either implicitly clears it.
  const stallKey = JSON.stringify([clean ?? {}, first]);
  const [stall, setStall] = React.useState({ key: stallKey, stalled: false });
  const stalled = stall.key === stallKey && stall.stalled;
  const beforeFetchRef = React.useRef<{ count: number; key: string } | null>(null);
  React.useEffect(() => {
    if (loadingMore) {
      if (beforeFetchRef.current === null) {
        beforeFetchRef.current = { count: items?.length ?? 0, key: stallKey };
      }
      return;
    }
    const before = beforeFetchRef.current;
    beforeFetchRef.current = null;
    if (before !== null && (items?.length ?? 0) === before.count && hasNextPage && !stalled) {
      setStall({ key: before.key, stalled: true });
    }
  }, [loadingMore, items, hasNextPage, stallKey, stalled]);

  function loadMore() {
    if (!endCursor || stalled) return;
    // A rejected fetchMore is surfaced through the query error / stall state;
    // swallow the promise to keep it off the global unhandled-rejection path.
    void fetchMore({
      variables: { filter: clean, first, after: endCursor },
      updateQuery: (previous, { fetchMoreResult }) => {
        if (!fetchMoreResult) return previous;
        const previousConnection = getConnection(previous as MaybeMasked<TData>);
        const nextConnection = getConnection(fetchMoreResult as MaybeMasked<TData>);
        if (!previousConnection || !nextConnection) return previous;
        const seen = new Set(previousConnection.edges.map((edge) => edge.node.id));
        const appended = nextConnection.edges.filter((edge) => !seen.has(edge.node.id));
        return withConnection(previous, {
          ...nextConnection,
          edges: [...previousConnection.edges, ...appended],
          totalCount: nextConnection.totalCount,
        });
      },
    }).catch(() => {});
  }

  function reload() {
    setStall({ key: stallKey, stalled: false });
    void refetch();
  }

  return {
    status: error ? "error" : loading && !data ? "loading" : "ready",
    items,
    totalCount,
    hasNextPage,
    loadingMore,
    stalled,
    error: error?.message ?? null,
    loadMore,
    reload,
  };
}
