// @vitest-environment jsdom

import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import EmployeesPage from "@/app/(app)/employees/page";
import {
  AssignableTalentsDocument,
  EmployeesDocument,
  MyEmployeeDocument,
  UnitsDocument,
} from "@/generated/graphql";

const nav = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => nav }));

const auth = vi.hoisted(() => ({ role: "OPERATION" as string | null }));

vi.mock("@/lib/auth/guard", () => ({
  useSessionRole: () => auth.role,
  AuthGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

beforeEach(() => {
  auth.role = "OPERATION";
});

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

const nextPageMock = {
  request: { query: EmployeesDocument, variables: { filter: {}, first: 25, after: "c-2" } },
  result: pageTwo,
};

describe("EmployeesPage (daftar + filter, T021)", () => {
  it("renders NIK masked (4 digit akhir) and nomor induk per row", async () => {
    render(
      <MockedProvider mocks={[unitsMock, firstPageMock, nextPageMock]}>
        <EmployeesPage />
      </MockedProvider>
    );

    expect(await screen.findByText("Andi Pratama")).toBeInTheDocument();
    expect(screen.getAllByText(/^\*{8,}\d{4}$/).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("************1234")).toBeInTheDocument();
    expect(screen.getByText("EMP-1")).toBeInTheDocument();
    expect(screen.queryByText(/3273012345678901/)).not.toBeInTheDocument();
  });

  it("renders a dash for cells without a value (TAN-189)", async () => {
    render(
      <MockedProvider mocks={[unitsMock, firstPageMock, nextPageMock]}>
        <EmployeesPage />
      </MockedProvider>
    );

    expect(await screen.findByText("Andi Pratama")).toBeInTheDocument();

    expect(await screen.findByText("Eko Prasetyo")).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "-" })).toBeInTheDocument();
  });

  it("opens the row action menu and navigates to the detail page (TAN-189)", async () => {
    render(
      <MockedProvider mocks={[unitsMock, firstPageMock, nextPageMock]}>
        <EmployeesPage />
      </MockedProvider>
    );

    expect(await screen.findByText("Andi Pratama")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Aksi Andi Pratama" }));
    fireEvent.click(screen.getByRole("button", { name: "Lihat detail" }));
    expect(nav.push).toHaveBeenCalledWith("/employees/emp-1");
  });

  it("re-queries with the typed search filter", async () => {
    const mocks = [
      unitsMock,
      firstPageMock,
      nextPageMock,
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

    // The search is debounced, so the requery lands after the debounce delay.
    await waitFor(() => expect(screen.queryByText("Andi Pratama")).not.toBeInTheDocument());
    expect(screen.getByText("Citra Lestari")).toBeInTheDocument();
  });

  it("filters by divisi and status", async () => {
    const mocks = [
      unitsMock,
      firstPageMock,
      nextPageMock,
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

    fireEvent.click(screen.getByRole("button", { name: "Filter" }));

    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "u-1" } });
    fireEvent.change(selects[1], { target: { value: "INACTIVE" } });

    expect(
      screen.getByRole("button", { name: "Filter, 2 filter aktif" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("Eko Prasetyo")).toBeInTheDocument();
    expect(screen.queryByText("Andi Pratama")).not.toBeInTheDocument();
  });

  it("auto-fetches the next cursor page to fill the shown page", async () => {
    const mocks = [
      unitsMock,
      firstPageMock,
      nextPageMock,
    ];
    render(
      <MockedProvider mocks={mocks}>
        <EmployeesPage />
      </MockedProvider>
    );
    await screen.findByText("Andi Pratama");

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

describe("EmployeesPage per role (T034)", () => {
  it("shows the add action to Operation and Admin", async () => {
    render(
      <MockedProvider mocks={[unitsMock, firstPageMock, nextPageMock]}>
        <EmployeesPage />
      </MockedProvider>
    );
    expect(await screen.findByText("Andi Pratama")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tambah karyawan/i })).toBeInTheDocument();
  });

  it("lets Admin manage the directory (TAN-212 clarify 4)", async () => {
    auth.role = "ADMIN";
    render(
      <MockedProvider mocks={[unitsMock, firstPageMock, nextPageMock]}>
        <EmployeesPage />
      </MockedProvider>
    );
    expect(await screen.findByText("Andi Pratama")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tambah karyawan/i })).toBeInTheDocument();
  });

  it("lists scoped talents for Chapter via assignableTalents", async () => {
    auth.role = "CHAPTER";
    render(
      <MockedProvider
        mocks={[
          {
            request: { query: AssignableTalentsDocument, variables: { first: 100 } },
            result: {
              data: {
                assignableTalents: {
                  __typename: "EmployeeConnection",
                  edges: [
                    {
                      __typename: "EmployeeEdge",
                      node: { __typename: "Employee", id: "emp-9", fullName: "Sari Dewi", nomorInduk: "EMP-9" },
                    },
                  ],
                },
              },
            },
          },
        ]}
      >
        <EmployeesPage />
      </MockedProvider>
    );
    expect(await screen.findByRole("link", { name: "Sari Dewi" })).toHaveAttribute("href", "/employees/emp-9");
    expect(screen.queryByRole("button", { name: /tambah karyawan/i })).toBeNull();
    expect(screen.queryByText("NIK")).toBeNull();
  });

  it("redirects Talent to its own record", async () => {
    auth.role = "TALENT";
    render(
      <MockedProvider
        mocks={[
          {
            request: { query: MyEmployeeDocument },
            result: { data: { me: { __typename: "User", id: "u-9", employee: { __typename: "Employee", id: "emp-9" } } } },
          },
        ]}
      >
        <EmployeesPage />
      </MockedProvider>
    );
    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith("/employees/emp-9"));
  });

  it("tells a Talent without a linked employee record", async () => {
    auth.role = "TALENT";
    render(
      <MockedProvider
        mocks={[
          {
            request: { query: MyEmployeeDocument },
            result: { data: { me: { __typename: "User", id: "u-9", employee: null } } },
          },
        ]}
      >
        <EmployeesPage />
      </MockedProvider>
    );
    expect(await screen.findByText(/belum tertaut/i)).toBeInTheDocument();
  });
});
