// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useTablePagination } from "@/components/Pagination/useTablePagination";

const ROWS = Array.from({ length: 57 }, (_, i) => i);

describe("useTablePagination", () => {
  it("slices the current page out of the rows", () => {
    const { result } = renderHook(() =>
      useTablePagination(ROWS, { initialPageSize: 10 }),
    );

    expect(result.current.pageRows).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(result.current.pagination).toMatchObject({
      page: 1,
      pageSize: 10,
      totalItems: 57,
    });
  });

  it("moves pages through onPageChange and reports the safe page", () => {
    const { result } = renderHook(() =>
      useTablePagination(ROWS, { initialPageSize: 10 }),
    );

    act(() => result.current.pagination.onPageChange(3));
    expect(result.current.pageRows).toEqual([20, 21, 22, 23, 24, 25, 26, 27, 28, 29]);

    act(() => result.current.pagination.onPageChange(99));
    expect(result.current.pagination.page).toBe(6);
    expect(result.current.pageRows).toEqual([50, 51, 52, 53, 54, 55, 56]);
  });

  it("resets to page 1 when the page size changes", () => {
    const { result } = renderHook(() =>
      useTablePagination(ROWS, { initialPageSize: 10 }),
    );

    act(() => result.current.pagination.onPageChange(4));
    act(() => result.current.pagination.onPageSizeChange(50));

    expect(result.current.pagination).toMatchObject({ page: 1, pageSize: 50 });
    expect(result.current.pageRows).toHaveLength(50);
  });

  it("mirrors a controlled page size and reports the choice", () => {
    const onPageSizeChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ pageSize }: { pageSize: number }) =>
        useTablePagination(ROWS, { pageSize, onPageSizeChange }),
      { initialProps: { pageSize: 10 } },
    );

    expect(result.current.pagination.pageSize).toBe(10);
    act(() => {
      result.current.pagination.onPageChange(3);
      result.current.pagination.onPageSizeChange(25);
    });
    expect(onPageSizeChange).toHaveBeenCalledWith(25);
    // The page resets even though the size is controlled.
    expect(result.current.pagination.page).toBe(1);

    rerender({ pageSize: 25 });
    expect(result.current.pagination.pageSize).toBe(25);
    expect(result.current.pageRows).toHaveLength(25);
  });

  it("resetPage brings the state back to the first page", () => {
    const { result } = renderHook(() => useTablePagination(ROWS));

    act(() => result.current.pagination.onPageChange(2));
    act(() => result.current.resetPage());

    expect(result.current.pagination.page).toBe(1);
  });

  it("falls back to a single empty page when there are no rows", () => {
    const { result } = renderHook(() => useTablePagination<number>(undefined));

    expect(result.current.pageRows).toEqual([]);
    expect(result.current.pagination).toMatchObject({ page: 1, totalItems: 0 });
  });

  it("uses the connection total instead of the loaded rows when given", () => {
    const { result } = renderHook(() =>
      useTablePagination([0, 1], { totalItems: 57, initialPageSize: 10 }),
    );

    expect(result.current.pagination.totalItems).toBe(57);
  });

  it("keeps fetching until the shown page is fully loaded", () => {
    let loaded = 2;
    const loadMore = vi.fn(() => {
      loaded += 25;
    });
    const { result, rerender } = renderHook(
      ({ rows }) =>
        useTablePagination(rows, { totalItems: 57, hasMore: true, loadMore }),
      { initialProps: { rows: Array.from({ length: 2 }, (_, i) => i) } },
    );

    act(() => {
      rerender({ rows: Array.from({ length: loaded }, (_, i) => i) });
    });
    expect(loadMore).toHaveBeenCalledTimes(1);

    act(() => {
      rerender({ rows: Array.from({ length: 57 }, (_, i) => i) });
    });
    expect(result.current.pagination.page).toBe(1);
  });

  it("does not loop when a fetch adds no rows", () => {
    const loadMore = vi.fn();
    const { rerender } = renderHook(
      ({ rows }) =>
        useTablePagination(rows, { totalItems: 57, hasMore: true, loadMore }),
      { initialProps: { rows: Array.from({ length: 2 }, (_, i) => i) } },
    );

    act(() => {
      rerender({ rows: Array.from({ length: 2 }, (_, i) => i) });
    });
    act(() => {
      rerender({ rows: Array.from({ length: 2 }, (_, i) => i) });
    });

    expect(loadMore).toHaveBeenCalledTimes(1);
  });

  it("stops auto-fetching once the wanted rows are loaded", () => {
    const loadMore = vi.fn();
    const rows = Array.from({ length: 25 }, (_, i) => i);
    renderHook(() =>
      useTablePagination(rows, { totalItems: 57, hasMore: true, loadMore }),
    );

    expect(loadMore).not.toHaveBeenCalled();
  });

  it("locks the pagination controls while more rows are loading", () => {
    const rows = Array.from({ length: 25 }, (_, i) => i);
    const { result, rerender } = renderHook(
      ({ loading }) =>
        useTablePagination(rows, {
          totalItems: 57,
          hasMore: true,
          loadingMore: loading,
          loadMore: () => {},
        }),
      { initialProps: { loading: false } },
    );

    expect(result.current.pagination.disabled).toBe(false);
    act(() => result.current.pagination.onPageChange(4));
    rerender({ loading: true });
    expect(result.current.pagination.disabled).toBe(true);
  });
});
