// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { ToastProvider } from "@/components/Toast";
import ChaptersPage from "@/app/(app)/master-data/chapters/page";
import { ChaptersDocument } from "@/generated/graphql";

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
  it("renders chapters and their job roles after the query resolves", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <ToastProvider>
          <ChaptersPage />
        </ToastProvider>
      </MockedProvider>
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
      </MockedProvider>
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(serverMessage);
  });
});