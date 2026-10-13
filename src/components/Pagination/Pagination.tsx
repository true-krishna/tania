"use client";

import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { Select } from "@/components/Select";
import { cn } from "@/lib/cn";
import * as React from "react";

const ELLIPSIS_LEFT = "ellipsis-left";
const ELLIPSIS_RIGHT = "ellipsis-right";

type PageItem = number | typeof ELLIPSIS_LEFT | typeof ELLIPSIS_RIGHT;

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

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

// Jendela nomor halaman ala Material: 1 sibling di tiap sisi halaman aktif,
// selalu tampilkan halaman pertama & terakhir, dan collapse ke lima nomor
// berurutan saat hanya satu sisi yang terputus.
function buildPageItems(page: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) return range(1, totalPages);
  const left = Math.max(page - 1, 1);
  const right = Math.min(page + 1, totalPages);
  const showLeft = left > 2;
  const showRight = right < totalPages - 1;
  if (!showLeft && showRight) return [...range(1, 5), ELLIPSIS_RIGHT, totalPages];
  if (showLeft && !showRight) return [1, ELLIPSIS_LEFT, ...range(totalPages - 4, totalPages)];
  return [1, ELLIPSIS_LEFT, ...range(left, right), ELLIPSIS_RIGHT, totalPages];
}

const PAGE_CHIP =
  "inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-[13px] font-medium transition-colors";
const PAGE_CHIP_IDLE =
  "border border-tp-line bg-tp-surface text-tp-muted hover:border-tp-brand-navy hover:text-tp-brand-navy";

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

  const chip = (extra?: string) =>
    cn(PAGE_CHIP, disabled ? cn(PAGE_CHIP_IDLE, "pointer-events-none opacity-50") : extra);

  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
      <p className="text-xs text-tp-muted" aria-live="polite">
        Menampilkan {from}–{to} dari {totalItems}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-tp-muted">
          Baris per halaman
          <Select
            className="w-auto"
            value={pageSize}
            disabled={disabled}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {options.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </Select>
        </label>
        <nav aria-label="Navigasi halaman">
          <ul className="flex items-center gap-1">
            <li>
              <button
                type="button"
                aria-label="Halaman sebelumnya"
                className={chip(cn(PAGE_CHIP_IDLE, "disabled:pointer-events-none disabled:opacity-50"))}
                disabled={disabled || page <= 1}
                onClick={() => onPageChange(page - 1)}
              >
                <IconChevronLeft aria-hidden size={16} stroke={2} />
              </button>
            </li>
            {buildPageItems(page, totalPages).map((item) =>
              item === ELLIPSIS_LEFT || item === ELLIPSIS_RIGHT ? (
                <li key={item}>
                  <span aria-hidden className={cn(PAGE_CHIP, "text-tp-muted")}>
                    …
                  </span>
                </li>
              ) : (
                <li key={item}>
                  <button
                    type="button"
                    aria-label={`Halaman ${item}`}
                    aria-current={item === page ? "page" : undefined}
                    className={chip(
                      item === page
                        ? "border border-tp-brand-navy bg-tp-brand-navy text-tp-on-nav"
                        : PAGE_CHIP_IDLE,
                    )}
                    disabled={disabled}
                    onClick={() => onPageChange(item)}
                  >
                    {item}
                  </button>
                </li>
              ),
            )}
            <li>
              <button
                type="button"
                aria-label="Halaman berikutnya"
                className={chip(cn(PAGE_CHIP_IDLE, "disabled:pointer-events-none disabled:opacity-50"))}
                disabled={disabled || page >= totalPages}
                onClick={() => onPageChange(page + 1)}
              >
                <IconChevronRight aria-hidden size={16} stroke={2} />
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}