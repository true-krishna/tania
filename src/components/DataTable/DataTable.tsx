"use client";

import { Pagination } from "@/components/Pagination";
import { orDash } from "@/lib/cell";
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

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  caption,
  loading = false,
  emptyMessage = "Tidak ada data.",
  pagination,
}: DataTableProps<T>) {
  return (
    <section className="table-panel">
      <div className="table-scroll">
        <table className="w-full min-w-[560px]">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} scope="col" className={cn(col.className)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length}>
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
                <td colSpan={columns.length} className="empty-row">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={getRowId(row)}>
                  {columns.map((col) => {
                    const value = (row as unknown as Record<string, unknown>)[col.key];
                    return (
                      <td key={col.key} className={cn(col.className)}>
                        {col.render ? col.render(row) : orDash(value)}
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
        <footer className="table-footer">
          <Pagination {...pagination} disabled={loading} />
        </footer>
      ) : null}
    </section>
  );
}