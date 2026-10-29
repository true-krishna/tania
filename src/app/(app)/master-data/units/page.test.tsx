// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import UnitsPage from "@/app/(app)/master-data/units/page";
import { UnitsDocument } from "@/generated/graphql";
import * as React from "react";
import { ToastProvider } from "@/components/Toast";

// Master-data pages read the session role from the guard; the tests render the
// page as Admin (the manage role) unless a case sets another role explicitly.
const auth = vi.hoisted(() => ({ role: "ADMIN" as string | null }));
vi.mock("@/lib/auth/guard", () => ({
  useSessionRole: () => auth.role,
  AuthGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

beforeEach(() => {
  auth.role = "ADMIN";
});

const mocks = [
  {
    request: { query: UnitsDocument, variables: { includeInactive: true } },
    result: {
      data: {
        units: [
          {
            id: "u-1",
            code: "DBT",
            name: "Digital Business & Technology",
            isActive: true,
            projects: [{ id: "prj-1", name: "Enterprise Network", __typename: "Project" }],
            __typename: "Unit",
          },
          {
            id: "u-2",
            code: "ECSS",
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
      </MockedProvider>,
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
      </MockedProvider>,
    );

    expect(await screen.findByText("Digital Business & Technology")).toBeInTheDocument();
    const table = screen.getByRole("table", { name: "Daftar unit" });
    expect(within(table).getByText("1")).toBeInTheDocument();
  });
});
