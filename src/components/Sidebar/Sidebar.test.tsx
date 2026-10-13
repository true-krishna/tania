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

  it("keeps the Laporan Talent nav scoped to Operation and Chapter", () => {
    const talent = renderSidebar({ role: "TALENT" });
    expect(desktopNav().queryByRole("link", { name: "Laporan Talent" })).toBeNull();
    expect(compactNav().queryByRole("link", { name: "Laporan Talent" })).toBeNull();
    talent.unmount();

    const admin = renderSidebar({ role: "ADMIN" });
    expect(desktopNav().queryByRole("link", { name: "Laporan Talent" })).toBeNull();
    expect(compactNav().queryByRole("link", { name: "Laporan Talent" })).toBeNull();
    admin.unmount();

    renderSidebar({ role: "OPERATION" });
    expect(desktopNav().getByRole("link", { name: "Laporan Talent" })).toBeInTheDocument();
    expect(compactNav().getByRole("link", { name: "Laporan Talent" })).toBeInTheDocument();
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
    renderSidebar({ pathname: "/evaluations/periods/new" });
    expect(desktopNav().getByRole("link", { name: "Periode" })).toHaveAttribute("aria-current", "page");
    expect(desktopNav().getByRole("link", { name: "Roster" })).not.toHaveAttribute("aria-current");
  });

  it("shows only the role-scoped child of a section", () => {
    renderSidebar({ role: "TALENT", pathname: "/evaluations/my" });
    expect(desktopNav().getByRole("link", { name: "Evaluasi Saya" })).toHaveAttribute("aria-current", "page");
    expect(desktopNav().queryByRole("link", { name: "Roster" })).toBeNull();
  });

  it("marks the active link in the compact strip without expanding anything", () => {
    renderSidebar({ role: "TALENT", pathname: "/evaluations/my" });
    expect(compactNav().getByRole("link", { name: "Evaluasi Saya" })).toHaveAttribute("aria-current", "page");
    // The strip is flat: no expandable group buttons.
    expect(compactNav().queryByRole("button")).toBeNull();
  });

  it("renders the 268px sticky shell with labels and no collapse toggle", () => {
    renderSidebar();
    const aside = document.getElementById("app-sidebar") as HTMLElement;
    expect(aside.className).toContain("min-[861px]:w-[268px]");
    expect(aside.className).toContain("min-[861px]:sticky");
    expect(screen.getByText("Tania")).toBeInTheDocument();
    expect(desktopNav().getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Collapse navigation" })).toBeNull();
  });
});
