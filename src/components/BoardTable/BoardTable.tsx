import { cn } from "@/lib/cn";
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
}

export function BoardTable({ caption, columns, children }: BoardTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-board-border bg-board shadow-sm">
      <table className="w-full border-collapse text-left text-sm">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead>
          <tr className="border-b border-board-border bg-header-row">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  "px-4 py-2.5 text-xs font-semibold text-zinc-700",
                  col.className,
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}