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
    expect(screen.queryByText("Master Data")).toBeNull();
    expect(screen.queryByText("Accounts")).toBeNull();
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

  it("shows Employees to every role (002-tania-rbac matrix)", () => {
    for (const role of ["TALENT", "CHAPTER", "OPERATION", "ADMIN"] as const) {
      const view = renderSidebar({ role });
      expect(desktopNav().getByRole("link", { name: "Employees" })).toBeInTheDocument();
      expect(compactNav().getByRole("link", { name: "Employees" })).toBeInTheDocument();
      view.unmount();
    }
  });

  it("shows Assignments to Chapter, Operation and Talent but not Admin", () => {
    for (const role of ["TALENT", "CHAPTER", "OPERATION"] as const) {
      const view = renderSidebar({ role });
      expect(desktopNav().getByRole("link", { name: "Assignments" })).toBeInTheDocument();
      view.unmount();
    }
    renderSidebar({ role: "ADMIN" });
    expect(desktopNav().queryByRole("link", { name: "Assignments" })).toBeNull();
    expect(compactNav().queryByRole("link", { name: "Assignments" })).toBeNull();
  });

  it("lists no deferred IDP or Evaluation entry for any role", () => {
    for (const role of ["TALENT", "CHAPTER", "OPERATION", "ADMIN"] as const) {
      const view = renderSidebar({ role, pathname: "/evaluations/my" });
      for (const name of ["IDP", "Evaluations", "Roster", "Periode", "Template", "Evaluasi Saya"]) {
        expect(screen.queryByRole("link", { name })).toBeNull();
        expect(screen.queryByRole("button", { name: new RegExp(name) })).toBeNull();
      }
      view.unmount();
    }
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

  it("marks the active link in the compact strip without expanding anything", () => {
    renderSidebar({ role: "TALENT", pathname: "/cv" });
    expect(compactNav().getByRole("link", { name: "CV" })).toHaveAttribute("aria-current", "page");
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
    renderSidebar({ pathname: "/master-data/chapters" });
    fireEvent.click(screen.getByRole("button", { name: "Collapse navigation" }));
    expect(desktopNav().getByRole("link", { name: "Master Data" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
