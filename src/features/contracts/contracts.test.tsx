// @vitest-environment jsdom

import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { GraphQLError } from "graphql";
import type * as AuthGuard from "@/lib/auth/guard";
import ContractsPage from "@/app/(app)/contracts/page";
import ContractDetailPage from "@/app/(app)/contracts/[id]/page";
import { CreateContractModal } from "@/features/contracts/CreateContractModal";
import { RenewContractModal } from "@/features/contracts/RenewContractModal";
import { ToastProvider } from "@/components/Toast";
import {
  AuditLogsDocument,
  CreateEmploymentContractDocument,
  EmployeesDocument,
  EmploymentContractDocument,
  EmploymentContractsDocument,
  JobRolesDocument,
  RenewEmploymentContractDocument,
  UnitsDocument,
} from "@/generated/graphql";
import { workLocationFormValue } from "@/features/contracts/labels";

const nav = vi.hoisted(() => ({ push: vi.fn() }));
const auth = vi.hoisted(() => ({
  role: "OPERATION" as "ADMIN" | "OPERATION" | "CHAPTER" | "TALENT",
}));

vi.mock("next/navigation", () => ({
  useRouter: () => nav,
  notFound: () => {
    throw new Error("notFound");
  },
  redirect: () => {
    throw new Error("redirect");
  },
}));

// Role comes from the session store in the app; here it is drove directly so the
// Operation (manage) and Chapter (read-only) surfaces can both be exercised.
vi.mock("@/lib/auth/guard", async (importOriginal) => {
  const actual = await importOriginal<typeof AuthGuard>();
  return { ...actual, useSessionRole: () => auth.role };
});

const unitsMock = {
  request: { query: UnitsDocument, variables: { includeInactive: true } },
  result: {
    data: {
      units: [{ __typename: "Unit", id: "u-1", name: "Digital", isActive: true, projects: [] }],
    },
  },
};

const jobRolesMock = {
  request: { query: JobRolesDocument, variables: { includeInactive: true } },
  result: {
    data: {
      jobRoles: [
        {
          __typename: "JobRole",
          id: "jr-1",
          name: "Engineer",
          isActive: true,
          chapter: { __typename: "Chapter", id: "ch-1", name: "Platform" },
        },
      ],
    },
  },
};

const employeesMock = {
  request: { query: EmployeesDocument, variables: { filter: {}, first: 100, after: null } },
  result: {
    data: {
      employees: {
        __typename: "EmployeeConnection",
        totalCount: 1,
        edges: [
          {
            __typename: "EmployeeEdge",
            cursor: "emp-1",
            node: {
              __typename: "Employee",
              id: "emp-1",
              fullName: "Andi Pratama",
              nikMasked: "************1234",
              email: "andi@tania.id",
              status: "ACTIVE",
              assignable: true,
              nomorInduk: "EMP-11",
              unit: { __typename: "Unit", id: "u-1", name: "Digital" },
              jobRole: { __typename: "JobRole", id: "jr-1", name: "Engineer" },
            },
          },
        ],
        pageInfo: { __typename: "PageInfo", hasNextPage: false, endCursor: null },
      },
    },
  },
};

const validInput = {
  employeeId: "emp-1",
  contractNo: "PKWT/2026/001",
  contractType: "TKWT_DIGITAL_TALENT",
  nomorInduk: "EMP-100",
  bandPosition: "UNDEFINED",
  jobRoleId: "jr-1",
  workLocation: "JAKARTA",
  unitId: "u-1",
  startDate: "2026-01-01",
  endDate: "2026-12-31",
};

const createMock = {
  request: { query: CreateEmploymentContractDocument, variables: { input: validInput } },
  result: {
    data: {
      createEmploymentContract: {
        __typename: "EmploymentContract",
        id: "ctr-9",
        contractNo: "PKWT/2026/001",
        status: "ACTIVE",
        nomorInduk: "EMP-100",
      },
    },
  },
};

async function renderCreateModal(mocks: React.ComponentProps<typeof MockedProvider>["mocks"]) {
  await act(async () => {
    render(
      <React.Suspense fallback={null}>
        <MockedProvider mocks={mocks}>
          <ToastProvider>
            <CreateContractModal onClose={() => {}} open={true} />
          </ToastProvider>
        </MockedProvider>
      </React.Suspense>,
    );
  });
}

function fillValidForm() {
  fireEvent.change(screen.getByRole("combobox", { name: /karyawan/i }), {
    target: { value: "emp-1" },
  });
  fireEvent.change(screen.getByLabelText(/no\. kontrak/i), {
    target: { value: validInput.contractNo },
  });
  fireEvent.change(screen.getByRole("combobox", { name: /jenis kontrak/i }), {
    target: { value: validInput.contractType },
  });
  fireEvent.change(screen.getByLabelText(/nomor induk karyawan/i), {
    target: { value: validInput.nomorInduk },
  });
  fireEvent.change(screen.getByRole("combobox", { name: /^unit/i }), {
    target: { value: "u-1" },
  });
  fireEvent.change(screen.getByRole("combobox", { name: /posisi/i }), {
    target: { value: "jr-1" },
  });
  fireEvent.change(screen.getByRole("combobox", { name: /work location/i }), {
    target: { value: "JAKARTA" },
  });
  fireEvent.change(screen.getByLabelText(/tanggal mulai/i), {
    target: { value: validInput.startDate },
  });
  fireEvent.change(screen.getByLabelText(/tanggal selesai/i), {
    target: { value: validInput.endDate },
  });
}

function submitForm() {
  const form = screen.getByRole("dialog").querySelector("form");
  if (!form) throw new Error("form not found");
  fireEvent.submit(form);
}

describe("CreateContractModal (form tambah kontrak, T023)", () => {
  it("shows per-field required errors when submitting an empty form", async () => {
    await renderCreateModal([unitsMock, jobRolesMock, employeesMock, createMock]);
    expect(await screen.findByRole("dialog", { name: /tambah kontrak/i })).toBeInTheDocument();

    submitForm();

    expect(screen.getByText(/karyawan wajib dipilih/i)).toBeInTheDocument();
    expect(screen.getByText(/nomor kontrak wajib diisi/i)).toBeInTheDocument();
    expect(screen.getByText(/nomor induk wajib diisi/i)).toBeInTheDocument();
    expect(screen.getByText(/job role wajib dipilih/i)).toBeInTheDocument();
    expect(screen.getByText(/work location wajib dipilih/i)).toBeInTheDocument();
    expect(screen.getByText(/unit wajib dipilih/i)).toBeInTheDocument();
    expect(screen.getByText(/tanggal mulai wajib diisi/i)).toBeInTheDocument();
  });

  it("requires an end date for a time-bound type", async () => {
    await renderCreateModal([unitsMock, jobRolesMock, employeesMock, createMock]);
    expect(await screen.findByRole("dialog", { name: /tambah kontrak/i })).toBeInTheDocument();

    fireEvent.change(screen.getByRole("combobox", { name: /karyawan/i }), {
      target: { value: "emp-1" },
    });
    fireEvent.change(screen.getByLabelText(/no\. kontrak/i), {
      target: { value: validInput.contractNo },
    });
    fireEvent.change(screen.getByLabelText(/nomor induk karyawan/i), {
      target: { value: validInput.nomorInduk },
    });
    fireEvent.change(screen.getByRole("combobox", { name: /^unit/i }), {
      target: { value: "u-1" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: /posisi/i }), {
      target: { value: "jr-1" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: /work location/i }), {
      target: { value: "JAKARTA" },
    });
    fireEvent.change(screen.getByLabelText(/tanggal mulai/i), {
      target: { value: validInput.startDate },
    });
    submitForm();

    expect(
      screen.getByText(/tanggal selesai wajib untuk kontrak berbatas waktu/i),
    ).toBeInTheDocument();
  });

  it("offers the TMS contract types and treats KARYAWAN TETAP as open-ended", async () => {
    await renderCreateModal([unitsMock, jobRolesMock, employeesMock]);
    expect(await screen.findByRole("dialog", { name: /tambah kontrak/i })).toBeInTheDocument();

    for (const label of [
      "TPPBW PROHIRE",
      "EMPLOYEE MOBILIT",
      "PROJECT BASED PROCUREMENT",
      "OUTSOURCE TKP",
      "KARYAWAN TETAP",
      "TKWT DIGITAL TALENT",
    ]) {
      expect(screen.getByRole("option", { name: label })).toBeInTheDocument();
    }

    expect(screen.getByLabelText(/tanggal selesai/i)).toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox", { name: /jenis kontrak/i }), {
      target: { value: "KARYAWAN_TETAP" },
    });
    expect(screen.queryByLabelText(/tanggal selesai/i)).not.toBeInTheDocument();
  });

  it("creates the contract with the TMS input", async () => {
    await renderCreateModal([unitsMock, jobRolesMock, employeesMock, createMock]);
    expect(await screen.findByRole("dialog", { name: /tambah kontrak/i })).toBeInTheDocument();

    fillValidForm();
    submitForm();

    expect(await screen.findByRole("alert")).toHaveTextContent(/berhasil dibuat/i);
  });

  it("menampilkan chapter dari job role terpilih (TAN-328)", async () => {
    await renderCreateModal([unitsMock, jobRolesMock, employeesMock]);
    expect(await screen.findByRole("dialog", { name: /tambah kontrak/i })).toBeInTheDocument();

    fireEvent.change(screen.getByRole("combobox", { name: /posisi/i }), {
      target: { value: "jr-1" },
    });

    expect(await screen.findByText(/chapter:\s*platform/i)).toBeInTheDocument();
  });

  it("rejects a duplicate nomor induk with a clear message", async () => {
    const mocks = [
      unitsMock,
      jobRolesMock,
      employeesMock,
      {
        request: { query: CreateEmploymentContractDocument, variables: { input: validInput } },
        result: {
          errors: [
            new GraphQLError("resource already exists", { extensions: { code: "CONFLICT" } }),
          ],
        },
      },
    ];
    await renderCreateModal(mocks);
    expect(await screen.findByRole("dialog", { name: /tambah kontrak/i })).toBeInTheDocument();

    fillValidForm();
    submitForm();

    expect(
      await screen.findByText(/nomor kontrak atau nomor induk sudah dipakai/i),
    ).toBeInTheDocument();
  });

  it("maps a server overlap rejection to the start-date field", async () => {
    const mocks = [
      unitsMock,
      jobRolesMock,
      employeesMock,
      {
        request: { query: CreateEmploymentContractDocument, variables: { input: validInput } },
        result: {
          errors: [
            new GraphQLError("invalid startDate: overlaps an existing contract period", {
              extensions: { code: "BAD_USER_INPUT", field: "startDate" },
            }),
          ],
        },
      },
    ];
    await renderCreateModal(mocks);
    expect(await screen.findByRole("dialog", { name: /tambah kontrak/i })).toBeInTheDocument();

    fillValidForm();
    submitForm();

    expect(await screen.findByText(/overlaps an existing contract period/i)).toBeInTheDocument();
  });
});

const renewDetailMock = {
  request: { query: EmploymentContractDocument, variables: { id: "ctr-1" } },
  result: {
    data: {
      employmentContract: {
        __typename: "EmploymentContract",
        id: "ctr-1",
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
        notes: "",
        employee: { __typename: "Employee", id: "emp-1", fullName: "Andi Pratama" },
        unit: { __typename: "Unit", id: "u-1", name: "Digital" },
        jobRole: { __typename: "JobRole", id: "jr-1", name: "Engineer" },
      },
    },
  },
};

const validRenewInput = {
  predecessorContractId: "ctr-1",
  contractNo: "PKWT/2026/003",
  contractType: "TKWT_DIGITAL_TALENT",
  nomorInduk: "EMP-77",
  bandPosition: "II",
  jobRoleId: "jr-1",
  workLocation: "JAKARTA",
  unitId: "u-1",
  startDate: "2026-07-01",
  endDate: "2027-06-30",
  officeEmail: "andi@corp.id",
  jobTitle: "Backend Engineer",
  jobLevel: "Junior",
};

const renewMock = {
  request: { query: RenewEmploymentContractDocument, variables: { input: validRenewInput } },
  result: {
    data: {
      renewEmploymentContract: {
        __typename: "EmploymentContract",
        id: "ctr-2",
        contractNo: "PKWT/2026/003",
        status: "ACTIVE",
        startDate: "2026-07-01",
      },
    },
  },
};

async function renderRenewModal(mocks: React.ComponentProps<typeof MockedProvider>["mocks"]) {
  await act(async () => {
    render(
      <React.Suspense fallback={null}>
        <MockedProvider mocks={mocks}>
          <ToastProvider>
            <RenewContractModal contractId="ctr-1" onClose={() => {}} open={true} />
          </ToastProvider>
        </MockedProvider>
      </React.Suspense>,
    );
  });
}

describe("RenewContractModal (form perpanjangan kontrak, T023)", () => {
  it("pre-fills attributes from the predecessor contract", async () => {
    await renderRenewModal([renewDetailMock, unitsMock, jobRolesMock, renewMock]);
    expect(await screen.findByRole("dialog", { name: /perpanjang kontrak/i })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/no\. kontrak baru/i), {
      target: { value: validRenewInput.contractNo },
    });
    fireEvent.change(screen.getByLabelText(/tanggal mulai/i), {
      target: { value: validRenewInput.startDate },
    });
    fireEvent.change(screen.getByLabelText(/tanggal selesai/i), {
      target: { value: validRenewInput.endDate },
    });
    fireEvent.click(screen.getByRole("button", { name: /lanjut/i }));

    expect(await screen.findByLabelText(/nomor induk karyawan/i)).toHaveValue("EMP-77");
    expect(screen.getByLabelText(/email kantor/i)).toHaveValue("andi@corp.id");
  });

  it("membuat kontrak perpanjangan dengan data yang valid", async () => {
    await renderRenewModal([renewDetailMock, unitsMock, jobRolesMock, renewMock]);
    expect(await screen.findByRole("dialog", { name: /perpanjang kontrak/i })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/no\. kontrak baru/i), {
      target: { value: validRenewInput.contractNo },
    });
    fireEvent.change(screen.getByLabelText(/tanggal mulai/i), {
      target: { value: validRenewInput.startDate },
    });
    fireEvent.change(screen.getByLabelText(/tanggal selesai/i), {
      target: { value: validRenewInput.endDate },
    });

    fireEvent.click(screen.getByRole("button", { name: /lanjut/i }));
    fireEvent.click(screen.getByRole("button", { name: /simpan perpanjangan/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/berhasil dibuat/i);
  });

  it("menampilkan chapter dari job role terpilih (TAN-328)", async () => {
    await renderRenewModal([renewDetailMock, unitsMock, jobRolesMock, renewMock]);
    expect(await screen.findByRole("dialog", { name: /perpanjang kontrak/i })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/no\. kontrak baru/i), {
      target: { value: validRenewInput.contractNo },
    });
    fireEvent.change(screen.getByLabelText(/tanggal mulai/i), {
      target: { value: validRenewInput.startDate },
    });
    fireEvent.change(screen.getByLabelText(/tanggal selesai/i), {
      target: { value: validRenewInput.endDate },
    });
    fireEvent.click(screen.getByRole("button", { name: /lanjut/i }));

    expect(await screen.findByText(/chapter:\s*platform/i)).toBeInTheDocument();
  });
});

const contractListNode = {
  __typename: "EmploymentContract",
  id: "ctr-1",
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
  employee: { __typename: "Employee", id: "emp-1", fullName: "Andi Pratama" },
  unit: { __typename: "Unit", id: "u-1", name: "Digital" },
  jobRole: { __typename: "JobRole", id: "jr-1", name: "Engineer" },
};

const listMock = {
  request: {
    query: EmploymentContractsDocument,
    variables: { filter: {}, first: 25, after: null },
  },
  result: {
    data: {
      employmentContracts: {
        __typename: "EmploymentContractConnection",
        totalCount: 1,
        edges: [{ __typename: "EmploymentContractEdge", cursor: "ctr-1", node: contractListNode }],
        pageInfo: { __typename: "PageInfo", hasNextPage: false, endCursor: null },
      },
    },
  },
};

describe("ContractsPage (daftar kontrak, T023)", () => {
  it("renders the contract rows with TMS attributes", async () => {
    render(
      <MockedProvider mocks={[listMock]}>
        <ToastProvider>
          <ContractsPage />
        </ToastProvider>
      </MockedProvider>,
    );

    expect(await screen.findByText("PKWT/2025/002")).toBeInTheDocument();
    expect(screen.getByText("Andi Pratama")).toBeInTheDocument();
    expect(screen.getByText("EMP-77")).toBeInTheDocument();
    expect(screen.getByText("Engineer")).toBeInTheDocument();
    expect(screen.getAllByText("Aktif").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/2025-07-01/)).toBeInTheDocument();
  });

  it("menyembunyikan tombol tambah bagi Chapter dan menampilkannya bagi Operation", async () => {
    auth.role = "CHAPTER";
    const chapter = render(
      <MockedProvider mocks={[listMock]}>
        <ToastProvider>
          <ContractsPage />
        </ToastProvider>
      </MockedProvider>,
    );
    expect(await screen.findByText("PKWT/2025/002")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "+ Tambah Kontrak" })).toBeNull();
    expect(screen.getByText(/hanya baca/i)).toBeInTheDocument();
    chapter.unmount();

    auth.role = "OPERATION";
    try {
      render(
        <MockedProvider mocks={[listMock]}>
          <ToastProvider>
            <ContractsPage />
          </ToastProvider>
        </MockedProvider>,
      );
      expect(await screen.findByRole("button", { name: "+ Tambah Kontrak" })).toBeInTheDocument();
    } finally {
      auth.role = "OPERATION";
    }
  });

  it("membuka modal tambah saat tombol Tambah Kontrak diklik", async () => {
    render(
      <MockedProvider mocks={[listMock, unitsMock, jobRolesMock, employeesMock]}>
        <ToastProvider>
          <ContractsPage />
        </ToastProvider>
      </MockedProvider>,
    );

    expect(await screen.findByText("PKWT/2025/002")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: /tambah kontrak/i })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "+ Tambah Kontrak" }));

    expect(await screen.findByRole("dialog", { name: /tambah kontrak/i })).toBeInTheDocument();
  });

  it("membuka modal perpanjang dari aksi baris", async () => {
    render(
      <MockedProvider mocks={[listMock, renewDetailMock, unitsMock, jobRolesMock]}>
        <ToastProvider>
          <ContractsPage />
        </ToastProvider>
      </MockedProvider>,
    );

    expect(await screen.findByText("PKWT/2025/002")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: /perpanjang kontrak/i })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /aksi pkwt\/2025\/002/i }));
    fireEvent.click(screen.getByRole("button", { name: /perpanjang/i }));

    expect(await screen.findByRole("dialog", { name: /perpanjang kontrak/i })).toBeInTheDocument();
  });

  it("filters by jenis via the collapsible filter panel", async () => {
    const filteredMock = {
      request: {
        query: EmploymentContractsDocument,
        variables: { filter: { contractType: "KARYAWAN_TETAP" }, first: 25, after: null },
      },
      result: {
        data: {
          employmentContracts: {
            __typename: "EmploymentContractConnection",
            totalCount: 0,
            edges: [],
            pageInfo: { __typename: "PageInfo", hasNextPage: false, endCursor: null },
          },
        },
      },
    };
    render(
      <MockedProvider mocks={[listMock, filteredMock]}>
        <ToastProvider>
          <ContractsPage />
        </ToastProvider>
      </MockedProvider>,
    );

    await screen.findByText("PKWT/2025/002");

    fireEvent.click(screen.getByRole("button", { name: "Filter" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Jenis" }), {
      target: { value: "KARYAWAN_TETAP" },
    });

    expect(screen.getByRole("button", { name: "Filter, 1 filter aktif" })).toBeInTheDocument();
    expect(await screen.findByText(/tidak ada kontrak yang cocok/i)).toBeInTheDocument();
  });
});

const contractDetailNode = {
  __typename: "EmploymentContract",
  id: "ctr-1",
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
  notes: "Perpanjangan",
  employee: {
    __typename: "Employee",
    id: "emp-1",
    fullName: "Andi Pratama",
    nikMasked: "************1234",
    email: "andi@tania.id",
  },
  unit: { __typename: "Unit", id: "u-1", name: "Digital" },
  jobRole: {
    __typename: "JobRole",
    id: "jr-1",
    name: "Engineer",
    chapter: { __typename: "Chapter", id: "ch-1", name: "Platform" },
  },
  predecessor: { __typename: "EmploymentContract", id: "ctr-0", contractNo: "PKWT/2024/001" },
  createdBy: { __typename: "User", id: "u-1", fullName: "Sari Operator" },
  createdAt: "2025-06-20T09:00:00Z",
  updatedAt: "2025-06-20T09:00:00Z",
};

const detailMock = {
  request: { query: EmploymentContractDocument, variables: { id: "ctr-1" } },
  result: { data: { employmentContract: contractDetailNode } },
};

const contractAuditMock = {
  request: {
    query: AuditLogsDocument,
    variables: {
      filter: { entityType: "employment_contract", entityId: "ctr-1" },
      first: 25,
      after: null,
    },
  },
  result: {
    data: {
      auditLogs: {
        __typename: "AuditLogConnection",
        totalCount: 1,
        edges: [
          {
            __typename: "AuditLogEdge",
            cursor: "log-1",
            node: {
              __typename: "AuditLog",
              id: "log-1",
              occurredAt: "2026-10-08T10:00:00Z",
              action: "RENEW",
              actor: { __typename: "User", id: "u-1", fullName: "Sari Operator" },
              actorRole: "OPERATION",
              entityType: "employment_contract",
              entityId: "ctr-1",
              before: '{"contractNo":"PKWT/2024/001"}',
              after: '{"contractNo":"PKWT/2025/002"}',
              ip: null,
              userAgent: null,
              requestId: null,
            },
          },
        ],
        pageInfo: { __typename: "PageInfo", hasNextPage: false, endCursor: null },
      },
    },
  },
};

describe("ContractDetailPage (detail kontrak + riwayat, T023)", () => {
  it("shows the TMS attributes and the per-record change history", async () => {
    await act(async () => {
      render(
        <React.Suspense fallback={null}>
          <MockedProvider mocks={[detailMock, contractAuditMock]}>
            <ContractDetailPage params={Promise.resolve({ id: "ctr-1" })} />
          </MockedProvider>
        </React.Suspense>,
      );
    });

    expect(await screen.findByRole("heading", { name: /pkwt\/2025\/002/i })).toBeInTheDocument();
    expect(screen.getByText("EMP-77")).toBeInTheDocument();
    expect(screen.getByText("andi@corp.id")).toBeInTheDocument();
    expect(screen.getAllByText("Backend Engineer").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Perpanjangan")).toBeInTheDocument();
    expect(screen.getByText("PKWT/2024/001")).toBeInTheDocument();
    expect(screen.getByText("************1234")).toBeInTheDocument();

    expect(await screen.findByText("Perpanjang")).toBeInTheDocument();
    expect(screen.getByText("Sari Operator")).toBeInTheDocument();
    expect(screen.getByText(/sebelum: \{"contractNo":"PKWT\/2024\/001"\}/i)).toBeInTheDocument();
  });

  it("menampilkan section kontrak dan chapter dari job role (TAN-328)", async () => {
    await act(async () => {
      render(
        <React.Suspense fallback={null}>
          <MockedProvider mocks={[detailMock, contractAuditMock]}>
            <ContractDetailPage params={Promise.resolve({ id: "ctr-1" })} />
          </MockedProvider>
        </React.Suspense>,
      );
    });

    expect(await screen.findByRole("heading", { name: /pkwt\/2025\/002/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Identitas kontrak" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Posisi & unit" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Periode & status" })).toBeInTheDocument();
    expect(screen.getByText("Platform")).toBeInTheDocument();
    expect(screen.queryByText("Tanpa chapter")).toBeNull();
  });

  // 2026-10-16 clarify 5: Chapter reads the contracts of its own chapter.
  it("menyembunyikan seluruh aksi tulis bagi Chapter", async () => {
    auth.role = "CHAPTER";
    try {
      await act(async () => {
        render(
          <React.Suspense fallback={null}>
            <MockedProvider mocks={[detailMock, contractAuditMock]}>
              <ContractDetailPage params={Promise.resolve({ id: "ctr-1" })} />
            </MockedProvider>
          </React.Suspense>,
        );
      });

      expect(await screen.findByRole("heading", { name: /pkwt\/2025\/002/i })).toBeInTheDocument();
      expect(screen.getByText("EMP-77")).toBeInTheDocument();
      expect(screen.queryByText("Perpanjang kontrak")).toBeNull();
      expect(screen.queryByRole("button", { name: "Perpanjang" })).toBeNull();
      expect(screen.queryByRole("heading", { name: "Ubah data kontrak" })).toBeNull();
      // Per-record history stays Operation/Admin only (FR-41).
      expect(screen.queryByRole("heading", { name: "Riwayat perubahan" })).toBeNull();
    } finally {
      auth.role = "OPERATION";
    }
  });
});

describe("Lokasi kerja belum tercatat (legacy, FR-33 phase 1)", () => {
  // A contract whose work_location was never recorded reads back as the
  // UNDEFINED sentinel. The label map and the vendored SDL enum have to agree,
  // otherwise the cell renders blank while TypeScript sees nothing wrong.
  const legacyDetailMock = {
    request: { query: EmploymentContractDocument, variables: { id: "ctr-legacy" } },
    result: {
      data: {
        employmentContract: { ...contractDetailNode, id: "ctr-legacy", workLocation: "UNDEFINED" },
      },
    },
  };
  const legacyAuditMock = {
    request: {
      query: AuditLogsDocument,
      variables: {
        filter: { entityType: "employment_contract", entityId: "ctr-legacy" },
        first: 25,
        after: null,
      },
    },
    result: {
      data: {
        auditLogs: {
          __typename: "AuditLogConnection",
          totalCount: 0,
          edges: [],
          pageInfo: { __typename: "PageInfo", hasNextPage: false, endCursor: null },
        },
      },
    },
  };

  it("menampilkan label sentinel, bukan sel kosong", async () => {
    await act(async () => {
      render(
        <React.Suspense fallback={null}>
          <MockedProvider mocks={[legacyDetailMock, legacyAuditMock]}>
            <ContractDetailPage params={Promise.resolve({ id: "ctr-legacy" })} />
          </MockedProvider>
        </React.Suspense>,
      );
    });

    const cell = (await screen.findByText("Work Location")).nextElementSibling;
    expect(cell).toHaveTextContent("Belum ditetapkan");
  });

  it("form memperlakukan sentinel sebagai 'belum dipilih', bukan sebagai lokasi", () => {
    expect(workLocationFormValue("UNDEFINED")).toBe("");
    expect(workLocationFormValue("BANDUNG")).toBe("BANDUNG");
  });
});
