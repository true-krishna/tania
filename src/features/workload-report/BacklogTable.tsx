"use client";

import * as React from "react";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import { Card } from "@/components/Card";
import { Table, type TableColumn } from "@/components/Table";
import { Chip, type ChipVariant } from "@/components/Chip";
import { Input } from "@/components/Input";
import { formatTimestamp } from "./formatTimestamp";
import type { IndividualBacklogNormalizedRow, IndividualBacklogRow } from "./types";

type BacklogVariant = "detail" | "normalized";
type SortKey = "issueKey" | "timespent" | "updated";
type SortState = { key: SortKey; dir: "asc" | "desc" } | null;

const STATUS_VARIANT: Record<string, ChipVariant> = {
  Done: "success",
  "In Progress": "info",
  "To Do": "neutral",
};

function detailSortValue(row: IndividualBacklogRow, key: SortKey): number | string {
  if (key === "issueKey") return row.issueKey ?? "";
  if (key === "updated") return row.updated ?? "";
  return row.timespent ?? -1;
}

function normalizedSortValue(row: IndividualBacklogNormalizedRow, key: SortKey): number | string {
  if (key === "issueKey") return row.issueKey ?? "";
  if (key === "updated") return row.updated ?? "";
  return row.timespent === null ? -1 : Number(row.timespent);
}

function sortBy<T>(rows: T[], key: SortKey, dir: "asc" | "desc", valueOf: (row: T, key: SortKey) => number | string): T[] {
  const sorted = [...rows].sort((a, b) => {
    const av = valueOf(a, key);
    const bv = valueOf(b, key);
    if (typeof av === "number" && typeof bv === "number") return av - bv;
    return String(av).localeCompare(String(bv));
  });
  return dir === "desc" ? sorted.reverse() : sorted;
}

function sortHeaderProps(
  sort: SortState,
  sortKey: SortKey,
): React.ThHTMLAttributes<HTMLTableCellElement> {
  return {
    "aria-sort":
      sort?.key === sortKey ? (sort.dir === "asc" ? "ascending" : "descending") : undefined,
  };
}

function SortHeader({
  label,
  sortKey,
  sort,
  onToggle,
}: {
  label: string;
  sortKey: SortKey;
  sort: SortState;
  onToggle: (key: SortKey) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(sortKey)}
      className="inline-flex items-center gap-1 hover:text-tp-text"
    >
      {label}
      {sort?.key === sortKey ? (
        sort.dir === "asc" ? (
          <IconChevronUp aria-hidden size={14} stroke={2} />
        ) : (
          <IconChevronDown aria-hidden size={14} stroke={2} />
        )
      ) : null}
    </button>
  );
}

const NORMALIZED_BADGE =
  "ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-tp-tint-sun px-1 text-[10px] font-bold text-tp-ink-sun";

/**
 * Tabel detail backlog per talent (TAN-234) dengan varian ternormalisasi,
 * search, sort, dan pagination. Konteks talent tidak pernah ada di URL.
 */
export function BacklogTable({
  backlog,
  backlogNormalized,
}: {
  backlog: IndividualBacklogRow[];
  backlogNormalized: IndividualBacklogNormalizedRow[];
}) {
  const [variant, setVariant] = React.useState<BacklogVariant>("detail");
  const [search, setSearch] = React.useState("");
  const [sort, setSort] = React.useState<SortState>(null);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const query = search.trim().toLowerCase();
  const rows =
    variant === "detail"
      ? backlog.filter(
          (row) =>
            !query ||
            [row.issueKey, row.projectKey, row.backlog].some((v) => (v ?? "").toLowerCase().includes(query)),
        )
      : backlogNormalized.filter(
          (row) =>
            !query ||
            [row.issueKey, row.projectKey, row.backlog].some((v) => (v ?? "").toLowerCase().includes(query)),
        );
  const sortedRows = sort
    ? variant === "detail"
      ? sortBy(rows as IndividualBacklogRow[], sort.key, sort.dir, detailSortValue)
      : sortBy(rows as IndividualBacklogNormalizedRow[], sort.key, sort.dir, normalizedSortValue)
    : rows;
  const pageRows = sortedRows.slice((page - 1) * pageSize, page * pageSize);

  const pagination = {
    page,
    pageSize,
    totalItems: rows.length,
    onPageChange: setPage,
    onPageSizeChange: (size: number) => {
      setPageSize(size);
      setPage(1);
    },
  };

  function changeVariant(next: BacklogVariant) {
    setVariant(next);
    setPage(1);
  }

  function changeSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function toggleSort(key: SortKey) {
    setPage(1);
    setSort((current) => {
      if (!current || current.key !== key) return { key, dir: "desc" };
      if (current.dir === "desc") return { key, dir: "asc" };
      return null;
    });
  }

  const detailColumns: TableColumn<IndividualBacklogRow>[] = [
    {
      key: "issueKey",
      title: <SortHeader label="Activity Key" sortKey="issueKey" sort={sort} onToggle={toggleSort} />,
      headerProps: sortHeaderProps(sort, "issueKey"),
      className: "font-medium text-tp-text",
      render: (_value, row) => (
        <>
          {row.issueKey}
          {row.isNormalized ? (
            <span title="Timespent dinormalisasi" className={NORMALIZED_BADGE}>
              N
            </span>
          ) : null}
        </>
      ),
    },
    { key: "projectKey", title: "Project", render: (_value, row) => row.projectKey ?? "—" },
    {
      key: "backlog",
      title: "Judul Aktivitas",
      className: "max-w-[320px]",
      render: (_value, row) => row.backlog ?? "—",
    },
    {
      key: "status",
      title: "Status",
      render: (_value, row) =>
        row.status ? <Chip variant={STATUS_VARIANT[row.status] ?? "neutral"}>{row.status}</Chip> : "—",
    },
    { key: "priority", title: "Priority", render: (_value, row) => row.priority ?? "—" },
    {
      key: "updated",
      title: <SortHeader label="Activity Time" sortKey="updated" sort={sort} onToggle={toggleSort} />,
      headerProps: sortHeaderProps(sort, "updated"),
      render: (_value, row) => formatTimestamp(row.updated),
    },
    {
      key: "timespent",
      title: <SortHeader label="Time Spent" sortKey="timespent" sort={sort} onToggle={toggleSort} />,
      headerProps: sortHeaderProps(sort, "timespent"),
      align: "right",
      render: (_value, row) => (row.timespent === null ? "—" : `${row.timespent} jam`),
    },
  ];

  const normalizedColumns: TableColumn<IndividualBacklogNormalizedRow>[] = [
    {
      key: "issueKey",
      title: <SortHeader label="Activity Key" sortKey="issueKey" sort={sort} onToggle={toggleSort} />,
      headerProps: sortHeaderProps(sort, "issueKey"),
      className: "font-medium text-tp-text",
      render: (_value, row) => row.issueKey ?? "—",
    },
    { key: "projectKey", title: "Project", render: (_value, row) => row.projectKey ?? "—" },
    {
      key: "backlog",
      title: "Judul Aktivitas",
      className: "max-w-[320px]",
      render: (_value, row) => row.backlog ?? "—",
    },
    {
      key: "updated",
      title: <SortHeader label="Activity Time" sortKey="updated" sort={sort} onToggle={toggleSort} />,
      headerProps: sortHeaderProps(sort, "updated"),
      render: (_value, row) => formatTimestamp(row.updated),
    },
    {
      key: "timespent",
      title: <SortHeader label="Filled Time Spent" sortKey="timespent" sort={sort} onToggle={toggleSort} />,
      headerProps: sortHeaderProps(sort, "timespent"),
      align: "right",
      className: "font-medium text-tp-ink-peach",
      render: (_value, row) => `${row.timespent ?? "—"} jam`,
    },
    {
      key: "timespentNormalized",
      title: "Normalized Time Spent",
      align: "right",
      className: "font-medium text-tp-ink-mint",
      render: (_value, row) => `${row.timespentNormalized ?? "—"} jam`,
    },
  ];

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="tp-h3">Detail backlog</h2>
          <p className="tp-label mt-1">
            {variant === "detail"
              ? "Aktivitas talent pada periode terpilih."
              : "Aktivitas yang timespent-nya dinormalisasi (hari kerja 8 jam, maksimum 24 jam/hari)."}
          </p>
        </div>
        <div className="flex w-fit gap-1 overflow-x-auto rounded-[14px] border border-tp-line bg-tp-bg p-1">
          {(
            [
              { id: "detail", label: "Detail Activity" },
              { id: "normalized", label: "Ternormalisasi" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={variant === tab.id}
              onClick={() => changeVariant(tab.id)}
              className={
                variant === tab.id
                  ? "flex-none rounded-[10px] bg-tp-brand-navy px-4 py-2 text-sm font-semibold text-white"
                  : "flex-none rounded-[10px] px-4 py-2 text-sm font-medium text-tp-muted transition-colors hover:text-tp-text"
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-[13px] font-semibold text-tp-muted">
        Cari
        <Input
          type="search"
          aria-label="Cari aktivitas"
          placeholder="Issue key, project, atau judul aktivitas…"
          value={search}
          onChange={(e) => changeSearch(e.target.value)}
          className="h-10 max-w-80 flex-1"
        />
      </label>

      {variant === "detail" ? (
        <Table
          caption="Tabel detail aktivitas per individu"
          rowKey={(row) => `${row.issueKey}-${row.updated ?? ""}`}
          dataSource={pageRows as IndividualBacklogRow[]}
          minWidth={900}
          emptyText="Tidak ada aktivitas yang cocok dengan pencarian."
          pagination={rows.length > 0 ? pagination : undefined}
          columns={detailColumns}
        />
      ) : (
        <Table
          caption="Tabel aktivitas ternormalisasi"
          rowKey={(row) => `${row.issueKey}-${row.updated ?? ""}`}
          dataSource={pageRows as IndividualBacklogNormalizedRow[]}
          minWidth={820}
          emptyText="Tidak ada aktivitas ternormalisasi pada periode ini."
          pagination={rows.length > 0 ? pagination : undefined}
          columns={normalizedColumns}
        />
      )}
    </Card>
  );
}
