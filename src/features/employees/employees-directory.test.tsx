// @vitest-environment jsdom

import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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

function employeesPage(
  totalCount: number,
  ids: number[],
  hasNextPage: boolean,
  endCursor: string | null,
) {
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

// first mirrors the page size chosen in the Pagination footer (default 25,
// the API default from speckit data-model §5).
const firstPageMock = {
  request: { query: EmployeesDocument, variables: { filter: {}, first: 25, after: null } },
  result: {
    data: { employees: employeesPage(147, ids(1, 25), true, "C25") },
  },
};

function pageMock(
  first: number,
  after: string | null,
  from: number,
  to: number,
  hasNextPage: boolean,
  endCursor: string | null,
) {
  return {
    request: { query: EmployeesDocument, variables: { filter: {}, first, after } },
    result: {
      data: { employees: employeesPage(147, ids(from, to), hasNextPage, endCursor) },
    },
  };
}

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
    <MockedProvider cache={appCache()} mocks={mocks}>
      <EmployeesPage />
    </MockedProvider>,
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

    await waitFor(() => expect(tableRows(container)).toHaveLength(25));
    expect(screen.getByText("Karyawan 01")).toBeInTheDocument();
    expect(screen.getByText("Karyawan 25")).toBeInTheDocument();
    expect(screen.queryByText("Karyawan 26")).not.toBeInTheDocument();
    expect(container.querySelector(".page-total")?.textContent).toBe("147");
  });

  it("refetches page 1 with the page size the user chooses", async () => {
    const tenRowsMock = pageMock(10, null, 1, 10, true, "C10");
    const { container } = renderDirectory([unitsMock, firstPageMock, tenRowsMock]);
    await waitFor(() => expect(tableRows(container)).toHaveLength(25));

    await choosePageSize("10");
    await waitFor(() => expect(tableRows(container)).toHaveLength(10));
    expect(container.querySelector(".page-total")?.textContent).toBe("147");
    expect(screen.getByText("Karyawan 10")).toBeInTheDocument();
    expect(screen.queryByText("Karyawan 11")).not.toBeInTheDocument();
  });

  // Interaction-heavy: jsdom + Apollo scheduling in CI needs more than the
  // default 5s test timeout.
  it(
    "chains the cursor fetch for a page beyond the loaded rows, with hint and locked controls",
    { timeout: 20000 },
    async () => {
      const fiftyRows = pageMock(50, null, 1, 50, true, "C50");
      const delayedSecondChunk = { ...pageMock(50, "C50", 51, 100, true, "C100"), delay: 150 };
      const lastChunk = pageMock(50, "C100", 101, 147, false, "C147");
      const { container } = renderDirectory([
        unitsMock,
        firstPageMock,
        fiftyRows,
        delayedSecondChunk,
        lastChunk,
      ]);
      await waitFor(() => expect(tableRows(container)).toHaveLength(25));

      await choosePageSize("50");
      await waitFor(() => expect(tableRows(container)).toHaveLength(50));

      fireEvent.click(screen.getByRole("button", { name: "3" }));

      // While the fetchMore chain is in flight the table shows a loading hint
      // and the pagination controls are locked.
      expect(await screen.findByText(/Memuat baris 101–147 dari 147/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Halaman berikutnya" })).toBeDisabled();
      expect(tableRows(container)).toHaveLength(1); // only the loading-hint row

      await waitFor(() => expect(tableRows(container)).toHaveLength(47), { timeout: 4000 });
      expect(screen.getByText("Karyawan 147")).toBeInTheDocument();
      expect(screen.queryByText(/Memuat baris/)).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Halaman berikutnya" })).toBeDisabled(); // last page
    },
  );

  it(
    "shows the stall banner with a reload action when a fetch adds no rows",
    { timeout: 20000 },
    async () => {
      const duplicateSecondPage = {
        request: { query: EmployeesDocument, variables: { filter: {}, first: 25, after: "C25" } },
        result: {
          data: { employees: employeesPage(147, ids(1, 25), true, "C25") },
        },
      };
      const freshFirstPage = {
        request: { query: EmployeesDocument, variables: { filter: {}, first: 25, after: null } },
        result: {
          data: { employees: employeesPage(147, ids(1, 25), true, "C25") },
        },
      };
      const { container } = renderDirectory([
        unitsMock,
        firstPageMock,
        duplicateSecondPage,
        freshFirstPage,
      ]);
      await waitFor(() => expect(tableRows(container)).toHaveLength(25));

      fireEvent.click(screen.getByRole("button", { name: "2" }));

      expect(await screen.findByText(/Sebagian data belum berhasil dimuat/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /muat ulang/i }));
      await waitFor(() =>
        expect(screen.queryByText(/Sebagian data belum berhasil dimuat/i)).not.toBeInTheDocument(),
      );
      await waitFor(() => expect(tableRows(container)).toHaveLength(25));
      expect(screen.getByText("Karyawan 01")).toBeInTheDocument();
    },
  );

  it("debounces the search input so partial typing does not trigger the query", async () => {
    const emptySearchMock = {
      request: {
        query: EmployeesDocument,
        variables: { filter: { search: "zzz" }, first: 25, after: null },
      },
      result: {
        data: { employees: employeesPage(0, [], false, null) },
      },
    };
    const { container } = renderDirectory([unitsMock, firstPageMock, emptySearchMock]);
    await waitFor(() => expect(tableRows(container)).toHaveLength(25));

    fireEvent.change(screen.getByPlaceholderText(/cari nama/i), { target: { value: "zzz" } });
    // The debounce has not elapsed yet — the unfiltered rows are still shown.
    expect(tableRows(container)).toHaveLength(25);

    await waitFor(
      () => expect(screen.getByText(/Tidak ada karyawan yang cocok/i)).toBeInTheDocument(),
      { timeout: 2000 },
    );
  });
});
