"use client";

import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { cn } from "@/lib/cn";
import * as React from "react";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  className?: string;
  render?: (row: T) => React.ReactNode;
}

export interface DataTablePagination {
  /** Halaman aktif, mulai dari 1. */
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

interface DataTableProps<T> {
  columns: Array<DataTableColumn<T>>;
  rows: T[];
  getRowId: (row: T) => React.Key;
  caption?: string;
  loading?: boolean;
  emptyMessage?: string;
  pagination?: DataTablePagination;
}

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50];

function formatCell(value: unknown): string {
  if (value == null || value === "") return "—";
  return String(value);
}

const PAGE_ICON_BUTTON =
  "inline-flex h-8 w-8 items-center justify-center rounded-md text-tp-muted transition-colors hover:bg-tp-bg disabled:pointer-events-none disabled:opacity-40";

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  caption,
  loading = false,
  emptyMessage = "Tidak ada data.",
  pagination,
}: DataTableProps<T>) {
  const pageSizeOptions = React.useMemo(() => {
    const options = new Set(pagination?.pageSizeOptions ?? DEFAULT_PAGE_SIZE_OPTIONS);
    if (pagination) options.add(pagination.pageSize);
    return [...options].sort((a, b) => a - b);
  }, [pagination]);

  const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.totalItems / Math.max(1, pagination.pageSize)))
    : 1;
  const from =
    pagination && pagination.totalItems > 0
      ? (pagination.page - 1) * pagination.pageSize + 1
      : 0;
  const to = pagination
    ? Math.min(pagination.page * pagination.pageSize, pagination.totalItems)
    : 0;

  return (
    <section className="overflow-hidden rounded-lg border border-tp-line bg-tp-surface shadow-[0_2px_4px_rgba(16,24,40,0.025)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] table-fixed border-collapse text-left">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead className="border-b border-tp-line bg-tp-bg">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    "h-[42px] px-5 align-middle text-[11px] font-medium text-tp-muted",
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-6">
                  <span className="flex items-center justify-center gap-2 text-sm text-tp-muted">
                    <span
                      className="h-4 w-4 animate-spin rounded-full border-2 border-tp-neutral border-t-transparent"
                      aria-hidden
                    />
                    Memuat…
                  </span>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="h-[160px] px-5 text-center align-middle text-[12px] text-tp-muted"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={getRowId(row)}
                  className="border-b border-tp-line transition-colors last:border-b-0 hover:bg-tp-bg"
                >
                  {columns.map((col) => {
                    const value = (row as unknown as Record<string, unknown>)[col.key];
                    return (
                      <td
                        key={col.key}
                        className={cn(
                          "h-[76px] px-5 align-middle text-[12px]",
                          col.className,
                        )}
                      >
                        {col.render ? col.render(row) : formatCell(value)}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pagination ? (
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-tp-line px-5 py-4 text-[11px] text-tp-muted">
          <p aria-live="polite">
            Menampilkan{" "}
            <strong className="font-medium text-tp-text">
              {from}–{to}
            </strong>{" "}
            dari{" "}
            <strong className="font-medium text-tp-text">{pagination.totalItems}</strong>
          </p>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2">
              Baris per halaman
              <select
                className="mx-2 h-[30px] rounded-[5px] border border-tp-line bg-tp-surface px-[7px] text-tp-text"
                value={pagination.pageSize}
                onChange={(e) => pagination.onPageSizeChange(Number(e.target.value))}
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              aria-label="Halaman sebelumnya"
              className={PAGE_ICON_BUTTON}
              disabled={pagination.page <= 1 || loading}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              <IconChevronLeft aria-hidden size={16} stroke={2} />
            </button>
            <span
              aria-current="page"
              className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-md border border-tp-line bg-tp-bg text-[12px] font-medium text-tp-text"
            >
              {pagination.page}
            </span>
            <button
              type="button"
              aria-label="Halaman berikutnya"
              className={PAGE_ICON_BUTTON}
              disabled={pagination.page >= totalPages || loading}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              <IconChevronRight aria-hidden size={16} stroke={2} />
            </button>
          </div>
        </footer>
      ) : null}
    </section>
  );
}
