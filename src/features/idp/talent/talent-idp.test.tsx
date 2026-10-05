// @vitest-environment jsdom

import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import MyIdpPage from "@/app/(app)/idp/my/page";
import {
  MyIdpDocument,
  UpdateDevelopmentActionStatusDocument,
} from "@/generated/graphql";

vi.mock("@/lib/auth/guard", () => ({
  AuthGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const myIdp = {
  __typename: "Idp",
  id: "idp-1",
  status: "IN_PROGRESS",
  developmentObjective: "Menjadi Go backend engineer yang andal",
  currentAssessment: "Sudah mampu mengerjakan fitur CRUD dasar.",
  gapAnalysis: "Perlu peningkatan pada desain API.",
  timelineStart: "2025-07-01",
  timelineEnd: "2025-09-30",
  successIndicators: "Mampu menyelesaikan 1 modul penuh.",
  actions: [
    { __typename: "DevelopmentAction", id: "act-1", description: "Ikut training GraphQL", method: "TRAINING", status: "IN_PROGRESS", dueDate: "2025-08-01" },
    { __typename: "DevelopmentAction", id: "act-2", description: "Mentoring dengan lead", method: "MENTORING", status: "TODO", dueDate: "2025-08-15" },
  ],
  reviews: [
    { __typename: "ReviewLog", id: "rev-1", reviewDate: "2025-08-01", summary: "Progres stabil", followUp: "Lanjutkan", createdBy: { __typename: "User", id: "u-1", fullName: "Budi Santoso" } },
  ],
  revisions: [],
};

const myIdpResult = { data: { myIdp } };

describe("MyIdpPage — Talent (FR-14 / US3)", () => {
  it("shows an empty state when the talent has no IDP yet", async () => {
    render(
      <MockedProvider mocks={[{ request: { query: MyIdpDocument }, result: { data: { myIdp: null } } }]}>
        <MyIdpPage />
      </MockedProvider>
    );

    expect(await screen.findByText(/Chapter belum membuat IDP untuk Anda/i)).toBeInTheDocument();
  });

  it("renders the talent's IDP detail with actions and reviews", async () => {
    render(
      <MockedProvider mocks={[{ request: { query: MyIdpDocument }, result: myIdpResult }]}>
        <MyIdpPage />
      </MockedProvider>
    );

    expect(await screen.findByText("IDP Saya")).toBeInTheDocument();
    expect(screen.getByText("Menjadi Go backend engineer yang andal")).toBeInTheDocument();
    expect(screen.getByText("Ikut training GraphQL")).toBeInTheDocument();
    expect(screen.getByText("Progres stabil")).toBeInTheDocument();
    expect(screen.getByText("0/2 selesai")).toBeInTheDocument();
  });

  it("updates an action status and confirms", async () => {
    const updated = {
      __typename: "DevelopmentAction",
      id: "act-2",
      description: "Mentoring dengan lead",
      method: "MENTORING",
      status: "IN_PROGRESS",
      dueDate: "2025-08-15",
    };

    render(
      <MockedProvider
        mocks={[
          { request: { query: MyIdpDocument }, result: myIdpResult },
          {
            request: { query: UpdateDevelopmentActionStatusDocument, variables: { id: "act-2", status: "IN_PROGRESS" } },
            result: { data: { updateDevelopmentActionStatus: updated } },
          },
          {
            request: { query: MyIdpDocument },
            result: {
              data: {
                myIdp: {
                  ...myIdp,
                  actions: [
                    myIdp.actions[0],
                    { ...myIdp.actions[1], status: "IN_PROGRESS" },
                  ],
                },
              },
            },
          },
        ]}
      >
        <MyIdpPage />
      </MockedProvider>
    );

    await screen.findByText("Ikut training GraphQL");

    fireEvent.change(screen.getByLabelText(/Status aksi: Mentoring dengan lead/i), {
      target: { value: "IN_PROGRESS" },
    });

    expect(await screen.findByText("Status aksi diperbarui.")).toBeInTheDocument();
  });

  it("shows an error toast when the status update fails", async () => {
    render(
      <MockedProvider
        mocks={[
          { request: { query: MyIdpDocument }, result: myIdpResult },
          {
            request: { query: UpdateDevelopmentActionStatusDocument, variables: { id: "act-2", status: "IN_PROGRESS" } },
            error: new Error("FORBIDDEN"),
          },
        ]}
      >
        <MyIdpPage />
      </MockedProvider>
    );

    await screen.findByText("Ikut training GraphQL");

    fireEvent.change(screen.getByLabelText(/Status aksi: Mentoring dengan lead/i), {
      target: { value: "IN_PROGRESS" },
    });

    expect(await screen.findByText(/FORBIDDEN/)).toBeInTheDocument();
  });
});