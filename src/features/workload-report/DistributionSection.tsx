"use client";

import * as React from "react";
import { IconChevronDown, IconChevronRight, IconChevronUp } from "@tabler/icons-react";
import { Card } from "@/components/Card";
import { Pagination } from "@/components/Pagination";
import { Select } from "@/components/Select";
import { LoadStatusBadge, TtdLevelBadge } from "./LoadStatusBadge";
import type {
  DistributionDimension,
  DistributionFilter,
  DistributionNormalizedRow,
  DistributionRow,
  DistributionTables,
} from "./types";
import { DIMENSION_LABELS, DISTRIBUTION_DIMENSIONS, WORKLOAD_STATUSES } from "./types";
import { cn } from "@/lib/cn";

type SortDir = "asc" | "desc";
type SortKey =
  | "jumlahTalent"
  | "totalBacklog"
  | "totalTaskSubtask"
  | "availability"
  | "totalTimespent"
  | "fte"
  | "loadEstimate"
  | "ttdComp";
type SortState = { key: SortKey; dir: SortDir } | null;

type SortAccessor = (row: DistributionRow) => number | null;

const SORT_ACCESSORS: Record<SortKey, SortAccessor> = {
  jumlahTalent: (r) => r.jumlahTalent,
  totalBacklog: (r) => r.totalBacklog,
  totalTaskSubtask: (r) => r.totalTaskSubtask,
  availability: (r) => r.availability,
  totalTimespent: (r) => (r.totalTimespent === null ? null : Number(r.totalTimespent)),
  fte: (r) => r.fte,
  loadEstimate: (r) => r.loadEstimate,
  ttdComp: (r) => r.ttdComp,
};

interface ColumnDef<Row> {
  key: string;
  header: string;
  sortKey?: SortKey;
  alignRight?: boolean;
  render: (row: Row) => React.ReactNode;
}

function percent(value: number | null): string {
  return value === null ? "—" : `${value}%`;
}

function normalizedMarker(row: DistributionRow): React.ReactNode {
  if (!row.isNormalized) return null;
  return (
    <span
      title="Ada aktivitas ternormalisasi"
      className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-tp-tint-sun px-1 text-[10px] font-bold text-tp-ink-sun"
    >
      N
    </span>
  );
}

function standardColumns(
  dimension: DistributionDimension,
  canSeeCost: boolean,
): Array<ColumnDef<DistributionRow>> {
  const columns: Array<ColumnDef<DistributionRow>> = [
    {
      key: "nama",
      header: DIMENSION_LABELS[dimension],
      render: (row) => (
        <span className="flex items-center font-semibold text-tp-text">
          {row.nama}
          {normalizedMarker(row)}
        </span>
      ),
    },
    { key: "jumlahTalent", header: "Talent", sortKey: "jumlahTalent", alignRight: true, render: (row) => row.jumlahTalent },
    { key: "totalBacklog", header: "Backlog", sortKey: "totalBacklog", alignRight: true, render: (row) => row.totalBacklog },
    { key: "totalTaskSubtask", header: "Aktivitas", sortKey: "totalTaskSubtask", alignRight: true, render: (row) => row.totalTaskSubtask },
    { key: "taskSubtaskPerTalent", header: "Aktivitas/Talent", alignRight: true, render: (row) => row.taskSubtaskPerTalent },
    { key: "availability", header: "Availability", sortKey: "availability", alignRight: true, render: (row) => percent(row.availability) },
    { key: "totalAvailableTime", header: "Jam tersedia", alignRight: true, render: (row) => row.totalAvailableTime },
    { key: "totalTimespent", header: "Time spent", sortKey: "totalTimespent", alignRight: true, render: (row) => row.totalTimespent },
    { key: "fte", header: "Beban (FTE)", sortKey: "fte", alignRight: true, render: (row) => percent(row.fte) },
    { key: "statusLoad", header: "Status beban", render: (row) => <LoadStatusBadge status={row.statusLoad} /> },
    { key: "backlogPerTalent", header: "Backlog/Talent", alignRight: true, render: (row) => row.backlogPerTalent },
    { key: "taskSubtaskWithTimespent", header: "Aktivitas w/ TS", alignRight: true, render: (row) => row.taskSubtaskWithTimespent },
    { key: "training", header: "Training", alignRight: true, render: (row) => row.training },
    { key: "avgFte", header: "Rata-rata FTE", alignRight: true, render: (row) => percent(row.avgFte) },
    { key: "jmlAssignment", header: "Assignment", alignRight: true, render: (row) => row.jmlAssignment },
    { key: "totalTimespentEstimate", header: "Est. time spent", alignRight: true, render: (row) => row.totalTimespentEstimate ?? "—" },
    { key: "loadEstimate", header: "Est. beban", sortKey: "loadEstimate", alignRight: true, render: (row) => percent(row.loadEstimate) },
    {
      key: "statusLoadEstimate",
      header: "Est. status",
      render: (row) => (row.statusLoadEstimate ? <LoadStatusBadge status={row.statusLoadEstimate} /> : "—"),
    },
    { key: "ttdComp", header: "TTD", sortKey: "ttdComp", alignRight: true, render: (row) => percent(row.ttdComp) },
    {
      key: "compLvl",
      header: "Level TTD",
      render: (row) => (row.compLvl ? <TtdLevelBadge level={row.compLvl} /> : "—"),
    },
  ];
  if (canSeeCost) {
    columns.push({
      key: "totalCost",
      header: "Biaya talent",
      alignRight: true,
      render: (row) => row.totalCost ?? "—",
    });
  }
  return columns;
}

const NORMALIZED_COLUMNS: Array<ColumnDef<DistributionNormalizedRow>> = [
  { key: "nama", header: "Entitas", render: (row) => <span className="font-semibold text-tp-text">{row.nama}</span> },
  { key: "jumlahTalent", header: "Talent ternormalisasi", alignRight: true, render: (row) => row.jumlahTalent ?? "—" },
  { key: "jmlActivityNormalized", header: "Aktivitas ternormalisasi", alignRight: true, render: (row) => row.jmlActivityNormalized ?? "—" },
  { key: "totalTimespent", header: "Total time spent", alignRight: true, render: (row) => row.totalTimespent ?? "—" },
  { key: "totalTimespentNormDay", header: "TS ternormalisasi/hari", alignRight: true, render: (row) => row.totalTimespentNormDay ?? "—" },
];

type FilterKey = "tribeId" | "productId" | "squadId" | "unitcode" | "statusLoad";

const FILTER_SCOPE: Record<DistributionDimension, readonly FilterKey[]> = {
  tribe: ["statusLoad"],
  product: ["tribeId", "statusLoad"],
  squad: ["tribeId", "productId", "statusLoad"],
  unitcode: ["tribeId", "productId", "squadId", "statusLoad"],
  talent: ["tribeId", "productId", "squadId", "unitcode", "statusLoad"],
};

const EMPTY_FILTER: DistributionFilter = {
  tribeId: null,
  productId: null,
  squadId: null,
  unitcode: null,
  statusLoad: null,
};

function scopeMatches(row: DistributionRow, filter: DistributionFilter, keys: readonly FilterKey[]): boolean {
  return keys.every((key) => {
    if (key === "statusLoad") {
      return !filter.statusLoad || row.statusLoad === filter.statusLoad;
    }
    return !filter[key] || row.scope[key] === filter[key];
  });
}

function normalizedScopeMatches(
  row: DistributionNormalizedRow,
  filter: DistributionFilter,
  keys: readonly FilterKey[],
): boolean {
  return keys
    .filter((key): key is Exclude<FilterKey, "statusLoad"> => key !== "statusLoad")
    .every((key) => !filter[key] || row.scope[key] === filter[key]);
}

function uniqueOptions(rows: { id: string; nama: string }[]) {
  return rows.map((row) => ({ value: row.id, label: row.nama }));
}

function sortRows(rows: DistributionRow[], sort: SortState): DistributionRow[] {
  if (!sort) return rows;
  const accessor = SORT_ACCESSORS[sort.key];
  return [...rows].sort((a, b) => {
    const av = accessor(a);
    const bv = accessor(b);
    if (av === null && bv === null) return 0;
    if (av === null) return 1;
    if (bv === null) return -1;
    const order = av - bv;
    return sort.dir === "asc" ? order : -order;
  });
}

/** Opsi filter unit code — satu entri per nilai unitcode, bukan per baris. */
function unitcodeFilterOptions(rows: DistributionRow[], filter: DistributionFilter) {
  const options = new Map<string, { value: string; label: string }>();
  for (const row of rows) {
    const code = row.scope.unitcode;
    if (!code || options.has(code)) continue;
    if (filter.tribeId && row.scope.tribeId !== filter.tribeId) continue;
    if (filter.productId && row.scope.productId !== filter.productId) continue;
    if (filter.squadId && row.scope.squadId !== filter.squadId) continue;
    options.set(code, { value: code, label: code });
  }
  return [...options.values()];
}

function TalentDrillDownList({ row, tables }: { row: DistributionRow; tables: DistributionTables }) {
  const scopeKeys = (Object.keys(row.scope) as Array<keyof typeof row.scope>).filter(
    (key) => row.scope[key] !== null,
  );
  const talents = tables.rows.talent.filter((talent) =>
    scopeKeys.every((key) => talent.scope[key] === row.scope[key]),
  );

  if (talents.length === 0) {
    return <p className="text-sm text-tp-muted">Tidak ada talent dalam entitas ini.</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-tp-line" aria-label={`Talent dalam ${row.nama}`}>
      {talents.map((talent) => (
        <li
          key={talent.id}
          className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm first:pt-0 last:pb-0"
        >
          <span className="font-medium text-tp-text">{talent.nama}</span>
          <span className="flex items-center gap-3 text-tp-muted">
            <span>Beban {talent.fte}%</span>
            <LoadStatusBadge status={talent.statusLoad} />
          </span>
        </li>
      ))}
    </ul>
  );
}

function SortHeader({
  column,
  sort,
  onToggle,
}: {
  column: { header: string; sortKey?: SortKey };
  sort: SortState;
  onToggle: (key: SortKey) => void;
}) {
  if (!column.sortKey) return <>{column.header}</>;
  const active = sort?.key === column.sortKey;
  return (
    <button
      type="button"
      onClick={() => onToggle(column.sortKey!)}
      className="inline-flex items-center gap-1 hover:text-tp-text"
    >
      {column.header}
      {active ? (
        sort!.dir === "asc" ? (
          <IconChevronUp aria-hidden size={14} stroke={2} />
        ) : (
          <IconChevronDown aria-hidden size={14} stroke={2} />
        )
      ) : null}
    </button>
  );
}

/**
 * Tabel distribusi beban per dimensi (TAN-231) dengan varian ternormalisasi,
 * drill-down talent, filter per dimensi, sort, dan pagination. Semua angka
 * berasal dari data; filter/sort/pagination hanya memilih baris yang tampil.
 */
export function DistributionSection({
  tables,
  canSeeCost,
}: {
  tables: DistributionTables;
  canSeeCost: boolean;
}) {
  const [dimension, setDimension] = React.useState<DistributionDimension>("tribe");
  const [normalized, setNormalized] = React.useState(false);
  const [filter, setFilter] = React.useState<DistributionFilter>(EMPTY_FILTER);
  const [sort, setSort] = React.useState<SortState>(null);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const filterKeys = FILTER_SCOPE[dimension];
  const standardRows = tables.rows[dimension].filter((row) => scopeMatches(row, filter, filterKeys));
  const normalizedRows = tables.normalizedRows[dimension].filter((row) =>
    normalizedScopeMatches(row, filter, filterKeys),
  );
  const visibleRows: number = normalized ? normalizedRows.length : standardRows.length;

  function changeDimension(next: DistributionDimension) {
    setDimension(next);
    setPage(1);
    setExpandedId(null);
  }

  function changeNormalized(next: boolean) {
    setNormalized(next);
    setPage(1);
    setExpandedId(null);
  }

  const standardCols = standardColumns(dimension, canSeeCost);
  const drillDownEnabled = !normalized && dimension !== "talent";
  const shownRows = normalized
    ? normalizedRows.slice((page - 1) * pageSize, page * pageSize)
    : sortRows(standardRows, sort).slice((page - 1) * pageSize, page * pageSize);

  function toggleSort(key: SortKey) {
    setPage(1);
    setExpandedId(null);
    setSort((current) => {
      if (!current || current.key !== key) return { key, dir: "desc" };
      if (current.dir === "desc") return { key, dir: "asc" };
      return null;
    });
  }

  function updateFilter(key: FilterKey, value: string) {
    const next: DistributionFilter = { ...filter, [key]: value || null };
    if (key === "tribeId") {
      next.productId = null;
      next.squadId = null;
      next.unitcode = null;
    } else if (key === "productId") {
      next.squadId = null;
      next.unitcode = null;
    } else if (key === "squadId") {
      next.unitcode = null;
    }
    setFilter(next);
    setPage(1);
    setExpandedId(null);
  }

  const productOptions = uniqueOptions(
    tables.rows.product.filter((row) => !filter.tribeId || row.scope.tribeId === filter.tribeId),
  );
  const squadOptions = uniqueOptions(
    tables.rows.squad.filter(
      (row) =>
        (!filter.tribeId || row.scope.tribeId === filter.tribeId) &&
        (!filter.productId || row.scope.productId === filter.productId),
    ),
  );
  const unitcodeOptions = unitcodeFilterOptions(tables.rows.unitcode, filter);

  const statusOptions = [
    { value: "", label: "Semua status" },
    ...WORKLOAD_STATUSES.map((status) => ({ value: status as string, label: status })),
  ];

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="tp-h3">Distribusi beban</h2>
          <p className="tp-label mt-1">
            Agregat per dimensi organisasi — angka dari data, bukan dihitung ulang.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-[13px] font-semibold text-tp-muted">
            Dimensi
            <Select
              aria-label="Dimensi distribusi"
              className="h-10 w-40"
              value={dimension}
              onChange={(e) => changeDimension(e.target.value as DistributionDimension)}
              options={DISTRIBUTION_DIMENSIONS.map((d) => ({ value: d, label: DIMENSION_LABELS[d] }))}
            />
          </label>
          <label className="flex items-center gap-2 text-[13px] font-semibold text-tp-muted">
            Varian
            <Select
              aria-label="Varian tabel distribusi"
              className="h-10 w-44"
              value={normalized ? "normalized" : "standard"}
              onChange={(e) => changeNormalized(e.target.value === "normalized")}
              options={[
                { value: "standard", label: "Standar" },
                { value: "normalized", label: "Ternormalisasi" },
              ]}
            />
          </label>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {filterKeys.includes("tribeId") ? (
          <label className="flex items-center gap-1.5 text-[13px] text-tp-muted">
            Tribe
            <Select
              aria-label="Filter tribe"
              className="h-9 w-44"
              value={filter.tribeId ?? ""}
              onChange={(e) => updateFilter("tribeId", e.target.value)}
              options={[{ value: "", label: "Semua tribe" }, ...uniqueOptions(tables.rows.tribe)]}
            />
          </label>
        ) : null}
        {filterKeys.includes("productId") ? (
          <label className="flex items-center gap-1.5 text-[13px] text-tp-muted">
            Product
            <Select
              aria-label="Filter product"
              className="h-9 w-44"
              value={filter.productId ?? ""}
              onChange={(e) => updateFilter("productId", e.target.value)}
              options={[{ value: "", label: "Semua product" }, ...productOptions]}
            />
          </label>
        ) : null}
        {filterKeys.includes("squadId") ? (
          <label className="flex items-center gap-1.5 text-[13px] text-tp-muted">
            Squad
            <Select
              aria-label="Filter squad"
              className="h-9 w-44"
              value={filter.squadId ?? ""}
              onChange={(e) => updateFilter("squadId", e.target.value)}
              options={[{ value: "", label: "Semua squad" }, ...squadOptions]}
            />
          </label>
        ) : null}
        {filterKeys.includes("unitcode") ? (
          <label className="flex items-center gap-1.5 text-[13px] text-tp-muted">
            Unit Code
            <Select
              aria-label="Filter unit code"
              className="h-9 w-44"
              value={filter.unitcode ?? ""}
              onChange={(e) => updateFilter("unitcode", e.target.value)}
              options={[{ value: "", label: "Semua unit code" }, ...unitcodeOptions]}
            />
          </label>
        ) : null}
        {!normalized ? (
          <label className="flex items-center gap-1.5 text-[13px] text-tp-muted">
            Status beban
            <Select
              aria-label="Filter status beban"
              className="h-9 w-48"
              value={filter.statusLoad ?? ""}
              onChange={(e) => updateFilter("statusLoad", e.target.value)}
              options={statusOptions}
            />
          </label>
        ) : null}
      </div>

      <div className="table-panel">
        <div className="table-scroll">
          {normalized ? (
            <table className="w-full min-w-[640px]">
              <caption className="sr-only">
                Tabel distribusi beban ternormalisasi dimensi {DIMENSION_LABELS[dimension]}
              </caption>
              <thead>
                <tr>
                  {NORMALIZED_COLUMNS.map((col) => (
                    <th key={col.key} scope="col" className={cn(col.alignRight && "text-right")}>
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shownRows.length === 0 ? (
                  <tr>
                    <td colSpan={NORMALIZED_COLUMNS.length} className="empty-row">
                      Tidak ada baris yang cocok dengan filter atau dimensi ini.
                    </td>
                  </tr>
                ) : (
                  (shownRows as DistributionNormalizedRow[]).map((row) => (
                    <tr key={row.id}>
                      {NORMALIZED_COLUMNS.map((col) => (
                        <td key={col.key} className={cn(col.alignRight && "text-right")}>
                          {col.render(row)}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full min-w-[1400px]">
              <caption className="sr-only">Tabel distribusi beban dimensi {DIMENSION_LABELS[dimension]}</caption>
              <thead>
                <tr>
                  {drillDownEnabled ? <th scope="col" className="w-10" aria-label="Ekspand baris" /> : null}
                  {standardCols.map((col) => (
                    <th
                      key={col.key}
                      scope="col"
                      aria-sort={
                        sort && col.sortKey === sort.key
                          ? sort.dir === "asc"
                            ? "ascending"
                            : "descending"
                          : undefined
                      }
                      className={cn(col.alignRight && "text-right")}
                    >
                      <SortHeader column={col} sort={sort} onToggle={toggleSort} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shownRows.length === 0 ? (
                  <tr>
                    <td colSpan={standardCols.length + (drillDownEnabled ? 1 : 0)} className="empty-row">
                      Tidak ada baris yang cocok dengan filter atau dimensi ini.
                    </td>
                  </tr>
                ) : (
                  (shownRows as DistributionRow[]).map((row) => {
                    const expanded = drillDownEnabled && expandedId === row.id;
                    const panelId = `drilldown-${row.id}`;
                    return (
                      <React.Fragment key={row.id}>
                        <tr data-expanded={expanded || undefined}>
                          {drillDownEnabled ? (
                            <td>
                              <button
                                type="button"
                                aria-expanded={expanded}
                                aria-controls={panelId}
                                aria-label={`Lihat talent ${row.nama}`}
                                onClick={() => setExpandedId(expanded ? null : row.id)}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-tp-line text-tp-muted hover:text-tp-text"
                              >
                                {expanded ? (
                                  <IconChevronDown aria-hidden size={16} stroke={2} />
                                ) : (
                                  <IconChevronRight aria-hidden size={16} stroke={2} />
                                )}
                              </button>
                            </td>
                          ) : null}
                          {standardCols.map((col) => (
                            <td key={col.key} className={cn(col.alignRight && "text-right")}>
                              {col.render(row)}
                            </td>
                          ))}
                        </tr>
                        {expanded ? (
                          <tr id={panelId}>
                            <td colSpan={standardCols.length + 1} className="bg-tp-bg">
                              <div className="px-2 py-3">
                                <TalentDrillDownList row={row} tables={tables} />
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
        {visibleRows > 0 ? (
          <footer className="table-footer">
            <Pagination
              page={page}
              pageSize={pageSize}
              totalItems={visibleRows}
              pageSizeOptions={[5, 10, 25]}
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
