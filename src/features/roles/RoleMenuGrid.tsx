"use client";

import * as React from "react";
import { Button } from "@/components/Button";
import { Select } from "@/components/Select";
import { Table, type TableColumn } from "@/components/Table";
import type { AccessRole } from "@/generated/graphql/types";
import type { MenuAccessLevel } from "@/generated/graphql/types";
import type { Role } from "./useRoles";
import {
  LEVEL_LABEL,
  MENU_ROWS,
  cellRule,
  gridDirty,
  type RoleGrid,
  type MenuGridRow,
} from "./menuGrid";


export type GridDraft = Record<string, RoleGrid>;

export interface MenuGridProps {
  roles: readonly Role[];
  draft: GridDraft;
  saved: GridDraft;
  busyRoleId: string | null;
  onChangeCell: (roleId: string, entryId: string, level: MenuAccessLevel) => void;
  onSaveRole: (role: Role) => void;
  onResetRole: (role: Role) => void;
  onPreviewRole: (role: Role) => void;
}

export function MenuGrid({
  roles,
  draft,
  saved,
  busyRoleId,
  onChangeCell,
  onSaveRole,
  onResetRole,
  onPreviewRole,
}: MenuGridProps) {
  const columns: TableColumn<MenuGridRow>[] = [
    {
      key: "menu",
      title: "Menu",
      render: (_value: unknown, row) => (
        <span className={row.parent ? "pl-4 text-zinc-600" : "font-medium"}>
          {row.parent ? `${row.label}` : row.label}
          {row.parent ? (
            <span className="ml-2 text-xs text-tp-muted">{row.parent}</span>
          ) : null}
        </span>
      ),
    },
    ...roles.map((role) => ({
      key: `role-${role.id}`,
      title: roleHeader(role, draft, saved, busyRoleId, onSaveRole, onResetRole, onPreviewRole),
      render: (_value: unknown, row: MenuGridRow) => {
        const grid = draft[role.id] ?? {};
        const rule = cellRule(role.templateRole as AccessRole, row.id);
        const value = grid[row.id]?.accessLevel ?? "NONE";
        return (
          <Select
            aria-label={`${row.label} untuk ${role.label}`}
            className="w-full"
            disabled={rule.disabled || busyRoleId === role.id}
            onChange={(e) =>
              onChangeCell(role.id, row.id, e.target.value as MenuAccessLevel)
            }
            options={rule.allowed.map((level) => ({
              value: level,
              label: LEVEL_LABEL[level],
            }))}
            title={rule.reason}
            value={value}
          />
        );
      },
    })),
  ];

  return (
    <Table
      caption="Grid menu dan akses per role"
      columns={columns}
      dataSource={MENU_ROWS}
      rowKey={(row) => row.id}
    />
  );
}

function roleHeader(
  role: Role,
  draft: GridDraft,
  saved: GridDraft,
  busyRoleId: string | null,
  onSaveRole: (role: Role) => void,
  onResetRole: (role: Role) => void,
  onPreviewRole: (role: Role) => void,
) {
  const grid = draft[role.id] ?? {};
  const dirty = gridDirty(grid, saved[role.id] ?? {});
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="font-medium">{role.label}</span>
      <span className="text-xs text-tp-muted">{role.name}</span>
      {role.status !== "ACTIVE" ? (
        <span className="text-xs text-tp-ink-peach">Nonaktif</span>
      ) : null}
      <span className="flex gap-1">
        <Button
          disabled={!dirty || busyRoleId === role.id}
          onClick={() => onSaveRole(role)}
          type="button"
          variant={dirty ? "primary" : "secondary"}
        >
          Simpan
        </Button>
        <Button
          disabled={busyRoleId === role.id}
          onClick={() => onResetRole(role)}
          type="button"
          variant="ghost"
        >
          Reset
        </Button>
        <Button
          onClick={() => onPreviewRole(role)}
          type="button"
          variant="ghost"
        >
          Pratinjau
        </Button>
      </span>
    </div>
  );
}
