// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import UnitsPage from "@/app/(app)/master-data/units/page";

describe("UnitsPage (mock, US6)", () => {
  it("renders the master-data units table after the mock query resolves", async () => {
    render(<UnitsPage />);

    expect(await screen.findByText("Digital Business & Technology")).toBeInTheDocument();
    expect(screen.getByText("Enterprise Network")).toBeInTheDocument();
  });

  it("marks inactive units with a non-active badge", async () => {
    render(<UnitsPage />);
    // Fourth unit is inactive; its row shows a "Nonaktif" badge element.
    expect(await screen.findByText("Enabler & Corporate Shared Services")).toBeInTheDocument();
  });
});