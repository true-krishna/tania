// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import ProjectsPage from "@/app/(app)/master-data/projects/page";
import { ProjectsDocument, SetProjectActiveDocument, UnitsDocument } from "@/generated/graphql";
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
    request: { query: ProjectsDocument, variables: { includeInactive: true } },
    result: {
      data: {
        projects: [
          {
            id: "prj-1",
            name: "Enterprise Network",
            isActive: true,
            unit: { id: "u-1", name: "Digital Business & Technology", __typename: "Unit" },
            __typename: "Project",
          },
        ],
      },
    },
  },
  {
    request: { query: UnitsDocument, variables: { includeInactive: true } },
    result: {
      data: {
        units: [
          { id: "u-1", name: "Digital Business & Technology", isActive: true, __typename: "Unit" },
          {
            id: "u-2",
            name: "Enabler & Corporate Shared Services",
            isActive: true,
            __typename: "Unit",
          },
        ],
      },
    },
  },
];

describe("ProjectsPage (Apollo)", () => {
  it("renders projects with their unit after queries resolve", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <ToastProvider>
          <ProjectsPage />
        </ToastProvider>
      </MockedProvider>,
    );

    expect(await screen.findByText("Enterprise Network")).toBeInTheDocument();
    expect(screen.getByText("Digital Business & Technology")).toBeInTheDocument();
  });

  it("opens the initiative import modal with the official template link (TAN-350)", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <ToastProvider>
          <ProjectsPage />
        </ToastProvider>
      </MockedProvider>,
    );

    expect(await screen.findByText("Enterprise Network")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "+ Unggah Massal" }));
    expect(screen.getByRole("dialog", { name: "Unggah Massal Initiative" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Unduh Template" })).toHaveAttribute(
      "href",
      "/templates/template-buat-initiative-massal.xlsx",
    );
  });

  it("surfaces the server validation message when deactivation is rejected", async () => {
    const serverMessage = "Proyek masih digunakan oleh assignment, tidak dapat dinonaktifkan.";
    const failingMocks = [
      ...mocks,
      {
        request: { query: SetProjectActiveDocument, variables: { id: "prj-1", isActive: false } },
        error: new Error(serverMessage),
      },
    ];
    render(
      <MockedProvider mocks={failingMocks}>
        <ToastProvider>
          <ProjectsPage />
        </ToastProvider>
      </MockedProvider>,
    );

    expect(await screen.findByText("Enterprise Network")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Aksi Enterprise Network" }));
    fireEvent.click(screen.getByRole("button", { name: "Nonaktifkan" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(serverMessage);
  });
});
