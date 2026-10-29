"use client";

import { Table, type TableColumn, type TableExpandable } from "@/components/Table";
import {
  NORMALIZED_COLUMNS,
  standardColumns,
  type SortKey,
  type SortState,
} from "./distributionColumns";
import { SortHeader } from "./SortHeader";
import { TalentDrillDownList } from "./TalentDrillDownList";
import type {
  DistributionDimension,
  DistributionNormalizedRow,
  DistributionRow,
  DistributionTables,
} from "./types";
import { DIMENSION_LABELS } from "./types";

type DistributionTableCommonProps = {
  canSeeCost: boolean;
  dimension: DistributionDimension;
  expandedId: string | null;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSortToggle: (key: SortKey) => void;
  onToggleExpand: (row: DistributionRow) => void;
  page: number;
  pageSize: number;
  sort: SortState;
  tables: DistributionTables;
  totalItems: number;
};

type DistributionTableProps = DistributionTableCommonProps &
  (
    | { normalized: true; rows: DistributionNormalizedRow[] }
    | { normalized: false; rows: DistributionRow[] }
  );

export function DistributionTable(props: DistributionTableProps) {
  const {
    canSeeCost,
    dimension,
    expandedId,
    onPageChange,
    onPageSizeChange,
    onSortToggle,
    onToggleExpand,
    page,
    pageSize,
    sort,
    tables,
    totalItems,
  } = props;

  const pagination = {
    onPageChange,
    onPageSizeChange,
    page,
    pageSize,
    pageSizeOptions: [5, 10, 25],
    totalItems,
  };

  if (props.normalized) {
    const columns: TableColumn<DistributionNormalizedRow>[] =
      NORMALIZED_COLUMNS.map((column) => ({
        align: column.alignRight ? ("right" as const) : undefined,
        key: column.key,
        render: (_value, row) => column.render(row),
        title: column.header,
      }));

    return (
      <Table
        caption={`Tabel distribusi beban ternormalisasi dimensi ${
          DIMENSION_LABELS[dimension]
        }`}
        columns={columns}
        dataSource={props.rows}
        emptyText="Tidak ada baris yang cocok dengan filter atau dimensi ini."
        minWidth={640}
        pagination={totalItems > 0 ? pagination : undefined}
        rowKey={(row) => row.id}
      />
    );
  }

  const columns: TableColumn<DistributionRow>[] = standardColumns(
    dimension,
    canSeeCost
  ).map((column) => ({
    align: column.alignRight ? ("right" as const) : undefined,
    headerProps: {
      "aria-sort":
        sort && column.sortKey === sort.key
          ? sort.dir === "asc"
            ? "ascending"
            : "descending"
          : undefined,
    },
    key: column.key,
    render: (_value, row) => column.render(row),
    title: (
      <SortHeader column={column} onToggle={onSortToggle} sort={sort} />
    ),
  }));

  const expandable: TableExpandable<DistributionRow> = {
    columnAriaLabel: "Ekspand baris",
    columnClassName: "w-10",
    expandedRowId: (row) => `drilldown-${row.id}`,
    expandedRowKeys: expandedId ? [expandedId] : [],
    expandedRowRender: (row) => (
      <TalentDrillDownList row={row} tables={tables} />
    ),
    onExpand: onToggleExpand,
    toggleLabel: (row) => `Lihat talent ${row.nama}`,
  };

  return (
    <Table
      caption={`Tabel distribusi beban dimensi ${DIMENSION_LABELS[dimension]}`}
      columns={columns}
      dataSource={props.rows}
      emptyText="Tidak ada baris yang cocok dengan filter atau dimensi ini."
      expandable={dimension === "talent" ? undefined : expandable}
      minWidth={1400}
      pagination={totalItems > 0 ? pagination : undefined}
      rowKey={(row) => row.id}
    />
  );
}
