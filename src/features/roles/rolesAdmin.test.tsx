// @vitest-environment jsdom

// The configuration page body (W3 / TAN-264 AC1–AC5). What is asserted here is
// the write contract, not the pixels: which payload a save sends, that a reset
// asks before it acts, that the preview follows the draft, and that a custom
// role is created through the API.

import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { GraphQLError } from "graphql";
import { ToastProvider } from "@/components/Toast";
import {
  CreateRoleDocument,
  ResetRoleMenuConfigDocument,
  RoleMenuConfigDocument,
  RolesDocument,
  SetRoleMenuAccessDocument,
} from "@/generated/graphql";
import type { MenuAccessLevel } from "@/generated/graphql/types";
import { DEFAULT_MENU_ACCESS } from "@/lib/auth/menuAccess";
import { MENU_ROWS, gridInput, type RoleGrid } from "./menuGrid";
import { RolesAdminSection } from "./RolesAdminSection";

const ROLES = [
  {
    id: "role-admin",
    name: "ADMIN",
    label: "Admin",
    templateRole: "ADMIN",
    builtIn: true,
    status: "ACTIVE",
    __typename: "Role",
  },
  {
    id: "role-chapter",
    name: "CHAPTER",
    label: "Chapter",
    templateRole: "CHAPTER",
    builtIn: true,
    status: "ACTIVE",
    __typename: "Role",
  },
  {
    id: "role-talent",
    name: "TALENT",
    label: "Talent",
    templateRole: "TALENT",
    builtIn: true,
    status: "ACTIVE",
    __typename: "Role",
  },
] as const;

/** The server's grid: the default matrix, 18 entries per role (termasuk baris tanpa rute "Asisten data"). */
const CONFIG_CELLS = ROLES.flatMap((role) =>
  MENU_ROWS.map((row) => {
    const cell = DEFAULT_MENU_ACCESS[role.name][row.id] ?? {
      visible: false,
      accessLevel: "NONE" as const,
    };
    return {
      roleId: role.id,
      roleName: role.name,
      menuEntryId: row.id,
      visible: cell.visible,
      accessLevel: cell.accessLevel,
      __typename: "RoleMenuEntry" as const,
    };
  }),
);

const ROLES_QUERY = {
  request: { query: RolesDocument, variables: { includeInactive: true } },
  result: { data: { roles: ROLES } },
};

const CONFIG_QUERY = {
  request: { query: RoleMenuConfigDocument, variables: {} },
  result: { data: { roleMenuConfig: CONFIG_CELLS } },
};

function renderSection(mocks: unknown[]) {
  render(
    <MockedProvider mocks={mocks as never}>
      <ToastProvider>
        <RolesAdminSection />
      </ToastProvider>
    </MockedProvider>,
  );
}

function roleHeader(name: string) {
  const header = screen
    .getAllByRole("columnheader")
    .find((cell) => cell.textContent?.includes(name));
  if (!header) throw new Error(`header for ${name} not found`);
  return within(header as HTMLElement);
}

/** What the Talent column's draft becomes after one cell is edited. */
function expectedTalentGrid(entryId: string, level: MenuAccessLevel): RoleGrid {
  const grid: RoleGrid = {};
  for (const row of MENU_ROWS) {
    const cell = DEFAULT_MENU_ACCESS["TALENT"][row.id];
    grid[row.id] = cell ?? { visible: false, accessLevel: "NONE" };
  }
  grid[entryId] = { visible: level !== "NONE", accessLevel: level };
  return grid;
}

describe("halaman Menu & Akses per Role — bagian grid", () => {
  it("menampilkan grid 18 entri dan menghitung menu yang tampil", async () => {
    renderSection([ROLES_QUERY, CONFIG_QUERY]);
    expect(await screen.findByText("Grid Menu × Role")).toBeInTheDocument();
    for (const row of MENU_ROWS) {
      expect(screen.getAllByText(row.label).length).toBeGreaterThan(0);
    }
    // One select per menu × role cell, all seeded from the server's grid.
    expect(screen.getAllByRole("combobox").length).toBe(MENU_ROWS.length * ROLES.length);
    expect(screen.getByLabelText("IDP untuk Talent")).toHaveValue("MANAGE");
    expect(screen.getByLabelText("Accounts untuk Talent")).toHaveValue("NONE");
  });

  it("menampilkan Audit Admin sebagai Lihat dan tidak mengubahnya tanpa aksi eksplisit", async () => {
    renderSection([ROLES_QUERY, CONFIG_QUERY]);
    await screen.findByText("Grid Menu × Role");

    // TAN-364 F8: Audit's default is READ, so the locked Admin cell renders
    // "Lihat" instead of a blank select — and an untouched grid stays unsaved.
    expect(screen.getByLabelText("Audit untuk Admin")).toHaveValue("READ");
    expect(screen.getByLabelText("Audit untuk Admin")).toBeDisabled();
    expect(roleHeader("ADMIN").getByRole("button", { name: "Simpan" })).toBeDisabled();
  });

  it("menyimpan satu kolom dengan seluruh katalog, hanya sel yang berubah yang berbeda", async () => {
    const expectedGrid = expectedTalentGrid("idp", "READ");
    renderSection([
      ROLES_QUERY,
      CONFIG_QUERY,
      {
        request: {
          query: SetRoleMenuAccessDocument,
          variables: { roleId: "role-talent", entries: gridInput(expectedGrid) },
        },
        result: { data: { setRoleMenuAccess: [] } },
      },
      CONFIG_QUERY,
      ROLES_QUERY,
    ]);

    await screen.findByText("Grid Menu × Role");
    fireEvent.change(screen.getByLabelText("IDP untuk Talent"), { target: { value: "READ" } });
    fireEvent.click(roleHeader("TALENT").getByRole("button", { name: "Simpan" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Konfigurasi menu Talent tersimpan.",
    );
  });

  it("tidak menawarkan menyimpan kolom yang belum diubah", async () => {
    renderSection([ROLES_QUERY, CONFIG_QUERY]);
    await screen.findByText("Grid Menu × Role");
    for (const name of ["ADMIN", "CHAPTER", "TALENT"]) {
      expect(roleHeader(name).getByRole("button", { name: "Simpan" })).toBeDisabled();
    }
    fireEvent.change(screen.getByLabelText("IDP untuk Talent"), { target: { value: "NONE" } });
    expect(roleHeader("TALENT").getByRole("button", { name: "Simpan" })).toBeEnabled();
    expect(roleHeader("ADMIN").getByRole("button", { name: "Simpan" })).toBeDisabled();
  });

  it("mempertahankan draft role lain saat satu role disimpan", async () => {
    const expectedGrid = expectedTalentGrid("idp", "READ");
    renderSection([
      ROLES_QUERY,
      CONFIG_QUERY,
      {
        request: {
          query: SetRoleMenuAccessDocument,
          variables: { roleId: "role-talent", entries: gridInput(expectedGrid) },
        },
        result: { data: { setRoleMenuAccess: [] } },
      },
      CONFIG_QUERY,
      ROLES_QUERY,
    ]);

    await screen.findByText("Grid Menu × Role");
    fireEvent.change(screen.getByLabelText("IDP untuk Talent"), { target: { value: "READ" } });
    fireEvent.change(screen.getByLabelText("IDP untuk Chapter"), { target: { value: "NONE" } });
    fireEvent.click(roleHeader("TALENT").getByRole("button", { name: "Simpan" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Konfigurasi menu Talent tersimpan.",
    );
    // The refetch after the save must not discard the Chapter column.
    expect(screen.getByLabelText("IDP untuk Chapter")).toHaveValue("NONE");
    expect(roleHeader("CHAPTER").getByRole("button", { name: "Simpan" })).toBeEnabled();
  });

  it("mengunci sel yang tidak boleh diubah role tersebut", async () => {
    renderSection([ROLES_QUERY, CONFIG_QUERY]);
    await screen.findByText("Grid Menu × Role");
    // Admin-only menus stay locked; master data is Admin-managed, readable for others.
    expect(screen.getByLabelText("Accounts untuk Talent")).toBeDisabled();
    expect(screen.getByLabelText("Audit untuk Chapter")).toBeDisabled();
    expect(screen.getByLabelText("Unit untuk Chapter")).toBeEnabled();
    expect(screen.getByLabelText("Unit untuk Admin")).toBeDisabled();
  });

  it("reset meminta konfirmasi dulu, lalu memanggil API", async () => {
    renderSection([
      ROLES_QUERY,
      CONFIG_QUERY,
      {
        request: { query: ResetRoleMenuConfigDocument, variables: { roleId: "role-talent" } },
        result: { data: { resetRoleMenuConfig: [] } },
      },
      CONFIG_QUERY,
      ROLES_QUERY,
    ]);

    await screen.findByText("Grid Menu × Role");
    fireEvent.click(roleHeader("TALENT").getByRole("button", { name: "Reset" }));
    expect(screen.getByText(/Kembalikan konfigurasi menu/)).toBeInTheDocument();
    // Nothing is sent before the Admin confirms.
    fireEvent.click(screen.getByRole("button", { name: "Batal" }));
    expect(screen.queryByRole("alert")).toBeNull();

    fireEvent.click(roleHeader("TALENT").getByRole("button", { name: "Reset" }));
    fireEvent.click(screen.getByRole("button", { name: "Ya, reset ke default" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Konfigurasi menu Talent kembali ke default.",
    );
  });

  it("pratinjau sidebar mengikuti draft yang belum disimpan", async () => {
    renderSection([ROLES_QUERY, CONFIG_QUERY]);
    await screen.findByText("Grid Menu × Role");
    expect(screen.getByText(/Pilih .*Pratinjau/i)).toBeInTheDocument();

    fireEvent.click(roleHeader("TALENT").getByRole("button", { name: "Pratinjau" }));
    const talentPreview = within(screen.getByRole("navigation", { name: "Pratinjau menu TALENT" }));
    // Talent memakai halaman pribadi datar (TAN-392), bukan modul operasional.
    expect(talentPreview.getByText("IDP")).toBeInTheDocument();
    expect(talentPreview.getByText("Profil")).toBeInTheDocument();
    expect(talentPreview.queryByText("Accounts")).toBeNull();
    // Entri tanpa rute (TAN-344) punya baris grid, tetapi tidak pernah jadi
    // item nav di pratinjau — tanpa error.
    expect(talentPreview.queryByText("Asisten data")).toBeNull();

    // Hide an entry in the draft: an operational preview must follow it before
    // any save.
    fireEvent.click(roleHeader("CHAPTER").getByRole("button", { name: "Pratinjau" }));
    const chapterPreview = within(
      screen.getByRole("navigation", { name: "Pratinjau menu CHAPTER" }),
    );
    expect(chapterPreview.getByText("Data Karyawan")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Data Karyawan untuk Chapter"), {
      target: { value: "NONE" },
    });
    expect(chapterPreview.queryByText("Data Karyawan")).toBeNull();
  });
});

describe("halaman Menu & Akses per Role — role kustom", () => {
  it("membuat role dari template yang dipilih", async () => {
    renderSection([
      ROLES_QUERY,
      CONFIG_QUERY,
      {
        request: {
          query: CreateRoleDocument,
          variables: {
            input: { name: "PM_CHAPTER", label: "PM Chapter", templateRole: "CHAPTER" },
          },
        },
        result: {
          data: {
            createRole: {
              id: "role-pm",
              name: "PM_CHAPTER",
              label: "PM Chapter",
              templateRole: "CHAPTER",
              builtIn: false,
              status: "ACTIVE",
              __typename: "Role",
            },
          },
        },
      },
      ROLES_QUERY,
      CONFIG_QUERY,
    ]);

    await screen.findByText("Role Kustom");
    fireEvent.click(screen.getByRole("button", { name: "Tambah Role" }));
    fireEvent.change(screen.getByLabelText("Nama mesin"), { target: { value: "pm_chapter" } });
    fireEvent.change(screen.getByLabelText("Label"), { target: { value: "PM Chapter" } });
    fireEvent.change(screen.getByLabelText("Template"), { target: { value: "CHAPTER" } });

    const form = screen.getByLabelText("Nama mesin").closest("form");
    if (!form) throw new Error("form not found");
    fireEvent.click(within(form).getByRole("button", { name: "Simpan" }));

    expect(await screen.findByRole("alert")).toHaveTextContent('Role "PM Chapter" dibuat.');
  });

  it("role bawaan tidak bisa diubah atau dihapus", async () => {
    renderSection([ROLES_QUERY, CONFIG_QUERY]);
    await screen.findByText("Role Kustom");
    const rows = screen.getAllByText("Role bawaan — tidak dapat diubah.");
    expect(rows).toHaveLength(ROLES.length);
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();
  });

  it("tidak menutup form role kustom ketika server menolak", async () => {
    renderSection([
      ROLES_QUERY,
      CONFIG_QUERY,
      {
        request: {
          query: CreateRoleDocument,
          variables: {
            input: { name: "PM_CHAPTER", label: "PM Chapter", templateRole: "CHAPTER" },
          },
        },
        result: { errors: [new GraphQLError("Nama role sudah dipakai.")] },
      },
    ]);

    await screen.findByText("Role Kustom");
    fireEvent.click(screen.getByRole("button", { name: "Tambah Role" }));
    fireEvent.change(screen.getByLabelText("Nama mesin"), { target: { value: "pm_chapter" } });
    fireEvent.change(screen.getByLabelText("Label"), { target: { value: "PM Chapter" } });

    const form = screen.getByLabelText("Nama mesin").closest("form");
    if (!form) throw new Error("form not found");
    fireEvent.click(within(form).getByRole("button", { name: "Simpan" }));

    expect((await screen.findAllByText("Nama role sudah dipakai.")).length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Nama mesin")).toHaveValue("PM_CHAPTER");
    expect(screen.getByRole("button", { name: "Batal" })).toBeInTheDocument();
  });
});
