// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import EmployeesPage from "@/app/(app)/employees/page";
import { EmployeesDocument, UnitsDocument } from "@/generated/graphql";

function node(
  id: string,
  fullName: string,
  email: string,
  status: "ACTIVE" | "INACTIVE",
  nikMasked: string,
  nomorInduk: string | null,
  unitName: string | null
) {
  return {
    __typename: "Employee",
    id,
    fullName,
    nikMasked,
    email,
    status,
    assignable: status === "ACTIVE",
    nomorInduk,
    unit: unitName
      ? { __typename: "Unit", id: "u-1", name: unitName }
      : null,
    jobRole: { __typename: "JobRole", id: "jr-1", name: "Engineer" },
  };
}

const edges = (items: ReturnType<typeof node>[]) =>
  items.map((n) => ({ __typename: "EmployeeEdge", cursor: n.id, node: n }));

const unitsMock = {
  request: { query: UnitsDocument, variables: { includeInactive: true } },
  result: {
    data: {
      units: [{ __typename: "Unit", id: "u-1", name: "Digital", isActive: true, projects: [] }],
    },
  },
};

const pageOne = {
  data: {
    employees: {
      __typename: "EmployeeConnection",
      totalCount: 3,
      edges: edges([
        node("emp-1", "Andi Pratama", "andi@tania.id", "ACTIVE", "************1234", "EMP-1", "Digital"),
        node("emp-2", "Citra Lestari", "citra@tania.id", "ACTIVE", "************5678", "EMP-2", "Digital"),
      ]),
      pageInfo: { __typename: "PageInfo", hasNextPage: true, endCursor: "c-2" },
    },
  },
};

const pageTwo = {
  data: {
    employees: {
      __typename: "EmployeeConnection",
      totalCount: 3,
      edges: edges([
        node("emp-3", "Eko Prasetyo", "eko@tania.id", "INACTIVE", "************9012", null, null),
      ]),
      pageInfo: { __typename: "PageInfo", hasNextPage: false, endCursor: null },
    },
  },
};

const firstPageMock = {
  request: { query: EmployeesDocument, variables: { filter: {}, first: 25, after: null } },
  result: pageOne,
};

describe("EmployeesPage (daftar + filter, T021)", () => {
  it("renders NIK masked (4 digit akhir) and nomor induk per row", async () => {
    render(
      <MockedProvider mocks={[unitsMock, firstPageMock]}>
        <EmployeesPage />
      </MockedProvider>
    );

    expect(await screen.findByText("Andi Pratama")).toBeInTheDocument();
    expect(screen.getAllByText(/^\*{8,}\d{4}$/).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("************1234")).toBeInTheDocument();
    expect(screen.getByText("EMP-1")).toBeInTheDocument();
    expect(screen.queryByText(/3273012345678901/)).not.toBeInTheDocument();
  });

  it("re-queries with the typed search filter", async () => {
    const mocks = [
      unitsMock,
      firstPageMock,
      {
        request: {
          query: EmployeesDocument,
          variables: { filter: { search: "citra" }, first: 25, after: null },
        },
        result: {
          data: {
            employees: {
              __typename: "EmployeeConnection",
              totalCount: 1,
              edges: edges([
                node("emp-2", "Citra Lestari", "citra@tania.id", "ACTIVE", "************5678", "EMP-2", "Digital"),
              ]),
              pageInfo: { __typename: "PageInfo", hasNextPage: false, endCursor: null },
            },
          },
        },
      },
    ];
    render(
      <MockedProvider mocks={mocks}>
        <EmployeesPage />
      </MockedProvider>
    );
    await screen.findByText("Andi Pratama");

    fireEvent.change(screen.getByPlaceholderText(/cari nama, email, atau nomor induk/i), {
      target: { value: "citra" },
    });

    expect(await screen.findByText("Citra Lestari")).toBeInTheDocument();
    expect(screen.queryByText("Andi Pratama")).not.toBeInTheDocument();
  });

  it("filters by divisi and status", async () => {
    const mocks = [
      unitsMock,
      firstPageMock,
      {
        request: {
          query: EmployeesDocument,
          variables: { filter: { unitId: "u-1", status: "INACTIVE" }, first: 25, after: null },
        },
        result: {
          data: {
            employees: {
              __typename: "EmployeeConnection",
              totalCount: 1,
              edges: edges([
                node("emp-3", "Eko Prasetyo", "eko@tania.id", "INACTIVE", "************9012", null, null),
              ]),
              pageInfo: { __typename: "PageInfo", hasNextPage: false, endCursor: null },
            },
          },
        },
      },
    ];
    render(
      <MockedProvider mocks={mocks}>
        <EmployeesPage />
      </MockedProvider>
    );
    await screen.findByText("Andi Pratama");

    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "u-1" } });
    fireEvent.change(selects[1], { target: { value: "INACTIVE" } });

    expect(await screen.findByText("Eko Prasetyo")).toBeInTheDocument();
    expect(screen.queryByText("Andi Pratama")).not.toBeInTheDocument();
  });

  it("loads the next cursor page with Muat lebih banyak", async () => {
    const mocks = [
      unitsMock,
      firstPageMock,
      {
        request: { query: EmployeesDocument, variables: { filter: {}, first: 25, after: "c-2" } },
        result: pageTwo,
      },
    ];
    render(
      <MockedProvider mocks={mocks}>
        <EmployeesPage />
      </MockedProvider>
    );
    await screen.findByText("Andi Pratama");

    fireEvent.click(screen.getByRole("button", { name: /muat lebih banyak/i }));

    expect(await screen.findByText("Eko Prasetyo")).toBeInTheDocument();
    expect(screen.getByText("Andi Pratama")).toBeInTheDocument();
  });

  it("shows the empty state when no employees are returned", async () => {
    render(
      <MockedProvider
        mocks={[
          unitsMock,
          {
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
          },
        ]}
      >
        <EmployeesPage />
      </MockedProvider>
    );

    expect(await screen.findByText(/tidak ada karyawan yang cocok/i)).toBeInTheDocument();
  });
});
