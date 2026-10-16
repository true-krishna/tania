import { IconChevronDown, IconChevronRight } from "@tabler/icons-react";
import { Pagination } from "@/components/Pagination";
import { orDash } from "@/lib/cell";
import { cn } from "@/lib/cn";
import * as React from "react";

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

const TOGGLE_BUTTON =
  "inline-flex h-7 w-7 items-center justify-center rounded-full border border-tp-line text-tp-muted hover:text-tp-text";

function readCell<T>(column: TableColumn<T>, record: T, index: number): React.ReactNode {
  const raw =
    column.dataIndex !== undefined
      ? (record as Record<string, unknown>)[column.dataIndex as string]
      : undefined;
  if (column.render) return column.render(raw, record, index);
  if (column.dataIndex !== undefined) return orDash(raw);
  return "-";
}

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
                <th scope="col" className={expandable.columnClassName} aria-label={expandable.columnAriaLabel} />
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
            {loading ? (
              <tr>
                <td colSpan={colSpan} className="empty-row">
                  <span className="flex items-center justify-center gap-2 text-sm text-tp-muted">
                    <span
                      className="h-4 w-4 animate-spin rounded-full border-2 border-tp-neutral border-t-transparent"
                      aria-hidden
                    />
                    {loadingText}
                  </span>
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="empty-row">
                  {emptyText}
                </td>
              </tr>
            ) : (
              records.map((record, index) => {
                const key = rowKey(record, index);
                const expanded = expandable ? expandable.expandedRowKeys.includes(key) : false;
                const { className: rowPropsClassName, ...rowProps } = onRow?.(record, index) ?? {};
                const classNameForRow =
                  typeof rowClassName === "function" ? rowClassName(record, index) : rowClassName;
                return (
                  <React.Fragment key={key}>
                    <tr {...rowProps} className={cn(classNameForRow, rowPropsClassName)}>
                      {expandable ? (
                        <td>
                          <button
                            type="button"
                            aria-expanded={expanded}
                            aria-controls={expandable.expandedRowId?.(record, index)}
                            aria-label={expandable.toggleLabel(record, index)}
                            onClick={() => expandable.onExpand(record, index, !expanded)}
                            className={TOGGLE_BUTTON}
                          >
                            {expanded ? (
                              <IconChevronDown aria-hidden size={16} stroke={2} />
                            ) : (
                              <IconChevronRight aria-hidden size={16} stroke={2} />
                            )}
                          </button>
                        </td>
                      ) : null}
                      {columns.map((column) => {
                        const cellClassName = cn(
                          column.className,
                          column.align && ALIGN[column.align],
                        );
                        const content = readCell(column, record, index);
                        return column.rowHeader ? (
                          <th key={column.key} scope="row" className={cellClassName}>
                            {content}
                          </th>
                        ) : (
                          <td key={column.key} className={cellClassName}>
                            {content}
                          </td>
                        );
                      })}
                    </tr>
                    {expandable && expanded ? (
                      <tr id={expandable.expandedRowId?.(record, index)}>
                        <td colSpan={colSpan} className="bg-tp-bg">
                          <div className="px-2 py-3">{expandable.expandedRowRender(record, index)}</div>
                        </td>
                      </tr>
                    ) : null}
                  </React.Fragment>
                );
              })
            )}
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
