import { Pagination } from "@/components/Pagination";
import { cn } from "@/lib/cn";
import * as React from "react";
import { TableBody } from "./TableBody";

export interface TableColumn<T> {
  key: string;
  title: React.ReactNode;
  dataIndex?: keyof T;
  render?: (value: unknown, record: T, index: number) => React.ReactNode;
  className?: string;
  width?: number | string;
  align?: "left" | "center" | "right";
  rowHeader?: boolean;
  headerProps?: React.ThHTMLAttributes<HTMLTableCellElement>;
}

export interface TablePagination {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  disabled?: boolean;
}

export interface TableExpandable<T> {
  expandedRowKeys: readonly React.Key[];
  onExpand: (record: T, index: number, expanded: boolean) => void;
  expandedRowRender: (record: T, index: number) => React.ReactNode;
  toggleLabel: (record: T, index: number) => string;
  expandedRowId?: (record: T, index: number) => string;
  columnClassName?: string;
  columnAriaLabel?: string;
}

export interface TableProps<T> {
  columns: readonly TableColumn<T>[];
  dataSource?: readonly T[];
  rowKey: (record: T, index: number) => React.Key;
  caption?: string;
  loading?: boolean;
  loadingText?: React.ReactNode;
  emptyText?: React.ReactNode;
  pagination?: TablePagination;
  className?: string;
  minWidth?: number;
  rowClassName?: string | ((record: T, index: number) => string | undefined);
  onRow?: (record: T, index: number) => React.HTMLAttributes<HTMLTableRowElement>;
  expandable?: TableExpandable<T>;
}

const ALIGN: Record<"left" | "center" | "right", string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export function Table<T>({
  columns,
  dataSource,
  rowKey,
  caption,
  loading = false,
  loadingText = "Memuat…",
  emptyText = "Tidak ada data.",
  pagination,
  className,
  minWidth = 560,
  rowClassName,
  onRow,
  expandable,
}: TableProps<T>) {
  const records = dataSource ?? [];
  const colSpan = columns.length + (expandable ? 1 : 0);

  return (
    <div className={cn("table-panel", className)}>
      <div className="table-scroll">
        <table className="w-full" style={{ minWidth: `${minWidth}px` }}>
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead>
            <tr>
              {expandable ? (
                <th
                  aria-label={expandable.columnAriaLabel}
                  className={expandable.columnClassName}
                  scope="col"
                />
              ) : null}
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  {...column.headerProps}
                  className={cn(
                    column.className,
                    column.align && ALIGN[column.align],
                    column.headerProps?.className,
                  )}
                  style={{
                    ...column.headerProps?.style,
                    ...(column.width !== undefined ? { width: column.width } : {}),
                  }}
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <TableBody
              colSpan={colSpan}
              columns={columns}
              emptyText={emptyText}
              expandable={expandable}
              loading={loading}
              loadingText={loadingText}
              onRow={onRow}
              records={records}
              rowClassName={rowClassName}
              rowKey={rowKey}
            />
          </tbody>
        </table>
      </div>
      {pagination ? (
        <footer className="table-footer">
          <Pagination {...pagination} disabled={loading || pagination.disabled} />
        </footer>
      ) : null}
    </div>
  );
}
