// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { ToastProvider } from "@/components/Toast";
import UnitsPage from "@/app/(app)/master-data/units/page";
import { UnitsDocument } from "@/generated/graphql";

const mocks = [
  {
    request: { query: UnitsDocument, variables: { includeInactive: true } },
    result: {
      data: {
        units: [
          {
            id: "u-1",
            name: "Digital Business & Technology",
            isActive: true,
            projects: [
              { id: "prj-1", name: "Enterprise Network", __typename: "Project" },
            ],
            __typename: "Unit",
          },
          {
            id: "u-2",
            name: "Enabler & Corporate Shared Services",
            isActive: false,
            projects: [],
            __typename: "Unit",
          },
        ],
      },
    },
  },
];

describe("UnitsPage (Apollo)", () => {
  it("renders the master-data units table after the query resolves", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <ToastProvider>
          <UnitsPage />
        </ToastProvider>
      </MockedProvider>
    );

    expect(await screen.findByText("Digital Business & Technology")).toBeInTheDocument();
    expect(screen.getByText("Enabler & Corporate Shared Services")).toBeInTheDocument();
  });

  it("shows the project count for each unit", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <ToastProvider>
          <UnitsPage />
        </ToastProvider>
      </MockedProvider>
    );

    expect(await screen.findByText("Digital Business & Technology")).toBeInTheDocument();
    const table = screen.getByRole("table", { name: "Daftar unit" });
    expect(within(table).getByText("1")).toBeInTheDocument();
  });
});