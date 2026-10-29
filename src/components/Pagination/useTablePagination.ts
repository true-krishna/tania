"use client";

import * as React from "react";

type UseTablePaginationOptions = {
  /** Total dataset size; defaults to the loaded rows length. Cursor lists pass the connection's totalCount. */
  totalItems?: number;
  initialPageSize?: number;
  /** Controlled page size: the hook mirrors it instead of owning the state, for lists whose page size drives a query variable. */
  pageSize?: number;
  /** Called with the chosen size; pair with controlled pageSize. Page resets to 1 either way. */
  onPageSizeChange?: (pageSize: number) => void;
  /** Cursor lists: true while the connection still has pages beyond the loaded rows. */
  hasMore?: boolean;
  loadingMore?: boolean;
  loadMore?: () => void;
};

export function useTablePagination<T>(
  rows: Array<T> | undefined,
  options: UseTablePaginationOptions = {},
) {
  const {
    totalItems,
    initialPageSize = 10,
    hasMore = false,
    loadingMore = false,
    loadMore,
  } = options;
  const [page, setPage] = React.useState(1);
  const [ownedPageSize, setOwnedPageSize] = React.useState(initialPageSize);
  const pageSize = options.pageSize ?? ownedPageSize;

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
      // Lock page navigation while a load-more fetch is in flight so users
      // cannot stack jumps onto pages that are still being chained in.
      disabled: loadingMore,
      onPageChange: setPage,
      onPageSizeChange: (next: number) => {
        if (options.onPageSizeChange) options.onPageSizeChange(next);
        else setOwnedPageSize(next);
        setPage(1);
      },
    },
    resetPage: () => setPage(1),
  };
}
