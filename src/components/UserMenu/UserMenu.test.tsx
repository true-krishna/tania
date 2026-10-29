// @vitest-environment jsdom

import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { IconClockHour3 } from "@tabler/icons-react";
import { UserMenu } from "@/components/UserMenu";

function renderMenu() {
  const onLogout = vi.fn();
  const view = render(
    <UserMenu
      email="yudi.krisnandi@digitaltelkom.id"
      items={[{ href: "/activities", label: "Aktivitas saya", icon: IconClockHour3 }]}
      name="Yudi Krisnandi"
      onLogout={onLogout}
    />,
  );
  return { onLogout, view };
}

function trigger() {
  return screen.getByRole("button", { name: "Menu akun: Yudi Krisnandi" });
}

describe("UserMenu", () => {
  it("renders the avatar trigger collapsed with disclosure semantics", () => {
    renderMenu();
    expect(trigger()).toHaveAttribute("aria-haspopup", "true");
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: "Keluar" })).toBeNull();
  });

  it("opens a panel with the identity block, quick links, and sign-out", () => {
    renderMenu();
    fireEvent.click(trigger());
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByText("Yudi Krisnandi").length).toBeGreaterThan(0);
    expect(screen.getAllByText("yudi.krisnandi@digitaltelkom.id").length).toBeGreaterThan(0);
    const link = screen.getByRole("link", { name: "Aktivitas saya" });
    expect(link).toHaveAttribute("href", "/activities");
    expect(screen.getByRole("button", { name: "Keluar" })).toBeInTheDocument();
  });

  it("falls back to the role label when there is no email", () => {
    render(<UserMenu name="Admin" onLogout={() => {}} roleLabel="Administrator" />);
    fireEvent.click(screen.getByRole("button", { name: "Menu akun: Admin" }));
    expect(screen.getAllByText("Administrator").length).toBeGreaterThan(0);
  });

  it("marks the identity block with an em dash when no email or role is known", () => {
    render(<UserMenu name="Admin" onLogout={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Menu akun: Admin" }));
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("closes on Escape and returns focus to the trigger", () => {
    renderMenu();
    fireEvent.click(trigger());
    fireEvent.keyDown(document, { key: "Escape" });
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: "Keluar" })).toBeNull();
    expect(trigger()).toHaveFocus();
  });

  it("closes when a pointer press lands outside the menu", () => {
    renderMenu();
    fireEvent.click(trigger());
    fireEvent.pointerDown(document.body);
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });

  it("closes and signs out when the logout item is activated", () => {
    const { onLogout } = renderMenu();
    fireEvent.click(trigger());
    fireEvent.click(screen.getByRole("button", { name: "Keluar" }));
    expect(onLogout).toHaveBeenCalledTimes(1);
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });
});
