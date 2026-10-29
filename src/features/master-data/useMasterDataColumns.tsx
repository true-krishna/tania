"use client";

import type * as React from "react";
import type { TableColumn } from "@/components/Table";
import { StatusBadge } from "@/components/DataState";
import { MasterDataRowActions } from "./MasterDataRowActions";
import type { MasterDataItem } from "./MasterDataSection";

export function useMasterDataColumns<T extends MasterDataItem>({
  nameLabel,
  extraColumn,
  manage,
  selectionEnabled,
  selectedIdSet,
  pageRows,
  toggleAllRows,
  toggleRow,
  editingId,
  onEdit,
  onToggleActive,
}: {
  nameLabel: string;
  extraColumn?: { label: string; render: (item: T) => React.ReactNode };
  manage: boolean;
  selectionEnabled: boolean;
  selectedIdSet: Set<string>;
  pageRows: readonly T[];
  toggleAllRows: (checked: boolean) => void;
  toggleRow: (id: string, checked: boolean) => void;
  editingId: string | null;
  onEdit: (item: T) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
}): TableColumn<T>[] {
  return [
    ...(selectionEnabled
      ? [
          {
            key: "select",
            title: (
              <input
                aria-label="Pilih semua baris di halaman ini"
                checked={
                  pageRows.length > 0 && pageRows.every((item) => selectedIdSet.has(item.id))
                }
                className="h-4 w-4"
                onChange={(e) => toggleAllRows(e.target.checked)}
                type="checkbox"
              />
            ),
            render: (_value: unknown, item: T) => (
              <input
                aria-label={`Pilih ${item.name}`}
                checked={selectedIdSet.has(item.id)}
                className="h-4 w-4"
                onChange={(e) => toggleRow(item.id, e.target.checked)}
                type="checkbox"
              />
            ),
          } satisfies TableColumn<T>,
        ]
      : []),
    {
      key: "name",
      title: nameLabel,
      className: "text-zinc-900",
      render: (_value, item) => item.name,
    },
    ...(extraColumn
      ? [
          {
            key: "extra",
            title: extraColumn.label,
            className: "text-zinc-600",
            render: (_value: unknown, item: T) => extraColumn.render(item),
          } satisfies TableColumn<T>,
        ]
      : []),
    {
      key: "status",
      title: "Status",
      render: (_value, item) => <StatusBadge active={item.isActive} />,
    },
    ...(manage
      ? [
          {
            key: "actions",
            title: "Aksi",
            className: "col-action",
            render: (_value: unknown, item: T) => (
              <MasterDataRowActions
                editing={editingId === item.id}
                isActive={item.isActive}
                name={item.name}
                onEdit={() => onEdit(item)}
                onToggleActive={() => onToggleActive(item.id, !item.isActive)}
              />
            ),
          } satisfies TableColumn<T>,
        ]
      : []),
  ];
}
