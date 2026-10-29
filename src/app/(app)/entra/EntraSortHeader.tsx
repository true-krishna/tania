"use client";

import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import type { EntraEmployeeSortField, SortDirection } from "@/generated/graphql/types";

export type SortState = { key: EntraEmployeeSortField; dir: SortDirection } | null;

export function sortAria(
  sort: SortState,
  key: EntraEmployeeSortField,
): "ascending" | "descending" | undefined {
  if (!sort || sort.key !== key) return undefined;
  return sort.dir === "ASC" ? "ascending" : "descending";
}

function sortIcon(sort: SortState, sortKey: EntraEmployeeSortField) {
  if (sort?.key !== sortKey) return null;
  if (sort.dir === "ASC") return <IconChevronUp aria-hidden size={14} stroke={2} />;
  return <IconChevronDown aria-hidden size={14} stroke={2} />;
}

export function EntraSortHeader({
  label,
  sortKey,
  sort,
  onToggle,
}: {
  label: string;
  sortKey: EntraEmployeeSortField;
  sort: SortState;
  onToggle: (key: EntraEmployeeSortField) => void;
}) {
  return (
    <button
      className="inline-flex items-center gap-1 hover:text-tp-text"
      onClick={() => onToggle(sortKey)}
      type="button"
    >
      {label}
      {sortIcon(sort, sortKey)}
    </button>
  );
}
