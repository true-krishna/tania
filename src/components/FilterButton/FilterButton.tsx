"use client";

import { IconFilter } from "@tabler/icons-react";
import { cn } from "@/lib/cn";
import * as React from "react";

interface FilterButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  activeCount?: number;
  expanded?: boolean;
  panelId?: string;
}

export function FilterButton({
  activeCount = 0,
  expanded = false,
  panelId,
  className = "",
  ...rest
}: FilterButtonProps) {
  return (
    <button
      aria-controls={panelId}
      aria-expanded={expanded}
      aria-haspopup="true"
      aria-label={activeCount > 0 ? `Filter, ${activeCount} filter aktif` : "Filter"}
      className={cn(
        "tp-btn tp-filter-btn",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      data-active={activeCount > 0 || undefined}
      type="button"
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