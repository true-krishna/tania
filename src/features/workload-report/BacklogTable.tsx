"use client";

import * as React from "react";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import { Card } from "@/components/Card";
import { Pagination } from "@/components/Pagination";
import { Chip, type ChipVariant } from "@/components/Chip";
import { Input } from "@/components/Input";
import { formatTimestamp } from "./formatTimestamp";
import type { IndividualBacklogNormalizedRow, IndividualBacklogRow } from "./types";
import { cn } from "@/lib/cn";

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

      <div className="table-panel">
        <div className="table-scroll">
          {variant === "detail" ? (
            <table className="w-full min-w-[900px]">
              <caption className="sr-only">Tabel detail aktivitas per individu</caption>
              <thead>
                <tr>
                  {(
                    [
                      { key: "issueKey", header: "Activity Key" },
                      { key: "projectKey", header: "Project" },
                      { key: "backlog", header: "Judul Aktivitas" },
                      { key: "status", header: "Status" },
                      { key: "priority", header: "Priority" },
                      { key: "updated", header: "Activity Time" },
                      { key: "timespent", header: "Time Spent" },
                    ] as const
                  ).map((col) => {
                    const sortable = col.key === "issueKey" || col.key === "timespent" || col.key === "updated";
                    return (
                      <th
                        key={col.key}
                        scope="col"
                        aria-sort={
                          sort && col.key === sort.key
                            ? sort.dir === "asc"
                              ? "ascending"
                              : "descending"
                            : undefined
                        }
                        className={cn(col.key === "timespent" && "text-right")}
                      >
                        {sortable ? (
                          <button
                            type="button"
                            onClick={() => toggleSort(col.key as SortKey)}
                            className="inline-flex items-center gap-1 hover:text-tp-text"
                          >
                            {col.header}
                            {sort?.key === col.key ? (
                              sort.dir === "asc" ? (
                                <IconChevronUp aria-hidden size={14} stroke={2} />
                              ) : (
                                <IconChevronDown aria-hidden size={14} stroke={2} />
                              )
                            ) : null}
                          </button>
                        ) : (
                          col.header
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty-row">
                      Tidak ada aktivitas yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  (pageRows as IndividualBacklogRow[]).map((row) => (
                    <tr key={`${row.issueKey}-${row.updated ?? ""}`}>
                      <td className="font-medium text-tp-text">
                        {row.issueKey}
                        {row.isNormalized ? (
                          <span
                            title="Timespent dinormalisasi"
                            className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-tp-tint-sun px-1 text-[10px] font-bold text-tp-ink-sun"
                          >
                            N
                          </span>
                        ) : null}
                      </td>
                      <td>{row.projectKey ?? "—"}</td>
                      <td className="max-w-[320px]">{row.backlog ?? "—"}</td>
                      <td>
                        {row.status ? <Chip variant={STATUS_VARIANT[row.status] ?? "neutral"}>{row.status}</Chip> : "—"}
                      </td>
                      <td>{row.priority ?? "—"}</td>
                      <td>{formatTimestamp(row.updated)}</td>
                      <td className="text-right">{row.timespent === null ? "—" : `${row.timespent} jam`}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full min-w-[820px]">
              <caption className="sr-only">Tabel aktivitas ternormalisasi</caption>
              <thead>
                <tr>
                  {(
                    [
                      { key: "issueKey", header: "Activity Key" },
                      { key: "projectKey", header: "Project" },
                      { key: "backlog", header: "Judul Aktivitas" },
                      { key: "updated", header: "Activity Time" },
                      { key: "timespent", header: "Filled Time Spent" },
                      { key: "timespentNormalized", header: "Normalized Time Spent" },
                    ] as const
                  ).map((col) => {
                    const sortable = col.key === "issueKey" || col.key === "timespent" || col.key === "updated";
                    return (
                      <th
                        key={col.key}
                        scope="col"
                        aria-sort={
                          sort && col.key === sort.key
                            ? sort.dir === "asc"
                              ? "ascending"
                              : "descending"
                            : undefined
                        }
                        className={cn((col.key === "timespent" || col.key === "timespentNormalized") && "text-right")}
                      >
                        {sortable ? (
                          <button
                            type="button"
                            onClick={() => toggleSort(col.key as SortKey)}
                            className="inline-flex items-center gap-1 hover:text-tp-text"
                          >
                            {col.header}
                            {sort?.key === col.key ? (
                              sort.dir === "asc" ? (
                                <IconChevronUp aria-hidden size={14} stroke={2} />
                              ) : (
                                <IconChevronDown aria-hidden size={14} stroke={2} />
                              )
                            ) : null}
                          </button>
                        ) : (
                          col.header
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-row">
                      Tidak ada aktivitas ternormalisasi pada periode ini.
                    </td>
                  </tr>
                ) : (
                  (pageRows as IndividualBacklogNormalizedRow[]).map((row) => (
                    <tr key={`${row.issueKey}-${row.updated ?? ""}`}>
                      <td className="font-medium text-tp-text">{row.issueKey ?? "—"}</td>
                      <td>{row.projectKey ?? "—"}</td>
                      <td className="max-w-[320px]">{row.backlog ?? "—"}</td>
                      <td>{formatTimestamp(row.updated)}</td>
                      <td className="text-right font-medium text-tp-ink-peach">{row.timespent ?? "—"} jam</td>
                      <td className="text-right font-medium text-tp-ink-mint">{row.timespentNormalized ?? "—"} jam</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
        {rows.length > 0 ? (
          <footer className="table-footer">
            <Pagination
              page={page}
              pageSize={pageSize}
              totalItems={rows.length}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </footer>
        ) : null}
      </div>
    </Card>
  );
}