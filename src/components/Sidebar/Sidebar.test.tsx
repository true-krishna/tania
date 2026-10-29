// @vitest-environment jsdom

import * as React from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { Sidebar } from "@/components/Sidebar";

function renderSidebar(props: Partial<React.ComponentProps<typeof Sidebar>> = {}) {
  return render(<Sidebar pathname="/dashboard" role="OPERATION" {...props} />);
}

function desktopNav() {
  return within(screen.getByRole("navigation", { name: /^Main navigation$/ }));
}

function compactNav() {
  return within(screen.getByRole("navigation", { name: /^Main navigation \(compact\)$/ }));
}

describe("Sidebar", () => {
  it("hides sections the current role cannot access", () => {
    renderSidebar({ role: "TALENT" });
    // TAN-343: Talent tanpa sel Dashboard/Assignment.
    expect(desktopNav().queryByRole("link", { name: "Dashboard" })).toBeNull();
    // Master data is closed to Talent (matrix: —, 2026-10-16 clarify 6).
    expect(screen.queryByText("Master Data")).toBeNull();
    expect(screen.queryByText("Accounts")).toBeNull();
  });

  it("shows Master Data read-only to Chapter and Operation only", () => {
    for (const role of ["CHAPTER", "OPERATION"] as const) {
      const view = renderSidebar({ role });
      expect(desktopNav().getByText("Master Data")).toBeInTheDocument();
      view.unmount();
    }
  });

  it("menampilkan IDP & Evaluation untuk semua peran setelah aktivasi (klarifikasi 9)", () => {
    for (const role of ["TALENT", "CHAPTER", "OPERATION", "ADMIN"] as const) {
      const view = renderSidebar({ role });
      // Entri menunya sama untuk semua peran; yang berbeda hanya isi/akses
      // halamannya (Talent membuka IDP-nya sendiri, Operation hanya baca).
      expect(desktopNav().getByRole("link", { name: "IDP" })).toBeInTheDocument();
      expect(desktopNav().getByRole("button", { name: "Evaluations" })).toBeInTheDocument();
      expect(compactNav().getByRole("link", { name: "IDP" })).toBeInTheDocument();
      view.unmount();
    }
  });

  // Placement amendment (TAN-154, commit c5d8443): the Talent Report content
  // replaced the Dashboard content for Operation & Chapter and the nav entry was
  // removed for every role; the legacy /reports/talent route is gone entirely
  // (TAN-345 — Laporan Talent = Dashboard).
  it("no longer lists Laporan Talent in the nav for any role", () => {
    for (const role of ["TALENT", "CHAPTER", "OPERATION", "ADMIN"] as const) {
      const view = renderSidebar({ role });
      expect(desktopNav().queryByRole("link", { name: "Laporan Talent" })).toBeNull();
      expect(compactNav().queryByRole("link", { name: "Laporan Talent" })).toBeNull();
      view.unmount();
    }
  });

  it("mirrors the module matrix in the Employee section (R2.2)", () => {
    const talent = renderSidebar({ role: "TALENT" });
    fireEvent.click(desktopNav().getByRole("button", { name: "Employee" }));
    expect(desktopNav().getByRole("link", { name: "Data Karyawan" })).toBeInTheDocument();
    // TAN-343: Talent tanpa Assignments (self-service ditunda) dan Kontrak.
    expect(desktopNav().queryByRole("link", { name: "Assignments" })).toBeNull();
    expect(desktopNav().queryByRole("link", { name: "Kontrak" })).toBeNull();
    talent.unmount();

    const chapter = renderSidebar({ role: "CHAPTER" });
    fireEvent.click(desktopNav().getByRole("button", { name: "Employee" }));
    expect(desktopNav().getByRole("link", { name: "Assignments" })).toBeInTheDocument();
    // Chapter reads contracts of its own chapter (2026-10-16 clarify 5).
    expect(desktopNav().getByRole("link", { name: "Kontrak" })).toBeInTheDocument();
    chapter.unmount();

    // TAN-374: Admin memegang Employee lagi — ketiga halamannya tampil.
    const admin = renderSidebar({ role: "ADMIN" });
    fireEvent.click(desktopNav().getByRole("button", { name: "Employee" }));
    expect(desktopNav().getByRole("link", { name: "Data Karyawan" })).toBeInTheDocument();
    expect(desktopNav().getByRole("link", { name: "Kontrak" })).toBeInTheDocument();
    expect(desktopNav().getByRole("link", { name: "Assignments" })).toBeInTheDocument();
    admin.unmount();

    renderSidebar({ role: "OPERATION" });
    fireEvent.click(desktopNav().getByRole("button", { name: "Employee" }));
    expect(desktopNav().getByRole("link", { name: "Data Karyawan" })).toBeInTheDocument();
    expect(compactNav().getByRole("link", { name: "Data Karyawan" })).toBeInTheDocument();
  });

  it("merges Employees, Kontrak, and Assignments under one Employee section (TAN-173)", () => {
    // Operation memegang ketiganya (TAN-374: Admin juga memegang ketiganya).
    renderSidebar({ role: "OPERATION", pathname: "/employees" });
    const group = desktopNav().getByRole("button", { name: "Employee" });
    expect(group).toHaveAttribute("aria-expanded", "true");
    expect(desktopNav().getByRole("link", { name: "Data Karyawan" })).toHaveAttribute(
      "href",
      "/employees",
    );
    expect(desktopNav().getByRole("link", { name: "Kontrak" })).toHaveAttribute(
      "href",
      "/contracts",
    );
    expect(desktopNav().getByRole("link", { name: "Assignments" })).toHaveAttribute(
      "href",
      "/assignments",
    );
  });

  it("expands a multi-page section on click", () => {
    renderSidebar();
    const group = desktopNav().getByRole("button", { name: /Master Data/ });
    expect(group).toHaveAttribute("aria-expanded", "false");
    expect(desktopNav().queryByRole("link", { name: "Unit" })).toBeNull();

    fireEvent.click(group);
    expect(group).toHaveAttribute("aria-expanded", "true");
    expect(desktopNav().getByRole("link", { name: "Unit" })).toBeInTheDocument();
  });

  // TAN-374 (keputusan TAN-364): Workload disembunyikan sampai datanya nyata.
  it("does not render Workload for any role", () => {
    for (const role of ["TALENT", "CHAPTER", "OPERATION", "ADMIN"] as const) {
      const view = renderSidebar({ role });
      expect(desktopNav().queryByRole("link", { name: "Workload" })).toBeNull();
      expect(desktopNav().queryByRole("button", { name: "Workload" })).toBeNull();
      expect(compactNav().queryByRole("link", { name: "Workload" })).toBeNull();
      view.unmount();
    }
  });

  it("opens the section that owns the current route and marks the child active", () => {
    renderSidebar({ pathname: "/master-data/units" });
    expect(desktopNav().getByRole("button", { name: /Master Data/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(desktopNav().getByRole("link", { name: "Unit" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("marks the most specific route active", () => {
    renderSidebar({ pathname: "/master-data/projects/new" });
    expect(desktopNav().getByRole("link", { name: "Initiative" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(desktopNav().getByRole("link", { name: "Unit" })).not.toHaveAttribute("aria-current");
  });

  it("shows only the role-scoped child of a section", () => {
    renderSidebar({ role: "TALENT", pathname: "/employees/emp-1" });
    expect(desktopNav().getByRole("link", { name: "Data Karyawan" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    // TAN-343: Assignments & Kontrak bukan milik Talent.
    expect(desktopNav().queryByRole("link", { name: "Assignments" })).toBeNull();
    expect(desktopNav().queryByRole("link", { name: "Kontrak" })).toBeNull();
  });

  it("marks the active link in the compact strip without expanding anything", () => {
    renderSidebar({ role: "TALENT", pathname: "/employees" });
    expect(compactNav().getByRole("link", { name: "Data Karyawan" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    // The strip is flat: no expandable group buttons.
    expect(compactNav().queryByRole("button")).toBeNull();
  });

  it("renders the 268px sticky shell expanded by default with a collapse toggle", () => {
    renderSidebar();
    const aside = document.getElementById("app-sidebar") as HTMLElement;
    expect(aside.className).toContain("min-[861px]:w-[268px]");
    expect(aside.className).toContain("min-[861px]:sticky");
    expect(screen.getByRole("img", { name: "TANIA" })).toBeInTheDocument();
    expect(desktopNav().getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Collapse navigation" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("minimizes to an icon-only rail when toggled and restores on expand", () => {
    renderSidebar();
    const toggle = screen.getByRole("button", { name: "Collapse navigation" });

    fireEvent.click(toggle);
    const aside = document.getElementById("app-sidebar") as HTMLElement;
    expect(aside.className).toContain("min-[861px]:w-[78px]");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: "Expand navigation" })).toBeInTheDocument();

    // Labels are visually hidden but keep their accessible names.
    expect(desktopNav().getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    // Sections can no longer expand: they link to their first visible child.
    expect(desktopNav().queryByRole("button", { name: /Master Data/ })).toBeNull();
    expect(desktopNav().getByRole("link", { name: "Master Data" })).toHaveAttribute(
      "href",
      "/master-data/units",
    );

    // The ≤860px strip keeps its labels regardless of the collapse state.
    expect(compactNav().getByRole("link", { name: "Dashboard" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Expand navigation" }));
    expect(aside.className).toContain("min-[861px]:w-[268px]");
    expect(desktopNav().getByRole("button", { name: /Master Data/ })).toBeInTheDocument();
  });

  it("marks the owning section active in the collapsed rail", () => {
    renderSidebar({ pathname: "/master-data/units" });
    fireEvent.click(screen.getByRole("button", { name: "Collapse navigation" }));
    expect(desktopNav().getByRole("link", { name: "Master Data" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
