// @vitest-environment jsdom

import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { GraphQLError } from "graphql";
import AssignmentsPage from "@/app/(app)/assignments/page";
import NewAssignmentPage from "@/app/(app)/assignments/new/page";
import AssignmentDetailPage from "@/app/(app)/assignments/[id]/page";
import {
  AssignableTalentsDocument,
  AssignmentsDocument,
  CreateAssignmentDocument,
  EmployeesDocument,
  EndAssignmentDocument,
  JobRolesDocument,
  ProjectsDocument,
} from "@/generated/graphql";

const auth = vi.hoisted(() => ({ role: "CHAPTER" as string | null }));
const nav = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => nav,
  notFound: () => {
    throw new Error("notFound");
  },
}));

vi.mock("@/lib/auth/guard", () => ({
  useSessionRole: () => auth.role,
  AuthGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

beforeEach(() => {
  auth.role = "CHAPTER";
});

const unit = { __typename: "Unit", id: "u-1", name: "Digital" };

const employeeNodes = [
  { __typename: "Employee", id: "emp-1", fullName: "Andi Pratama", nomorInduk: "EMP-001", assignable: true },
  { __typename: "Employee", id: "emp-5", fullName: "Eko Prasetyo", nomorInduk: "EMP-005", assignable: false },
];
const employeesResult = {
  data: {
    employees: {
      __typename: "EmployeeConnection",
      totalCount: 2,
      edges: employeeNodes.map((n) => ({ __typename: "EmployeeEdge", cursor: n.id, node: n })),
      pageInfo: { __typename: "PageInfo", hasNextPage: false, endCursor: null },
    },
  },
};

const projectsResult = {
  data: {
    projects: [
      { __typename: "Project", id: "prj-1", name: "Network Modernization", isActive: true, unit },
    ],
  },
};

const jobRolesResult = {
  data: {
    jobRoles: [
      { __typename: "JobRole", id: "jr-1", name: "Engineer", isActive: true, chapter: null },
    ],
  },
};

const assignableTalentNode = {
  __typename: "Employee",
  id: "emp-1",
  fullName: "Andi Pratama",
  nomorInduk: "EMP-001",
};

const assignmentNode = {
  __typename: "Assignment",
  id: "asg-1",
  status: "ACTIVE",
  periodStart: "2025-07-01",
  periodEnd: "2025-12-31",
  talent: { __typename: "Employee", id: "emp-1", fullName: "Andi Pratama", nomorInduk: "EMP-001" },
  project: { __typename: "Project", id: "prj-1", name: "Network Modernization" },
  jobRole: { __typename: "JobRole", id: "jr-1", name: "Engineer" },
};

const assignmentsResult = {
  data: {
    assignments: {
      __typename: "AssignmentConnection",
      totalCount: 1,
      edges: [{ __typename: "AssignmentEdge", cursor: "asg-1", node: assignmentNode }],
      pageInfo: { __typename: "PageInfo", hasNextPage: false, endCursor: null },
    },
  },
};

describe("AssignmentsPage (Apollo, US2)", () => {
  it("renders the assignment list after the queries resolve", async () => {
    render(
      <MockedProvider
        mocks={[
          { request: { query: AssignableTalentsDocument, variables: { first: 100 } }, result: { data: { assignableTalents: { __typename: "EmployeeConnection", edges: [{ __typename: "EmployeeEdge", node: assignableTalentNode }] } } } },
          { request: { query: ProjectsDocument, variables: { includeInactive: true } }, result: projectsResult },
          { request: { query: AssignmentsDocument, variables: { filter: {}, first: 100 } }, result: assignmentsResult },
        ]}
      >
        <AssignmentsPage />
      </MockedProvider>
    );

    expect(await screen.findByRole("link", { name: "Andi Pratama" })).toBeInTheDocument();
    expect(screen.getAllByText("Network Modernization").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("link", { name: /buat assignment/i })).toBeInTheDocument();
  });

  it("is read-only for Operation (T033)", async () => {
    auth.role = "OPERATION";
    render(
      <MockedProvider
        mocks={[
          { request: { query: EmployeesDocument, variables: { filter: {}, first: 25, after: null } }, result: employeesResult },
          { request: { query: ProjectsDocument, variables: { includeInactive: true } }, result: projectsResult },
          { request: { query: AssignmentsDocument, variables: { filter: {}, first: 100 } }, result: assignmentsResult },
        ]}
      >
        <AssignmentsPage />
      </MockedProvider>
    );

    expect(await screen.findByRole("link", { name: "Andi Pratama" })).toBeInTheDocument();
    expect(screen.getByText(/hanya baca/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /buat assignment/i })).toBeNull();
    expect(screen.getByLabelText("Talent")).toBeInTheDocument();
  });

  it("shows only the talent's own history without a talent filter (T033)", async () => {
    auth.role = "TALENT";
    render(
      <MockedProvider
        mocks={[
          { request: { query: ProjectsDocument, variables: { includeInactive: true } }, result: projectsResult },
          { request: { query: AssignmentsDocument, variables: { filter: {}, first: 100 } }, result: assignmentsResult },
        ]}
      >
        <AssignmentsPage />
      </MockedProvider>
    );

    expect(await screen.findByRole("link", { name: "Andi Pratama" })).toBeInTheDocument();
    expect(screen.getByText(/riwayat penugasan anda/i)).toBeInTheDocument();
    expect(screen.queryByLabelText("Talent")).toBeNull();
    expect(screen.queryByRole("link", { name: /buat assignment/i })).toBeNull();
  });

  it("shows a FORBIDDEN message from the server as-is (T033)", async () => {
    auth.role = "OPERATION";
    render(
      <MockedProvider
        mocks={[
          { request: { query: EmployeesDocument, variables: { filter: {}, first: 25, after: null } }, result: employeesResult },
          { request: { query: ProjectsDocument, variables: { includeInactive: true } }, result: projectsResult },
          {
            request: { query: AssignmentsDocument, variables: { filter: {}, first: 100 } },
            result: {
              errors: [
                new GraphQLError("cakupan chapter tidak terdefinisi", {
                  extensions: { code: "FORBIDDEN", reason: "SCOPE_UNDEFINED" },
                }),
              ],
            },
          },
        ]}
      >
        <AssignmentsPage />
      </MockedProvider>
    );

    expect(await screen.findByText("cakupan chapter tidak terdefinisi")).toBeInTheDocument();
  });

  it("shows an empty state when the list has no assignments", async () => {
    auth.role = "OPERATION";
    render(
      <MockedProvider
        mocks={[
          { request: { query: EmployeesDocument, variables: { filter: {}, first: 25, after: null } }, result: employeesResult },
          { request: { query: ProjectsDocument, variables: { includeInactive: true } }, result: projectsResult },
          {
            request: { query: AssignmentsDocument, variables: { filter: {}, first: 100 } },
            result: {
              data: {
                assignments: {
                  __typename: "AssignmentConnection",
                  totalCount: 0,
                  edges: [],
                  pageInfo: { __typename: "PageInfo", hasNextPage: false, endCursor: null },
                },
              },
            },
          },
        ]}
      >
        <AssignmentsPage />
      </MockedProvider>
    );

    expect(await screen.findByText(/tidak ada assignment yang cocok/i)).toBeInTheDocument();
  });
});

describe("NewAssignmentPage (Apollo form, US2)", () => {
  const newMocks = [
    { request: { query: ProjectsDocument, variables: { includeInactive: true } }, result: projectsResult },
    { request: { query: JobRolesDocument, variables: { includeInactive: true } }, result: jobRolesResult },
    {
      request: { query: AssignableTalentsDocument, variables: { first: 100 } },
      result: {
        data: {
          assignableTalents: {
            __typename: "EmployeeConnection",
            edges: [{ __typename: "EmployeeEdge", cursor: "emp-1", node: assignableTalentNode }],
          },
        },
      },
    },
    {
      request: {
        query: CreateAssignmentDocument,
        variables: {
          input: {
            employeeId: "emp-1",
            projectId: "prj-1",
            jobRoleId: "jr-1",
            periodStart: "2025-07-01",
            periodEnd: undefined,
          },
        },
      },
      result: { data: { createAssignment: { id: "asg-2", status: "ACTIVE", __typename: "Assignment" } } },
    },
  ];
  const renderPage = () =>
    render(
      <MockedProvider mocks={newMocks}>
        <NewAssignmentPage />
      </MockedProvider>
    );

  it("only offers assignable talents on the form", async () => {
    renderPage();
    await screen.findByRole("heading", { name: /buat assignment/i });

    const talentSelect = screen.getByRole("combobox", { name: /talent/i });
    const options = Array.from(talentSelect.querySelectorAll("option")).map((o) => o.textContent);
    // emp-5 (Eko Prasetyo) is not assignable -> must not appear
    expect(options.some((t) => t?.includes("Eko Prasetyo"))).toBe(false);
    expect(options.some((t) => t?.includes("Andi Pratama"))).toBe(true);
  });

  it("shows required-field errors on an empty submit", async () => {
    renderPage();
    await screen.findByRole("heading", { name: /buat assignment/i });

    fireEvent.submit(screen.getByRole("button", { name: /simpan/i }).closest("form")!);

    expect(screen.getByText(/talent wajib dipilih/i)).toBeInTheDocument();
    expect(screen.getByText(/project wajib dipilih/i)).toBeInTheDocument();
    expect(screen.getByText(/job role wajib dipilih/i)).toBeInTheDocument();
    expect(screen.getByText(/tanggal mulai wajib diisi/i)).toBeInTheDocument();
  });

  it("creates the assignment and shows a success state", async () => {
    renderPage();
    await screen.findByRole("heading", { name: /buat assignment/i });

    fireEvent.change(screen.getByRole("combobox", { name: /talent/i }), {
      target: { value: "emp-1" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: /project/i }), {
      target: { value: "prj-1" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: /job role/i }), {
      target: { value: "jr-1" },
    });
    fireEvent.change(screen.getByLabelText(/tanggal mulai/i), { target: { value: "2025-07-01" } });

    fireEvent.submit(screen.getByRole("button", { name: /simpan/i }).closest("form")!);

    expect(await screen.findByText(/berhasil dibuat/i)).toBeInTheDocument();
  });
});

describe("AssignmentDetailPage (Apollo, US2)", () => {
  it("renders the assignment and ends an active one", async () => {
    const detailMocks = [
      { request: { query: AssignmentsDocument, variables: { first: 100 } }, result: assignmentsResult },
      {
        request: { query: EndAssignmentDocument, variables: { id: "asg-1", periodEnd: "2025-12-31" } },
        result: { data: { endAssignment: { __typename: "Assignment", id: "asg-1", status: "COMPLETED", periodEnd: "2025-12-31" } } },
      },
    ];

    await act(async () => {
      render(
        <React.Suspense fallback={null}>
          <MockedProvider mocks={detailMocks}>
            <AssignmentDetailPage params={Promise.resolve({ id: "asg-1" })} />
          </MockedProvider>
        </React.Suspense>
      );
    });

    fireEvent.click(await screen.findByRole("button", { name: /ya, akhiri assignment/i }));

    expect(await screen.findByText(/assignment selesai/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /ya, akhiri assignment/i })
    ).not.toBeInTheDocument();
  });

  for (const role of ["OPERATION", "TALENT"] as const) {
    it(`hides the end action for ${role} (T033)`, async () => {
      auth.role = role;
      await act(async () => {
        render(
          <React.Suspense fallback={null}>
            <MockedProvider mocks={[{ request: { query: AssignmentsDocument, variables: { first: 100 } }, result: assignmentsResult }]}>
              <AssignmentDetailPage params={Promise.resolve({ id: "asg-1" })} />
            </MockedProvider>
          </React.Suspense>
        );
      });

      expect(await screen.findByText("Talent")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /ya, akhiri assignment/i })).toBeNull();
    });
  }
});