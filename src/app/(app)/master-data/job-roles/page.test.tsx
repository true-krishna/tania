// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { ToastProvider } from "@/components/Toast";
import JobRolesPage from "@/app/(app)/master-data/job-roles/page";
import { ChaptersDocument, JobRolesDocument, SetJobRoleActiveDocument } from "@/generated/graphql";

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