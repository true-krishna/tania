// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DEFAULT_MENU_ACCESS } from "@/lib/auth/menuAccess";
import { SidebarNavPreview } from "./SidebarNavPreview";

describe("SidebarNavPreview dengan entri tanpa rute (TAN-344)", () => {
  it("baris grid Asisten data tidak pernah menjadi item nav, tanpa error", () => {
    // CHAPTER memegang asisten pada konfigurasi default (READ), tetapi entri
    // itu tanpa rute — preview hanya menggambar NAV, jadi tidak ada item
    // "Asisten data" dan tidak ada error.
    render(<SidebarNavPreview config={DEFAULT_MENU_ACCESS} roleName="CHAPTER" />);

    expect(screen.getByRole("navigation", { name: "Pratinjau menu CHAPTER" })).toBeInTheDocument();
    expect(screen.queryByText("Asisten data")).toBeNull();
    // Menu CHAPTER yang ber-rute tetap tampil.
    expect(screen.getByText("IDP")).toBeInTheDocument();
  });
});
