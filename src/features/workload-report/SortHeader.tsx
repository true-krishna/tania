"use client";

import type * as React from "react";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";

export type SortState = { key: string; dir: "asc" | "desc" } | null;

export function sortHeaderProps(
  sort: SortState,
  sortKey: string | undefined,
): React.ThHTMLAttributes<HTMLTableCellElement> {
  return { "aria-sort": ariaSort(sort, sortKey) };
}

function ariaSort(
  sort: SortState,
  sortKey: string | undefined,
): "ascending" | "descending" | undefined {
  if (sortKey === undefined) return undefined;
  if (sort?.key !== sortKey) return undefined;
  if (sort.dir === "asc") return "ascending";
  return "descending";
}

function sortIcon(sort: SortState, sortKey: string | undefined): React.ReactNode {
  if (sortKey === undefined || sort?.key !== sortKey) return null;
  if (sort.dir === "asc") return <IconChevronUp aria-hidden size={14} stroke={2} />;
  return <IconChevronDown aria-hidden size={14} stroke={2} />;
}

export function SortHeader<K extends string>({
  label,
  sortKey,
  sort,
  onToggle,
}: {
  label: string;
  sortKey?: K;
  sort: SortState;
  onToggle: (key: K) => void;
}) {
  return (
    <button
      className="inline-flex items-center gap-1 hover:text-tp-text"
      onClick={() => {
        if (sortKey !== undefined) onToggle(sortKey);
      }}
      type="button"
    >
      {label}
      {sortIcon(sort, sortKey)}
    </button>
  );
}
