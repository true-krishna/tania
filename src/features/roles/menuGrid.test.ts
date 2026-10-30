// Grid model of the Admin configuration page (W3 / TAN-264). The load-bearing
// assertions here are the drift guards: the grid must cover exactly the menu
// entries the sidebar renders, and the rules it applies must be the rules the
// server enforces.

import { describe, expect, it } from "vitest";
import { NAV } from "@/components/Sidebar";
import {
  DEFAULT_MENU_ACCESS,
  menuEntryIdForHref,
  type MenuAccessLevel,
} from "@/lib/auth/menuAccess";
import type { AccessRole } from "@/generated/graphql";
import {
  MENU_ROWS,
  cellOf,
  cellRule,
  gridCells,
  gridDirty,
  gridInput,
  gridOf,
  visibleRowCount,
  type GridCell,
  type RoleGrid,
} from "./menuGrid";

const ROLES: readonly AccessRole[] = ["ADMIN", "OPERATION", "CHAPTER", "TALENT"];

/** Sidebar hrefs, flattened — the grid must equal this set, id for id. */
const NAV_ENTRY_IDS = NAV.flatMap((entry) =>
  entry.kind === "link"
    ? [menuEntryIdForHref(entry.href)]
    : entry.children.map((c) => menuEntryIdForHref(c.href)),
);

/** The server's cells for one role: the default matrix, as `roleMenuConfig` returns it. */
function cellsOf(role: string): GridCell[] {
  return MENU_ROWS.map((row) => {
    const cell = DEFAULT_MENU_ACCESS[role][row.id] ?? {
      visible: false,
      accessLevel: "NONE" as const,
    };
    return {
      roleId: `role-${role.toLowerCase()}`,
      roleName: role,
      menuEntryId: row.id,
      visible: cell.visible,
      accessLevel: cell.accessLevel,
    };
  });
}

describe("MENU_ROWS mengikuti katalog menu", () => {
  it("memuat entri sidebar plus entri tanpa rute", () => {
    // "assistant" (TAN-344) adalah entri tanpa rute: punya baris grid, tidak
    // punya item nav. Urutannya tetap entri sidebar lebih dulu.
    expect(MENU_ROWS.map((row) => row.id)).toEqual([...NAV_ENTRY_IDS, "assistant"]);
    expect(new Set(MENU_ROWS.map((row) => row.id)).size).toBe(MENU_ROWS.length);
  });

  it("entri tanpa rute tampil sebagai baris grid tanpa induk", () => {
    expect(MENU_ROWS.find((row) => row.id === "assistant")).toEqual({
      id: "assistant",
      label: "Asisten data",
    });
  });

  it("setiap entri punya default di matriks 002 — tidak ada menu tanpa akses awal", () => {
    const inMatrix = new Set(
      Object.values(DEFAULT_MENU_ACCESS).flatMap((grid) => Object.keys(grid)),
    );
    for (const row of MENU_ROWS) {
      expect(inMatrix.has(row.id), `${row.id} tidak ada di DEFAULT_MENU_ACCESS`).toBe(true);
    }
    // And the other way round: every configurable entry of the matrix is
    // reachable from the grid. Talent's personal pages are not configurable
    // (TAN-392), so `evaluations/my` no longer has a row.
    const talentOnly = new Set(["evaluations/my"]);
    for (const id of inMatrix) {
      if (talentOnly.has(id)) continue;
      expect(
        MENU_ROWS.some((row) => row.id === id),
        `${id} tidak muncul di grid`,
      ).toBe(true);
    }
  });

  it("menandai entri bersarang dengan label induknya", () => {
    const nested = MENU_ROWS.filter((row) => row.parent);
    expect(nested.map((row) => row.id)).toContain("evaluations/periods");
    expect(
      nested.every((row) =>
        ["Administrasi", "Evaluasi", "Master Data", "Karyawan"].includes(row.parent ?? ""),
      ),
    ).toBe(true);
  });

  it("memuat baris Menu & Akses di grup Administration (TAN-376)", () => {
    expect(MENU_ROWS.find((row) => row.id === "admin/roles")).toEqual({
      id: "admin/roles",
      label: "Menu & Akses",
      parent: "Administrasi",
    });
  });
});

describe("cellRule mencerminkan aturan server", () => {
  it("menu Admin-only terkunci untuk semua role", () => {
    for (const entry of ["accounts", "admin/roles"]) {
      expect(cellRule("ADMIN", entry)).toMatchObject({ allowed: ["MANAGE"], disabled: true });
    }
    // Audit's default is READ, so the Admin cell must offer it instead of a
    // blank select (TAN-364 F8).
    expect(cellRule("ADMIN", "audit")).toMatchObject({
      allowed: ["READ", "MANAGE"],
      disabled: true,
    });
    for (const entry of ["accounts", "admin/roles", "audit"]) {
      for (const role of ["OPERATION", "CHAPTER", "TALENT"] as AccessRole[]) {
        expect(cellRule(role, entry)).toMatchObject({ allowed: ["NONE"], disabled: true });
      }
    }
  });

  it("sel terkunci ikut menampilkan level yang sedang dipegang", () => {
    // Even a value the rule did not anticipate is renderable: never blank.
    expect(cellRule("ADMIN", "audit", "READ").allowed).toEqual(["READ", "MANAGE"]);
    expect(cellRule("ADMIN", "accounts", "READ").allowed).toEqual(["READ", "MANAGE"]);
    expect(cellRule("OPERATION", "audit", "MANAGE").allowed).toEqual(["NONE", "MANAGE"]);
  });

  it("master data: Admin terkunci MANAGE, role lain boleh baca atau sembunyikan", () => {
    for (const entry of NAV_ENTRY_IDS.filter((id) => id.startsWith("master-data/"))) {
      expect(cellRule("ADMIN", entry)).toMatchObject({ allowed: ["MANAGE"], disabled: true });
      for (const role of ["OPERATION", "CHAPTER", "TALENT"] as AccessRole[]) {
        expect(cellRule(role, entry).allowed).toEqual(["NONE", "READ"]);
        // Editable, not locked: the level must stay the role's choice.
        expect(cellRule(role, entry).disabled).toBeFalsy();
      }
    }
  });

  it("menu biasa boleh tiga tingkat untuk semua role", () => {
    for (const role of ROLES) {
      expect(cellRule(role, "idp").allowed).toEqual(["NONE", "READ", "MANAGE"]);
      expect(cellRule(role, "idp").disabled).toBeFalsy();
    }
  });

  it("setiap level yang ditawarkan adalah level yang sah dan sebaliknya tidak", () => {
    // The locked rules never offer a level outside NONE/READ/MANAGE.
    const levels: MenuAccessLevel[] = ["NONE", "READ", "MANAGE"];
    for (const role of ROLES) {
      for (const row of MENU_ROWS) {
        const rule = cellRule(role, row.id);
        expect(rule.allowed.length).toBeGreaterThan(0);
        for (const level of rule.allowed) expect(levels).toContain(level);
      }
    }
  });
});

describe("draft grid", () => {
  it("cellOf menyembunyikan sekaligus menutup saat NONE", () => {
    expect(cellOf("NONE")).toEqual({ visible: false, accessLevel: "NONE" });
    expect(cellOf("READ")).toEqual({ visible: true, accessLevel: "READ" });
    expect(cellOf("MANAGE")).toEqual({ visible: true, accessLevel: "MANAGE" });
  });

  it("gridOf mengambil hanya sel milik satu role", () => {
    const cells = [...cellsOf("TALENT"), ...cellsOf("CHAPTER")];
    const grid = gridOf(cells, "TALENT");
    expect(Object.keys(grid)).toHaveLength(MENU_ROWS.length);
    expect(grid.idp).toEqual({ visible: true, accessLevel: "MANAGE" });
    expect(grid.accounts).toEqual({ visible: false, accessLevel: "NONE" });
  });

  it("gridInput mengirim seluruh katalog, dengan visible mengikuti level", () => {
    const input = gridInput({
      idp: cellOf("READ"),
      accounts: { visible: true, accessLevel: "NONE" },
    });
    expect(input).toHaveLength(MENU_ROWS.length);
    expect(input.find((cell) => cell.menuEntryId === "idp")).toEqual({
      menuEntryId: "idp",
      visible: true,
      accessLevel: "READ",
    });
    // A cell that claims visible while denying is sent as hidden: the API ties
    // the two together (W2), so the menu cannot lie about authorization.
    expect(input.find((cell) => cell.menuEntryId === "accounts")).toEqual({
      menuEntryId: "accounts",
      visible: false,
      accessLevel: "NONE",
    });
    expect(input.filter((cell) => cell.visible)).toHaveLength(1);
  });

  it("sel yang belum ada di draft memakai baseline role, bukan NONE", () => {
    const baseline = DEFAULT_MENU_ACCESS["CHAPTER"];
    const input = gridInput({ idp: cellOf("MANAGE") }, baseline);
    expect(input.find((cell) => cell.menuEntryId === "employees")).toEqual({
      menuEntryId: "employees",
      visible: true,
      accessLevel: "READ",
    });
    expect(input.find((cell) => cell.menuEntryId === "idp")).toEqual({
      menuEntryId: "idp",
      visible: true,
      accessLevel: "MANAGE",
    });
  });

  it("gridDirty hanya melihat level, bukan objeknya", () => {
    const saved: RoleGrid = { idp: cellOf("READ") };
    expect(gridDirty({ idp: { visible: true, accessLevel: "READ" } }, saved)).toBe(false);
    expect(gridDirty({ idp: cellOf("MANAGE") }, saved)).toBe(true);
    expect(gridDirty({}, saved)).toBe(true);
    // An absent entry and an explicit NONE are the same thing to the server.
    expect(gridDirty({}, {})).toBe(false);
  });

  it("visibleRowCount menghitung menu yang tampil", () => {
    const talent = gridOf(cellsOf("TALENT"), "TALENT");
    expect(visibleRowCount(talent)).toBe(
      MENU_ROWS.filter(
        (row) => (DEFAULT_MENU_ACCESS["TALENT"][row.id]?.accessLevel ?? "NONE") !== "NONE",
      ).length,
    );
    expect(visibleRowCount({})).toBe(0);
  });

  it("gridCells menyiapkan pratinjau dari draft yang belum disimpan", () => {
    const cells = gridCells("role-talent", "TALENT", { idp: cellOf("NONE") });
    expect(cells).toHaveLength(MENU_ROWS.length);
    expect(cells.every((cell) => cell.roleName === "TALENT" && cell.roleId === "role-talent")).toBe(
      true,
    );
    expect(cells.find((cell) => cell.menuEntryId === "idp")?.visible).toBe(false);
  });
});
