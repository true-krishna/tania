// @vitest-environment jsdom

import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { FilterButton } from "@/components/FilterButton";

describe("FilterButton", () => {
  it("renders the outline trigger with filter semantics", () => {
    render(<FilterButton />);
    const btn = screen.getByRole("button", { name: "Filter" });
    expect(btn).toHaveAttribute("type", "button");
    expect(btn).toHaveAttribute("aria-haspopup", "true");
    expect(btn).toHaveAttribute("aria-expanded", "false");
  });

  it("reflects the expanded state and target panel", () => {
    render(<FilterButton expanded panelId="filter-panel" />);
    const btn = screen.getByRole("button");
    expect(btn).toHaveAttribute("aria-expanded", "true");
    expect(btn).toHaveAttribute("aria-controls", "filter-panel");
  });

  it("shows the active count as badge and accessible name", () => {
    render(<FilterButton activeCount={3} />);
    expect(screen.getByRole("button", { name: "Filter, 3 filter aktif" })).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("omits the badge and active marker when nothing is filtered", () => {
    render(<FilterButton />);
    expect(screen.getByRole("button")).not.toHaveAttribute("data-active");
    expect(screen.queryByText("1")).not.toBeInTheDocument();
  });

  it("forwards onClick to the caller", () => {
    const onClick = vi.fn();
    render(<FilterButton onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
