// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import * as React from "react";
import { Modal, ModalActions, ModalContent, ModalTitle } from "./Modal";

function BasicModal({
  open = true,
  onClose = vi.fn(),
  size = "md",
  disableBackdropClick = false,
  children = <p>Konten modal</p>,
}: {
  open?: boolean;
  onClose?: () => void;
  size?: "sm" | "md" | "lg";
  disableBackdropClick?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Modal disableBackdropClick={disableBackdropClick} onClose={onClose} open={open} size={size}>
      <ModalTitle>Tambah data</ModalTitle>
      <ModalContent>{children}</ModalContent>
    </Modal>
  );
}

describe("Modal", () => {
  it("renders nothing when open is false", () => {
    render(<BasicModal open={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders dialog with title and content when open", () => {
    render(<BasicModal />);
    const dialog = screen.getByRole("dialog");
    const title = screen.getByRole("heading", { name: "Tambah data" });

    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", title.id);
    expect(screen.getByText("Konten modal")).toBeInTheDocument();
  });

  it("renders subtitle and links aria-describedby when provided", () => {
    render(
      <Modal onClose={vi.fn()} open>
        <ModalTitle subtitle="Keterangan tambahan">Tambah data</ModalTitle>
        <ModalContent>
          <p>Isi modal</p>
        </ModalContent>
      </Modal>,
    );
    const dialog = screen.getByRole("dialog");
    const subtitle = screen.getByText("Keterangan tambahan");

    expect(dialog).toHaveAttribute("aria-describedby", subtitle.id);
  });

  it("calls onClose when close icon is clicked", () => {
    const onClose = vi.fn();
    render(<BasicModal onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: "Tutup" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when scrim (backdrop) is clicked", () => {
    const onClose = vi.fn();
    render(<BasicModal onClose={onClose} />);

    const backdropButton = document.querySelector(".bg-black\\/40");
    expect(backdropButton).not.toBeNull();
    fireEvent.click(backdropButton!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not close when backdrop is clicked if disabled", () => {
    const onClose = vi.fn();
    render(<BasicModal disableBackdropClick onClose={onClose} />);

    const backdropButton = document.querySelector(".bg-black\\/40");
    expect(backdropButton).not.toBeNull();
    fireEvent.click(backdropButton!);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onClose when Escape key is pressed", () => {
    const onClose = vi.fn();
    render(<BasicModal onClose={onClose} />);

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
          <Modal onClose={() => setOpen(false)} open={open} triggerRef={triggerRef}>
            <ModalTitle>Tambah data</ModalTitle>
            <ModalContent>
              <button type="button">Aksi</button>
            </ModalContent>
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
      <BasicModal>
        <button type="button">Pertama</button>
        <button type="button">Kedua</button>
      </BasicModal>,
    );
    const second = screen.getByRole("button", { name: "Kedua" });
    const closeButton = screen.getByRole("button", { name: "Tutup" });

    second.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(closeButton);
  });

  it("traps focus inside the modal (Shift+Tab from first wraps to last)", () => {
    render(
      <BasicModal>
        <button type="button">Pertama</button>
        <button type="button">Kedua</button>
      </BasicModal>,
    );
    const closeButton = screen.getByRole("button", { name: "Tutup" });
    const second = screen.getByRole("button", { name: "Kedua" });

    closeButton.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(second);
  });

  it("focuses the first focusable element when modal opens", async () => {
    render(
      <BasicModal>
        <button type="button">Pertama</button>
      </BasicModal>,
    );
    const closeButton = screen.getByRole("button", { name: "Tutup" });
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    expect(closeButton).toHaveFocus();
  });

  it("applies responsive size classes correctly", () => {
    const { rerender } = render(<BasicModal size="sm" />);
    let dialog = screen.getByRole("dialog");
    expect(dialog.className).toContain("max-w-[420px]");
    expect(dialog.className).toContain("w-full");

    rerender(<BasicModal size="lg" />);
    dialog = screen.getByRole("dialog");
    expect(dialog.className).toContain("max-w-[720px]");
  });

  it("renders ModalActions as the dialog footer", () => {
    render(
      <Modal onClose={vi.fn()} open>
        <ModalTitle>Tambah data</ModalTitle>
        <ModalContent>
          <p>Isi</p>
        </ModalContent>
        <ModalActions>
          <button type="button">Simpan</button>
        </ModalActions>
      </Modal>,
    );

    expect(screen.getByRole("button", { name: "Simpan" })).toBeInTheDocument();
    expect(screen.getByRole("dialog").querySelector("footer")).not.toBeNull();
  });

  it("has no footer when ModalActions is omitted", () => {
    render(<BasicModal />);
    expect(screen.getByRole("dialog").querySelector("footer")).toBeNull();
  });

  it("portals the dialog into document.body", () => {
    const { container } = render(<BasicModal />);
    const dialog = screen.getByRole("dialog");

    expect(container.contains(dialog)).toBe(false);
    expect(document.body.contains(dialog)).toBe(true);
  });

  it("locks body scroll while open and restores it after closing", async () => {
    document.body.style.overflow = "";
    const { rerender } = render(<BasicModal />);
    expect(document.body.style.overflow).toBe("hidden");

    rerender(<BasicModal open={false} />);
    await waitForElementToBeRemoved(() => screen.queryByRole("dialog", { hidden: true }));
    await waitFor(() => expect(document.body.style.overflow).toBe(""));
  });

  it("hides the dialog immediately on close and unmounts after the transition", async () => {
    function TestWrapper() {
      const [open, setOpen] = React.useState(true);
      return (
        <Modal onClose={() => setOpen(false)} open={open}>
          <ModalTitle>Tambah data</ModalTitle>
          <ModalContent>
            <p>Isi</p>
          </ModalContent>
        </Modal>
      );
    }

    render(<TestWrapper />);
    fireEvent.click(screen.getByRole("button", { name: "Tutup" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { hidden: true })).toBeInTheDocument();
    await waitForElementToBeRemoved(() => screen.queryByRole("dialog", { hidden: true }));
  });

  it("keeps the dialog mounted when reopened during the exit transition", async () => {
    const { rerender } = render(<BasicModal />);

    rerender(<BasicModal open={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    rerender(<BasicModal />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
    await new Promise((resolve) => window.setTimeout(resolve, 250));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
