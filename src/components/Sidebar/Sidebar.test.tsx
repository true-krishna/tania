// @vitest-environment jsdom

import * as React from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { Sidebar } from "@/components/Sidebar";

function renderSidebar(props: Partial<React.ComponentProps<typeof Sidebar>> = {}) {
  return render(<Sidebar role="ADMIN" pathname="/dashboard" {...props} />);
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
    expect(desktopNav().getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    // Master data is read-only for every role (matrix: lihat), so it is shown.
    expect(desktopNav().getByText("Master Data")).toBeInTheDocument();
    expect(screen.queryByText("Accounts")).toBeNull();
  });

  it("offers no entry for the deferred IDP & Evaluation modules", () => {
    for (const role of ["TALENT", "CHAPTER", "OPERATION", "ADMIN"] as const) {
      const view = renderSidebar({ role });
      expect(desktopNav().queryByRole("link", { name: "IDP" })).toBeNull();
      expect(desktopNav().queryByRole("button", { name: "Evaluations" })).toBeNull();
      expect(compactNav().queryByRole("link", { name: "IDP" })).toBeNull();
      view.unmount();
    }
  });

  // Placement amendment (TAN-154, commit c5d8443): the Talent Report content
  // replaced the Dashboard content for Operation & Chapter, the nav entry was
  // removed for every role, and /reports/talent now only redirects there.
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
    expect(desktopNav().getByRole("link", { name: "Assignments" })).toBeInTheDocument();
    expect(desktopNav().queryByRole("link", { name: "Kontrak" })).toBeNull();
    talent.unmount();

    const chapter = renderSidebar({ role: "CHAPTER" });
    fireEvent.click(desktopNav().getByRole("button", { name: "Employee" }));
    expect(desktopNav().getByRole("link", { name: "Assignments" })).toBeInTheDocument();
    expect(desktopNav().getByRole("link", { name: "Data Karyawan" })).toBeInTheDocument();
    expect(desktopNav().queryByRole("link", { name: "Kontrak" })).toBeNull();
    chapter.unmount();

    const admin = renderSidebar({ role: "ADMIN" });
    fireEvent.click(desktopNav().getByRole("button", { name: "Employee" }));
    expect(desktopNav().getByRole("link", { name: "Data Karyawan" })).toBeInTheDocument();
    expect(compactNav().getByRole("link", { name: "Data Karyawan" })).toBeInTheDocument();
    admin.unmount();

    renderSidebar({ role: "OPERATION" });
    fireEvent.click(desktopNav().getByRole("button", { name: "Employee" }));
    expect(desktopNav().getByRole("link", { name: "Data Karyawan" })).toBeInTheDocument();
    expect(compactNav().getByRole("link", { name: "Data Karyawan" })).toBeInTheDocument();
  });

  it("merges Employees, Kontrak, and Assignments under one Employee section (TAN-173)", () => {
    renderSidebar({ role: "ADMIN", pathname: "/employees" });
    const group = desktopNav().getByRole("button", { name: "Employee" });
    expect(group).toHaveAttribute("aria-expanded", "true");
    expect(desktopNav().getByRole("link", { name: "Data Karyawan" })).toHaveAttribute("href", "/employees");
    expect(desktopNav().getByRole("link", { name: "Kontrak" })).toHaveAttribute("href", "/contracts");
    expect(desktopNav().getByRole("link", { name: "Assignments" })).toHaveAttribute("href", "/assignments");
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

  it("opens the section that owns the current route and marks the child active", () => {
    renderSidebar({ pathname: "/master-data/units" });
    expect(desktopNav().getByRole("button", { name: /Master Data/ })).toHaveAttribute("aria-expanded", "true");
    expect(desktopNav().getByRole("link", { name: "Unit" })).toHaveAttribute("aria-current", "page");
  });

  it("marks the most specific route active", () => {
    renderSidebar({ pathname: "/master-data/projects/new" });
    expect(desktopNav().getByRole("link", { name: "Project" })).toHaveAttribute("aria-current", "page");
    expect(desktopNav().getByRole("link", { name: "Unit" })).not.toHaveAttribute("aria-current");
  });

  it("shows only the role-scoped child of a section", () => {
    renderSidebar({ role: "TALENT", pathname: "/employees/emp-1" });
    expect(desktopNav().getByRole("link", { name: "Data Karyawan" })).toHaveAttribute("aria-current", "page");
    expect(desktopNav().getByRole("link", { name: "Assignments" })).toBeInTheDocument();
    expect(desktopNav().queryByRole("link", { name: "Kontrak" })).toBeNull();
  });

  it("marks the active link in the compact strip without expanding anything", () => {
    renderSidebar({ role: "TALENT", pathname: "/employees" });
    expect(compactNav().getByRole("link", { name: "Data Karyawan" })).toHaveAttribute("aria-current", "page");
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
