// @vitest-environment jsdom

// The precondition of the whole feature (W3 / TAN-264 AC6): an untouched
// `role_menu_config` must render the same sidebar as the static role lists of
// 002 — and a configuration that does change a cell must change the menu.
// Comparing the rendered components is the only assertion that cannot drift:
// the fallback path and the configured path are two different code paths.

import * as React from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { Sidebar } from "@/components/Sidebar";
import { ACCESS_ROLES, DEFAULT_MENU_ACCESS, type MenuAccessConfig } from "@/lib/auth/menuAccess";
import type { AccessRole } from "@/generated/graphql";

function desktopNav() {
  return within(screen.getByRole("navigation", { name: /^Main navigation$/ }));
}

/** The desktop menu as the user sees it: every drawn entry, in order. */
function drawnMenu(): { href: string; label: string }[] {
  const nav = screen.getByRole("navigation", { name: /^Main navigation$/ });
  // A submenu renders its children only while open, so open them all first —
  // comparing collapsed sections would compare nothing.
  for (const group of desktopNav().queryAllByRole("button")) {
    if (group.getAttribute("aria-expanded") === "false") fireEvent.click(group);
  }
  return [...nav.querySelectorAll("a")].map((link) => ({
    href: link.getAttribute("href") ?? "",
    label: link.textContent?.trim() ?? "",
  }));
}

function withCell(
  config: MenuAccessConfig,
  role: string,
  entry: string,
  level: "NONE" | "READ" | "MANAGE",
): MenuAccessConfig {
  return { ...config, [role]: { ...config[role], [entry]: { visible: level !== "NONE", accessLevel: level } } };
}

describe("Sidebar dengan konfigurasi menu aktif (W3)", () => {
  it("konfigurasi default merender menu yang sama dengan daftar role statis", () => {
    for (const role of ACCESS_ROLES as readonly AccessRole[]) {
      const plain = render(<Sidebar pathname="/dashboard" role={role} />);
      const before = drawnMenu();
      plain.unmount();

      const configured = render(
        <Sidebar menuConfig={DEFAULT_MENU_ACCESS} pathname="/dashboard" role={null} roleName={role} />,
      );
      expect(drawnMenu(), `role ${role}`).toEqual(before);
      configured.unmount();
    }
  });

  it("menu yang ditutup hilang dari sidebar tanpa mengubah role lain", () => {
    const closed = withCell(DEFAULT_MENU_ACCESS, "TALENT", "idp", "NONE");
    render(<Sidebar menuConfig={closed} pathname="/dashboard" role={null} roleName="TALENT" />);
    const drawn = drawnMenu();
    expect(drawn.find((item) => item.label === "IDP")).toBeUndefined();
    // The rest of the Talent menu survives: closing one cell is surgical.
    expect(drawn.find((item) => item.label === "Dashboard")).toBeDefined();
    expect(drawn.find((item) => item.label === "Evaluasi Saya")).toBeDefined();
  });

  it("role kustom memakai konfigurasi role-nya sendiri", () => {
    // A custom role's name is in no NAV `roles` list, so only its configuration
    // can produce a menu — this is what makes a new role usable without a deploy.
    const chapter = render(<Sidebar pathname="/dashboard" role="CHAPTER" />);
    const chapterMenu = drawnMenu();
    chapter.unmount();

    const custom: MenuAccessConfig = { PM_CHAPTER: DEFAULT_MENU_ACCESS["CHAPTER"] };
    render(
      <Sidebar menuConfig={custom} pathname="/dashboard" role={null} roleName="PM_CHAPTER" />,
    );
    expect(drawnMenu()).toEqual(chapterMenu);
  });

  it("konfigurasi untuk role yang tidak dikenal tidak menampilkan menu apa pun", () => {
    render(
      <Sidebar menuConfig={DEFAULT_MENU_ACCESS} pathname="/dashboard" role={null} roleName="GHOST" />,
    );
    // Absence of a configuration is not a reason to show a menu the server may deny.
    expect(drawnMenu()).toEqual([]);
  });

  it("menu yang tampil selalu diizinkan server", () => {
    // The sidebar hint and the authorization axis must agree: anything drawn is
    // readable per the same configuration (server denies the rest at the API).
    const config = withCell(DEFAULT_MENU_ACCESS, "CHAPTER", "employees", "NONE");
    render(<Sidebar menuConfig={config} pathname="/dashboard" role={null} roleName="CHAPTER" />);
    const hrefs = drawnMenu().map((item) => item.href);
    expect(hrefs).not.toContain("/employees");
    // Data Karyawan is the only Employee page Chapter loses; the section stays.
    expect(hrefs).toContain("/contracts");
    expect(hrefs).toContain("/assignments");
  });
});
