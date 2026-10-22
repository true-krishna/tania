// @vitest-environment jsdom

import * as React from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
  {
    __typename: "Employee",
    id: "emp-3",
    fullName: "Dewi Anggraini",
    email: "dewi@example.com",
    status: "ACTIVE",
    entraProvision: {
      __typename: "EntraProvision",
      status: "CREATED",
      action: "CREATE",
      upn: "dewi.anggraini@digitaltelkom.id",
      lastError: null,
      updatedAt: "2026-10-12T10:00:00Z",
    },
  },
];

function connection(nodes: typeof rows, hasNextPage = false, endCursor: string | null = null) {
  return {
    data: {
      employeesWithoutEntra: {
        __typename: "EmployeeConnection",
        totalCount: nodes.length,
        edges: nodes.map((node) => ({ __typename: "EmployeeEdge", cursor: node.id, node })),
        pageInfo: { __typename: "PageInfo", hasNextPage, endCursor },
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
    // CREATED: akun hasil create menunggu aktivasi di luar aplikasi (TAN-273).
    expect(screen.getByText("Menunggu aktivasi")).toBeInTheDocument();
    expect(screen.getByText("dewi.anggraini@digitaltelkom.id")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Aksi Budi Santoso" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Aksi Rina Kusuma" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Aksi Budi Santoso" }));
    expect(screen.getByRole("button", { name: /provisioning/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Aksi Rina Kusuma" }));
    expect(screen.getByRole("button", { name: /coba lagi/i })).toBeInTheDocument();
  }, 15000);

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

    fireEvent.click(await screen.findByRole("button", { name: "Aksi Budi Santoso" }));
    fireEvent.click(await screen.findByRole("button", { name: /provisioning/i }));

    expect(await screen.findByText(/provisi akun budi santoso berhasil/i)).toBeInTheDocument();
    await waitFor(
      () => expect(screen.queryByText("Budi Santoso")).not.toBeInTheDocument(),
      { timeout: 3000 }
    );
    expect(screen.getByText("Rina Kusuma")).toBeInTheDocument();
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

    fireEvent.click(await screen.findByRole("button", { name: "Aksi Rina Kusuma" }));
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

    fireEvent.click(await screen.findByRole("button", { name: "Aksi Budi Santoso" }));
    fireEvent.click(await screen.findByRole("button", { name: /provisioning/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/aturan bisnis belum terpenuhi/i);
  });

  it("reaches talent past the first 100 rows by loading the next cursor page", async () => {
    const first100 = Array.from({ length: 100 }, (_, i) => ({
      __typename: "Employee",
      id: `emp-${i + 1}`,
      fullName: `Talent ${String(i + 1).padStart(3, "0")}`,
      email: `talent${i + 1}@example.com`,
      status: "ACTIVE",
      entraProvision: null,
    }));
    const rest5 = Array.from({ length: 5 }, (_, i) => ({
      __typename: "Employee",
      id: `emp-${101 + i}`,
      fullName: `Talent ${101 + i}`,
      email: `talent${101 + i}@example.com`,
      status: "ACTIVE",
      entraProvision: null,
    }));
    renderPage([
      {
        request: { query: EmployeesWithoutEntraDocument, variables: listVariables },
        result: {
          data: {
            employeesWithoutEntra: {
              __typename: "EmployeeConnection",
              totalCount: 105,
              edges: first100.map((node) => ({
                __typename: "EmployeeEdge",
                cursor: node.id,
                node,
              })),
              pageInfo: { __typename: "PageInfo", hasNextPage: true, endCursor: "c-100" },
            },
          },
        },
      },
      {
        request: {
          query: EmployeesWithoutEntraDocument,
          variables: { ...ENTRA_LIST_VARIABLES, after: "c-100" },
        },
        result: {
          data: {
            employeesWithoutEntra: {
              __typename: "EmployeeConnection",
              totalCount: 105,
              edges: rest5.map((node) => ({
                __typename: "EmployeeEdge",
                cursor: node.id,
                node,
              })),
              pageInfo: { __typename: "PageInfo", hasNextPage: false, endCursor: null },
            },
          },
        },
      },
    ]);
    expect(await screen.findByText("Talent 001")).toBeInTheDocument();

    // Page 11 (rows 101–110 at 10 rows/page) passes the loaded cursor page,
    // so the table chains loadMore and the appended rows become visible.
    for (let page = 1; page < 11; page += 1) {
      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Halaman berikutnya" })).toBeEnabled()
      );
      fireEvent.click(screen.getByRole("button", { name: "Halaman berikutnya" }));
    }

    expect(await screen.findByText("Talent 101")).toBeInTheDocument();
    expect(screen.getByText("Talent 105")).toBeInTheDocument();
  }, 15000);

  it("rechains loadMore after provisioning so the deep page stays navigable", async () => {
    const talent = (n: number) => ({
      __typename: "Employee",
      id: `emp-${n}`,
      fullName: `Talent ${String(n).padStart(3, "0")}`,
      email: `talent${n}@example.com`,
      status: "ACTIVE",
      entraProvision: null,
    });
    const page = (
      nodes: ReturnType<typeof talent>[],
      totalCount: number,
      hasNextPage: boolean,
      endCursor: string | null
    ) => ({
      data: {
        employeesWithoutEntra: {
          __typename: "EmployeeConnection",
          totalCount,
          edges: nodes.map((node) => ({ __typename: "EmployeeEdge", cursor: node.id, node })),
          pageInfo: { __typename: "PageInfo", hasNextPage, endCursor },
        },
      },
    });
    const fresh100 = Array.from({ length: 100 }, (_, i) => talent(i + 2));
    const fresh4 = Array.from({ length: 4 }, (_, i) => talent(102 + i));

    renderPage([
      {
        request: { query: EmployeesWithoutEntraDocument, variables: listVariables },
        result: page(Array.from({ length: 100 }, (_, i) => talent(i + 1)), 105, true, "c-100"),
      },
      {
        request: {
          query: EmployeesWithoutEntraDocument,
          variables: { ...ENTRA_LIST_VARIABLES, after: "c-100" },
        },
        result: page(Array.from({ length: 5 }, (_, i) => talent(101 + i)), 105, false, null),
      },
      {
        request: { query: ProvisionEntraAccountDocument, variables: { employeeId: "emp-1" } },
        result: {
          data: {
            provisionEntraAccount: {
              __typename: "Employee",
              id: "emp-1",
              fullName: "Talent 001",
              entraProvision: {
                __typename: "EntraProvision",
                status: "INVITED",
                action: "INVITE",
                upn: "talent001@telkom.co.id",
                lastError: null,
                updatedAt: "2026-10-12T11:00:00Z",
              },
            },
          },
        },
      },
      {
        // Refetch after provisioning: the provisioned talent left the list.
        request: { query: EmployeesWithoutEntraDocument, variables: listVariables },
        result: page(fresh100, 104, true, "c-2"),
      },
      {
        request: {
          query: EmployeesWithoutEntraDocument,
          variables: { ...ENTRA_LIST_VARIABLES, after: "c-2" },
        },
        result: page(fresh4, 104, false, null),
      },
    ]);
    expect(await screen.findByText("Talent 001")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Aksi Talent 001" }));
    fireEvent.click(await screen.findByRole("button", { name: /provisioning/i }));
    expect(await screen.findByText(/provisi akun talent 001 berhasil/i)).toBeInTheDocument();

    // The refetched list (104 talent) is served by the same pagination chain:
    // widening the page past the loaded rows pulls the remaining cursor page.
    fireEvent.change(screen.getByRole("combobox", { name: /baris per halaman/i }), {
      target: { value: "50" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Halaman berikutnya" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Halaman berikutnya" })).toBeEnabled()
    );
    fireEvent.click(screen.getByRole("button", { name: "Halaman berikutnya" }));

    expect(await screen.findByText("Talent 105")).toBeInTheDocument();
    expect(screen.queryByText("Talent 001")).not.toBeInTheDocument();
    expect(screen.getByText("Talent 102")).toBeInTheDocument();
  }, 15000);
});

describe("EntraProvisioningPage (pencarian dan pengurutan, FR-44)", () => {
  it("searches by employee name", async () => {
    renderPage([
      listMock,
      {
        request: {
          query: EmployeesWithoutEntraDocument,
          variables: { ...listVariables, search: "rina" },
        },
        result: connection([rows[1]]),
      },
    ]);
    expect(await screen.findByText("Budi Santoso")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("searchbox", { name: /cari nama karyawan/i }), {
      target: { value: "rina" },
    });

    await waitFor(
      () => expect(screen.queryByText("Budi Santoso")).not.toBeInTheDocument(),
      { timeout: 3000 }
    );
    expect(screen.getByText("Rina Kusuma")).toBeInTheDocument();
  });

  it("sorts every data column through the server query", async () => {
    const sortedVariables = {
      ...listVariables,
      sortBy: "EMAIL",
      sortDirection: "ASC",
    };
    renderPage([
      listMock,
      {
        request: { query: EmployeesWithoutEntraDocument, variables: sortedVariables },
        result: connection(rows),
      },
    ]);
    expect(await screen.findByText("Budi Santoso")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Email" }));

    await waitFor(() =>
      expect(screen.getByRole("columnheader", { name: /email/i })).toHaveAttribute(
        "aria-sort",
        "ascending"
      )
    );
    expect(screen.getByRole("button", { name: "Nama" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hasil provisi" })).toBeInTheDocument();
  });
});
