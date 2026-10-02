// @vitest-environment jsdom

import * as React from "react";
import { describe, expect, it } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import AssignmentsPage from "@/app/(app)/assignments/page";
import NewAssignmentPage from "@/app/(app)/assignments/new/page";
import AssignmentDetailPage from "@/app/(app)/assignments/[id]/page";
import { assignments, filterAssignments } from "./mock";

describe("filterAssignments (mock, US2)", () => {
  it("filters by talent (employeeId)", () => {
    const result = filterAssignments(assignments, { employeeId: "emp-001" });
    expect(result).toHaveLength(1);
    expect(result[0].talent.id).toBe("emp-001");
  });

  it("filters by project (projectId)", () => {
    const result = filterAssignments(assignments, { projectId: "prj-001" });
    expect(result.every((a) => a.project.id === "prj-001")).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  it("filters by status", () => {
    const result = filterAssignments(assignments, { status: "COMPLETED" });
    expect(result.every((a) => a.status === "COMPLETED")).toBe(true);
  });

  it("returns all when the filter is empty", () => {
    expect(filterAssignments(assignments, {})).toHaveLength(assignments.length);
  });
});

describe("AssignmentsPage (mock, US2)", () => {
  it("renders the assignment list after the mock query resolves", async () => {
    render(<AssignmentsPage />);
    expect(await screen.findByText("Budi Santoso")).toBeInTheDocument();
    expect(screen.getByText("Andi Pratama")).toBeInTheDocument();
    expect(screen.getByText("Network Modernization")).toBeInTheDocument();
  });

  it("shows an empty state when a filter matches nothing", async () => {
    render(<AssignmentsPage />);
    await screen.findByText("Budi Santoso");

    // Andi (asg-001) is COMPLETED, so ACTIVE + emp-001 matches nothing
    fireEvent.change(screen.getByLabelText("Talent"), { target: { value: "emp-001" } });
    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "ACTIVE" } });
    await waitFor(() => {
      expect(screen.getByText(/tidak ada assignment yang cocok/i)).toBeInTheDocument();
    });
  });
});

describe("NewAssignmentPage (mock form, US2)", () => {
  it("only offers assignable talents on the form", async () => {
    render(<NewAssignmentPage />);
    await screen.findByRole("heading", { name: /buat assignment/i });

    const talentSelect = screen.getByRole("combobox", { name: /talent/i });
    const options = Array.from(talentSelect.querySelectorAll("option")).map((o) => o.textContent);
    // emp-005 (Eko Prasetyo) is not assignable -> must not appear
    expect(options.some((t) => t?.includes("Eko Prasetyo"))).toBe(false);
    expect(options.some((t) => t?.includes("Andi Pratama"))).toBe(true);
  });

  it("shows required-field errors on an empty submit", async () => {
    render(<NewAssignmentPage />);
    await screen.findByRole("heading", { name: /buat assignment/i });

    fireEvent.submit(screen.getByRole("button", { name: /simpan/i }).closest("form")!);

    expect(screen.getByText(/talent wajib dipilih/i)).toBeInTheDocument();
    expect(screen.getByText(/project wajib dipilih/i)).toBeInTheDocument();
    expect(screen.getByText(/job role wajib dipilih/i)).toBeInTheDocument();
    expect(screen.getByText(/tanggal mulai wajib diisi/i)).toBeInTheDocument();
  });

  it("accepts a valid assignment and shows the mock success state", async () => {
    render(<NewAssignmentPage />);
    await screen.findByRole("heading", { name: /buat assignment/i });

    fireEvent.change(screen.getByRole("combobox", { name: /talent/i }), {
      target: { value: "emp-001" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: /project/i }), {
      target: { value: "prj-001" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: /job role/i }), {
      target: { value: "jr-001" },
    });
    fireEvent.change(screen.getByLabelText(/tanggal mulai/i), { target: { value: "2025-07-01" } });

    fireEvent.submit(screen.getByRole("button", { name: /simpan/i }).closest("form")!);

    expect(await screen.findByText(/disiapkan untuk dibuat \(mock\)/i)).toBeInTheDocument();
  });
});

describe("AssignmentDetailPage (mock, US2)", () => {
  it("renders the assignment and ends an active one", async () => {

    // The page uses React.use(params); wrap render in an awaited act so the
    // params suspension (and the mock query) resolve before interacting.
    await act(async () => {
      render(
        <React.Suspense fallback={null}>
          <AssignmentDetailPage params={Promise.resolve({ id: "asg-002" })} />
        </React.Suspense>
      );
    });
    fireEvent.click(
      await screen.findByRole("button", { name: /ya, akhiri assignment/i })
    );

    expect(await screen.findByText(/assignment selesai/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /ya, akhiri assignment/i })
    ).not.toBeInTheDocument();
  });
});