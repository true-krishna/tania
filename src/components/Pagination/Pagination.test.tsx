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
  render(<Pagination {...props} />);
  return props;
}

describe("Pagination", () => {
  it("shows the visible range and total", () => {
    renderPagination({ page: 2, pageSize: 10, totalItems: 57 });
    expect(screen.getByText("Menampilkan 11–20 dari 57")).toBeInTheDocument();
  });

  it("renders every page number and marks the current one", () => {
    renderPagination({ page: 2, pageSize: 10, totalItems: 57 });

    for (const n of [1, 2, 3, 4, 5, 6]) {
      expect(screen.getByRole("button", { name: `Halaman ${n}` })).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: "Halaman 2" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("button", { name: "Halaman 1" })).not.toHaveAttribute("aria-current");
  });

  it("navigates through the previous and next buttons", () => {
    const { onPageChange } = renderPagination({ page: 2 });

    fireEvent.click(screen.getByRole("button", { name: "Halaman sebelumnya" }));
    expect(onPageChange).toHaveBeenCalledWith(1);
    fireEvent.click(screen.getByRole("button", { name: "Halaman berikutnya" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("jumps to a page through its number", () => {
    const { onPageChange } = renderPagination({ page: 2 });

    fireEvent.click(screen.getByRole("button", { name: "Halaman 5" }));
    expect(onPageChange).toHaveBeenCalledWith(5);
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

  it("collapses long page lists with ellipsis around the current page", () => {
    renderPagination({ page: 6, pageSize: 10, totalItems: 120 });

    for (const n of [1, 5, 6, 7, 12]) {
      expect(screen.getByRole("button", { name: `Halaman ${n}` })).toBeInTheDocument();
    }
    expect(screen.queryByRole("button", { name: "Halaman 2" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Halaman 11" })).not.toBeInTheDocument();
    expect(screen.getAllByText("…")).toHaveLength(2);
  });

  it("keeps the first pages visible when the current page is near the start", () => {
    renderPagination({ page: 1, pageSize: 10, totalItems: 120 });

    for (const n of [1, 2, 3, 4, 5, 12]) {
      expect(screen.getByRole("button", { name: `Halaman ${n}` })).toBeInTheDocument();
    }
    expect(screen.queryByRole("button", { name: "Halaman 6" })).not.toBeInTheDocument();
  });

  it("keeps the last pages visible when the current page is near the end", () => {
    renderPagination({ page: 12, pageSize: 10, totalItems: 120 });

    for (const n of [1, 8, 9, 10, 11, 12]) {
      expect(screen.getByRole("button", { name: `Halaman ${n}` })).toBeInTheDocument();
    }
    expect(screen.queryByRole("button", { name: "Halaman 7" })).not.toBeInTheDocument();
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

    for (const name of ["Halaman sebelumnya", "Halaman berikutnya", "Halaman 1", "Halaman 2"]) {
      expect(screen.getByRole("button", { name })).toBeDisabled();
    }
    expect(screen.getByLabelText("Baris per halaman")).toBeDisabled();
  });

  it("renders a single page when there are no items", () => {
    renderPagination({ page: 1, pageSize: 10, totalItems: 0 });

    expect(screen.getByText("Menampilkan 0–0 dari 0")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Halaman 1" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("button", { name: "Halaman sebelumnya" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Halaman berikutnya" })).toBeDisabled();
  });
});
