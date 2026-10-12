// @vitest-environment jsdom

import * as React from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { GraphQLError } from "graphql";
import EntraProvisioningPage from "./page";
import { ENTRA_LIST_VARIABLES } from "@/features/entra/useEmployeesWithoutEntra";
import {
  EmployeesWithoutEntraDocument,
  ProvisionEntraAccountDocument,
} from "@/generated/graphql";

const listVariables = { ...ENTRA_LIST_VARIABLES };

const rows = [
  {
    __typename: "Employee",
    id: "emp-1",
    fullName: "Budi Santoso",
    email: "budi@example.com",
    status: "ACTIVE",
    entraProvision: null,
  },
  {
    __typename: "Employee",
    id: "emp-2",
    fullName: "Rina Kusuma",
    email: "rina@example.com",
    status: "ACTIVE",
    entraProvision: {
      __typename: "EntraProvision",
      status: "FAILED",
      action: "CREATE",
      upn: null,
      lastError: "graph unavailable",
      updatedAt: "2026-10-12T10:00:00Z",
    },
  },
];

function connection(nodes: typeof rows) {
  return {
    data: {
      employeesWithoutEntra: {
        __typename: "EmployeeConnection",
        totalCount: nodes.length,
        edges: nodes.map((node) => ({ __typename: "EmployeeEdge", cursor: node.id, node })),
        pageInfo: { __typename: "PageInfo", hasNextPage: false, endCursor: null },
      },
    },
  };
}

const listMock = {
  request: { query: EmployeesWithoutEntraDocument, variables: listVariables },
  result: connection(rows),
};

const emptyListMock = {
  request: { query: EmployeesWithoutEntraDocument, variables: listVariables },
  result: connection([]),
};

function renderPage(mocks: React.ComponentProps<typeof MockedProvider>["mocks"]) {
  return render(
    <MockedProvider mocks={mocks}>
      <EntraProvisioningPage />
    </MockedProvider>
  );
}

describe("EntraProvisioningPage (daftar belum ada Entra, FR-44)", () => {
  it("lists talent without an Entra account and shows the recorded outcome", async () => {
    renderPage([listMock]);

    expect(await screen.findByText("Budi Santoso")).toBeInTheDocument();
    expect(screen.getByText("Belum dibuat")).toBeInTheDocument();
    expect(screen.getByText("Gagal")).toBeInTheDocument();
    expect(screen.getByText("graph unavailable")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /provisioning/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /coba lagi/i })).toBeInTheDocument();
  });

  it("shows an empty state when every talent already has an Entra account", async () => {
    renderPage([emptyListMock]);

    expect(
      await screen.findByText(/semua talent sudah memiliki akun entra/i)
    ).toBeInTheDocument();
  });

  it("provisions a talent and refetches the list", async () => {
    const provisioned = {
      __typename: "Employee",
      id: "emp-1",
      fullName: "Budi Santoso",
      entraProvision: {
        __typename: "EntraProvision",
        status: "INVITED",
        action: "INVITE",
        upn: "budi@telkom.co.id",
        lastError: null,
        updatedAt: "2026-10-12T11:00:00Z",
      },
    };
    renderPage([
      listMock,
      {
        request: {
          query: ProvisionEntraAccountDocument,
          variables: { employeeId: "emp-1" },
        },
        result: { data: { provisionEntraAccount: provisioned } },
      },
      {
        request: { query: EmployeesWithoutEntraDocument, variables: listVariables },
        result: connection([rows[1]]),
      },
    ]);

    fireEvent.click(await screen.findByRole("button", { name: /provisioning/i }));

    expect(await screen.findByText(/provisi akun budi santoso berhasil/i)).toBeInTheDocument();
    expect(await screen.findByText("Rina Kusuma")).toBeInTheDocument();
    expect(screen.queryByText("Budi Santoso")).not.toBeInTheDocument();
  });

  it("surfaces a failed retry without losing the row", async () => {
    renderPage([
      listMock,
      {
        request: {
          query: ProvisionEntraAccountDocument,
          variables: { employeeId: "emp-2" },
        },
        result: {
          data: {
            provisionEntraAccount: {
              __typename: "Employee",
              id: "emp-2",
              fullName: "Rina Kusuma",
              entraProvision: {
                __typename: "EntraProvision",
                status: "FAILED",
                action: "CREATE",
                upn: null,
                lastError: "quota exceeded",
                updatedAt: "2026-10-12T11:00:00Z",
              },
            },
          },
        },
      },
      listMock,
    ]);

    fireEvent.click(await screen.findByRole("button", { name: /coba lagi/i }));

    expect(await screen.findByText(/provisi akun rina kusuma gagal/i)).toBeInTheDocument();
    expect(screen.getByText("Rina Kusuma")).toBeInTheDocument();
  });

  it("maps a rejected provisioning to a clear message", async () => {
    renderPage([
      listMock,
      {
        request: {
          query: ProvisionEntraAccountDocument,
          variables: { employeeId: "emp-1" },
        },
        result: {
          errors: [
            new GraphQLError("Aturan bisnis belum terpenuhi.", {
              extensions: { code: "PRECONDITION_FAILED" },
            }),
          ],
        },
      },
    ]);

    fireEvent.click(await screen.findByRole("button", { name: /provisioning/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/aturan bisnis belum terpenuhi/i);
  });
});
