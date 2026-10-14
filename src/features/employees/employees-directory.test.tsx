// @vitest-environment jsdom

import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { InMemoryCache } from "@apollo/client";
import EmployeesPage from "@/app/(app)/employees/page";
import { EmployeesDocument, UnitsDocument } from "@/generated/graphql";

const auth = vi.hoisted(() => ({ role: "OPERATION" as string | null }));
const nav = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("@/lib/auth/guard", () => ({
  useSessionRole: () => auth.role,
  AuthGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => nav,
}));

beforeEach(() => {
  auth.role = "OPERATION";
});

function employeeNode(i: number) {
  return {
    __typename: "Employee",
    id: `emp-${i}`,
    fullName: `Karyawan ${String(i).padStart(2, "0")}`,
    nikMasked: "************1234",
    email: `karyawan${i}@tania.id`,
    status: "ACTIVE",
    assignable: true,
    nomorInduk: `EMP-${i}`,
    unit: { __typename: "Unit", id: "u-1", name: "Digital" },
    jobRole: { __typename: "JobRole", id: "jr-1", name: "Engineer" },
  };
}

function employeesPage(totalCount: number, ids: number[], hasNextPage: boolean, endCursor: string | null) {
  return {
    __typename: "EmployeeConnection",
    totalCount,
    edges: ids.map((i) => ({
      __typename: "EmployeeEdge",
      cursor: `c-${i}`,
      node: employeeNode(i),
    })),
    pageInfo: { __typename: "PageInfo", hasNextPage, endCursor },
  };
}

function ids(from: number, to: number) {
  return Array.from({ length: to - from + 1 }, (_, k) => from + k);
}

const unitsMock = {
  request: { query: UnitsDocument, variables: { includeInactive: true } },
  result: {
    data: {
      units: [{ __typename: "Unit", id: "u-1", name: "Digital", isActive: true, projects: [] }],
    },
  },
};

const firstPageMock = {
  request: { query: EmployeesDocument, variables: { filter: {}, first: 100, after: null } },
  result: {
    data: { employees: employeesPage(147, ids(1, 100), true, "C100") },
  },
};

const secondPageMock = {
  request: { query: EmployeesDocument, variables: { filter: {}, first: 100, after: "C100" } },
  result: {
    data: { employees: employeesPage(147, ids(101, 147), false, "C147") },
  },
};

function appCache() {
  return new InMemoryCache({
    typePolicies: {
      Query: { fields: { employees: { keyArgs: ["filter"] } } },
      EmployeeConnection: { merge: false },
    },
  });
}

function renderDirectory(mocks: React.ComponentProps<typeof MockedProvider>["mocks"]) {
  return render(
    <MockedProvider mocks={mocks} cache={appCache()}>
      <EmployeesPage />
    </MockedProvider>
  );
}

function tableRows(container: HTMLElement) {
  return within(container.querySelector("tbody") as HTMLElement).queryAllByRole("row");
}

async function choosePageSize(size: string) {
  fireEvent.change(screen.getByLabelText(/baris per halaman/i), { target: { value: size } });
}

describe("EmployeeDirectory pagination (Operation)", () => {
  it("shows the first client page with the connection total", async () => {
    const { container } = renderDirectory([unitsMock, firstPageMock]);

    await waitFor(() => expect(tableRows(container)).toHaveLength(10));
    expect(screen.getByText("Karyawan 01")).toBeInTheDocument();
    expect(screen.getByText("Karyawan 10")).toBeInTheDocument();
    expect(screen.queryByText("Karyawan 11")).not.toBeInTheDocument();
    expect(container.querySelector(".page-total")?.textContent).toBe("147");
  });

  it("chains the cursor fetch for a page beyond the loaded rows, with hint and locked controls", async () => {
    const delayedSecondPage = {
      ...secondPageMock,
      delay: 200,
    };
    const { container } = renderDirectory([unitsMock, firstPageMock, delayedSecondPage]);
    await waitFor(() => expect(tableRows(container)).toHaveLength(10));

    await act(async () => {
      await choosePageSize("50");
    });
    await waitFor(() => expect(tableRows(container)).toHaveLength(50));

    fireEvent.click(screen.getByRole("button", { name: "3" }));

    // While the fetchMore chain is in flight the table shows a loading hint
    // and the pagination controls are locked.
    expect(await screen.findByText(/Memuat baris 101–147 dari 147/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Halaman berikutnya" })).toBeDisabled();
    expect(tableRows(container)).toHaveLength(1); // only the loading-hint row

    await waitFor(() => expect(tableRows(container)).toHaveLength(47));
    expect(screen.getByText("Karyawan 147")).toBeInTheDocument();
    expect(screen.queryByText(/Memuat baris/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Halaman berikutnya" })).toBeDisabled(); // last page
  });

  it("shows the stall banner with a reload action when a fetch adds no rows", async () => {
    const duplicateSecondPage = {
      request: { query: EmployeesDocument, variables: { filter: {}, first: 100, after: "C100" } },
      result: {
        data: { employees: employeesPage(147, ids(1, 47), true, "C100") },
      },
    };
    const freshFirstPage = {
      request: { query: EmployeesDocument, variables: { filter: {}, first: 100, after: null } },
      result: {
        data: { employees: employeesPage(147, ids(1, 100), true, "C100") },
      },
    };
    const { container } = renderDirectory([unitsMock, firstPageMock, duplicateSecondPage, freshFirstPage]);
    await waitFor(() => expect(tableRows(container)).toHaveLength(10));

    await act(async () => {
      await choosePageSize("50");
    });
    fireEvent.click(screen.getByRole("button", { name: "3" }));

    expect(await screen.findByText(/Sebagian data belum berhasil dimuat/i)).toBeInTheDocument();
    expect(tableRows(container)).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: /muat ulang/i }));
    await waitFor(() => expect(screen.queryByText(/Sebagian data belum berhasil dimuat/i)).not.toBeInTheDocument());
    await waitFor(() => expect(tableRows(container)).toHaveLength(50));
    expect(screen.getByText("Karyawan 01")).toBeInTheDocument();
  });

  it("debounces the search input so partial typing does not trigger the query", async () => {
    const emptySearchMock = {
      request: { query: EmployeesDocument, variables: { filter: { search: "zzz" }, first: 100, after: null } },
      result: {
        data: { employees: employeesPage(0, [], false, null) },
      },
    };
    const { container } = renderDirectory([unitsMock, firstPageMock, emptySearchMock]);
    await waitFor(() => expect(tableRows(container)).toHaveLength(10));

    fireEvent.change(screen.getByPlaceholderText(/cari nama/i), { target: { value: "zzz" } });
    // The debounce has not elapsed yet — the unfiltered rows are still shown.
    expect(tableRows(container)).toHaveLength(10);

    await waitFor(
      () => expect(screen.getByText(/Tidak ada karyawan yang cocok/i)).toBeInTheDocument(),
      { timeout: 2000 }
    );
  });
});
