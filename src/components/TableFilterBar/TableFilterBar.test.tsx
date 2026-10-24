// @vitest-environment jsdom

import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { TableFilterBar } from "@/components/TableFilterBar";

const FIELDS = [
  {
    type: "select" as const,
    key: "status",
    label: "Status",
    options: [
      { value: "", label: "Semua" },
      { value: "ACTIVE", label: "Aktif" },
    ],
  },
  { type: "date" as const, key: "from", label: "Dari tanggal" },
];

function renderBar(props: Partial<Parameters<typeof TableFilterBar>[0]> = {}) {
  const onChange = vi.fn();
  const onSearchChange = props.search?.onChange ?? vi.fn();
  const utils = render(
    <TableFilterBar
      fields={FIELDS}
      onChange={onChange}
      search={{
        label: "Cari karyawan",
        onChange: onSearchChange,
        placeholder: "Cari nama…",
        value: props.search?.value ?? "",
      }}
      values={props.values ?? { status: "", from: "" }}
      {...props}
    />,
  );
  return { onChange, onSearchChange, rerender: utils.rerender };
}

describe("TableFilterBar", () => {
  it("renders the standardized search input with an accessible label", () => {
    const { onSearchChange } = renderBar();
    const input = screen.getByRole("searchbox", { name: "Cari karyawan" });
    expect(input).toHaveValue("");
    fireEvent.change(input, { target: { value: "budi" } });
    expect(onSearchChange).toHaveBeenLastCalledWith("budi");
  });

  it("renders nothing when there is no search and no fields", () => {
    const { container } = render(<TableFilterBar onChange={vi.fn()} values={{}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("starts with the filter panel closed and toggles it from the Filter button", () => {
    renderBar();
    const button = screen.getByRole("button", { name: "Filter" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByLabelText("Status")).not.toBeInTheDocument();

    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByLabelText("Status")).toBeInTheDocument();
    expect(screen.getByLabelText("Dari tanggal")).toBeInTheDocument();

    fireEvent.click(button);
    expect(screen.queryByLabelText("Status")).not.toBeInTheDocument();
  });

  it("counts non-empty values as active filters", () => {
    renderBar({ values: { status: "ACTIVE", from: "2026-01-01" } });
    expect(screen.getByRole("button", { name: "Filter, 2 filter aktif" })).toBeInTheDocument();
  });

  it("forwards select and date changes with the field key", () => {
    const { onChange } = renderBar();
    fireEvent.click(screen.getByRole("button", { name: "Filter" }));

    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "ACTIVE" } });
    expect(onChange).toHaveBeenLastCalledWith("status", "ACTIVE");

    fireEvent.change(screen.getByLabelText("Dari tanggal"), { target: { value: "2026-01-01" } });
    expect(onChange).toHaveBeenLastCalledWith("from", "2026-01-01");
  });

  it("renders custom fields with the controlled value and change handler", () => {
    const custom = vi.fn(({ value, onChange }) => (
      <input aria-label="Talent" onChange={(e) => onChange(e.target.value)} value={value} />
    ));
    const { onChange } = renderBar({
      fields: [{ type: "custom", key: "talentId", label: "Talent", render: custom }],
      values: { talentId: "emp-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Filter, 1 filter aktif" }));
    expect(custom).toHaveBeenCalled();
    expect(screen.getByLabelText("Talent")).toHaveValue("emp-1");

    fireEvent.change(screen.getByLabelText("Talent"), { target: { value: "emp-2" } });
    expect(onChange).toHaveBeenLastCalledWith("talentId", "emp-2");
  });

  it("shows the Reset button only when a filter is active and clears every field", () => {
    const { onChange, rerender } = renderBar({ values: { status: "ACTIVE", from: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Filter, 1 filter aktif" }));

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(onChange).toHaveBeenCalledWith("status", "");
    expect(onChange).not.toHaveBeenCalledWith("from", "");

    rerender(
      <TableFilterBar
        fields={FIELDS}
        onChange={onChange}
        values={{ status: "", from: "" }}
      />,
    );
    expect(screen.queryByRole("button", { name: "Reset" })).not.toBeInTheDocument();
  });
});
