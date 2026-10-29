"use client";

import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import {
  AuditLogsDocument,
  type AuditLogsQuery,
  type AuditLogsQueryVariables,
} from "@/generated/graphql";
import type { AuditLogFilter } from "@/generated/graphql/types";

type AuditLogNode = AuditLogsQuery["auditLogs"]["edges"][number]["node"];

export type AuditLogsState = {
  status: "loading" | "ready" | "error";
  /** All audit log rows accumulated across fetched pages, newest first. */
  logs: AuditLogNode[] | undefined;
  totalCount: number;
  hasNextPage: boolean;
  loadingMore: boolean;
  error: string | null;
  loadMore: () => void;
};

/**
 * Admin audit trail viewer feed (FR-17) — US5.
 * Cursor pagination over the served `auditLogs(filter, first, after)`
 * connection. `fetchMore` + `updateQuery` accumulate pages into the Apollo
 * cache, so `data.auditLogs.edges` grows across pages with no manual state.
 * Admin-only — access is not enforced here (FR-16), only the viewer is gated.
 */
export function useAuditLogs(filter: AuditLogFilter = {}): AuditLogsState {
  const clean = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(filter ?? {}).filter(([, v]) => v !== undefined),
      ) as AuditLogFilter,
    [filter],
  );

  const { loading, error, data, fetchMore } = useQuery<AuditLogsQuery, AuditLogsQueryVariables>(
    AuditLogsDocument,
    {
      variables: { filter: clean, first: 25, after: null },
      notifyOnNetworkStatusChange: true,
    },
  );

  const connection = data?.auditLogs;
  const logs = connection?.edges.map((edge) => edge.node);
  const totalCount = connection?.totalCount ?? 0;
  const hasNextPage = connection?.pageInfo.hasNextPage ?? false;
  const endCursor = connection?.pageInfo.endCursor;

  function loadMore() {
    if (!endCursor) return;
    void fetchMore({
      variables: { filter: clean, first: 25, after: endCursor },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult?.auditLogs) return prev;
        const seen = new Set(prev.auditLogs.edges.map((e) => e.node.id));
        const appended = fetchMoreResult.auditLogs.edges.filter((edge) => !seen.has(edge.node.id));
        return {
          auditLogs: {
            ...fetchMoreResult.auditLogs,
            edges: [...prev.auditLogs.edges, ...appended],
            totalCount: fetchMoreResult.auditLogs.totalCount,
          },
        };
      },
    });
  }

  // `loading` stays true on the first fetch; a refetch keeps it false and the
  // accumulated list visible, so loadingMore is tracked separately.
  const loadingMore = loading && !!data;

  return {
    status: error ? "error" : loading && !data ? "loading" : "ready",
    logs,
    totalCount,
    hasNextPage,
    loadingMore,
    error: error?.message ?? null,
    loadMore,
  };
}
