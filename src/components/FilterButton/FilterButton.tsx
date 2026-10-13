"use client";

import { IconFilter } from "@tabler/icons-react";
import { cn } from "@/lib/cn";
import * as React from "react";

interface FilterButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Jumlah filter yang sedang aktif; menampilkan badge saat > 0. */
  activeCount?: number;
  /** Status panel filter terbuka — dikendalikan pemanggil (aria-expanded). */
  expanded?: boolean;
  /** Id elemen panel filter untuk aria-controls. */
  panelId?: string;
}

/**
 * Trigger filter halaman daftar (TAN-168). Basis outline `.tp-btn` — filter
 * bukan aksi utama (§II); saat filter aktif atau panel terbuka memakai state
 * soft navy `.tp-filter-btn` (matriks state §V, tanpa hex baru).
 */
export function FilterButton({
  activeCount = 0,
  expanded = false,
  panelId,
  className = "",
  ...rest
}: FilterButtonProps) {
  return (
    <button
      type="button"
      aria-haspopup="true"
      aria-expanded={expanded}
      aria-controls={panelId}
      aria-label={activeCount > 0 ? `Filter, ${activeCount} filter aktif` : "Filter"}
      data-active={activeCount > 0 || undefined}
      className={cn(
        "tp-btn tp-filter-btn",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...rest}
    >
      <IconFilter aria-hidden size={18} stroke={2} />
      Filter
      {activeCount > 0 && (
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-tp-brand-navy px-1.5 text-[12.5px] font-semibold leading-none text-tp-on-nav">
          {activeCount}
        </span>
      )}
    </button>
  );
}