// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import NewEmployeePage from "./page";
import {
  CreateEmployeeDocument,
  JobRolesDocument,
  UnitsDocument,
} from "@/generated/graphql";

const mocks = [
  {
    request: { query: UnitsDocument, variables: { includeInactive: true } },
    result: {
      data: {
        units: [
          { id: "u-1", name: "Digital", isActive: true, projects: [], __typename: "Unit" },
        ],
      },
    },
  },
  {
    request: { query: JobRolesDocument, variables: { includeInactive: true } },
    result: {
      data: {
        jobRoles: [
          { id: "jr-1", name: "Engineer", isActive: true, chapter: null, __typename: "JobRole" },
        ],
      },
    },
  },
  {
    request: {
      query: CreateEmployeeDocument,
      variables: {
        input: {
          fullName: "Ahmad Fauzi",
          employeeCode: "EMP-0100",
          email: "ahmad@tania.co.id",
          unitId: "u-1",
          jobRoleId: "jr-1",
          joinedAt: "2025-01-01",
        },
      },
    },
    result: {
      data: {
        createEmployee: {
          id: "emp-100",
          fullName: "Ahmad Fauzi",
          employeeCode: "EMP-0100",
          __typename: "Employee",
        },
      },
    },
  },
];

function submitForm() {
  const form = screen.getByRole("textbox", { name: /email/i }).closest("form");
  if (!form) throw new Error("form not found");
  fireEvent.submit(form);
}

describe("NewEmployeePage (Apollo form)", () => {
  it("shows required-field errors when submitting an empty form", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <NewEmployeePage />
      </MockedProvider>
    );
    await screen.findByRole("heading", { name: /tambah karyawan/i });

    submitForm();

    expect(screen.getByText(/nama lengkap wajib diisi/i)).toBeInTheDocument();
    expect(screen.getByText(/kode karyawan wajib diisi/i)).toBeInTheDocument();
    expect(screen.getByText(/email wajib diisi/i)).toBeInTheDocument();
    expect(screen.getByText(/unit wajib dipilih/i)).toBeInTheDocument();
    expect(screen.getByText(/job role wajib dipilih/i)).toBeInTheDocument();
    expect(screen.getByText(/tanggal bergabung wajib diisi/i)).toBeInTheDocument();
  });

  it("rejects an invalid email format", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <NewEmployeePage />
      </MockedProvider>
    );
    await screen.findByRole("heading", { name: /tambah karyawan/i });

    fireEvent.change(screen.getByRole("textbox", { name: /email/i }), {
      target: { value: "bukan-email" },
    });
    submitForm();

    expect(screen.getByText(/format email tidak valid/i)).toBeInTheDocument();
  });

  it("shows a success state after creating the employee", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <NewEmployeePage />
      </MockedProvider>
    );
    await screen.findByRole("heading", { name: /tambah karyawan/i });

    fireEvent.change(screen.getByRole("textbox", { name: /nama lengkap/i }), {
      target: { value: "Ahmad Fauzi" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /kode karyawan/i }), {
      target: { value: "EMP-0100" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /email/i }), {
      target: { value: "ahmad@tania.co.id" },
    });
    fireEvent.change(screen.getAllByRole("combobox")[0], { target: { value: "u-1" } });
    fireEvent.change(screen.getAllByRole("combobox")[1], { target: { value: "jr-1" } });
    fireEvent.change(screen.getByLabelText(/tanggal bergabung/i), {
      target: { value: "2025-01-01" },
    });

    submitForm();

    expect(await screen.findByText(/ahmad fauzi berhasil dibuat/i)).toBeInTheDocument();
  });
});