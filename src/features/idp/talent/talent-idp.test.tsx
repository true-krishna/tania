// @vitest-environment jsdom

import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ApolloLink, Observable } from "@apollo/client";
import { MockedProvider } from "@apollo/client/testing";
import MyIdpPage from "@/app/(app)/idp/my/page";
import { MenuAccessProvider } from "@/lib/auth/access";
import type { MenuAccessConfig, MenuAccessLevel } from "@/lib/auth/menuAccess";
import { MyIdpDocument, UpdateDevelopmentActionStatusDocument } from "@/generated/graphql";

vi.mock("@/lib/auth/guard", () => ({
  useSessionRole: () => "TALENT",
}));

function idpConfig(level: MenuAccessLevel, roleName: string): MenuAccessConfig {
  return { [roleName]: { idp: { visible: level !== "NONE", accessLevel: level } } };
}

function recordingLink(operations: string[]): ApolloLink {
  return new ApolloLink((operation) => {
    operations.push(operation.operationName);
    return new Observable((observer) => {
      observer.next({ data: { myIdp: null } });
      observer.complete();
    });
  });
}

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
    {
      __typename: "DevelopmentAction",
      id: "act-1",
      description: "Ikut training GraphQL",
      method: "TRAINING",
      status: "IN_PROGRESS",
      dueDate: "2025-08-01",
    },
    {
      __typename: "DevelopmentAction",
      id: "act-2",
      description: "Mentoring dengan lead",
      method: "MENTORING",
      status: "TODO",
      dueDate: "2025-08-15",
    },
  ],
  reviews: [
    {
      __typename: "ReviewLog",
      id: "rev-1",
      reviewDate: "2025-08-01",
      summary: "Progres stabil",
      followUp: "Lanjutkan",
      createdBy: { __typename: "User", id: "u-1", fullName: "Budi Santoso" },
    },
  ],
  revisions: [],
};

const myIdpResult = { data: { myIdp } };

describe("MyIdpPage — Talent (FR-14 / US3)", () => {
  it("shows an empty state when the talent has no IDP yet", async () => {
    render(
      <MockedProvider
        mocks={[{ request: { query: MyIdpDocument }, result: { data: { myIdp: null } } }]}
      >
        <MyIdpPage />
      </MockedProvider>,
    );

    expect(await screen.findByText(/Chapter belum membuat IDP untuk Anda/i)).toBeInTheDocument();
  });

  it("renders the talent's IDP detail with actions and reviews", async () => {
    render(
      <MockedProvider mocks={[{ request: { query: MyIdpDocument }, result: myIdpResult }]}>
        <MyIdpPage />
      </MockedProvider>,
    );

    expect(await screen.findByText("IDP saya")).toBeInTheDocument();
    expect(screen.getByText("Menjadi Go backend engineer yang andal")).toBeInTheDocument();
    expect(screen.getByText("Ikut training GraphQL")).toBeInTheDocument();
    expect(screen.getByText("Progres stabil")).toBeInTheDocument();
    expect(screen.getAllByText("0/2 selesai").length).toBeGreaterThan(0);
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
            request: {
              query: UpdateDevelopmentActionStatusDocument,
              variables: { id: "act-2", status: "IN_PROGRESS" },
            },
            result: { data: { updateDevelopmentActionStatus: updated } },
          },
          {
            request: { query: MyIdpDocument },
            result: {
              data: {
                myIdp: {
                  ...myIdp,
                  actions: [myIdp.actions[0], { ...myIdp.actions[1], status: "IN_PROGRESS" }],
                },
              },
            },
          },
        ]}
      >
        <MyIdpPage />
      </MockedProvider>,
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
            request: {
              query: UpdateDevelopmentActionStatusDocument,
              variables: { id: "act-2", status: "IN_PROGRESS" },
            },
            error: new Error("FORBIDDEN"),
          },
        ]}
      >
        <MyIdpPage />
      </MockedProvider>,
    );

    await screen.findByText("Ikut training GraphQL");

    fireEvent.change(screen.getByLabelText(/Status aksi: Mentoring dengan lead/i), {
      target: { value: "IN_PROGRESS" },
    });

    expect(await screen.findByText(/FORBIDDEN/)).toBeInTheDocument();
  });

  it("menolak IDP saat sel efektif tersembunyi tanpa memanggil kueri (TAN-373)", () => {
    const operations: string[] = [];
    render(
      <MenuAccessProvider config={idpConfig("NONE", "TALENT")} roleName="TALENT">
        <MockedProvider link={recordingLink(operations)}>
          <MyIdpPage />
        </MockedProvider>
      </MenuAccessProvider>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Akses ditolak");
    expect(operations).toEqual([]);
  });

  it("membuka IDP untuk peran kustom yang selnya dibuka konfigurasi (TAN-373)", async () => {
    render(
      <MenuAccessProvider config={idpConfig("READ", "PM_CHAPTER")} roleName="PM_CHAPTER">
        <MockedProvider mocks={[{ request: { query: MyIdpDocument }, result: myIdpResult }]}>
          <MyIdpPage />
        </MockedProvider>
      </MenuAccessProvider>,
    );

    expect(await screen.findByText("IDP saya")).toBeInTheDocument();
    expect(screen.getByText("Menjadi Go backend engineer yang andal")).toBeInTheDocument();
  });
});
