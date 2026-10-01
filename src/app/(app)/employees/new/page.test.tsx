// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import NewEmployeePage from "./page";

function submitForm() {
  const form = screen.getByRole("textbox", { name: /email/i }).closest("form");
  if (!form) throw new Error("form not found");
  fireEvent.submit(form);
}

describe("NewEmployeePage (mock form)", () => {
  it("shows required-field errors when submitting an empty form", async () => {
    render(<NewEmployeePage />);
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
    render(<NewEmployeePage />);
    await screen.findByRole("heading", { name: /tambah karyawan/i });

    fireEvent.change(screen.getByRole("textbox", { name: /email/i }), {
      target: { value: "bukan-email" },
    });
    submitForm();

    expect(screen.getByText(/format email tidak valid/i)).toBeInTheDocument();
  });

  it("shows the mock success state when required fields are filled", async () => {
    render(<NewEmployeePage />);
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
    fireEvent.change(screen.getAllByRole("combobox")[0], { target: { value: "unit-001" } });
    fireEvent.change(screen.getAllByRole("combobox")[1], { target: { value: "jr-001" } });
    fireEvent.change(screen.getByLabelText(/tanggal bergabung/i), {
      target: { value: "2025-01-01" },
    });

    submitForm();

    expect(await screen.findByText(/disiapkan untuk dibuat \(mock\)/i)).toBeInTheDocument();
  });
});