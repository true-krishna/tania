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
  ReprovisionEntraAccountDocument,
  ResendEntraActivationEmailDocument,
  SetEntraAccountEnabledDocument,
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
    </MockedProvider>,
  );
}

describe("EntraProvisioningPage (daftar belum ada Entra, FR-44)", () => {
  it("lists talent without an Entra account and shows the recorded outcome", async () => {
    renderPage([listMock]);

    expect(await screen.findByText("Budi Santoso")).toBeInTheDocument();
    expect(screen.getByText("Belum dibuat")).toBeInTheDocument();
    expect(screen.getByText("Gagal")).toBeInTheDocument();
    expect(screen.getByText("graph unavailable")).toBeInTheDocument();
    // CREATED: akun hasil create dengan password sementara via email (TAN-359).
    expect(screen.getByText("Akun dibuat")).toBeInTheDocument();
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

    expect(await screen.findByText(/semua talent sudah memiliki akun entra/i)).toBeInTheDocument();
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
    await waitFor(() => expect(screen.queryByText("Budi Santoso")).not.toBeInTheDocument(), {
      timeout: 3000,
    });
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
        expect(screen.getByRole("button", { name: "Halaman berikutnya" })).toBeEnabled(),
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
      endCursor: string | null,
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
        result: page(
          Array.from({ length: 100 }, (_, i) => talent(i + 1)),
          105,
          true,
          "c-100",
        ),
      },
      {
        request: {
          query: EmployeesWithoutEntraDocument,
          variables: { ...ENTRA_LIST_VARIABLES, after: "c-100" },
        },
        result: page(
          Array.from({ length: 5 }, (_, i) => talent(101 + i)),
          105,
          false,
          null,
        ),
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
      expect(screen.getByRole("button", { name: "Halaman berikutnya" })).toBeEnabled(),
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

    await waitFor(() => expect(screen.queryByText("Budi Santoso")).not.toBeInTheDocument(), {
      timeout: 3000,
    });
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
        "ascending",
      ),
    );
    expect(screen.getByRole("button", { name: "Nama" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hasil provisi" })).toBeInTheDocument();
  });
});

describe("EntraProvisioningPage (siklus akun & notifikasi, TAN-360)", () => {
  const linkedRows = [
    {
      __typename: "Employee",
      id: "emp-linked",
      fullName: "Dewi Anggraini",
      email: "dewi@example.com",
      status: "ACTIVE",
      entraProvision: {
        __typename: "EntraProvision",
        status: "CREATED",
        action: "CREATE",
        upn: "dewi.anggraini@digitaltelkom.id",
        notifyStatus: "SENT",
        notifyError: null,
        needsReprovision: false,
        lastError: null,
        updatedAt: "2026-10-12T10:00:00Z",
      },
    },
    {
      __typename: "Employee",
      id: "emp-mismatch",
      fullName: "Iwan Mutasi",
      email: "iwan@example.com",
      status: "ACTIVE",
      entraProvision: {
        __typename: "EntraProvision",
        status: "INVITED",
        action: "INVITE",
        upn: "iwan@example.com",
        notifyStatus: null,
        notifyError: null,
        needsReprovision: true,
        lastError: null,
        updatedAt: "2026-10-12T10:00:00Z",
      },
    },
    {
      __typename: "Employee",
      id: "emp-email-failed",
      fullName: "Rian Email",
      email: "rian@example.com",
      status: "ACTIVE",
      entraProvision: {
        __typename: "EntraProvision",
        status: "CREATED",
        action: "CREATE",
        upn: "rian.email@digitaltelkom.id",
        notifyStatus: "FAILED",
        notifyError: "smtp relay down",
        needsReprovision: false,
        lastError: null,
        updatedAt: "2026-10-12T10:00:00Z",
      },
    },
    {
      __typename: "Employee",
      id: "emp-disabled",
      fullName: "Eka Nonaktif",
      email: "eka@example.com",
      status: "ACTIVE",
      entraProvision: {
        __typename: "EntraProvision",
        status: "DISABLED",
        action: "CREATE",
        upn: "eka.nonaktif@digitaltelkom.id",
        notifyStatus: null,
        notifyError: null,
        needsReprovision: false,
        lastError: null,
        updatedAt: "2026-10-12T10:00:00Z",
      },
    },
  ];

  const linkedListMock = {
    request: { query: EmployeesWithoutEntraDocument, variables: listVariables },
    result: connection(linkedRows),
  };

  it("shows the re-provision badge for a mismatched account and reprovisions it after confirmation", async () => {
    const afterSwap = linkedRows.map((row) =>
      row.id === "emp-mismatch"
        ? {
            ...row,
            entraProvision: {
              ...row.entraProvision,
              status: "CREATED",
              action: "CREATE",
              upn: "iwan.mutasi@digitaltelkom.id",
              needsReprovision: false,
            },
          }
        : row,
    );
    renderPage([
      linkedListMock,
      {
        request: {
          query: ReprovisionEntraAccountDocument,
          variables: { employeeId: "emp-mismatch" },
        },
        result: {
          data: {
            reprovisionEntraAccount: {
              __typename: "Employee",
              id: "emp-mismatch",
              fullName: "Iwan Mutasi",
              entraProvision: {
                __typename: "EntraProvision",
                status: "CREATED",
                action: "CREATE",
                upn: "iwan.mutasi@digitaltelkom.id",
                notifyStatus: "SENT",
                notifyError: null,
                needsReprovision: false,
                lastError: null,
                updatedAt: "2026-10-12T11:00:00Z",
              },
            },
          },
        },
      },
      {
        request: { query: EmployeesWithoutEntraDocument, variables: listVariables },
        result: connection(afterSwap),
      },
    ]);
    expect(await screen.findByText("Iwan Mutasi")).toBeInTheDocument();
    expect(screen.getByText("Perlu provisi ulang")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Aksi Iwan Mutasi" }));
    fireEvent.click(await screen.findByRole("button", { name: "Provisi ulang" }));
    // The confirmation modal explains the swap before it runs.
    expect(
      await screen.findByText(/akun entra lama iwan mutasi akan dinonaktifkan/i),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Provisi ulang" }));

    expect(await screen.findByText(/provisi ulang iwan mutasi berhasil/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("Perlu provisi ulang")).not.toBeInTheDocument(), {
      timeout: 3000,
    });
  }, 15000);

  it("disables a linked account only through the confirmation modal and shows the result", async () => {
    const afterToggle = linkedRows.map((row) =>
      row.id === "emp-linked"
        ? {
            ...row,
            entraProvision: { ...row.entraProvision, status: "DISABLED" },
          }
        : row,
    );
    renderPage([
      linkedListMock,
      {
        request: {
          query: SetEntraAccountEnabledDocument,
          variables: { employeeId: "emp-linked", enabled: false },
        },
        result: {
          data: {
            setEntraAccountEnabled: {
              __typename: "Employee",
              id: "emp-linked",
              fullName: "Dewi Anggraini",
              entraProvision: {
                __typename: "EntraProvision",
                status: "DISABLED",
                action: "CREATE",
                upn: "dewi.anggraini@digitaltelkom.id",
                notifyStatus: "SENT",
                notifyError: null,
                needsReprovision: false,
                lastError: null,
                updatedAt: "2026-10-12T11:00:00Z",
              },
            },
          },
        },
      },
      {
        request: { query: EmployeesWithoutEntraDocument, variables: listVariables },
        result: connection(afterToggle),
      },
    ]);
    expect(await screen.findByText("Dewi Anggraini")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Aksi Dewi Anggraini" }));
    fireEvent.click(await screen.findByRole("button", { name: "Nonaktifkan" }));
    expect(await screen.findByText(/tidak akan dapat dipakai login/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Nonaktifkan" }));

    expect(
      await screen.findByText(/akun entra dewi anggraini berhasil dinonaktifkan/i),
    ).toBeInTheDocument();
    expect((await screen.findAllByText("Dinonaktifkan")).length).toBeGreaterThan(0);
  }, 15000);

  it("re-enables a disabled account without a confirmation modal", async () => {
    const afterToggle = linkedRows.map((row) =>
      row.id === "emp-disabled"
        ? {
            ...row,
            entraProvision: { ...row.entraProvision, status: "CREATED" },
          }
        : row,
    );
    renderPage([
      linkedListMock,
      {
        request: {
          query: SetEntraAccountEnabledDocument,
          variables: { employeeId: "emp-disabled", enabled: true },
        },
        result: {
          data: {
            setEntraAccountEnabled: {
              __typename: "Employee",
              id: "emp-disabled",
              fullName: "Eka Nonaktif",
              entraProvision: {
                __typename: "EntraProvision",
                status: "CREATED",
                action: "CREATE",
                upn: "eka.nonaktif@digitaltelkom.id",
                notifyStatus: null,
                notifyError: null,
                needsReprovision: false,
                lastError: null,
                updatedAt: "2026-10-12T11:00:00Z",
              },
            },
          },
        },
      },
      {
        request: { query: EmployeesWithoutEntraDocument, variables: listVariables },
        result: connection(afterToggle),
      },
    ]);
    expect(await screen.findByText("Eka Nonaktif")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Aksi Eka Nonaktif" }));
    fireEvent.click(await screen.findByRole("button", { name: "Aktifkan" }));

    expect(
      await screen.findByText(/akun entra eka nonaktif berhasil diaktifkan/i),
    ).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("Dinonaktifkan")).not.toBeInTheDocument(), {
      timeout: 3000,
    });
  }, 15000);

  it("resends the activation email for a created account whose email failed and updates the status", async () => {
    const afterResend = linkedRows.map((row) =>
      row.id === "emp-email-failed"
        ? {
            ...row,
            entraProvision: { ...row.entraProvision, notifyStatus: "SENT", notifyError: null },
          }
        : row,
    );
    renderPage([
      linkedListMock,
      {
        request: {
          query: ResendEntraActivationEmailDocument,
          variables: { employeeId: "emp-email-failed" },
        },
        result: {
          data: {
            resendEntraActivationEmail: {
              __typename: "Employee",
              id: "emp-email-failed",
              fullName: "Rian Email",
              entraProvision: {
                __typename: "EntraProvision",
                status: "CREATED",
                action: "CREATE",
                upn: "rian.email@digitaltelkom.id",
                notifyStatus: "SENT",
                notifyError: null,
                needsReprovision: false,
                lastError: null,
                updatedAt: "2026-10-12T11:00:00Z",
              },
            },
          },
        },
      },
      {
        request: { query: EmployeesWithoutEntraDocument, variables: listVariables },
        result: connection(afterResend),
      },
    ]);
    expect(await screen.findByText("Rian Email")).toBeInTheDocument();
    expect(screen.getByText("Email aktivasi gagal")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Aksi Rian Email" }));
    fireEvent.click(await screen.findByRole("button", { name: /kirim ulang email aktivasi/i }));

    expect(
      await screen.findByText(/berhasil dikirim ulang ke email pribadinya/i),
    ).toBeInTheDocument();
    expect(await screen.findAllByText("Email aktivasi terkirim")).not.toHaveLength(0);
  }, 15000);

  it("surfaces a failed resend with its reason", async () => {
    renderPage([
      linkedListMock,
      {
        request: {
          query: ResendEntraActivationEmailDocument,
          variables: { employeeId: "emp-email-failed" },
        },
        result: {
          data: {
            resendEntraActivationEmail: {
              __typename: "Employee",
              id: "emp-email-failed",
              fullName: "Rian Email",
              entraProvision: {
                __typename: "EntraProvision",
                status: "CREATED",
                action: "CREATE",
                upn: "rian.email@digitaltelkom.id",
                notifyStatus: "FAILED",
                notifyError: "relay masih down",
                needsReprovision: false,
                lastError: null,
                updatedAt: "2026-10-12T11:00:00Z",
              },
            },
          },
        },
      },
      // The mutation refetches the list; the failed send keeps the FAILED badge.
      linkedListMock,
    ]);
    expect(await screen.findByText("Rian Email")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Aksi Rian Email" }));
    fireEvent.click(await screen.findByRole("button", { name: /kirim ulang email aktivasi/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/relay masih down/i);
    expect(screen.getByText("Email aktivasi gagal")).toBeInTheDocument();
  }, 15000);
});
