// @vitest-environment jsdom

import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { DataTable } from "@/components/DataTable";

type Row = { id: string; name: string | null; unit: string };

const COLUMNS = [
  { key: "name", header: "Nama" },
  { key: "unit", header: "Divisi" },
];

const ROWS: Row[] = [
  { id: "1", name: "Budi Santoso", unit: "Digital Business" },
  { id: "2", name: null, unit: "Network" },
];

function renderTable(overrides?: Partial<React.ComponentProps<typeof DataTable<Row>>>) {
  return render(
    <DataTable
      columns={COLUMNS}
      rows={ROWS}
      getRowId={(row) => row.id}
      {...overrides}
    />,
  );
}

describe("DataTable", () => {
  it("renders column headers and plain cell values", () => {
    renderTable();
    expect(screen.getByRole("columnheader", { name: "Nama" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Divisi" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Budi Santoso" })).toBeInTheDocument();
  });

  it("renders an em dash for missing plain values", () => {
    renderTable();
    expect(screen.getByRole("cell", { name: "—" })).toBeInTheDocument();
  });

  it("renders custom cell content through render", () => {
    renderTable({
      columns: [{ key: "name", header: "Nama", render: (row) => `Halo, ${row.id}` }],
    });
    expect(screen.getByRole("cell", { name: "Halo, 1" })).toBeInTheDocument();
  });

  it("shows the empty message when there are no rows", () => {
    renderTable({ rows: [] });
    expect(screen.getByText("Tidak ada data.")).toBeInTheDocument();
    expect(screen.queryByText("Budi Santoso")).not.toBeInTheDocument();
  });

  it("shows a loading row instead of rows while loading", () => {
    renderTable({ loading: true });
    expect(screen.getByText("Memuat…")).toBeInTheDocument();
    expect(screen.queryByText("Budi Santoso")).not.toBeInTheDocument();
  });

  it("omits the pagination footer when pagination is not given", () => {
    renderTable();
    expect(screen.queryByText(/Menampilkan/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sebelumnya" })).not.toBeInTheDocument();
  });

  it("shows the visible range and current page", () => {
    renderTable({ pagination: { page: 2, pageSize: 10, totalItems: 57, onPageChange: vi.fn(), onPageSizeChange: vi.fn() } });
    expect(screen.getByText("Menampilkan 11–20 dari 57")).toBeInTheDocument();
    expect(screen.getByText("Halaman 2 dari 6")).toBeInTheDocument();
  });

  it("navigates pages through the prev and next buttons", () => {
    const onPageChange = vi.fn();
    renderTable({
      pagination: { page: 2, pageSize: 10, totalItems: 57, onPageChange, onPageSizeChange: vi.fn() },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sebelumnya" }));
    expect(onPageChange).toHaveBeenCalledWith(1);
    fireEvent.click(screen.getByRole("button", { name: "Berikutnya" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("disables prev on the first page and next on the last page", () => {
    const { rerender } = render(
      <DataTable
        columns={COLUMNS}
        rows={ROWS}
        getRowId={(row) => row.id}
        pagination={{ page: 1, pageSize: 10, totalItems: 57, onPageChange: vi.fn(), onPageSizeChange: vi.fn() }}
      />,
    );
    expect(screen.getByRole("button", { name: "Sebelumnya" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Berikutnya" })).toBeEnabled();

    rerender(
      <DataTable
        columns={COLUMNS}
        rows={ROWS}
        getRowId={(row) => row.id}
        pagination={{ page: 6, pageSize: 10, totalItems: 57, onPageChange: vi.fn(), onPageSizeChange: vi.fn() }}
      />,
    );
    expect(screen.getByRole("button", { name: "Sebelumnya" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Berikutnya" })).toBeDisabled();
  });

  it("lets the user choose how many rows per page", () => {
    const onPageSizeChange = vi.fn();
    renderTable({
      pagination: { page: 1, pageSize: 10, totalItems: 57, onPageChange: vi.fn(), onPageSizeChange },
    });
    fireEvent.change(screen.getByLabelText("Baris per halaman"), { target: { value: "50" } });
    expect(onPageSizeChange).toHaveBeenCalledWith(50);
  });

  it("disables pagination controls while loading", () => {
    renderTable({
      pagination: { page: 2, pageSize: 10, totalItems: 57, onPageChange: vi.fn(), onPageSizeChange: vi.fn() },
      loading: true,
    });
    expect(screen.getByRole("button", { name: "Sebelumnya" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Berikutnya" })).toBeDisabled();
  });
});
