// @vitest-environment jsdom

import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Sidebar } from "@/components/Sidebar";

function renderSidebar(props: Partial<React.ComponentProps<typeof Sidebar>> = {}) {
  const onToggle = vi.fn();
  const view = render(
    <Sidebar role="ADMIN" pathname="/dashboard" collapsed={false} onToggle={onToggle} {...props} />,
  );
  return { onToggle, view };
}

function railWidth() {
  return (document.getElementById("app-sidebar") as HTMLElement).style.width;
}

describe("Sidebar", () => {
  it("hides sections the current role cannot access", () => {
    renderSidebar({ role: "TALENT" });
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.queryByText("Master Data")).toBeNull();
    expect(screen.queryByText("Accounts")).toBeNull();
  });

  it("expands a multi-page section on click", () => {
    renderSidebar();
    const group = screen.getByRole("button", { name: /Master Data/ });
    expect(group).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: "Unit" })).toBeNull();

    fireEvent.click(group);
    expect(group).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Unit" })).toBeInTheDocument();
  });

  it("opens the section that owns the current route and marks the child active", () => {
    renderSidebar({ pathname: "/master-data/units" });
    expect(screen.getByRole("button", { name: /Master Data/ })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Unit" })).toHaveAttribute("aria-current", "page");
  });

  it("marks the most specific route active", () => {
    renderSidebar({ pathname: "/evaluations/periods/new" });
    expect(screen.getByRole("link", { name: "Periode" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Roster" })).not.toHaveAttribute("aria-current");
  });

  it("shows only the role-scoped child of a section", () => {
    renderSidebar({ role: "TALENT", pathname: "/evaluations/my" });
    expect(screen.getByRole("link", { name: "Evaluasi Saya" })).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("link", { name: "Roster" })).toBeNull();
  });

  it("renders the full sidebar with labels when expanded", () => {
    renderSidebar();
    expect(railWidth()).toBe("240px");
    expect(screen.getByText("Tania")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Collapse navigation" })).toBeInTheDocument();
  });

  it("renders an icon-only rail when collapsed", () => {
    renderSidebar({ collapsed: true });
    expect(railWidth()).toBe("72px");
    expect(screen.queryByText("Tania")).toBeNull();
    expect(screen.queryByText("Dashboard")).toBeNull();
    // Icon-only items keep an accessible name.
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Unit" })).toBeNull();
  });

  it("toggles collapse from the footer button", () => {
    const { onToggle } = renderSidebar();
    fireEvent.click(screen.getByRole("button", { name: "Collapse navigation" }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("expands, rather than opening a submenu, when a collapsed group is clicked", () => {
    const { onToggle } = renderSidebar({ collapsed: true });
    const group = screen.getByRole("button", { name: "Master Data" });
    expect(group).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(group);
    expect(onToggle).toHaveBeenCalledTimes(1);
    // Still controlled as collapsed: the submenu stays hidden until expanded.
    expect(screen.queryByRole("link", { name: "Unit" })).toBeNull();
  });
});