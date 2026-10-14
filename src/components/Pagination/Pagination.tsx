"use client";

import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { cn } from "@/lib/cn";
import * as React from "react";

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50];

interface PaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  disabled?: boolean;
  className?: string;
}

const PAGE_ICON_BUTTON = "page-icon-btn";

export function Pagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions,
  disabled = false,
  className,
}: PaginationProps) {
  const options = React.useMemo(() => {
    const sizes = new Set(pageSizeOptions ?? DEFAULT_PAGE_SIZE_OPTIONS);
    sizes.add(pageSize);
    return [...sizes].sort((a, b) => a - b);
  }, [pageSizeOptions, pageSize]);

  const totalPages = Math.max(1, Math.ceil(totalItems / Math.max(1, pageSize)));
  const from = totalItems > 0 ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(page * pageSize, totalItems);

  return (
    <div className={cn("flex w-full flex-wrap items-center justify-between gap-3", className)}>
      <p aria-live="polite">
        Menampilkan{" "}
        <strong>
          {from}–{to}
        </strong>{" "}
        dari <span className="page-total">{totalItems}</span>
      </p>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2">
          Baris per halaman
          <select
            className="page-size mx-2"
            value={pageSize}
            disabled={disabled}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {options.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <nav aria-label="Navigasi halaman">
          <ul className="flex items-center gap-2">
            <li>
              <button
                type="button"
                aria-label="Halaman sebelumnya"
                className={PAGE_ICON_BUTTON}
                disabled={disabled || page <= 1}
                onClick={() => onPageChange(page - 1)}
              >
                <IconChevronLeft aria-hidden size={18} stroke={2} />
              </button>
            </li>
            <li>
              <span aria-current={disabled ? undefined : "page"} className="page-current">
                {page}
              </span>
            </li>
            <li>
              <button
                type="button"
                aria-label="Halaman berikutnya"
                className={PAGE_ICON_BUTTON}
                disabled={disabled || page >= totalPages}
                onClick={() => onPageChange(page + 1)}
              >
                <IconChevronRight aria-hidden size={18} stroke={2} />
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
