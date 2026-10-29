// @vitest-environment jsdom

import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import EmployeeDetailPage from "@/app/(app)/employees/[id]/page";
import {
  AuditLogsDocument,
  EmployeeDocument,
  EmployeeEntraProvisionDocument,
  UpdateEmployeeDocument,
} from "@/generated/graphql";

const auth = vi.hoisted(() => ({ role: "OPERATION" as string | null }));

vi.mock("@/lib/auth/guard", () => ({
  useSessionRole: () => auth.role,
  AuthGuard: ({ children }: { children: React.ReactNode }) => children,
}));

beforeEach(() => {
  auth.role = "OPERATION";
});

const employeeNode = {
  __typename: "Employee",
  id: "emp-1",
  fullName: "Andi Pratama",
  nikMasked: "************1234",
  email: "andi@tania.id",
  birthDate: "1990-01-01",
  gender: "MALE",
  phone: "0811111111",
  address: "Jl. Satu",
  latestEducation: null,
  institutionName: null,
  major: null,
  nomorInduk: "EMP-77",
  status: "ACTIVE",
  assignable: true,
  joinedAt: "2024-01-01",
  unit: { __typename: "Unit", id: "u-1", name: "Digital" },
  jobRole: { __typename: "JobRole", id: "jr-1", name: "Engineer" },
  chapter: { __typename: "Chapter", id: "ch-1", name: "Platform" },
  contracts: {
    __typename: "EmploymentContractConnection",
    totalCount: 2,
    edges: [
      {
        __typename: "EmploymentContractEdge",
        cursor: "c-2",
        node: {
          __typename: "EmploymentContract",
          id: "ctr-2",
          contractNo: "PKWT/2025/002",
          contractType: "TKWT_DIGITAL_TALENT",
          officeEmail: "andi@corp.id",
          nomorInduk: "EMP-77",
          bandPosition: "II",
          jobTitle: "Backend Engineer",
          jobLevel: "Junior",
          workLocation: "JAKARTA",
          startDate: "2025-07-01",
          endDate: "2026-06-30",
          status: "ACTIVE",
          endReason: null,
          terminatedAt: null,
          notes: null,
          unit: { __typename: "Unit", id: "u-1", name: "Digital" },
          jobRole: {
            __typename: "JobRole",
            id: "jr-1",
            name: "Engineer",
            chapter: { __typename: "Chapter", id: "ch-1", name: "Platform" },
          },
          createdAt: "2025-06-20T09:00:00Z",
          updatedAt: "2025-06-20T09:00:00Z",
        },
      },
      {
        __typename: "EmploymentContractEdge",
        cursor: "c-1",
        node: {
          __typename: "EmploymentContract",
          id: "ctr-1",
          contractNo: "PKWT/2024/001",
          contractType: "TKWT_DIGITAL_TALENT",
          officeEmail: null,
          nomorInduk: "EMP-11",
          bandPosition: "UNDEFINED",
          jobTitle: null,
          jobLevel: null,
          workLocation: "BANDUNG",
          startDate: "2024-01-01",
          endDate: "2025-06-30",
          status: "ENDED",
          endReason: "EXPIRY",
          terminatedAt: "2025-06-30T17:00:00Z",
          notes: "Kontrak awal",
          unit: { __typename: "Unit", id: "u-2", name: "Enterprise" },
          jobRole: { __typename: "JobRole", id: "jr-2", name: "Analyst", chapter: null },
          createdAt: "2023-12-20T09:00:00Z",
          updatedAt: "2025-06-30T17:00:00Z",
        },
      },
    ],
  },
};

const employeeMock = {
  request: { query: EmployeeDocument, variables: { id: "emp-1" } },
  result: { data: { employee: employeeNode } },
};

const auditLogNode = {
  __typename: "AuditLog",
  id: "log-1",
  occurredAt: "2026-10-08T10:00:00Z",
  action: "UPDATE",
  actor: { __typename: "User", id: "u-1", fullName: "Sari Operator" },
  actorRole: "OPERATION",
  entityType: "employee",
  entityId: "emp-1",
  before: '{"phone":"0811111111"}',
  after: '{"phone":"0822222222"}',
  ip: null,
  userAgent: null,
  requestId: null,
};

const auditLogsMock = {
  request: {
    query: AuditLogsDocument,
    variables: { filter: { entityType: "employee", entityId: "emp-1" }, first: 25, after: null },
  },
  result: {
    data: {
      auditLogs: {
        __typename: "AuditLogConnection",
        totalCount: 1,
        edges: [{ __typename: "AuditLogEdge", cursor: "log-1", node: auditLogNode }],
        pageInfo: { __typename: "PageInfo", hasNextPage: false, endCursor: null },
      },
    },
  },
};

// `entraProvision` is requested only for roles holding permEntraRead
// (Operation/Admin) — the query itself is gated before it is ever sent.
const entraProvisionMock = {
  request: { query: EmployeeEntraProvisionDocument, variables: { id: "emp-1" } },
  result: {
    data: {
      employee: {
        __typename: "Employee",
        id: "emp-1",
        entraProvision: {
          __typename: "EntraProvision",
          status: "FAILED",
          action: "CREATE",
          upn: null,
          lastError: "graph unavailable",
          updatedAt: "2026-10-12T10:00:00Z",
        },
      },
    },
  },
};

const noProvisionMock = {
  request: { query: EmployeeEntraProvisionDocument, variables: { id: "emp-1" } },
  result: {
    data: {
      employee: { __typename: "Employee", id: "emp-1", entraProvision: null },
    },
  },
};

const createdProvisionMock = {
  request: { query: EmployeeEntraProvisionDocument, variables: { id: "emp-1" } },
  result: {
    data: {
      employee: {
        __typename: "Employee",
        id: "emp-1",
        entraProvision: {
          __typename: "EntraProvision",
          status: "CREATED",
          action: "CREATE",
          upn: "rina.kusuma@digitaltelkom.id",
          notifyStatus: "SENT",
          notifyError: null,
          needsReprovision: false,
          lastError: null,
          updatedAt: "2026-10-12T10:00:00Z",
        },
      },
    },
  },
};

function renderDetail(mocks: React.ComponentProps<typeof MockedProvider>["mocks"]) {
  return render(
    <React.Suspense fallback={null}>
      <MockedProvider mocks={mocks}>
        <EmployeeDetailPage params={Promise.resolve({ id: "emp-1" })} />
      </MockedProvider>
    </React.Suspense>,
  );
}

describe("EmployeeDetailPage (riwayat kontrak + riwayat perubahan, T022)", () => {
  it("shows data diri with NIK masked and the full TMS attributes of every contract", async () => {
    await act(async () => {
      renderDetail([employeeMock, auditLogsMock, entraProvisionMock]);
    });

    expect(
      await screen.findByRole("heading", { name: /detail karyawan|andi pratama/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("************1234")).toBeInTheDocument();
    expect(screen.queryByText(/3273012345678901/)).not.toBeInTheDocument();

    expect(screen.getByText("PKWT/2025/002")).toBeInTheDocument();
    expect(screen.getByText("PKWT/2024/001")).toBeInTheDocument();
    expect(screen.getAllByText("EMP-77").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("EMP-11")).toBeInTheDocument();
    expect(screen.getByText("Backend Engineer")).toBeInTheDocument();
    expect(screen.getByText("Habis masa berlaku")).toBeInTheDocument();
    expect(screen.getByText("Kontrak awal")).toBeInTheDocument();
    expect(screen.getAllByText("Jakarta").length).toBeGreaterThanOrEqual(1);
  });

  it("shows the per-record change history from auditLogs", async () => {
    await act(async () => {
      renderDetail([employeeMock, auditLogsMock, entraProvisionMock]);
    });

    expect(await screen.findByText(/riwayat perubahan/i)).toBeInTheDocument();
    expect(await screen.findByText("Sari Operator")).toBeInTheDocument();
    expect(screen.getByText("Ubah")).toBeInTheDocument();
    expect(screen.getByText(/sebelum: \{"phone":"0811111111"\}/i)).toBeInTheDocument();
    expect(screen.getByText(/sesudah: \{"phone":"0822222222"\}/i)).toBeInTheDocument();
  });
});

describe("EmployeeDetailPage per role (T034)", () => {
  it("lets Operation manage the record", async () => {
    await act(async () => {
      renderDetail([employeeMock, auditLogsMock, entraProvisionMock]);
    });

    expect(await screen.findByText("************1234")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ubah data/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tambah kontrak/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ya, nonaktifkan/i })).toBeInTheDocument();
  });

  it("is read-only for Admin, keeping only the audit history (TAN-343)", async () => {
    // Admin fokus RBAC + Master Data + Audit: record terlihat, riwayat
    // perubahan tetap ada, semua permukaan kelola hilang.
    auth.role = "ADMIN";
    await act(async () => {
      renderDetail([employeeMock, auditLogsMock, entraProvisionMock]);
    });

    expect(await screen.findByText("************1234")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /ubah data/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /tambah kontrak/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /ya, nonaktifkan/i })).toBeNull();
    expect(screen.getByText(/riwayat perubahan/i)).toBeInTheDocument();
  });

  it("is read-only for CHAPTER, which may still follow the contract link", async () => {
    // Chapter reads the contracts of its own chapter (2026-10-16 clarify 5), so
    // the record links through while every manage surface stays hidden.
    auth.role = "CHAPTER";
    await act(async () => {
      renderDetail([employeeMock]);
    });

    expect(await screen.findByText("************1234")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /ubah data/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /ya, nonaktifkan/i })).toBeNull();
    expect(screen.queryByText(/riwayat perubahan/i)).toBeNull();
    expect(screen.queryByText(/provisi akun entra/i)).toBeNull();
    expect(screen.getByRole("link", { name: "PKWT/2025/002" })).toBeInTheDocument();
  });

  it("is read-only for TALENT without the change history or contract link", async () => {
    auth.role = "TALENT";
    await act(async () => {
      renderDetail([employeeMock]);
    });

    expect(await screen.findByText("************1234")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /ubah data/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /ya, nonaktifkan/i })).toBeNull();
    expect(screen.queryByText(/riwayat perubahan/i)).toBeNull();
    expect(screen.queryByText(/provisi akun entra/i)).toBeNull();
    expect(screen.queryByRole("link", { name: "PKWT/2025/002" })).toBeNull();
  });
});

describe("EmployeeDetailPage — edit modal (TAN-357)", () => {
  const updatePhoneMock = {
    request: {
      query: UpdateEmployeeDocument,
      variables: {
        id: "emp-1",
        input: {
          fullName: "Andi Pratama",
          email: "andi@tania.id",
          birthDate: "1990-01-01",
          gender: "MALE",
          phone: "0822222222",
          address: "Jl. Satu",
          joinedAt: "2024-01-01",
          status: "ACTIVE",
        },
      },
    },
    result: {
      data: {
        updateEmployee: {
          __typename: "Employee",
          id: "emp-1",
          fullName: "Andi Pratama",
          nikMasked: "************1234",
          email: "andi@tania.id",
          birthDate: "1990-01-01",
          gender: "MALE",
          phone: "0822222222",
          address: "Jl. Satu",
          latestEducation: null,
          institutionName: null,
          major: null,
          joinedAt: "2024-01-01",
          status: "ACTIVE",
        },
      },
    },
  };

  it("opens the edit modal from the Ubah data button and refreshes the record after save", async () => {
    await act(async () => {
      renderDetail([employeeMock, auditLogsMock, entraProvisionMock, updatePhoneMock]);
    });

    expect(await screen.findByText("************1234")).toBeInTheDocument();
    expect(screen.getByText("0811111111")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /ubah data/i }));
    const dialog = await screen.findByRole("dialog", { name: /ubah data/i });
    expect(within(dialog).getByLabelText(/^telepon/i)).toHaveValue("0811111111");

    fireEvent.change(within(dialog).getByLabelText(/^telepon/i), {
      target: { value: "0822222222" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Simpan" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /perubahan data andi pratama berhasil disimpan/i,
    );
    expect(screen.queryByRole("dialog")).toBeNull();

    // Detail terbaca ulang dari entity cache hasil mutasi — data terbaru.
    expect(screen.getByText("0822222222")).toBeInTheDocument();
  });
});

describe("EmployeeDetailPage provisi akun Entra (TAN-272 U1)", () => {
  it("shows the recorded provisioning outcome with UPN and last error", async () => {
    await act(async () => {
      renderDetail([employeeMock, auditLogsMock, entraProvisionMock]);
    });

    expect(await screen.findByText("************1234")).toBeInTheDocument();
    const card = screen.getByText("Provisi akun Entra").closest("div") as HTMLElement;
    expect(await within(card).findByText("Gagal")).toBeInTheDocument();
    expect(within(card).getByText("CREATE")).toBeInTheDocument();
    expect(within(card).getByText(/graph unavailable/i)).toBeInTheDocument();
    expect(within(card).getByText(/diperbarui/i)).toBeInTheDocument();
    expect(within(card).getAllByText("-").length).toBeGreaterThan(0);
  });

  it("says the talent was never provisioned when no outcome is recorded", async () => {
    await act(async () => {
      renderDetail([employeeMock, auditLogsMock, noProvisionMock]);
    });

    expect(await screen.findByText("Belum pernah diprovisi.")).toBeInTheDocument();
  });

  it("marks a CREATED outcome as dibuat dengan email aktivasi (TAN-359)", async () => {
    await act(async () => {
      renderDetail([employeeMock, auditLogsMock, createdProvisionMock]);
    });

    expect(await screen.findByText("************1234")).toBeInTheDocument();
    const card = screen.getByText("Provisi akun Entra").closest("div") as HTMLElement;
    expect(await within(card).findByText("Akun dibuat")).toBeInTheDocument();
    expect(within(card).getByText("Email aktivasi terkirim")).toBeInTheDocument();
    expect(within(card).getByText("rina.kusuma@digitaltelkom.id")).toBeInTheDocument();
    expect(within(card).getByText(/wajib ganti password pada login pertama/i)).toBeInTheDocument();
  });
});
