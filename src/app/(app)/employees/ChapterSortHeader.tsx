"use client";

import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import type { EmployeeListSortField, SortDirection } from "@/generated/graphql/types";

export type ChapterSortState = { key: EmployeeListSortField; dir: SortDirection } | null;

export function chapterSortAria(
  sort: ChapterSortState,
  key: EmployeeListSortField,
): "ascending" | "descending" | undefined {
  if (!sort || sort.key !== key) return undefined;
  return sort.dir === "ASC" ? "ascending" : "descending";
}

function sortIcon(sort: ChapterSortState, sortKey: EmployeeListSortField) {
  if (sort?.key !== sortKey) return null;
  if (sort.dir === "ASC") return <IconChevronUp aria-hidden size={14} stroke={2} />;
  return <IconChevronDown aria-hidden size={14} stroke={2} />;
}

export function ChapterSortHeader({
  label,
  sortKey,
  sort,
  onToggle,
}: {
  label: string;
  sortKey: EmployeeListSortField;
  sort: ChapterSortState;
  onToggle: (key: EmployeeListSortField) => void;
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
