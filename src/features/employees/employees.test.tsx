// @vitest-environment jsdom

import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { GraphQLError } from "graphql";
import EditEmployeePage from "@/app/(app)/employees/[id]/edit/page";
import EmployeeDetailPage from "@/app/(app)/employees/[id]/page";
import {
  AuditLogsDocument,
  EmployeeDocument,
  UpdateEmployeeDocument,
} from "@/generated/graphql";

const auth = vi.hoisted(() => ({ role: "OPERATION" as string | null }));

vi.mock("@/lib/auth/guard", () => ({
  useSessionRole: () => auth.role,
  AuthGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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
          jobRole: { __typename: "JobRole", id: "jr-1", name: "Engineer" },
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
          jobRole: { __typename: "JobRole", id: "jr-2", name: "Analyst" },
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

const updateInputBase = {
  fullName: "Andi Pratama",
  email: "andi@tania.id",
  birthDate: "1990-01-01",
  gender: "MALE",
  phone: "0811111111",
  address: "Jl. Satu",
  joinedAt: "2024-01-01",
  status: "ACTIVE",
};

const updateResult = {
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

async function renderEdit(mocks: React.ComponentProps<typeof MockedProvider>["mocks"]) {
  await act(async () => {
    render(
      <React.Suspense fallback={null}>
        <MockedProvider mocks={mocks}>
          <EditEmployeePage params={Promise.resolve({ id: "emp-1" })} />
        </MockedProvider>
      </React.Suspense>
    );
  });
}

function renderDetail(mocks: React.ComponentProps<typeof MockedProvider>["mocks"]) {
  return render(
    <React.Suspense fallback={null}>
      <MockedProvider mocks={mocks}>
        <EmployeeDetailPage params={Promise.resolve({ id: "emp-1" })} />
      </MockedProvider>
    </React.Suspense>
  );
}

function submitForm() {
  const form = screen.getByRole("button", { name: /simpan/i }).closest("form");
  if (!form) throw new Error("form not found");
  fireEvent.submit(form);
}

describe("EditEmployeePage (form ubah data diri, T020)", () => {
  it("shows the current NIK masked and never the full value", async () => {
    await renderEdit([employeeMock]);
    expect(await screen.findByText("************1234")).toBeInTheDocument();
    expect(screen.queryByText(/3273012345678901/)).not.toBeInTheDocument();
  });

  it("rejects a re-entered NIK that is not 16 digits", async () => {
    await renderEdit([employeeMock]);
    await screen.findByText("************1234");

    fireEvent.change(screen.getByLabelText(/nik baru/i), { target: { value: "123" } });
    submitForm();

    expect(screen.getByText(/nik harus terdiri dari 16 digit angka/i)).toBeInTheDocument();
  });

  it("sends the update without NIK when the NIK field is left empty", async () => {
    const mocks = [
      employeeMock,
      {
        request: {
          query: UpdateEmployeeDocument,
          variables: { id: "emp-1", input: { ...updateInputBase, phone: "0822222222" } },
        },
        result: updateResult,
      },
    ];
    await renderEdit(mocks);
    await screen.findByText("************1234");

    fireEvent.change(screen.getByLabelText(/telepon/i), {
      target: { value: "0822222222" },
    });
    submitForm();

    expect(await screen.findByText(/perubahan data andi pratama berhasil disimpan/i)).toBeInTheDocument();
  });

  it("sends the re-entered NIK and maps a duplicate to a clear message", async () => {
    const input = {
      ...updateInputBase,
      phone: "0822222222",
      nik: "3273012345678901",
    };
    const mocks = [
      employeeMock,
      {
        request: { query: UpdateEmployeeDocument, variables: { id: "emp-1", input } },
        result: {
          errors: [new GraphQLError("resource already exists", { extensions: { code: "CONFLICT" } })],
        },
      },
    ];
    await renderEdit(mocks);
    await screen.findByText("************1234");

    fireEvent.change(screen.getByLabelText(/nik baru/i), {
      target: { value: "3273012345678901" },
    });
    fireEvent.change(screen.getByLabelText(/telepon/i), {
      target: { value: "0822222222" },
    });
    submitForm();

    expect(
      await screen.findByText(/email atau nik sudah terdaftar/i)
    ).toBeInTheDocument();
  });

  it("shows required-field errors when mandatory values are cleared", async () => {
    await renderEdit([employeeMock]);
    await screen.findByText("************1234");

    fireEvent.change(screen.getByLabelText(/nama lengkap/i), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText(/telepon/i), { target: { value: "" } });
    submitForm();

    expect(screen.getByText(/nama lengkap wajib diisi/i)).toBeInTheDocument();
    expect(screen.getByText(/telepon wajib diisi/i)).toBeInTheDocument();
  });
});

describe("EmployeeDetailPage (riwayat kontrak + riwayat perubahan, T022)", () => {
  it("shows data diri with NIK masked and the full TMS attributes of every contract", async () => {
    await act(async () => {
      renderDetail([employeeMock, auditLogsMock]);
    });

    expect(await screen.findByRole("heading", { name: /detail karyawan|andi pratama/i })).toBeInTheDocument();
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
      renderDetail([employeeMock, auditLogsMock]);
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
      renderDetail([employeeMock, auditLogsMock]);
    });

    expect(await screen.findByText("************1234")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ubah data/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tambah kontrak/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ya, nonaktifkan/i })).toBeInTheDocument();
  });

  it("lets Admin manage the record (TAN-212 clarify 4)", async () => {
    auth.role = "ADMIN";
    await act(async () => {
      renderDetail([employeeMock, auditLogsMock]);
    });

    expect(await screen.findByText("************1234")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ubah data/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tambah kontrak/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ya, nonaktifkan/i })).toBeInTheDocument();
  });

  for (const role of ["CHAPTER", "TALENT"] as const) {
    it(`is read-only for ${role} without the change history`, async () => {
      auth.role = role;
      await act(async () => {
        renderDetail([employeeMock]);
      });

      expect(await screen.findByText("************1234")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /ubah data/i })).toBeNull();
      expect(screen.queryByRole("button", { name: /ya, nonaktifkan/i })).toBeNull();
      expect(screen.queryByText(/riwayat perubahan/i)).toBeNull();
      expect(screen.queryByRole("link", { name: "PKWT/2025/002" })).toBeNull();
    });
  }
});
