// @vitest-environment jsdom

import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MockedProvider, type MockedResponse } from "@apollo/client/testing";
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
  UpdateAssignmentDocument,
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
    // O4 — label status seragam: ACTIVE tampil sebagai "Berjalan" (bukan "Aktif").
    expect(screen.getByText("Berjalan")).toBeInTheDocument();
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

    fireEvent.click(screen.getByRole("button", { name: "Filter" }));
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
  const detailProjectsResult = {
    data: {
      projects: [
        ...projectsResult.data.projects,
        { __typename: "Project", id: "prj-2", name: "Aplikasi Mobile", isActive: true, unit },
        { __typename: "Project", id: "prj-3", name: "Legacy System", isActive: false, unit },
      ],
    },
  };
  const detailJobRolesResult = {
    data: {
      jobRoles: [
        ...jobRolesResult.data.jobRoles,
        { __typename: "JobRole", id: "jr-2", name: "Manager", isActive: false, chapter: null },
      ],
    },
  };
  const baseDetailMocks = [
    { request: { query: AssignmentsDocument, variables: { first: 100 } }, result: assignmentsResult },
    { request: { query: ProjectsDocument, variables: { includeInactive: true } }, result: detailProjectsResult },
    { request: { query: JobRolesDocument, variables: { includeInactive: true } }, result: detailJobRolesResult },
  ];

  const renderDetail = async (mocks: ReadonlyArray<MockedResponse>) => {
    await act(async () => {
      render(
        <React.Suspense fallback={null}>
          <MockedProvider mocks={mocks}>
            <AssignmentDetailPage params={Promise.resolve({ id: "asg-1" })} />
          </MockedProvider>
        </React.Suspense>
      );
    });
  };

  it("shows a completed assignment as \"Selesai\" without edit or end actions (O4)", async () => {
    await renderDetail([
      {
        request: { query: AssignmentsDocument, variables: { first: 100 } },
        result: {
          data: {
            assignments: {
              ...assignmentsResult.data.assignments,
              edges: [
                {
                  __typename: "AssignmentEdge",
                  cursor: "asg-1",
                  node: { ...assignmentNode, status: "COMPLETED" },
                },
              ],
            },
          },
        },
      },
    ]);

    // Label seragam: COMPLETED tampil sebagai "Selesai" (bukan "Nonaktif").
    expect(await screen.findByText("Selesai")).toBeInTheDocument();
    expect(screen.getByText(/assignment selesai\./i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /akhiri assignment/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /simpan/i })).toBeNull();
  });

  it("sends the update mutation with the edited fields and shows the latest version", async () => {
    await renderDetail([
      ...baseDetailMocks,
      {
        request: {
          query: UpdateAssignmentDocument,
          variables: {
            id: "asg-1",
            input: { projectId: "prj-2", jobRoleId: "jr-1", periodStart: "2025-08-01", periodEnd: "2026-01-31" },
          },
        },
        result: {
          data: {
            updateAssignment: {
              __typename: "Assignment",
              id: "asg-1",
              status: "ACTIVE",
              periodStart: "2025-08-01",
              periodEnd: "2026-01-31",
              project: { __typename: "Project", id: "prj-2", name: "Aplikasi Mobile" },
              jobRole: { __typename: "JobRole", id: "jr-1", name: "Engineer" },
            },
          },
        },
      },
    ]);

    const editForm = await screen.findByRole("button", { name: /simpan/i }).then((b) => b.closest("form")!);
    // Master data nonaktif tidak lagi jadi pilihan (T002).
    expect(within(editForm).queryByText("Legacy System")).toBeNull();
    expect(within(editForm).queryByText("Manager")).toBeNull();

    fireEvent.change(within(editForm).getByRole("combobox", { name: /project/i }), { target: { value: "prj-2" } });
    fireEvent.change(within(editForm).getByLabelText(/tanggal mulai/i), { target: { value: "2025-08-01" } });
    fireEvent.change(within(editForm).getByLabelText(/tanggal selesai/i), { target: { value: "2026-01-31" } });
    fireEvent.submit(editForm);

    expect(await screen.findByText(/perubahan tersimpan/i)).toBeInTheDocument();
    // Versi terbaru tampil pada detail (cache ternormalisasi dari hasil mutasi).
    expect(screen.getByText("2025-08-01 — 2026-01-31")).toBeInTheDocument();
    expect(screen.getAllByText("Aplikasi Mobile").length).toBeGreaterThanOrEqual(2);
  });

  it("rejects an end date earlier than the start date on the edit form without sending the mutation", async () => {
    await renderDetail(baseDetailMocks);

    const editForm = await screen.findByRole("button", { name: /simpan/i }).then((b) => b.closest("form")!);
    fireEvent.change(within(editForm).getByLabelText(/tanggal selesai/i), { target: { value: "2025-06-30" } });
    fireEvent.submit(editForm);

    expect(await screen.findByText(/tidak boleh lebih awal dari tanggal mulai/i)).toBeInTheDocument();
    expect(screen.queryByText(/perubahan tersimpan/i)).toBeNull();
  });

  it("shows the server error from a failed update (T003)", async () => {
    await renderDetail([
      ...baseDetailMocks,
      {
        request: {
          query: UpdateAssignmentDocument,
          variables: {
            id: "asg-1",
            input: { projectId: "prj-1", jobRoleId: "jr-1", periodStart: "2025-07-01", periodEnd: "2025-12-31" },
          },
        },
        result: {
          errors: [
            new GraphQLError("periode assignment tidak valid", {
              extensions: { code: "BAD_USER_INPUT", field: "periodEnd" },
            }),
          ],
        },
      },
    ]);

    const editForm = await screen.findByRole("button", { name: /simpan/i }).then((b) => b.closest("form")!);
    fireEvent.submit(editForm);

    expect(await screen.findByText("periode assignment tidak valid")).toBeInTheDocument();
    expect(screen.queryByText(/perubahan tersimpan/i)).toBeNull();
  });

  it("ends an active assignment with a filled end date (T004/T005)", async () => {
    await renderDetail([
      ...baseDetailMocks,
      {
        request: { query: EndAssignmentDocument, variables: { id: "asg-1", periodEnd: "2025-12-31" } },
        result: { data: { endAssignment: { __typename: "Assignment", id: "asg-1", status: "COMPLETED", periodEnd: "2025-12-31" } } },
      },
    ]);

    const endForm = await screen.findByRole("button", { name: /akhiri assignment/i }).then((b) => b.closest("form")!);
    // Tanpa default otomatis: input mulai kosong (T004).
    expect((within(endForm).getByLabelText(/tanggal selesai/i) as HTMLInputElement).value).toBe("");
    fireEvent.change(within(endForm).getByLabelText(/tanggal selesai/i), { target: { value: "2025-12-31" } });
    fireEvent.submit(endForm);

    expect(await screen.findByText(/assignment selesai/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /akhiri assignment/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /simpan/i })).not.toBeInTheDocument();
  });

  it("rejects an end date earlier than the start date before sending the mutation (T005)", async () => {
    await renderDetail(baseDetailMocks);

    const endForm = await screen.findByRole("button", { name: /akhiri assignment/i }).then((b) => b.closest("form")!);
    fireEvent.change(within(endForm).getByLabelText(/tanggal selesai/i), { target: { value: "2025-06-30" } });
    fireEvent.submit(endForm);

    expect(await screen.findByText(/tidak boleh lebih awal dari tanggal mulai/i)).toBeInTheDocument();
    expect(screen.queryByText(/assignment selesai/i)).toBeNull();
  });

  it("requires the end date to be filled before ending (FR-06)", async () => {
    await renderDetail(baseDetailMocks);

    const endForm = await screen.findByRole("button", { name: /akhiri assignment/i }).then((b) => b.closest("form")!);
    fireEvent.submit(endForm);

    expect(await screen.findByText(/tanggal selesai wajib diisi/i)).toBeInTheDocument();
  });

  it("shows a server rejection from the end mutation as a clear message (T005)", async () => {
    await renderDetail([
      ...baseDetailMocks,
      {
        request: { query: EndAssignmentDocument, variables: { id: "asg-1", periodEnd: "2025-12-31" } },
        result: {
          errors: [
            new GraphQLError("assignment sudah selesai sebelumnya", {
              extensions: { code: "PRECONDITION_FAILED" },
            }),
          ],
        },
      },
    ]);

    const endForm = await screen.findByRole("button", { name: /akhiri assignment/i }).then((b) => b.closest("form")!);
    fireEvent.change(within(endForm).getByLabelText(/tanggal selesai/i), { target: { value: "2025-12-31" } });
    fireEvent.submit(endForm);

    expect(await screen.findByText("assignment sudah selesai sebelumnya")).toBeInTheDocument();
    // Masih berjalan — tombol aksi tetap tersedia.
    expect(screen.getByRole("button", { name: /akhiri assignment/i })).toBeInTheDocument();
  });

  for (const role of ["OPERATION", "TALENT"] as const) {
    it(`hides the edit and end actions for ${role} (T033)`, async () => {
      auth.role = role;
      await renderDetail([{ request: { query: AssignmentsDocument, variables: { first: 100 } }, result: assignmentsResult }]);

      expect(await screen.findByText("Talent")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /akhiri assignment/i })).toBeNull();
      expect(screen.queryByRole("button", { name: /simpan/i })).toBeNull();
    });
  }
});