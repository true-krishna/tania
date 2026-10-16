// @vitest-environment jsdom

import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Table, type TableColumn } from "@/components/Table";

type Row = { id: string; name: string | null; unit: string };

const COLUMNS: TableColumn<Row>[] = [
  { key: "name", title: "Nama", dataIndex: "name" },
  { key: "unit", title: "Divisi", dataIndex: "unit" },
];

const ROWS: Row[] = [
  { id: "1", name: "Budi Santoso", unit: "Digital Business" },
  { id: "2", name: null, unit: "Network" },
];

function renderTable(overrides?: Partial<React.ComponentProps<typeof Table<Row>>>) {
  return render(
    <Table columns={COLUMNS} dataSource={ROWS} rowKey={(row) => row.id} {...overrides} />,
  );
}

describe("Table", () => {
  it("renders column headers and plain cell values", () => {
    renderTable();
    expect(screen.getByRole("columnheader", { name: "Nama" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Divisi" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Budi Santoso" })).toBeInTheDocument();
  });

  it("renders a dash for missing plain values", () => {
    renderTable();
    expect(screen.getByRole("cell", { name: "-" })).toBeInTheDocument();
  });

  it("renders custom cell content through render", () => {
    renderTable({
      columns: [
        { key: "name", title: "Nama", render: (_value, row, index) => `Halo, ${row.id}-${index}` },
      ],
    });
    expect(screen.getByRole("cell", { name: "Halo, 1-0" })).toBeInTheDocument();
  });

  it("passes the dataIndex value into render", () => {
    renderTable({
      columns: [{ key: "unit", title: "Divisi", dataIndex: "unit", render: (value) => `${value}!` }],
    });
    expect(screen.getByRole("cell", { name: "Digital Business!" })).toBeInTheDocument();
  });

  it("shows the empty message when there are no rows", () => {
    renderTable({ dataSource: [] });
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
    expect(
      screen.queryByRole("button", { name: "Halaman sebelumnya" }),
    ).not.toBeInTheDocument();
  });

  it("shows the visible range and current page", () => {
    renderTable({
      pagination: {
        page: 2,
        pageSize: 10,
        totalItems: 57,
        onPageChange: vi.fn(),
        onPageSizeChange: vi.fn(),
      },
    });
    expect(screen.getByText("11–20")).toBeInTheDocument();
    expect(screen.getByText("57")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("navigates pages through the prev and next buttons", () => {
    const onPageChange = vi.fn();
    renderTable({
      pagination: {
        page: 2,
        pageSize: 10,
        totalItems: 57,
        onPageChange,
        onPageSizeChange: vi.fn(),
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Halaman sebelumnya" }));
    expect(onPageChange).toHaveBeenCalledWith(1);
    fireEvent.click(screen.getByRole("button", { name: "Halaman berikutnya" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("disables prev on the first page and next on the last page", () => {
    const { rerender } = render(
      <Table
        columns={COLUMNS}
        dataSource={ROWS}
        rowKey={(row) => row.id}
        pagination={{
          page: 1,
          pageSize: 10,
          totalItems: 57,
          onPageChange: vi.fn(),
          onPageSizeChange: vi.fn(),
        }}
      />,
    );
    expect(screen.getByRole("button", { name: "Halaman sebelumnya" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Halaman berikutnya" })).toBeEnabled();

    rerender(
      <Table
        columns={COLUMNS}
        dataSource={ROWS}
        rowKey={(row) => row.id}
        pagination={{
          page: 6,
          pageSize: 10,
          totalItems: 57,
          onPageChange: vi.fn(),
          onPageSizeChange: vi.fn(),
        }}
      />,
    );
    expect(screen.getByRole("button", { name: "Halaman sebelumnya" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Halaman berikutnya" })).toBeDisabled();
  });

  it("lets the user choose how many rows per page", () => {
    const onPageSizeChange = vi.fn();
    renderTable({
      pagination: {
        page: 1,
        pageSize: 10,
        totalItems: 57,
        onPageChange: vi.fn(),
        onPageSizeChange,
      },
    });
    fireEvent.change(screen.getByLabelText("Baris per halaman"), { target: { value: "50" } });
    expect(onPageSizeChange).toHaveBeenCalledWith(50);
  });

  it("disables pagination controls while loading", () => {
    renderTable({
      pagination: {
        page: 2,
        pageSize: 10,
        totalItems: 57,
        onPageChange: vi.fn(),
        onPageSizeChange: vi.fn(),
      },
      loading: true,
    });
    expect(screen.getByRole("button", { name: "Halaman sebelumnya" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Halaman berikutnya" })).toBeDisabled();
  });
});
