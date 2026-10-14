// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { RowActionsMenu } from "./RowActionsMenu";

describe("RowActionsMenu", () => {
  it("opens the option list from the three-dot trigger and runs the chosen action", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <RowActionsMenu
        label="Aksi Unit A"
        actions={[
          { label: "Ubah", onSelect: onEdit },
          { label: "Hapus", onSelect: onDelete, danger: true },
        ]}
      />,
    );

    const trigger = screen.getByRole("button", { name: "Aksi Unit A" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: "Ubah" })).not.toBeInTheDocument();

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(screen.getByRole("button", { name: "Ubah" }));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "Ubah" })).not.toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it("closes on Escape and returns focus to the trigger", () => {
    render(<RowActionsMenu label="Aksi Unit A" actions={[{ label: "Ubah", onSelect: vi.fn() }]} />);
    const trigger = screen.getByRole("button", { name: "Aksi Unit A" });

    fireEvent.click(trigger);
    expect(screen.getByRole("button", { name: "Ubah" })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("button", { name: "Ubah" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes when pressing outside the menu", () => {
    render(<RowActionsMenu label="Aksi Unit A" actions={[{ label: "Ubah", onSelect: vi.fn() }]} />);

    fireEvent.click(screen.getByRole("button", { name: "Aksi Unit A" }));
    fireEvent.pointerDown(document.body);

    expect(screen.queryByRole("button", { name: "Ubah" })).not.toBeInTheDocument();
  });

  it("renders custom panel content above the actions", () => {
    render(
      <RowActionsMenu
        label="Aksi Unit A"
        actions={[{ label: "Nonaktifkan", onSelect: vi.fn() }]}
      >
        <select aria-label="Ubah peran Unit A" defaultValue="ADMIN">
          <option value="ADMIN">Admin</option>
        </select>
      </RowActionsMenu>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Aksi Unit A" }));

    expect(screen.getByLabelText("Ubah peran Unit A")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nonaktifkan" })).toBeInTheDocument();
  });
});
