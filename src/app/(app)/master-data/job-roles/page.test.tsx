// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import JobRolesPage from "@/app/(app)/master-data/job-roles/page";
import { ChaptersDocument, JobRolesDocument, SetJobRoleActiveDocument } from "@/generated/graphql";
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
    request: { query: JobRolesDocument, variables: { includeInactive: true } },
    result: {
      data: {
        jobRoles: [
          {
            id: "jr-1",
            name: "Software Engineer",
            isActive: true,
            chapter: { id: "ch-1", name: "Product", __typename: "Chapter" },
            __typename: "JobRole",
          },
          {
            id: "jr-2",
            name: "Data Analyst",
            isActive: false,
            chapter: null,
            __typename: "JobRole",
          },
        ],
      },
    },
  },
  {
    request: { query: ChaptersDocument, variables: { includeInactive: true } },
    result: {
      data: {
        chapters: [
          { id: "ch-1", name: "Product", isActive: true, __typename: "Chapter" },
          { id: "ch-2", name: "Engineering", isActive: true, __typename: "Chapter" },
        ],
      },
    },
  },
];

describe("JobRolesPage (Apollo)", () => {
  it("opens the job role import modal with the official template link (TAN-350)", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <ToastProvider>
          <JobRolesPage />
        </ToastProvider>
      </MockedProvider>
    );

    expect(await screen.findByText("Software Engineer")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "+ Unggah Massal" }));
    expect(screen.getByRole("dialog", { name: "Unggah Massal Job Role" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Unduh Template" })).toHaveAttribute(
      "href",
      "/templates/template-buat-jobrole-massal.xlsx",
    );
  });
  it("renders job roles with their chapter after queries resolve", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <ToastProvider>
          <JobRolesPage />
        </ToastProvider>
      </MockedProvider>
    );

    expect(await screen.findByText("Software Engineer")).toBeInTheDocument();
    expect(screen.getByText("Data Analyst")).toBeInTheDocument();
    expect(screen.getByText("Product")).toBeInTheDocument();
    expect(screen.getByText("Tanpa chapter")).toBeInTheDocument();
  });

  it("surfaces the server validation message when deactivation is rejected", async () => {
    const serverMessage = "Job role masih digunakan oleh karyawan, tidak dapat dinonaktifkan.";
    const failingMocks = [
      ...mocks,
      {
        request: { query: SetJobRoleActiveDocument, variables: { id: "jr-1", isActive: false } },
        error: new Error(serverMessage),
      },
    ];
    render(
      <MockedProvider mocks={failingMocks}>
        <ToastProvider>
          <JobRolesPage />
        </ToastProvider>
      </MockedProvider>
    );

    expect(await screen.findByText("Software Engineer")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Aksi Software Engineer" }));
    fireEvent.click(screen.getByRole("button", { name: "Nonaktifkan" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(serverMessage);
  });
});
