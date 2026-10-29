// @vitest-environment jsdom

import * as React from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { GraphQLError } from "graphql";
import { EmployeeFormModal } from "./EmployeeFormModal";
import { ToastProvider } from "@/components/Toast";
import {
  CreateEmployeeDocument,
  EmployeeDocument,
  EmployeesDocument,
  UpdateEmployeeDocument,
} from "@/generated/graphql";

const createValidInput = {
  nik: "3273012345678901",
  fullName: "Ahmad Fauzi",
  email: "ahmad@tania.co.id",
  birthDate: "1990-05-01",
  gender: "MALE",
  phone: "081234567890",
  address: "Jl. Merdeka 1",
  joinedAt: "2025-01-01",
};

const createMock = {
  request: {
    query: CreateEmployeeDocument,
    variables: { input: createValidInput },
  },
  result: {
    data: {
      createEmployee: {
        __typename: "Employee",
        id: "emp-100",
        fullName: "Ahmad Fauzi",
        nikMasked: "************8901",
        email: "ahmad@tania.co.id",
        status: "ACTIVE",
      },
    },
  },
};

const createConflictMock = {
  request: {
    query: CreateEmployeeDocument,
    variables: { input: createValidInput },
  },
  result: {
    errors: [new GraphQLError("resource already exists", { extensions: { code: "CONFLICT" } })],
  },
};

const employeesMock = {
  request: { query: EmployeesDocument, variables: { filter: {}, first: 25, after: null } },
  result: {
    data: {
      employees: {
        __typename: "EmployeeConnection",
        totalCount: 0,
        edges: [],
        pageInfo: { __typename: "PageInfo", hasNextPage: false, endCursor: null },
      },
    },
  },
};

const employeeDetail = {
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
    totalCount: 0,
    edges: [],
  },
};

const employeeDetailMock = {
  request: { query: EmployeeDocument, variables: { id: "emp-1" } },
  result: { data: { employee: employeeDetail } },
};

const updateInput = {
  fullName: "Andi Pratama",
  email: "andi@tania.id",
  birthDate: "1990-01-01",
  gender: "MALE",
  phone: "0811111111",
  address: "Jl. Satu",
  joinedAt: "2024-01-01",
  status: "ACTIVE",
};

const updateMock = {
  request: {
    query: UpdateEmployeeDocument,
    variables: { id: "emp-1", input: updateInput },
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
        phone: "0811111111",
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

function fillCreateForm() {
  fireEvent.change(screen.getByLabelText(/^nik/i), {
    target: { value: createValidInput.nik },
  });
  fireEvent.change(screen.getByLabelText(/nama lengkap/i), {
    target: { value: createValidInput.fullName },
  });
  fireEvent.change(screen.getByLabelText(/^email/i), {
    target: { value: createValidInput.email },
  });
  fireEvent.change(screen.getByLabelText(/tanggal lahir/i), {
    target: { value: createValidInput.birthDate },
  });
  const selects = screen.getAllByRole("combobox");
  fireEvent.change(selects[0], { target: { value: createValidInput.gender } });
  fireEvent.change(screen.getByLabelText(/telepon/i), {
    target: { value: createValidInput.phone },
  });
  fireEvent.change(screen.getByLabelText(/^alamat/i), {
    target: { value: createValidInput.address },
  });
  fireEvent.change(screen.getByLabelText(/tanggal bergabung/i), {
    target: { value: createValidInput.joinedAt },
  });
}

function submitForm() {
  fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
}

describe("EmployeeFormModal — create mode (TAN-315)", () => {
  it("opens with empty form fields", () => {
    render(
      <MockedProvider mocks={[employeesMock, employeesMock]}>
        <ToastProvider>
          <EmployeeFormModal mode="create" onClose={() => {}} open={true} />
        </ToastProvider>
      </MockedProvider>,
    );
    expect(screen.getByRole("dialog", { name: /tambah karyawan/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^nik/i)).toHaveValue("");
    expect(screen.getByLabelText(/nama lengkap/i)).toHaveValue("");
  });

  it("places footer actions outside the form and links submit by form id", () => {
    render(
      <MockedProvider mocks={[employeesMock, employeesMock]}>
        <ToastProvider>
          <EmployeeFormModal mode="create" onClose={() => {}} open={true} />
        </ToastProvider>
      </MockedProvider>,
    );

    const form = document.querySelector("form");
    const submit = screen.getByRole("button", { name: "Simpan" });
    const cancel = screen.getByRole("button", { name: "Batal" });

    expect(form).not.toBeNull();
    expect(form?.contains(submit)).toBe(false);
    expect(form?.contains(cancel)).toBe(false);
    expect(submit).toHaveAttribute("form", form?.id);
  });

  it("shows required-field errors when submitting empty form", () => {
    render(
      <MockedProvider mocks={[employeesMock, employeesMock]}>
        <ToastProvider>
          <EmployeeFormModal mode="create" onClose={() => {}} open={true} />
        </ToastProvider>
      </MockedProvider>,
    );
    submitForm();
    expect(screen.getByText(/nik wajib diisi/i)).toBeInTheDocument();
    expect(screen.getByText(/nama lengkap wajib diisi/i)).toBeInTheDocument();
    expect(screen.getByText(/email wajib diisi/i)).toBeInTheDocument();
    expect(screen.getByText(/tanggal lahir wajib diisi/i)).toBeInTheDocument();
    expect(screen.getByText(/jenis kelamin wajib dipilih/i)).toBeInTheDocument();
    expect(screen.getByText(/telepon wajib diisi/i)).toBeInTheDocument();
    expect(screen.getByText(/alamat wajib diisi/i)).toBeInTheDocument();
    expect(screen.getByText(/tanggal bergabung wajib diisi/i)).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes modal and shows success toast after create", async () => {
    let closed = false;
    render(
      <MockedProvider mocks={[employeesMock, createMock, employeesMock]}>
        <ToastProvider>
          <EmployeeFormModal
            mode="create"
            onClose={() => {
              closed = true;
            }}
            open={true}
          />
        </ToastProvider>
      </MockedProvider>,
    );
    fillCreateForm();
    submitForm();
    expect(await screen.findByRole("alert")).toHaveTextContent(/ahmad fauzi berhasil dibuat/i);
    expect(closed).toBe(true);
  });

  it("shows conflict error in modal without closing", async () => {
    render(
      <MockedProvider mocks={[employeesMock, createConflictMock]}>
        <ToastProvider>
          <EmployeeFormModal mode="create" onClose={() => {}} open={true} />
        </ToastProvider>
      </MockedProvider>,
    );
    fillCreateForm();
    submitForm();
    expect(await screen.findByText(/email atau nik sudah terdaftar/i)).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("calls onClose when clicking Batal", () => {
    let closed = false;
    render(
      <MockedProvider mocks={[employeesMock]}>
        <ToastProvider>
          <EmployeeFormModal
            mode="create"
            onClose={() => {
              closed = true;
            }}
            open={true}
          />
        </ToastProvider>
      </MockedProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: /batal/i }));
    expect(closed).toBe(true);
  });
});

describe("EmployeeFormModal — edit mode (TAN-315)", () => {
  it("loads employee data and pre-fills the form", async () => {
    render(
      <MockedProvider mocks={[employeesMock, employeeDetailMock]}>
        <ToastProvider>
          <EmployeeFormModal employeeId="emp-1" mode="edit" onClose={() => {}} open={true} />
        </ToastProvider>
      </MockedProvider>,
    );
    expect(await screen.findByRole("dialog", { name: /ubah data/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/nama lengkap/i)).toHaveValue("Andi Pratama");
    expect(screen.getByLabelText(/^email/i)).toHaveValue("andi@tania.id");
    expect(screen.getByText("************1234")).toBeInTheDocument();
  });

  it("shows NIK masked and separate NIK baru field (FR-42)", async () => {
    render(
      <MockedProvider mocks={[employeesMock, employeeDetailMock]}>
        <ToastProvider>
          <EmployeeFormModal employeeId="emp-1" mode="edit" onClose={() => {}} open={true} />
        </ToastProvider>
      </MockedProvider>,
    );
    expect(await screen.findByRole("dialog", { name: /ubah data/i })).toBeInTheDocument();
    expect(screen.getByText(/nik saat ini/i)).toBeInTheDocument();
    expect(screen.getByText("************1234")).toBeInTheDocument();
    expect(screen.getByLabelText(/nik baru/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nik baru/i)).toHaveValue("");
  });

  it("closes modal and shows success toast after edit", async () => {
    let closed = false;
    render(
      <MockedProvider mocks={[employeesMock, employeeDetailMock, updateMock, employeesMock]}>
        <ToastProvider>
          <EmployeeFormModal
            employeeId="emp-1"
            mode="edit"
            onClose={() => {
              closed = true;
            }}
            open={true}
          />
        </ToastProvider>
      </MockedProvider>,
    );
    expect(await screen.findByRole("dialog", { name: /ubah data/i })).toBeInTheDocument();
    submitForm();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /perubahan data andi pratama berhasil disimpan/i,
    );
    expect(closed).toBe(true);
  });
});
