// @vitest-environment jsdom

import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Select } from "@/components/Select";

const OPTIONS = [
  { value: "", label: "Semua" },
  { value: "ACTIVE", label: "Aktif" },
];

describe("Select", () => {
  it("renders the options and reports changes as select events", () => {
    const onChange = vi.fn();
    render(
      <Select
        aria-label="Status"
        onChange={onChange}
        options={OPTIONS}
        value=""
      />,
    );

    fireEvent.change(screen.getByRole("combobox", { name: "Status" }), {
      target: { value: "ACTIVE" },
    });
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ target: expect.anything() }),
    );
  });

  it("applies the caller class to the sizing wrapper and marks empty values", () => {
    const { rerender } = render(
      <Select aria-label="Status" className="w-48" options={OPTIONS} value="" />,
    );
    const combobox = screen.getByRole("combobox", { name: "Status" });
    expect(combobox).toHaveClass("tp-select");
    expect(combobox).toHaveAttribute("data-empty");
    expect(combobox.parentElement).toHaveClass("w-48");

    rerender(
      <Select aria-label="Status" className="w-48" options={OPTIONS} value="ACTIVE" />,
    );
    expect(screen.getByRole("combobox", { name: "Status" })).not.toHaveAttribute("data-empty");
  });
});