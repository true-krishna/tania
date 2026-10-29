"use client";

import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import type { SortKey, SortState } from "./distributionColumns";

type SortHeaderProps = {
  column: { header: string; sortKey?: SortKey };
  onToggle: (key: SortKey) => void;
  sort: SortState;
};

export function SortHeader({ column, onToggle, sort }: SortHeaderProps) {
  const sortKey = column.sortKey;
  if (!sortKey) return column.header;

  const direction = sort?.key === sortKey ? sort.dir : null;

  return (
    <button
      className="inline-flex items-center gap-1 hover:text-tp-text"
      onClick={() => onToggle(sortKey)}
      type="button"
    >
      {column.header}
      {direction === "asc" ? (
        <IconChevronUp aria-hidden size={14} stroke={2} />
      ) : direction === "desc" ? (
        <IconChevronDown aria-hidden size={14} stroke={2} />
      ) : null}
    </button>
  );
}
