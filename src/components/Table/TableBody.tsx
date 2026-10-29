import { IconChevronDown, IconChevronRight } from "@tabler/icons-react";
import * as React from "react";
import { cn } from "@/lib/cn";
import { orDash } from "@/lib/cell";
import type { TableColumn, TableExpandable } from "./Table";

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

export function TableBody<T>({
  columns,
  records,
  loading,
  loadingText,
  emptyText,
  colSpan,
  rowKey,
  rowClassName,
  onRow,
  expandable,
}: {
  columns: readonly TableColumn<T>[];
  records: readonly T[];
  loading: boolean;
  loadingText: React.ReactNode;
  emptyText: React.ReactNode;
  colSpan: number;
  rowKey: (record: T, index: number) => React.Key;
  rowClassName?: string | ((record: T, index: number) => string | undefined);
  onRow?: (record: T, index: number) => React.HTMLAttributes<HTMLTableRowElement>;
  expandable?: TableExpandable<T>;
}) {
  if (loading) {
    return (
      <tr>
        <td className="empty-row" colSpan={colSpan}>
          <span className="flex items-center justify-center gap-2 text-sm text-tp-muted">
            <span
              aria-hidden
              className="h-4 w-4 animate-spin rounded-full border-2 border-tp-neutral border-t-transparent"
            />
            {loadingText}
          </span>
        </td>
      </tr>
    );
  }

  if (records.length === 0) {
    return (
      <tr>
        <td className="empty-row" colSpan={colSpan}>
          {emptyText}
        </td>
      </tr>
    );
  }

  return records.map((record, index) => {
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
                aria-controls={expandable.expandedRowId?.(record, index)}
                aria-expanded={expanded}
                aria-label={expandable.toggleLabel(record, index)}
                className={TOGGLE_BUTTON}
                onClick={() => expandable.onExpand(record, index, !expanded)}
                type="button"
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
            const cellClassName = cn(column.className, column.align && ALIGN_CELL[column.align]);
            const content = readCell(column, record, index);
            return column.rowHeader ? (
              <th className={cellClassName} key={column.key} scope="row">
                {content}
              </th>
            ) : (
              <td className={cellClassName} key={column.key}>
                {content}
              </td>
            );
          })}
        </tr>
        {expandable && expanded ? (
          <tr id={expandable.expandedRowId?.(record, index)}>
            <td className="bg-tp-bg" colSpan={colSpan}>
              <div className="px-2 py-3">{expandable.expandedRowRender(record, index)}</div>
            </td>
          </tr>
        ) : null}
      </React.Fragment>
    );
  });
}

const ALIGN_CELL: Record<"left" | "center" | "right", string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};
