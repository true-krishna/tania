// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { Modal } from "./Modal";

describe("Modal", () => {
  it("renders nothing when open is false", () => {
    render(
      <Modal onClose={vi.fn()} open={false} title="Tambah data">
        <p>Konten modal</p>
      </Modal>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders dialog with title and content when open", () => {
    render(
      <Modal onClose={vi.fn()} open title="Tambah data">
        <p>Konten modal</p>
      </Modal>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText("Tambah data")).toBeInTheDocument();
    expect(screen.getByText("Konten modal")).toBeInTheDocument();
  });

  it("renders subtitle and links aria-describedby when provided", () => {
    render(
      <Modal onClose={vi.fn()} open subtitle="Keterangan tambahan" title="Tambah data">
        <p>Isi modal</p>
      </Modal>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-describedby");
    expect(screen.getByText("Keterangan tambahan")).toBeInTheDocument();
  });

  it("calls onClose when close icon is clicked", () => {
    const onClose = vi.fn();
    render(
      <Modal onClose={onClose} open title="Tambah data">
        <p>Isi</p>
      </Modal>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Tutup" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when scrim (backdrop) is clicked", () => {
    const onClose = vi.fn();
    render(
      <Modal onClose={onClose} open title="Tambah data">
        <p>Isi</p>
      </Modal>,
    );
    const backdropButton = document.querySelector(".bg-black\\/40");
    expect(backdropButton).not.toBeNull();
    fireEvent.click(backdropButton!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Escape key is pressed", () => {
    const onClose = vi.fn();
    render(
      <Modal onClose={onClose} open title="Tambah data">
        <p>Isi</p>
      </Modal>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("restores focus to triggerRef after closing", () => {
    function TestWrapper() {
      const [open, setOpen] = React.useState(false);
      const triggerRef = React.useRef<HTMLButtonElement | null>(null);
      return (
        <>
          <button onClick={() => setOpen(true)} ref={triggerRef} type="button">
            Buka
          </button>
          <Modal
            onClose={() => setOpen(false)}
            open={open}
            title="Tambah data"
            triggerRef={triggerRef}
          >
            <button type="button">Aksi</button>
          </Modal>
        </>
      );
    }
    render(<TestWrapper />);
    const trigger = screen.getByRole("button", { name: "Buka" });
    fireEvent.click(trigger);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Tutup" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("traps focus inside the modal (Tab from last wraps to first)", () => {
    render(
      <Modal onClose={vi.fn()} open title="Tambah data">
        <button type="button">Pertama</button>
        <button type="button">Kedua</button>
      </Modal>,
    );
    const second = screen.getByRole("button", { name: "Kedua" });
    const closeButton = screen.getByRole("button", { name: "Tutup" });

    second.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(closeButton);
  });

  it("traps focus inside the modal (Shift+Tab from first wraps to last)", () => {
    render(
      <Modal onClose={vi.fn()} open title="Tambah data">
        <button type="button">Pertama</button>
        <button type="button">Kedua</button>
      </Modal>,
    );
    const closeButton = screen.getByRole("button", { name: "Tutup" });
    const second = screen.getByRole("button", { name: "Kedua" });

    closeButton.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(second);
  });

  it("focuses the first focusable element when modal opens", async () => {
    render(
      <Modal onClose={vi.fn()} open title="Tambah data">
        <button type="button">Pertama</button>
      </Modal>,
    );
    const closeButton = screen.getByRole("button", { name: "Tutup" });
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    expect(closeButton).toHaveFocus();
  });

  it("renders footer actions with correct variants", () => {
    const onPrimary = vi.fn();
    const onSecondary = vi.fn();
    render(
      <Modal
        footerActions={[
          { label: "Batal", onClick: onSecondary, variant: "secondary" },
          { label: "Simpan", onClick: onPrimary, variant: "primary" },
        ]}
        onClose={vi.fn()}
        open
        title="Tambah data"
      >
        <p>Isi</p>
      </Modal>,
    );
    const batal = screen.getByRole("button", { name: "Batal" });
    const simpan = screen.getByRole("button", { name: "Simpan" });
    expect(batal).toBeInTheDocument();
    expect(simpan).toBeInTheDocument();
    expect(simpan.className).toContain("tp-btn--primary");

    fireEvent.click(simpan);
    expect(onPrimary).toHaveBeenCalledTimes(1);
    expect(onSecondary).not.toHaveBeenCalled();
  });

  it("applies size classes correctly", () => {
    const { rerender } = render(
      <Modal onClose={vi.fn()} open size="sm" title="Kecil">
        Modal kecil
      </Modal>,
    );
    let dialog = screen.getByRole("dialog");
    expect(dialog.className).toContain("w-[420px]");

    rerender(
      <Modal onClose={vi.fn()} open size="lg" title="Besar">
        Modal besar
      </Modal>,
    );
    dialog = screen.getByRole("dialog");
    expect(dialog.className).toContain("w-[720px]");
  });

  it("disables footer action buttons when disabled prop is true", () => {
    render(
      <Modal
        footerActions={[{ disabled: true, label: "Simpan", onClick: vi.fn() }]}
        onClose={vi.fn()}
        open
        title="Tambah data"
      >
        <p>Isi</p>
      </Modal>,
    );
    const button = screen.getByRole("button", { name: "Simpan" });
    expect(button).toBeDisabled();
  });

  it("has no footer when footerActions is empty", () => {
    render(
      <Modal onClose={vi.fn()} open title="Tambah data">
        <p>Isi</p>
      </Modal>,
    );
    expect(screen.queryByRole("dialog")?.querySelector("footer")).toBeNull();
  });
});
