// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import EmployeesPage from "@/app/(app)/employees/page";
import { EmployeesDocument } from "@/generated/graphql";

function node(id: string, fullName: string, email: string, status: "ACTIVE" | "INACTIVE") {
  return {
    __typename: "Employee",
    id,
    fullName,
    employeeCode: id.toUpperCase(),
    email,
    status,
    assignable: status === "ACTIVE",
    unit: { __typename: "Unit", id: "u-1", name: "Digital" },
    jobRole: { __typename: "JobRole", id: "jr-1", name: "Engineer" },
  };
}

const edges = (items: ReturnType<typeof node>[]) =>
  items.map((n) => ({ __typename: "EmployeeEdge", cursor: n.id, node: n }));

const resultFor = (search: string) => ({
  data: {
    employees: {
      __typename: "EmployeeConnection",
      totalCount: search ? 1 : 2,
      edges: edges(search ? [node("emp-2", "Citra Lestari", "citra@tania.id", "ACTIVE")] : [
        node("emp-1", "Andi Pratama", "andi@tania.id", "ACTIVE"),
        node("emp-2", "Citra Lestari", "citra@tania.id", "ACTIVE"),
      ]),
      pageInfo: { __typename: "PageInfo", hasNextPage: false, endCursor: null },
    },
  },
});

describe("EmployeesPage (Apollo, US1)", () => {
  it("renders the employee table after the query resolves", async () => {
    render(
      <MockedProvider mocks={[{ request: { query: EmployeesDocument, variables: { filter: {}, first: 100 } }, result: resultFor("") }]}>
        <EmployeesPage />
      </MockedProvider>
    );

    expect(await screen.findByText("Andi Pratama")).toBeInTheDocument();
    expect(screen.getByText("EMP-1")).toBeInTheDocument();
  });

  it("re-queries with the typed search filter", async () => {
    const mocks = [
      { request: { query: EmployeesDocument, variables: { filter: {}, first: 100 } }, result: resultFor("") },
      { request: { query: EmployeesDocument, variables: { filter: { search: "citra" }, first: 100 } }, result: resultFor("citra") },
    ];
    render(
      <MockedProvider mocks={mocks}>
        <EmployeesPage />
      </MockedProvider>
    );
    await screen.findByText("Andi Pratama");

    fireEvent.change(screen.getByPlaceholderText(/cari nama, email, atau kode/i), {
      target: { value: "citra" },
    });

    expect(await screen.findByText("Citra Lestari")).toBeInTheDocument();
    expect(screen.queryByText("Andi Pratama")).not.toBeInTheDocument();
  });

  it("shows the empty state when no employees are returned", async () => {
    render(
      <MockedProvider mocks={[{ request: { query: EmployeesDocument, variables: { filter: {}, first: 100 } }, result: { data: { employees: { __typename: "EmployeeConnection", totalCount: 0, edges: [], pageInfo: { __typename: "PageInfo", hasNextPage: false, endCursor: null } } } } }]}>
        <EmployeesPage />
      </MockedProvider>
    );

    expect(await screen.findByText(/tidak ada karyawan yang cocok/i)).toBeInTheDocument();
  });
});