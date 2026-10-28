import type { AccessRole } from "@/generated/graphql";
import { NAV, type NavEntry } from "@/components/Sidebar";
import {
  menuEntryIdForHref,
  type MenuAccessCell,
  type MenuAccessLevel,
} from "@/lib/auth/menuAccess";

/**
 * Menu × role grid model of the Admin configuration page (W3 / TAN-264).
 *
 * The rows are generated from `NAV` — the same array the sidebar renders — so the
 * grid can never drift from the menu it configures, and the entry ids it sends
 * are exactly the `menu_entry_id` values the server catalog contains
 * (`route path without the leading slash`).
 *
 * Editing is one level per cell: "Tidak tampil" (NONE) is both hidden and
 * denied, "Lihat" (READ) and "Kelola" (MANAGE) are visible. The schema keeps
 * `visible` as a separate axis (W2), but a UI that could hide an entry while
 * still authorizing it would only invite a menu that lies about the server.
 */

export interface MenuGridRow {
  /** Menu entry id: the route path without its leading slash. */
  id: string;
  label: string;
  /** Label of the owning group ("Employee", "Master Data", …), when nested. */
  parent?: string;
}

function rowsOf(entry: NavEntry): MenuGridRow[] {
  if (entry.kind === "link") {
    return [{ id: menuEntryIdForHref(entry.href), label: entry.label }];
  }
  return entry.children.map((child) => ({
    id: menuEntryIdForHref(child.href),
    label: child.label,
    parent: entry.label,
  }));
}

/**
 * Configurable entries without a sidebar route (TAN-344): the assistant is a
 * global bubble, so its grid row exists but it never becomes a nav item and the
 * sidebar preview simply ignores it.
 */
const ROUTELESS_ROWS: readonly MenuGridRow[] = [{ id: "assistant", label: "Asisten data" }];

/** Every configurable menu entry, in sidebar order, plus the route-less ones. */
export const MENU_ROWS: readonly MenuGridRow[] = [...NAV.flatMap(rowsOf), ...ROUTELESS_ROWS];

export const LEVEL_LABEL: Record<MenuAccessLevel, string> = {
  NONE: "Tidak tampil",
  READ: "Lihat",
  MANAGE: "Kelola",
};

const ALL_LEVELS: readonly MenuAccessLevel[] = ["NONE", "READ", "MANAGE"];

/** Entries the server keeps Admin-only whatever a row says (W1 catalog + US-C). */
const ADMIN_ONLY_ENTRIES: readonly string[] = ["accounts", "audit"];

/**
 * What one cell may be configured to. `disabled` cells are shown but not
 * editable, because the server refuses the change (see
 * `validateMenuUpdates`) — mirroring the refusal in the UI is a courtesy, the
 * server is the enforcement point.
 */
export interface CellRule {
  /** Levels this role may hold on this entry, in menu order. */
  allowed: readonly MenuAccessLevel[];
  disabled?: boolean;
  reason?: string;
}

const ADMIN_LOCKED = "Hanya peran Admin yang dapat memegang menu ini.";

export function cellRule(templateRole: AccessRole, entryId: string): CellRule {
  const admin = templateRole === "ADMIN";
  if (ADMIN_ONLY_ENTRIES.includes(entryId)) {
    return { allowed: [admin ? "MANAGE" : "NONE"], disabled: true, reason: ADMIN_LOCKED };
  }
  if (entryId.startsWith("master-data/")) {
    // Master-data management is a Locked permission with no configurable entry:
    // other roles may read (or hide) the pages, never manage them.
    return admin
      ? { allowed: ["MANAGE"], disabled: true, reason: "Pengelolaan master data tetap milik Admin." }
      : { allowed: ["NONE", "READ"] };
  }
  return { allowed: ALL_LEVELS, disabled: false };
}

/** The cells of one role, keyed by menu entry id. */
export type RoleGrid = Record<string, MenuAccessCell>;

export interface GridCell {
  roleId: string;
  roleName: string;
  menuEntryId: string;
  visible: boolean;
  accessLevel: MenuAccessLevel;
}

/** Turns a `roleMenuConfig`/`myMenuConfig` response into one role's grid. */
export function gridOf(cells: readonly GridCell[], roleName: string): RoleGrid {
  const grid: RoleGrid = {};
  for (const cell of cells) {
    if (cell.roleName !== roleName) continue;
    grid[cell.menuEntryId] = { visible: cell.visible, accessLevel: cell.accessLevel };
  }
  return grid;
}

/**
 * One cell as the API expects it: the level carries visibility, so a hidden
 * entry is also a denied one.
 */
export function cellOf(level: MenuAccessLevel): MenuAccessCell {
  return { visible: level !== "NONE", accessLevel: level };
}

/** The writable payload of one role's grid, in catalog order. */
export function gridInput(
  grid: RoleGrid,
  fallback: RoleGrid = {},
): { menuEntryId: string; visible: boolean; accessLevel: MenuAccessLevel }[] {
  return MENU_ROWS.map((row) => {
    const cell = grid[row.id] ?? fallback[row.id] ?? cellOf("NONE");
    return {
      menuEntryId: row.id,
      visible: cell.visible && cell.accessLevel !== "NONE",
      accessLevel: cell.accessLevel,
    };
  });
}

/** One role's draft as API-shaped cells, for the preview panel. */
export function gridCells(roleId: string, roleName: string, grid: RoleGrid): GridCell[] {
  return MENU_ROWS.map((row) => {
    const cell = grid[row.id] ?? cellOf("NONE");
    return {
      roleId,
      roleName,
      menuEntryId: row.id,
      visible: cell.visible && cell.accessLevel !== "NONE",
      accessLevel: cell.accessLevel,
    };
  });
}

/** Whether a role's draft still differs from what the server returned. */
export function gridDirty(draft: RoleGrid, saved: RoleGrid): boolean {
  return MENU_ROWS.some((row) => {
    const a = draft[row.id]?.accessLevel ?? "NONE";
    const b = saved[row.id]?.accessLevel ?? "NONE";
    return a !== b;
  });
}

/** Menus a role sees, in sidebar order — the count shown above the grid. */
export function visibleRowCount(grid: RoleGrid): number {
  return MENU_ROWS.filter((row) => (grid[row.id]?.accessLevel ?? "NONE") !== "NONE").length;
}
