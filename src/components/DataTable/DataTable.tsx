"use client";

import { Button } from "@/components/Button";
import { Select } from "@/components/Select";
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

/**
 * Tabel standar halaman daftar (TAN-167) di atas kanon TANIA Pulse: kartu
 * `--tp-surface` ber-border `--tp-line` dengan satu soft shadow (§IV), header
 * semibold 14px (§III), dan tabel lebar menggulung horizontal (§VIII).
 * Paginasi (Known Gaps §2) diturunkan dari kelas shipped: tombol `.tp-btn`
 * dan select `.tp-input` — non-kanonik (referensi umum).
 */
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
    <div className="rounded-tp-lg border border-tp-line bg-tp-surface shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left text-sm">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead>
            <tr className="border-b border-tp-line bg-tp-bg">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn("px-4 py-2.5 font-semibold text-tp-muted", col.className)}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-6">
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
                <td colSpan={columns.length} className="px-4 py-6">
                  <p className="tp-empty">
                    <strong>{emptyMessage}</strong>
                  </p>
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
                      <td key={col.key} className={cn("px-4 py-2.5 align-middle", col.className)}>
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-tp-line px-4 py-3">
          <p className="text-xs text-tp-muted" aria-live="polite">
            Menampilkan {from}–{to} dari {pagination.totalItems}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-tp-muted">
              Baris per halaman
              <Select
                className="w-auto"
                value={pagination.pageSize}
                onChange={(e) => pagination.onPageSizeChange(Number(e.target.value))}
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </Select>
            </label>
            <Button
              type="button"
              variant="secondary"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1 || loading}
            >
              Sebelumnya
            </Button>
            <span className="text-xs text-tp-muted" aria-live="polite">
              Halaman {pagination.page} dari {totalPages}
            </span>
            <Button
              type="button"
              variant="secondary"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= totalPages || loading}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}