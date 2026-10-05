// @vitest-environment jsdom

import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Sidebar } from "@/components/Sidebar";

function renderSidebar(props: Partial<React.ComponentProps<typeof Sidebar>> = {}) {
  const onWidthChange = vi.fn();
  render(
    <Sidebar role="ADMIN" pathname="/dashboard" width={240} onWidthChange={onWidthChange} {...props} />,
  );
  return { onWidthChange };
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

  it("resizes with the keyboard and clamps at the limits", () => {
    const { onWidthChange } = renderSidebar({ width: 240 });
    const handle = screen.getByRole("separator", { name: "Resize navigation" });

    fireEvent.keyDown(handle, { key: "ArrowRight" });
    expect(onWidthChange).toHaveBeenLastCalledWith(256);
    fireEvent.keyDown(handle, { key: "ArrowLeft" });
    expect(onWidthChange).toHaveBeenLastCalledWith(224);
  });

  it("clamps resizing to the allowed range", () => {
    const { onWidthChange } = renderSidebar({ width: 395 });
    const handle = screen.getByRole("separator", { name: "Resize navigation" });

    fireEvent.keyDown(handle, { key: "End" });
    expect(onWidthChange).toHaveBeenLastCalledWith(400);
    fireEvent.keyDown(handle, { key: "ArrowRight" });
    expect(onWidthChange).toHaveBeenLastCalledWith(400);
    fireEvent.keyDown(handle, { key: "Home" });
    expect(onWidthChange).toHaveBeenLastCalledWith(200);
  });

  it("resets to the default width on double-click", () => {
    const { onWidthChange } = renderSidebar({ width: 330 });
    fireEvent.doubleClick(screen.getByRole("separator", { name: "Resize navigation" }));
    expect(onWidthChange).toHaveBeenLastCalledWith(240);
  });
});