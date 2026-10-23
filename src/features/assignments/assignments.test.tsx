// @vitest-environment jsdom

import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MockedProvider, type MockedResponse } from "@apollo/client/testing";
import { GraphQLError, Kind, parse, visit, type FieldNode } from "graphql";
import AssignmentsPage from "@/app/(app)/assignments/page";
import NewAssignmentPage from "@/app/(app)/assignments/new/page";
import AssignmentDetailPage from "@/app/(app)/assignments/[id]/page";
import { ToastProvider } from "@/components/Toast";
import {
  AssignableTalentsDocument,
  AssignmentsDocument,
  CreateAssignmentDocument,
  EmployeesDocument,
  EndAssignmentDocument,
  ProjectsDocument,
  UpdateAssignmentDocument,
} from "@/generated/graphql";

const auth = vi.hoisted(() => ({ role: "CHAPTER" as string | null }));
const nav = vi.hoisted(() => ({ push: vi.fn() }));
const redirect = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => nav,
  redirect,
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
  function renderPage(mocks: ReadonlyArray<MockedResponse>) {
    render(
      <MockedProvider mocks={mocks}>
        <ToastProvider>
          <AssignmentsPage />
        </ToastProvider>
      </MockedProvider>
    );
  }

  it("renders the assignment list after the queries resolve", async () => {
    renderPage([
      { request: { query: AssignableTalentsDocument, variables: { first: 100 } }, result: { data: { assignableTalents: { __typename: "EmployeeConnection", edges: [{ __typename: "EmployeeEdge", node: assignableTalentNode }] } } } },
      { request: { query: ProjectsDocument, variables: { includeInactive: true } }, result: projectsResult },
      { request: { query: AssignmentsDocument, variables: { filter: {}, first: 100 } }, result: assignmentsResult },
    ]);

    expect(await screen.findByRole("link", { name: "Andi Pratama" })).toBeInTheDocument();
    expect(screen.getAllByText("Network Modernization").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("button", { name: /buat assignment/i })).toBeInTheDocument();
    // O4 — label status seragam: ACTIVE tampil sebagai "Berjalan" (bukan "Aktif").
    expect(screen.getByText("Berjalan")).toBeInTheDocument();
    // TAN-133 — peran bukan lagi bagian assignment: tidak ada "Engineer" di mana pun.
    expect(screen.queryByText("Engineer")).toBeNull();
  });

  // UAT K6 (T009) — US3-2/SC-004: assignment yang sudah diakhiri tetap tampil
  // sebagai data historis, lengkap dengan periodenya — riwayat tidak berkurang.
  it("keeps completed assignments visible in the history (US3-2/SC-004)", async () => {
    const completedNode = {
      __typename: "Assignment",
      id: "asg-9",
      status: "COMPLETED",
      periodStart: "2025-01-01",
      periodEnd: "2025-06-30",
      talent: { __typename: "Employee", id: "emp-1", fullName: "Andi Pratama", nomorInduk: "EMP-001" },
      project: { __typename: "Project", id: "prj-1", name: "Network Modernization" },
    };
    renderPage([
      { request: { query: AssignableTalentsDocument, variables: { first: 100 } }, result: { data: { assignableTalents: { __typename: "EmployeeConnection", edges: [{ __typename: "EmployeeEdge", node: assignableTalentNode }] } } } },
      { request: { query: ProjectsDocument, variables: { includeInactive: true } }, result: projectsResult },
      {
        request: { query: AssignmentsDocument, variables: { filter: {}, first: 100 } },
        result: {
          data: {
            assignments: {
              __typename: "AssignmentConnection",
              totalCount: 2,
              edges: [
                { __typename: "AssignmentEdge", cursor: "asg-1", node: assignmentNode },
                { __typename: "AssignmentEdge", cursor: "asg-9", node: completedNode },
              ],
              pageInfo: { __typename: "PageInfo", hasNextPage: false, endCursor: null },
            },
          },
        },
      },
    ]);

    expect(await screen.findAllByRole("link", { name: "Andi Pratama" })).toHaveLength(2);
    expect(screen.getByText("Berjalan")).toBeInTheDocument();
    expect(screen.getByText("Selesai")).toBeInTheDocument();
    expect(screen.getByText("2025-01-01 — 2025-06-30")).toBeInTheDocument();
  });

  // UAT K6 (T009) — US4-1: daftar per project — memilih project memfilter
  // daftar; talent dalam cakupan chapter tampil beserta periodenya — tanpa
  // peran assignment (dihapus dari model, keputusan TAN-133).
  it("filters the list by project without a role column (US4-1)", async () => {
    const filteredNode = {
      __typename: "Assignment",
      id: "asg-7",
      status: "ACTIVE",
      periodStart: "2025-08-01",
      periodEnd: null,
      talent: { __typename: "Employee", id: "emp-2", fullName: "Rina Kartika", nomorInduk: "EMP-002" },
      project: { __typename: "Project", id: "prj-1", name: "Network Modernization" },
    };
    renderPage([
      { request: { query: AssignableTalentsDocument, variables: { first: 100 } }, result: { data: { assignableTalents: { __typename: "EmployeeConnection", edges: [{ __typename: "EmployeeEdge", node: assignableTalentNode }] } } } },
      { request: { query: ProjectsDocument, variables: { includeInactive: true } }, result: projectsResult },
      { request: { query: AssignmentsDocument, variables: { filter: {}, first: 100 } }, result: assignmentsResult },
      {
        request: { query: AssignmentsDocument, variables: { filter: { projectId: "prj-1" }, first: 100 } },
        result: {
          data: {
            assignments: {
              __typename: "AssignmentConnection",
              totalCount: 1,
              edges: [{ __typename: "AssignmentEdge", cursor: "asg-7", node: filteredNode }],
              pageInfo: { __typename: "PageInfo", hasNextPage: false, endCursor: null },
            },
          },
        },
      },
    ]);

    await screen.findByRole("link", { name: "Andi Pratama" });
    fireEvent.click(screen.getByRole("button", { name: "Filter" }));
    fireEvent.change(screen.getByLabelText("Project"), { target: { value: "prj-1" } });

    // Query ulang berjalan dengan filter project; hasilnya talent + periode,
    // tanpa peran assignment.
    expect(await screen.findByRole("link", { name: "Rina Kartika" })).toBeInTheDocument();
    expect(screen.getByText("2025-08-01 — sekarang")).toBeInTheDocument();
    expect(screen.queryByText("Engineer")).toBeNull();
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
    expect(screen.queryByRole("button", { name: /buat assignment/i })).toBeNull();

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
    expect(screen.queryByRole("button", { name: /buat assignment/i })).toBeNull();
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

describe("CreateAssignmentModal (TAN-316)", () => {
  const createProjectsResult = {
    data: {
      projects: [
        ...projectsResult.data.projects,
        { __typename: "Project", id: "prj-3", name: "Legacy System", isActive: false, unit },
      ],
    },
  };
  const baseMocks = [
    { request: { query: ProjectsDocument, variables: { includeInactive: true } }, result: createProjectsResult },
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
    { request: { query: AssignmentsDocument, variables: { filter: {}, first: 100 } }, result: assignmentsResult },
    {
      request: {
        query: CreateAssignmentDocument,
        variables: {
          input: {
            employeeId: "emp-1",
            projectId: "prj-1",
            periodStart: "2025-07-01",
            periodEnd: undefined,
          },
        },
      },
      result: { data: { createAssignment: { id: "asg-2", status: "ACTIVE", __typename: "Assignment" } } },
    },
    {
      request: {
        query: CreateAssignmentDocument,
        variables: {
          input: {
            employeeId: "emp-1",
            projectId: "prj-1",
            periodStart: "2025-07-01",
            periodEnd: "2025-12-31",
          },
        },
      },
      result: { data: { createAssignment: { id: "asg-3", status: "ACTIVE", __typename: "Assignment" } } },
    },
  ];

  function renderListWithCreate(mocks: ReadonlyArray<MockedResponse> = baseMocks) {
    render(
      <MockedProvider mocks={mocks}>
        <ToastProvider>
          <AssignmentsPage />
        </ToastProvider>
      </MockedProvider>
    );
  }

  async function openCreateModal() {
    await screen.findByRole("link", { name: "Andi Pratama" });
    fireEvent.click(screen.getByRole("button", { name: /buat assignment/i }));
    expect(screen.getByRole("dialog", { name: /buat assignment/i })).toBeInTheDocument();
    await screen.findByRole("combobox", { name: /talent/i });
  }

  function fillCreateForm() {
    fireEvent.change(screen.getByRole("combobox", { name: /talent/i }), {
      target: { value: "emp-1" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: /project/i }), {
      target: { value: "prj-1" },
    });
    fireEvent.change(screen.getByLabelText(/tanggal mulai/i), { target: { value: "2025-07-01" } });
  }

  it("opens the create modal when the button is clicked", async () => {
    renderListWithCreate();
    await openCreateModal();

    expect(screen.getByRole("dialog", { name: /buat assignment/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /talent/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /project/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/tanggal mulai/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tanggal selesai/i)).toBeInTheDocument();
  });

  it("closes the modal when Batal is clicked", async () => {
    renderListWithCreate();
    await openCreateModal();

    fireEvent.click(screen.getByRole("button", { name: /batal/i }));
    expect(screen.queryByRole("dialog", { name: /buat assignment/i })).toBeNull();
  });

  it("only offers assignable talents on the form", async () => {
    renderListWithCreate();
    await openCreateModal();

    const talentSelect = screen.getByRole("combobox", { name: /talent/i });
    const options = Array.from(talentSelect.querySelectorAll("option")).map((o) => o.textContent);
    expect(options.some((t) => t?.includes("Eko Prasetyo"))).toBe(false);
    expect(options.some((t) => t?.includes("Andi Pratama"))).toBe(true);
  });

  it("shows required-field errors on an empty submit", async () => {
    renderListWithCreate();
    await openCreateModal();

    fireEvent.submit(screen.getByRole("form", { name: /buat assignment/i }));

    expect(screen.getByText(/talent wajib dipilih/i)).toBeInTheDocument();
    expect(screen.getByText(/project wajib dipilih/i)).toBeInTheDocument();
    expect(screen.getByText(/tanggal mulai wajib diisi/i)).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: /job role/i })).toBeNull();
    expect(screen.queryByText(/job role wajib dipilih/i)).toBeNull();
  });

  it("creates the assignment, closes the modal, and shows a success toast", async () => {
    const listRefreshMocks = [
      ...baseMocks,
      { request: { query: AssignmentsDocument, variables: { filter: {}, first: 100 } }, result: assignmentsResult },
    ];
    renderListWithCreate(listRefreshMocks);
    await openCreateModal();

    fillCreateForm();
    fireEvent.submit(screen.getByRole("form", { name: /buat assignment/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/berhasil dibuat/i);
    expect(screen.queryByRole("dialog", { name: /buat assignment/i })).toBeNull();
  });

  it("only offers active master data for project (US1-3)", async () => {
    renderListWithCreate();
    await openCreateModal();

    const projectOptions = Array.from(
      screen.getByRole("combobox", { name: /project/i }).querySelectorAll("option")
    ).map((o) => o.textContent);
    expect(projectOptions.some((t) => t?.includes("Legacy System"))).toBe(false);
    expect(projectOptions.some((t) => t?.includes("Network Modernization"))).toBe(true);

    expect(screen.queryByRole("combobox", { name: /job role/i })).toBeNull();
  });

  it("sends the filled end date in the create payload (FR-01)", async () => {
    renderListWithCreate();
    await openCreateModal();

    fillCreateForm();
    fireEvent.change(screen.getByLabelText(/tanggal selesai/i), { target: { value: "2025-12-31" } });
    fireEvent.submit(screen.getByRole("form", { name: /buat assignment/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/berhasil dibuat/i);
  });

  const errorFormMocks = baseMocks.slice(0, 3);
  function renderWithError(createMock: MockedResponse) {
    renderListWithCreate([...errorFormMocks, createMock]);
  }

  it("maps a server date rejection to a per-field message on the end-date input (T007)", async () => {
    renderWithError({
      request: {
        query: CreateAssignmentDocument,
        variables: {
          input: {
            employeeId: "emp-1",
            projectId: "prj-1",
            periodStart: "2025-07-01",
            periodEnd: "2025-06-30",
          },
        },
      },
      result: {
        errors: [
          new GraphQLError("invalid periodEnd: must not precede periodStart", {
            extensions: { code: "BAD_USER_INPUT", field: "periodEnd" },
          }),
        ],
      },
    });
    await openCreateModal();
    fillCreateForm();
    fireEvent.change(screen.getByLabelText(/tanggal selesai/i), { target: { value: "2025-06-30" } });
    fireEvent.submit(screen.getByRole("form", { name: /buat assignment/i }));

    expect(await screen.findByText("Tanggal selesai tidak boleh lebih awal dari tanggal mulai.")).toBeInTheDocument();
    const periodEndField = screen.getByLabelText(/tanggal selesai/i).closest("label")!;
    expect(within(periodEndField).getByText(/tidak boleh lebih awal/i)).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: /buat assignment/i })).toBeInTheDocument();
  });

  it("maps a duplicate-active CONFLICT rejection to a clear action message (T007)", async () => {
    renderWithError({
      request: {
        query: CreateAssignmentDocument,
        variables: {
          input: {
            employeeId: "emp-1",
            projectId: "prj-1",
            periodStart: "2025-07-01",
            periodEnd: undefined,
          },
        },
      },
      result: {
        errors: [
          new GraphQLError("resource already exists", {
            extensions: { code: "CONFLICT" },
          }),
        ],
      },
    });
    await openCreateModal();
    fillCreateForm();
    fireEvent.submit(screen.getByRole("form", { name: /buat assignment/i }));

    expect(
      await screen.findByText("Talent ini sudah memiliki assignment aktif pada project tersebut.")
    ).toBeInTheDocument();
    expect(screen.queryByText(/resource already exists/i)).toBeNull();
    expect(screen.getByRole("dialog", { name: /buat assignment/i })).toBeInTheDocument();
  });

  it("maps a FORBIDDEN rejection to a clear action message (T007)", async () => {
    renderWithError({
      request: {
        query: CreateAssignmentDocument,
        variables: {
          input: {
            employeeId: "emp-1",
            projectId: "prj-1",
            periodStart: "2025-07-01",
            periodEnd: undefined,
          },
        },
      },
      result: {
        errors: [
          new GraphQLError("operation not permitted", {
            extensions: { code: "FORBIDDEN" },
          }),
        ],
      },
    });
    await openCreateModal();
    fillCreateForm();
    fireEvent.submit(screen.getByRole("form", { name: /buat assignment/i }));

    expect(await screen.findByText("Anda tidak memiliki izin untuk aksi ini.")).toBeInTheDocument();
    expect(screen.queryByText(/operation not permitted/i)).toBeNull();
    expect(screen.getByRole("dialog", { name: /buat assignment/i })).toBeInTheDocument();
  });
});

describe("NewAssignmentPage redirect (TAN-316)", () => {
  beforeEach(() => {
    redirect.mockClear();
  });

  it("redirects /assignments/new to /assignments", () => {
    NewAssignmentPage();
    expect(redirect).toHaveBeenCalledWith("/assignments");
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
  const baseDetailMocks = [
    { request: { query: AssignmentsDocument, variables: { first: 100 } }, result: assignmentsResult },
    { request: { query: ProjectsDocument, variables: { includeInactive: true } }, result: detailProjectsResult },
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
    // TAN-133 — peran tidak lagi dirender pada detail.
    expect(screen.queryByText("Engineer")).toBeNull();
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
            input: { projectId: "prj-2", periodStart: "2025-08-01", periodEnd: "2026-01-31" },
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
            },
          },
        },
      },
    ]);

    const editForm = await screen.findByRole("button", { name: /simpan/i }).then((b) => b.closest("form")!);
    // Master data nonaktif tidak lagi jadi pilihan (T002); peran tidak lagi
    // diminta pada form ubah (TAN-133).
    expect(within(editForm).queryByText("Legacy System")).toBeNull();
    expect(within(editForm).queryByRole("combobox", { name: /job role/i })).toBeNull();

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

  it("maps a server date rejection on the edit form to a per-field message (T006/T007)", async () => {
    await renderDetail([
      ...baseDetailMocks,
      {
        request: {
          query: UpdateAssignmentDocument,
          variables: {
            id: "asg-1",
            input: { projectId: "prj-1", periodStart: "2025-07-01", periodEnd: "2025-12-31" },
          },
        },
        result: {
          errors: [
            new GraphQLError("invalid periodEnd: must not precede periodStart", {
              extensions: { code: "BAD_USER_INPUT", field: "periodEnd" },
            }),
          ],
        },
      },
    ]);

    const editForm = await screen.findByRole("button", { name: /simpan/i }).then((b) => b.closest("form")!);
    fireEvent.submit(editForm);

    // Pesan menempel pada field Tanggal Selesai di form ubah.
    const periodEndField = within(editForm).getByLabelText(/tanggal selesai/i).closest("label")!;
    expect(
      await within(periodEndField).findByText("Tanggal selesai tidak boleh lebih awal dari tanggal mulai.")
    ).toBeInTheDocument();
    expect(screen.queryByText(/perubahan tersimpan/i)).toBeNull();
  });

  it("maps a duplicate-active CONFLICT rejection on the edit form to a clear message (T007)", async () => {
    await renderDetail([
      ...baseDetailMocks,
      {
        request: {
          query: UpdateAssignmentDocument,
          variables: {
            id: "asg-1",
            input: { projectId: "prj-1", periodStart: "2025-07-01", periodEnd: "2025-12-31" },
          },
        },
        result: {
          errors: [
            new GraphQLError("resource already exists", {
              extensions: { code: "CONFLICT" },
            }),
          ],
        },
      },
    ]);

    const editForm = await screen.findByRole("button", { name: /simpan/i }).then((b) => b.closest("form")!);
    fireEvent.submit(editForm);

    expect(
      await screen.findByText("Talent ini sudah memiliki assignment aktif pada project tersebut.")
    ).toBeInTheDocument();
    expect(screen.queryByText(/perubahan tersimpan/i)).toBeNull();
  });

  it("maps a FORBIDDEN rejection on the edit form to a clear message (T007)", async () => {
    await renderDetail([
      ...baseDetailMocks,
      {
        request: {
          query: UpdateAssignmentDocument,
          variables: {
            id: "asg-1",
            input: { projectId: "prj-1", periodStart: "2025-07-01", periodEnd: "2025-12-31" },
          },
        },
        result: {
          errors: [
            new GraphQLError("operation not permitted", {
              extensions: { code: "FORBIDDEN" },
            }),
          ],
        },
      },
    ]);

    const editForm = await screen.findByRole("button", { name: /simpan/i }).then((b) => b.closest("form")!);
    fireEvent.submit(editForm);

    expect(await screen.findByText("Anda tidak memiliki izin untuk aksi ini.")).toBeInTheDocument();
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

/**
 * Bukti (c) TAN-252 — tidak ada lagi permintaan GraphQL yang menyeleksi
 * `jobRole` pada assignment. Setiap dokumen `.graphql` di `src/features`
 * diparse, lalu seleksi `jobRole` di dalam selection set bertipe Assignment
 * (assignments, activeAssignments, workExperience pada CvProfile,
 * createAssignment/updateAssignment/endAssignment) ditolak. Seleksi
 * `jobRole` pada Employee/kontrak kerja tetap sah — hanya peran assignment
 * yang dihapus (TAN-133).
 */
describe("assignment jobRole removal (TAN-252, bukti c)", () => {
  const ASSIGNMENT_RETURNING_FIELDS = new Set([
    "assignment",
    "assignments",
    "activeAssignments",
    "workExperience",
    "createAssignment",
    "updateAssignment",
    "endAssignment",
  ]);

  function listGraphqlFiles(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) return listGraphqlFiles(full);
      return entry.name.endsWith(".graphql") ? [full] : [];
    });
  }

  it("no operation document selects jobRole inside an assignment selection set", () => {
    const featuresDir = join(process.cwd(), "src", "features");
    const violations: string[] = [];

    for (const file of listGraphqlFiles(featuresDir)) {
      const doc = parse(readFileSync(file, "utf8"));
      visit(doc, {
        Field: {
          enter(node, _key, _parent, _path, ancestors) {
            if (node.name.value !== "jobRole") return;
            const parentFields = ancestors
              .filter((a): a is FieldNode => "kind" in a && a.kind === Kind.FIELD)
              .map((a) => a.name.value);
            if (parentFields.some((name) => ASSIGNMENT_RETURNING_FIELDS.has(name))) {
              violations.push(`${relative(featuresDir, file)}: ${parentFields.join(".")}.jobRole`);
            }
          },
        },
      });
    }

    expect(violations).toEqual([]);
  });
});