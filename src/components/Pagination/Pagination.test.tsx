// @vitest-environment jsdom

import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Pagination } from "@/components/Pagination";

type PaginationProps = React.ComponentProps<typeof Pagination>;

function renderPagination(overrides?: Partial<PaginationProps>) {
  const props: PaginationProps = {
    page: 2,
    pageSize: 10,
    totalItems: 57,
    onPageChange: vi.fn(),
    onPageSizeChange: vi.fn(),
    ...overrides,
  };
  const view = render(<Pagination {...props} />);
  return { ...props, container: view.container };
}

describe("Pagination", () => {
  it("shows the visible range and total", () => {
    renderPagination({ page: 2, pageSize: 10, totalItems: 57 });
    expect(screen.getByText("11–20")).toBeInTheDocument();
    expect(screen.getByText("57")).toBeInTheDocument();
  });

  it("splits the info and the controls into two sections", () => {
    const { container } = renderPagination({ page: 2, pageSize: 10, totalItems: 57 });

    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass("w-full");
    expect(root.children).toHaveLength(2);
    expect(root.children[0]).toHaveTextContent("Menampilkan");
    expect(root.children[1]).toContainElement(screen.getByLabelText("Baris per halaman"));
    expect(root.children[1]).toContainElement(
      screen.getByRole("navigation", { name: "Navigasi halaman" }),
    );
  });

  it("highlights the total count", () => {
    renderPagination({ page: 2, pageSize: 10, totalItems: 57 });

    expect(screen.getByText("57")).toHaveClass("page-total");
  });

  it("marks the current page", () => {
    renderPagination({ page: 2, pageSize: 10, totalItems: 57 });

    const current = screen.getByText("2");
    expect(current).toHaveAttribute("aria-current", "page");
  });

  it("shows three numbered page buttons anchored on the current page", () => {
    renderPagination({ page: 1, pageSize: 10, totalItems: 57 });

    expect(screen.getByRole("button", { name: "1" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "3" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "4" })).not.toBeInTheDocument();
  });

  it("slides the window forward on next and clamps it on the last pages", () => {
    const view = render(
      <Pagination
        page={2}
        pageSize={10}
        totalItems={57}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    );

    for (const n of ["2", "3", "4"]) {
      expect(screen.getByRole("button", { name: n })).toBeInTheDocument();
    }
    expect(screen.queryByRole("button", { name: "5" })).not.toBeInTheDocument();

    view.rerender(
      <Pagination
        page={6}
        pageSize={10}
        totalItems={57}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    );
    for (const n of ["4", "5", "6"]) {
      expect(screen.getByRole("button", { name: n })).toBeInTheDocument();
    }
    expect(screen.queryByRole("button", { name: "3" })).not.toBeInTheDocument();
  });

  it("shows only as many numbered buttons as there are pages for small datasets", () => {
    renderPagination({ page: 2, pageSize: 10, totalItems: 20 });

    expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "3" })).not.toBeInTheDocument();
  });

  it("jumps to a page when its number is clicked", () => {
    const { onPageChange } = renderPagination({ page: 1, pageSize: 10, totalItems: 57 });

    fireEvent.click(screen.getByRole("button", { name: "3" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("navigates through the previous and next buttons", () => {
    const { onPageChange } = renderPagination({ page: 2 });

    fireEvent.click(screen.getByRole("button", { name: "Halaman sebelumnya" }));
    expect(onPageChange).toHaveBeenCalledWith(1);
    fireEvent.click(screen.getByRole("button", { name: "Halaman berikutnya" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("disables previous on the first page and next on the last page", () => {
    const { rerender } = render(
      <Pagination
        page={1}
        pageSize={10}
        totalItems={57}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Halaman sebelumnya" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Halaman berikutnya" })).toBeEnabled();

    rerender(
      <Pagination
        page={6}
        pageSize={10}
        totalItems={57}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Halaman sebelumnya" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Halaman berikutnya" })).toBeDisabled();
  });

  it("lets the user choose how many rows per page", () => {
    const { onPageSizeChange } = renderPagination({ page: 2, pageSize: 10 });

    fireEvent.change(screen.getByLabelText("Baris per halaman"), { target: { value: "50" } });
    expect(onPageSizeChange).toHaveBeenCalledWith(50);
  });

  it("always includes the current page size in the options", () => {
    renderPagination({ pageSize: 30, totalItems: 57 });

    const select = screen.getByLabelText("Baris per halaman");
    const values = Array.from((select as HTMLSelectElement).options).map((o) => o.value);
    expect(values).toEqual(["10", "25", "30", "50"]);
  });

  it("disables every control while disabled", () => {
    renderPagination({ page: 2, disabled: true });

    expect(screen.getByRole("button", { name: "Halaman sebelumnya" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Halaman berikutnya" })).toBeDisabled();
    expect(screen.getByLabelText("Baris per halaman")).toBeDisabled();
    expect(screen.getByRole("button", { name: "3" })).toBeDisabled();
    expect(screen.getByText("2")).not.toHaveAttribute("aria-current");
  });

  it("renders a single page when there are no items", () => {
    renderPagination({ page: 1, pageSize: 10, totalItems: 0 });

    expect(screen.getByText("0–0")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("1")).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Halaman sebelumnya" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Halaman berikutnya" })).toBeDisabled();
  });
});