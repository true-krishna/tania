import * as React from "react";

export interface Column {
  key: string;
  label: string;
  className?: string;
}

interface BoardTableProps {
  caption?: string;
  columns: Column[];
  children: React.ReactNode;
  /** Konten footer di dalam panel — biasanya komponen Pagination. */
  footer?: React.ReactNode;
}

/**
 * Tabel konten utama dengan desain panel referensi TAN-178 (kelas dan metrik
 * ada di `src/components/table.css`, di-scope ke `.table-panel`).
 */
export function BoardTable({ caption, columns, children, footer }: BoardTableProps) {
  return (
    <div className="table-panel">
      <div className="table-scroll">
        {/* Tabel lebar menggulung horizontal, tidak memampat (kanon §VIII). */}
        <table className="w-full min-w-[560px]">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} scope="col" className={col.className}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
      {footer ? <footer className="table-footer">{footer}</footer> : null}
    </div>
  );
}