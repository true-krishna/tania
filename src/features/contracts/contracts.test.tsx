// @vitest-environment jsdom

import * as React from "react";
import { describe, expect, it } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { GraphQLError } from "graphql";
import ContractsPage from "@/app/(app)/contracts/page";
import NewContractPage from "@/app/(app)/contracts/new/page";
import ContractDetailPage from "@/app/(app)/contracts/[id]/page";
import {
  AuditLogsDocument,
  CreateEmploymentContractDocument,
  EmployeesDocument,
  EmploymentContractDocument,
  EmploymentContractsDocument,
  JobRolesDocument,
  UnitsDocument,
} from "@/generated/graphql";

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
        { __typename: "JobRole", id: "jr-1", name: "Engineer", isActive: true, chapter: null },
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
  contractType: "PKWT",
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

async function renderNew(mocks: React.ComponentProps<typeof MockedProvider>["mocks"]) {
  await act(async () => {
    render(
      <React.Suspense fallback={null}>
        <MockedProvider mocks={mocks}>
          <NewContractPage searchParams={Promise.resolve({})} />
        </MockedProvider>
      </React.Suspense>
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
  const form = screen.getByRole("button", { name: /simpan/i }).closest("form");
  if (!form) throw new Error("form not found");
  fireEvent.submit(form);
}

describe("NewContractPage (form kontrak, T023)", () => {
  it("shows per-field required errors when submitting an empty form", async () => {
    await renderNew([unitsMock, jobRolesMock, employeesMock, createMock]);
    await screen.findByRole("heading", { name: /tambah kontrak/i });

    submitForm();

    expect(screen.getByText(/karyawan wajib dipilih/i)).toBeInTheDocument();
    expect(screen.getByText(/nomor kontrak wajib diisi/i)).toBeInTheDocument();
    expect(screen.getByText(/nomor induk wajib diisi/i)).toBeInTheDocument();
    expect(screen.getByText(/job role wajib dipilih/i)).toBeInTheDocument();
    expect(screen.getByText(/work location wajib dipilih/i)).toBeInTheDocument();
    expect(screen.getByText(/unit wajib dipilih/i)).toBeInTheDocument();
    expect(screen.getByText(/tanggal mulai wajib diisi/i)).toBeInTheDocument();
  });

  it("requires an end date for PKWT", async () => {
    await renderNew([unitsMock, jobRolesMock, employeesMock, createMock]);
    await screen.findByRole("heading", { name: /tambah kontrak/i });

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

    expect(screen.getByText(/tanggal selesai wajib untuk kontrak berbatas waktu/i)).toBeInTheDocument();
  });

  it("offers the TMS contract types and treats KARYAWAN TETAP as open-ended", async () => {
    await renderNew([unitsMock, jobRolesMock, employeesMock]);
    await screen.findByRole("heading", { name: /tambah kontrak/i });

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
    await renderNew([unitsMock, jobRolesMock, employeesMock, createMock]);
    await screen.findByRole("heading", { name: /tambah kontrak/i });

    fillValidForm();
    submitForm();

    expect(await screen.findByText(/kontrak pkwt\/2026\/001 berhasil dibuat/i)).toBeInTheDocument();
  });

  it("rejects a duplicate nomor induk with a clear message", async () => {
    const mocks = [
      unitsMock,
      jobRolesMock,
      employeesMock,
      {
        request: { query: CreateEmploymentContractDocument, variables: { input: validInput } },
        result: {
          errors: [new GraphQLError("resource already exists", { extensions: { code: "CONFLICT" } })],
        },
      },
    ];
    await renderNew(mocks);
    await screen.findByRole("heading", { name: /tambah kontrak/i });

    fillValidForm();
    submitForm();

    expect(
      await screen.findByText(/nomor kontrak atau nomor induk sudah dipakai/i)
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
    await renderNew(mocks);
    await screen.findByRole("heading", { name: /tambah kontrak/i });

    fillValidForm();
    submitForm();

    expect(
      await screen.findByText(/overlaps an existing contract period/i)
    ).toBeInTheDocument();
  });
});

const contractListNode = {
  __typename: "EmploymentContract",
  id: "ctr-1",
  contractNo: "PKWT/2025/002",
  contractType: "PKWT",
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
  request: { query: EmploymentContractsDocument, variables: { filter: {}, first: 25, after: null } },
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
        <ContractsPage />
      </MockedProvider>
    );

    expect(await screen.findByText("PKWT/2025/002")).toBeInTheDocument();
    expect(screen.getByText("Andi Pratama")).toBeInTheDocument();
    expect(screen.getByText("EMP-77")).toBeInTheDocument();
    expect(screen.getByText("Engineer")).toBeInTheDocument();
    expect(screen.getAllByText("Aktif").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/2025-07-01/)).toBeInTheDocument();
  });
});

const contractDetailNode = {
  __typename: "EmploymentContract",
  id: "ctr-1",
  contractNo: "PKWT/2025/002",
  contractType: "PKWT",
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
  jobRole: { __typename: "JobRole", id: "jr-1", name: "Engineer" },
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
        </React.Suspense>
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
});
