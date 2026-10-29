"use client";

import * as React from "react";
import { Card } from "@/components/Card";
import { Select } from "@/components/Select";
import { DistributionFilterBar } from "./DistributionFilterBar";
import {
  EMPTY_FILTER,
  FILTER_SCOPE,
  normalizedScopeMatches,
  scopeMatches,
  sortRows,
  type FilterKey,
} from "./distributionFilters";
import { DistributionTable } from "./DistributionTable";
import type { SortKey, SortState } from "./distributionColumns";
import {
  DIMENSION_LABELS,
  DISTRIBUTION_DIMENSIONS,
  type DistributionDimension,
  type DistributionFilter,
  type DistributionRow,
  type DistributionTables,
} from "./types";

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
  const standardRows = tables.rows[dimension].filter((row) =>
    scopeMatches(row, filter, filterKeys),
  );
  const normalizedRows = tables.normalizedRows[dimension].filter((row) =>
    normalizedScopeMatches(row, filter, filterKeys),
  );
  const visibleRows = normalized ? normalizedRows.length : standardRows.length;
  const pageStart = (page - 1) * pageSize;
  const pageEnd = page * pageSize;
  const standardShownRows = sortRows(standardRows, sort).slice(pageStart, pageEnd);
  const normalizedShownRows = normalizedRows.slice(pageStart, pageEnd);

  function changeDimension(nextDimension: DistributionDimension) {
    setDimension(nextDimension);
    setPage(1);
    setExpandedId(null);
  }

  function changeNormalized(nextNormalized: boolean) {
    setNormalized(nextNormalized);
    setPage(1);
    setExpandedId(null);
  }

  function toggleSort(key: SortKey) {
    setPage(1);
    setExpandedId(null);
    setSort((current) => {
      if (!current || current.key !== key) return { dir: "desc", key };
      if (current.dir === "desc") return { dir: "asc", key };
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

  function toggleExpanded(row: DistributionRow) {
    setExpandedId((current) => (current === row.id ? null : row.id));
  }

  function changePageSize(size: number) {
    setPageSize(size);
    setPage(1);
  }

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
              onChange={(event) => changeDimension(event.target.value as DistributionDimension)}
              options={DISTRIBUTION_DIMENSIONS.map((option) => ({
                label: DIMENSION_LABELS[option],
                value: option,
              }))}
              value={dimension}
            />
          </label>
          <label className="flex items-center gap-2 text-[13px] font-semibold text-tp-muted">
            Varian
            <Select
              aria-label="Varian tabel distribusi"
              className="h-10 w-44"
              onChange={(event) => changeNormalized(event.target.value === "normalized")}
              options={[
                { label: "Standar", value: "standard" },
                { label: "Ternormalisasi", value: "normalized" },
              ]}
              value={normalized ? "normalized" : "standard"}
            />
          </label>
        </div>
      </div>

      <DistributionFilterBar
        dimension={dimension}
        filter={filter}
        normalized={normalized}
        onChange={updateFilter}
        tables={tables}
      />

      {normalized ? (
        <DistributionTable
          canSeeCost={canSeeCost}
          dimension={dimension}
          expandedId={expandedId}
          normalized
          onPageChange={setPage}
          onPageSizeChange={changePageSize}
          onSortToggle={toggleSort}
          onToggleExpand={toggleExpanded}
          page={page}
          pageSize={pageSize}
          rows={normalizedShownRows}
          sort={sort}
          tables={tables}
          totalItems={visibleRows}
        />
      ) : (
        <DistributionTable
          canSeeCost={canSeeCost}
          dimension={dimension}
          expandedId={expandedId}
          normalized={false}
          onPageChange={setPage}
          onPageSizeChange={changePageSize}
          onSortToggle={toggleSort}
          onToggleExpand={toggleExpanded}
          page={page}
          pageSize={pageSize}
          rows={standardShownRows}
          sort={sort}
          tables={tables}
          totalItems={visibleRows}
        />
      )}
    </Card>
  );
}
