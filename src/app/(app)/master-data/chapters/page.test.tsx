// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import ChaptersPage from "@/app/(app)/master-data/chapters/page";
import { ChaptersDocument } from "@/generated/graphql";
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
    request: { query: ChaptersDocument, variables: { includeInactive: true } },
    result: {
      data: {
        chapters: [
          {
            id: "ch-1",
            name: "Digital Business & Technology",
            isActive: true,
            jobRoles: [{ id: "jr-1", name: "Software Engineer", __typename: "JobRole" }],
            __typename: "Chapter",
          },
          {
            id: "ch-2",
            name: "Operations",
            isActive: false,
            jobRoles: [],
            __typename: "Chapter",
          },
        ],
      },
    },
  },
];

describe("ChaptersPage (Apollo)", () => {
  it("opens the chapter import modal with the official template link (TAN-350)", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <ToastProvider>
          <ChaptersPage />
        </ToastProvider>
      </MockedProvider>,
    );

    expect(await screen.findByText("Digital Business & Technology")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "+ Unggah Massal" }));
    expect(screen.getByRole("dialog", { name: "Unggah Massal Chapter" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Unduh Template" })).toHaveAttribute(
      "href",
      "/templates/template-buat-chapter-massal.xlsx",
    );
  });
  it("renders chapters and their job roles after the query resolves", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <ToastProvider>
          <ChaptersPage />
        </ToastProvider>
      </MockedProvider>,
    );

    expect(await screen.findByText("Digital Business & Technology")).toBeInTheDocument();
    expect(screen.getByText("Operations")).toBeInTheDocument();
    expect(screen.getByText("1", { selector: "td" })).toBeInTheDocument();
  });

  it("surfaces the server validation message when the query fails", async () => {
    const serverMessage = "Akses ditolak untuk membaca chapter.";
    render(
      <MockedProvider
        mocks={[
          {
            request: { query: ChaptersDocument, variables: { includeInactive: true } },
            error: new Error(serverMessage),
          },
        ]}
      >
        <ToastProvider>
          <ChaptersPage />
        </ToastProvider>
      </MockedProvider>,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(serverMessage);
  });
});
