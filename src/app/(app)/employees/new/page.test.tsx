// @vitest-environment jsdom

import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { GraphQLError } from "graphql";
import NewEmployeePage from "./page";
import { CreateEmployeeDocument } from "@/generated/graphql";

const auth = vi.hoisted(() => ({ role: "OPERATION" as string | null }));

vi.mock("@/lib/auth/guard", () => ({
  useSessionRole: () => auth.role,
  AuthGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

beforeEach(() => {
  auth.role = "OPERATION";
});

const validInput = {
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
    variables: { input: validInput },
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

const conflictMock = {
  request: {
    query: CreateEmployeeDocument,
    variables: { input: validInput },
  },
  result: {
    errors: [new GraphQLError("resource already exists", { extensions: { code: "CONFLICT" } })],
  },
};

function submitForm() {
  const form = screen.getByRole("button", { name: /simpan/i }).closest("form");
  if (!form) throw new Error("form not found");
  fireEvent.submit(form);
}

function fillValidForm() {
  fireEvent.change(screen.getByLabelText(/^nik/i), {
    target: { value: validInput.nik },
  });
  fireEvent.change(screen.getByLabelText(/nama lengkap/i), {
    target: { value: validInput.fullName },
  });
  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: validInput.email },
  });
  fireEvent.change(screen.getByLabelText(/tanggal lahir/i), {
    target: { value: validInput.birthDate },
  });
  fireEvent.change(screen.getByRole("combobox"), {
    target: { value: validInput.gender },
  });
  fireEvent.change(screen.getByLabelText(/telepon/i), {
    target: { value: validInput.phone },
  });
  fireEvent.change(screen.getByLabelText(/^alamat/i), {
    target: { value: validInput.address },
  });
  fireEvent.change(screen.getByLabelText(/tanggal bergabung/i), {
    target: { value: validInput.joinedAt },
  });
}

describe("NewEmployeePage (form data diri, T019)", () => {
  it("shows required-field errors when submitting an empty form", async () => {
    render(
      <MockedProvider mocks={[createMock]}>
        <NewEmployeePage />
      </MockedProvider>
    );
    await screen.findByRole("heading", { name: /tambah karyawan/i });

    submitForm();

    expect(screen.getByText(/nik wajib diisi/i)).toBeInTheDocument();
    expect(screen.getByText(/nama lengkap wajib diisi/i)).toBeInTheDocument();
    expect(screen.getByText(/email wajib diisi/i)).toBeInTheDocument();
    expect(screen.getByText(/tanggal lahir wajib diisi/i)).toBeInTheDocument();
    expect(screen.getByText(/jenis kelamin wajib dipilih/i)).toBeInTheDocument();
    expect(screen.getByText(/telepon wajib diisi/i)).toBeInTheDocument();
    expect(screen.getByText(/alamat wajib diisi/i)).toBeInTheDocument();
    expect(screen.getByText(/tanggal bergabung wajib diisi/i)).toBeInTheDocument();
  });

  it("rejects a NIK that is not 16 digits and an invalid email format", async () => {
    render(
      <MockedProvider mocks={[createMock]}>
        <NewEmployeePage />
      </MockedProvider>
    );
    await screen.findByRole("heading", { name: /tambah karyawan/i });

    fireEvent.change(screen.getByLabelText(/^nik/i), { target: { value: "12345" } });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "bukan-email" },
    });
    submitForm();

    expect(screen.getByText(/nik harus terdiri dari 16 digit angka/i)).toBeInTheDocument();
    expect(screen.getByText(/format email tidak valid/i)).toBeInTheDocument();
  });

  it("shows a success state after creating the employee", async () => {
    render(
      <MockedProvider mocks={[createMock]}>
        <NewEmployeePage />
      </MockedProvider>
    );
    await screen.findByRole("heading", { name: /tambah karyawan/i });

    fillValidForm();
    submitForm();

    expect(await screen.findByText(/ahmad fauzi berhasil dibuat/i)).toBeInTheDocument();
  });

  it("does not offer the removed Entra auto-create toggle", async () => {
    render(
      <MockedProvider mocks={[createMock]}>
        <NewEmployeePage />
      </MockedProvider>
    );
    await screen.findByRole("heading", { name: /tambah karyawan/i });

    expect(
      screen.queryByRole("checkbox", { name: /buatkan akun microsoft entra/i })
    ).not.toBeInTheDocument();
  });

  it("rejects a duplicate email/NIK with a clear message", async () => {
    render(
      <MockedProvider mocks={[conflictMock]}>
        <NewEmployeePage />
      </MockedProvider>
    );
    await screen.findByRole("heading", { name: /tambah karyawan/i });

    fillValidForm();
    submitForm();

    expect(
      await screen.findByText(/email atau nik sudah terdaftar/i)
    ).toBeInTheDocument();
  });
});
