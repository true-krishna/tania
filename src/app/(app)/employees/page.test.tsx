// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import EmployeesPage from "@/app/(app)/employees/page";

describe("EmployeesPage (mock, US1)", () => {
  it("renders the employee table after the mock query resolves", async () => {
    render(<EmployeesPage />);
    expect(screen.getByText(/memuat/i)).toBeInTheDocument();

    expect(await screen.findByText("Andi Pratama")).toBeInTheDocument();
    expect(screen.getByText("EMP-0001")).toBeInTheDocument();
  });

  it("filters the list as the user types in the search box", async () => {
    render(<EmployeesPage />);
    await screen.findByText("Andi Pratama");
    const search = screen.getByPlaceholderText(/cari nama, email, atau kode/i);

    fireEvent.change(search, { target: { value: "citra" } });

    await waitFor(() => expect(screen.queryByText("Andi Pratama")).not.toBeInTheDocument());
    expect(screen.getByText("Citra Lestari")).toBeInTheDocument();
  });

  it("shows the empty state when no employee matches the search", async () => {
    render(<EmployeesPage />);
    await screen.findByText("Andi Pratama");
    const search = screen.getByPlaceholderText(/cari nama, email, atau kode/i);

    fireEvent.change(search, { target: { value: "tidak-ada" } });

    expect(await screen.findByText(/tidak ada karyawan yang cocok/i)).toBeInTheDocument();
  });
});