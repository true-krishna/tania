"use client";

import * as React from "react";

type UseTablePaginationOptions = {
  /** Total dataset size; defaults to the loaded rows length. Cursor lists pass the connection's totalCount. */
  totalItems?: number;
  initialPageSize?: number;
  /** Cursor lists: true while the connection still has pages beyond the loaded rows. */
  hasMore?: boolean;
  loadingMore?: boolean;
  loadMore?: () => void;
};

export function useTablePagination<T>(
  rows: Array<T> | undefined,
  options: UseTablePaginationOptions = {},
) {
  const { totalItems, initialPageSize = 10, hasMore = false, loadingMore = false, loadMore } =
    options;
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(initialPageSize);

  const total = totalItems ?? rows?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  const safePage = Math.min(page, totalPages);
  const loaded = rows?.length ?? 0;
  const wanted = safePage * pageSize;

  // Cursor lists: keep fetching while the page shown reaches past the loaded
  // rows. The ref stops the loop when a fetch returns no new rows (a server
  // that keeps claiming hasNextPage), and lets the next fetch start once the
  // page target moves.
  const needsMore = hasMore && loadMore !== undefined && loaded < wanted;
  const lastFetchRef = React.useRef<{ loaded: number; wanted: number } | null>(null);
  React.useEffect(() => {
    if (!needsMore || loadingMore || loadMore === undefined) return;
    const last = lastFetchRef.current;
    if (last && last.loaded === loaded && last.wanted === wanted) return;
    lastFetchRef.current = { loaded, wanted };
    loadMore();
  }, [needsMore, loadingMore, loadMore, loaded, wanted]);

  const start = (safePage - 1) * pageSize;
  const pageRows = rows?.slice(start, start + pageSize) ?? [];

  return {
    pageRows,
    pagination: {
      page: safePage,
      pageSize,
      totalItems: total,
      onPageChange: setPage,
      onPageSizeChange: (next: number) => {
        setPageSize(next);
        setPage(1);
      },
    },
    resetPage: () => setPage(1),
  };
}
