// @vitest-environment jsdom

import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { ToastProvider } from "@/components/Toast";
import ChaptersPage from "@/app/(app)/master-data/chapters/page";
import JobRolesPage from "@/app/(app)/master-data/job-roles/page";
import ProjectsPage from "@/app/(app)/master-data/projects/page";
import UnitsPage from "@/app/(app)/master-data/units/page";
import {
  ChaptersDocument,
  CreateUnitDocument,
  JobRolesDocument,
  ProjectsDocument,
  SetUnitActiveDocument,
  UnitsDocument,
  UpdateUnitDocument,
} from "@/generated/graphql";

const UNITS_QUERY = {
  request: { query: UnitsDocument, variables: { includeInactive: true } },
  result: {
    data: {
      units: [
        {
          id: "u-1",
          code: "DBT",
          name: "Digital Business & Technology",
          isActive: true,
          projects: [],
          __typename: "Unit",
        },
      ],
    },
  },
};

// Master-data pages read the session role from the guard: Admin manages, Chapter
// and Operation get the same list read-only (2026-10-16 clarify 6).
const auth = vi.hoisted(() => ({ role: "ADMIN" as string | null }));
vi.mock("@/lib/auth/guard", () => ({
  useSessionRole: () => auth.role,
  AuthGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

beforeEach(() => {
  auth.role = "ADMIN";
});

describe("master-data CRUD (Admin) — T052/T054", () => {
  it("creates a unit and shows the success toast", async () => {
    const mocks = [
      UNITS_QUERY,
      {
        request: { query: CreateUnitDocument, variables: { code: "ENG", name: "Engineering" } },
        result: {
          data: {
            createUnit: { id: "u-2", code: "ENG", name: "Engineering", isActive: true, projects: [], __typename: "Unit" },
          },
        },
      },
      UNITS_QUERY,
    ];
    render(
      <MockedProvider mocks={mocks}>
        <ToastProvider>
          <UnitsPage />
        </ToastProvider>
      </MockedProvider>
    );

    expect(await screen.findByText("Digital Business & Technology")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tambah Unit" }));
    fireEvent.change(screen.getByLabelText("Kode Unit"), { target: { value: "ENG" } });
    fireEvent.change(screen.getByLabelText("Nama Unit"), { target: { value: "Engineering" } });
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    expect(await screen.findByRole("alert")).toHaveTextContent('Unit "Engineering" berhasil dibuat.');
  });

  it("renames a unit via the edit form", async () => {
    const mocks = [
      UNITS_QUERY,
      {
        request: { query: UpdateUnitDocument, variables: { id: "u-1", code: "DBT", name: "Digital" } },
        result: {
          data: {
            updateUnit: { id: "u-1", code: "DBT", name: "Digital", isActive: true, projects: [], __typename: "Unit" },
          },
        },
      },
      UNITS_QUERY,
    ];
    render(
      <MockedProvider mocks={mocks}>
        <ToastProvider>
          <UnitsPage />
        </ToastProvider>
      </MockedProvider>
    );

    expect(await screen.findByText("Digital Business & Technology")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Aksi Digital Business & Technology" }));
    fireEvent.click(screen.getByRole("button", { name: "Ubah" }));
    fireEvent.change(screen.getByLabelText("Nama Unit"), { target: { value: "Digital" } });
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Unit berhasil diubah.");
  });

  it("deactivates a unit and shows the success toast", async () => {
    const mocks = [
      UNITS_QUERY,
      {
        request: { query: SetUnitActiveDocument, variables: { id: "u-1", isActive: false } },
        result: {
          data: {
            setUnitActive: { id: "u-1", code: "DBT", name: "Digital Business & Technology", isActive: false, projects: [], __typename: "Unit" },
          },
        },
      },
      UNITS_QUERY,
    ];
    render(
      <MockedProvider mocks={mocks}>
        <ToastProvider>
          <UnitsPage />
        </ToastProvider>
      </MockedProvider>
    );

    expect(await screen.findByText("Digital Business & Technology")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Aksi Digital Business & Technology" }));
    fireEvent.click(screen.getByRole("button", { name: "Nonaktifkan" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Unit berhasil dinonaktifkan.");
  });

  it("surfaces the server validation message when deactivation is rejected (T054)", async () => {
    const serverMessage = "Unit masih direferensikan oleh proyek, tidak dapat dinonaktifkan.";
    const mocks = [
      UNITS_QUERY,
      {
        request: { query: SetUnitActiveDocument, variables: { id: "u-1", isActive: false } },
        error: new Error(serverMessage),
      },
    ];
    render(
      <MockedProvider mocks={mocks}>
        <ToastProvider>
          <UnitsPage />
        </ToastProvider>
      </MockedProvider>
    );

    expect(await screen.findByText("Digital Business & Technology")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Aksi Digital Business & Technology" }));
    fireEvent.click(screen.getByRole("button", { name: "Nonaktifkan" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(serverMessage);
  });

  it("blocks creating a unit with an empty name (client-side)", async () => {
    render(
      <MockedProvider mocks={[UNITS_QUERY]}>
        <ToastProvider>
          <UnitsPage />
        </ToastProvider>
      </MockedProvider>
    );

    expect(await screen.findByText("Digital Business & Technology")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tambah Unit" }));
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() => expect(screen.getByText("Nama Unit wajib diisi.")).toBeInTheDocument());
  });
});
// --- Pencarian daftar master data (TAN-180, 003-master-data-search) ---

const UNITS_SEARCH_ROWS = [
  {
    id: "u-1",
    name: "Digital Business & Technology",
    isActive: true,
    projects: [],
    __typename: "Unit",
  },
  {
    id: "u-2",
    name: "Human Capital",
    isActive: true,
    projects: [{ id: "p-1", name: "People Program", __typename: "Project" }],
    __typename: "Unit",
  },
  {
    id: "u-3",
    name: "Digital Marketing",
    isActive: false,
    projects: [],
    __typename: "Unit",
  },
];

function renderUnitsPage(units: unknown[]) {
  render(
    <MockedProvider
      mocks={[
        {
          request: { query: UnitsDocument, variables: { includeInactive: true } },
          result: { data: { units } },
        },
      ]}
    >
      <ToastProvider>
        <UnitsPage />
      </ToastProvider>
    </MockedProvider>
  );
}

function unitSearchbox() {
  return screen.getByRole("searchbox", { name: "Cari nama unit" });
}

describe("master-data search (FR-001–FR-008)", () => {
  it("filters the unit list live, by substring and regardless of case (FR-001, FR-002, US3)", async () => {
    renderUnitsPage(UNITS_SEARCH_ROWS);
    await screen.findByText("Digital Business & Technology");

    fireEvent.change(unitSearchbox(), { target: { value: "DIGITAL" } });

    expect(screen.getByText("Digital Business & Technology")).toBeInTheDocument();
    expect(screen.getByText("Digital Marketing")).toBeInTheDocument();
    expect(screen.queryByText("Human Capital")).not.toBeInTheDocument();

    fireEvent.change(unitSearchbox(), { target: { value: "capital" } });
    expect(screen.getByText("Human Capital")).toBeInTheDocument();
    expect(screen.queryByText("Digital Business & Technology")).not.toBeInTheDocument();

    // Clearing the keyword restores the full list (FR-007).
    fireEvent.change(unitSearchbox(), { target: { value: "" } });
    expect(screen.getByText("Digital Business & Technology")).toBeInTheDocument();
    expect(screen.getByText("Human Capital")).toBeInTheDocument();
    expect(screen.getByText("Digital Marketing")).toBeInTheDocument();
  });

  it("shows the no-match message, not the empty-data state (FR-006)", async () => {
    renderUnitsPage(UNITS_SEARCH_ROWS);
    await screen.findByText("Digital Business & Technology");

    fireEvent.change(unitSearchbox(), { target: { value: "zzz" } });

    expect(screen.getByText("Tidak ada hasil yang cocok dengan pencarian.")).toBeInTheDocument();
    expect(screen.queryByText("Belum ada unit. Tambahkan unit pertama.")).not.toBeInTheDocument();
  });

  it("keeps a truly empty list on its empty-data message", async () => {
    renderUnitsPage([]);

    expect(await screen.findByText("Belum ada unit. Tambahkan unit pertama.")).toBeInTheDocument();
    expect(screen.queryByText("Tidak ada hasil yang cocok dengan pencarian.")).not.toBeInTheDocument();
    expect(screen.queryAllByRole("searchbox")).toHaveLength(0);
  });

  it("filters inactive rows too, badge included (FR-004)", async () => {
    renderUnitsPage(UNITS_SEARCH_ROWS);
    await screen.findByText("Digital Business & Technology");

    fireEvent.change(unitSearchbox(), { target: { value: "digital marketing" } });

    expect(screen.getByText("Digital Marketing")).toBeInTheDocument();
    expect(screen.getByText("Nonaktif")).toBeInTheDocument();
  });

  it("treats a whitespace-only keyword as no filter (FR-007)", async () => {
    renderUnitsPage(UNITS_SEARCH_ROWS);
    await screen.findByText("Digital Business & Technology");

    fireEvent.change(unitSearchbox(), { target: { value: "   " } });

    expect(screen.getByText("Digital Business & Technology")).toBeInTheDocument();
    expect(screen.getByText("Human Capital")).toBeInTheDocument();
    expect(screen.getByText("Digital Marketing")).toBeInTheDocument();
  });

  it("paginates the filtered result and never leaves an empty page (FR-005)", async () => {
    const manyUnits = Array.from({ length: 11 }, (_, i) => ({
      id: `u-${i + 1}`,
      name: `Unit ${String(i + 1).padStart(2, "0")}`,
      isActive: true,
      projects: [],
      __typename: "Unit",
    })).concat([
      { id: "u-12", name: "Zeta Target", isActive: true, projects: [], __typename: "Unit" },
    ]);
    renderUnitsPage(manyUnits);
    await screen.findByText("Unit 01");

    fireEvent.click(screen.getByRole("button", { name: "Halaman berikutnya" }));
    expect(screen.getByText("Zeta Target")).toBeInTheDocument();

    // The match lives on the last page; the older page number must not survive.
    fireEvent.change(unitSearchbox(), { target: { value: "zeta" } });

    expect(screen.getByText("Zeta Target")).toBeInTheDocument();
    expect(screen.queryByText("Tidak ada hasil yang cocok dengan pencarian.")).not.toBeInTheDocument();
    expect(
      screen.getByText((_, el) => el?.textContent === "Menampilkan 1–1 dari 1"),
    ).toBeInTheDocument();
  });

  it("leaves an open create form untouched while searching (FR-008)", async () => {
    renderUnitsPage(UNITS_SEARCH_ROWS);
    await screen.findByText("Digital Business & Technology");

    fireEvent.click(screen.getByRole("button", { name: "Tambah Unit" }));
    fireEvent.change(screen.getByLabelText("Nama Unit"), { target: { value: "Engineering" } });

    fireEvent.change(unitSearchbox(), { target: { value: "capital" } });

    expect(screen.getByLabelText("Nama Unit")).toHaveValue("Engineering");
    expect(screen.getByRole("button", { name: "Simpan" })).toBeInTheDocument();
    expect(screen.getByText("Human Capital")).toBeInTheDocument();
    expect(screen.queryByText("Digital Business & Technology")).not.toBeInTheDocument();
  });

  it("does not put a search field on the chapter list (R3, Out of Scope)", async () => {
    render(
      <MockedProvider
        mocks={[
          {
            request: { query: ChaptersDocument, variables: { includeInactive: true } },
            result: {
              data: {
                chapters: [
                  { id: "c-1", name: "Engineering", isActive: true, jobRoles: [], __typename: "Chapter" },
                ],
              },
            },
          },
        ]}
      >
        <ToastProvider>
          <ChaptersPage />
        </ToastProvider>
      </MockedProvider>
    );

    expect(await screen.findByText("Engineering")).toBeInTheDocument();
    expect(screen.queryAllByRole("searchbox")).toHaveLength(0);
  });
});

describe("master-data search per page (US1, US2)", () => {
  const JOB_ROLES_ROWS = [
    {
      id: "r-1",
      name: "Backend Engineer",
      isActive: true,
      chapter: { id: "c-1", name: "Engineering", __typename: "Chapter" },
      __typename: "JobRole",
    },
    {
      id: "r-2",
      name: "Product Designer",
      isActive: true,
      chapter: null,
      __typename: "JobRole",
    },
  ];

  const PROJECTS_ROWS = [
    {
      id: "p-1",
      name: "Alpha Transformation",
      isActive: true,
      unit: { id: "u-1", name: "Digital Business", __typename: "Unit" },
      __typename: "Project",
    },
    {
      id: "p-2",
      name: "Beta Rollout",
      isActive: false,
      unit: { id: "u-2", name: "Human Capital", __typename: "Unit" },
      __typename: "Project",
    },
  ];

  it("filters job roles by name and keeps the chapter column (US1)", async () => {
    render(
      <MockedProvider
        mocks={[
          {
            request: { query: JobRolesDocument, variables: { includeInactive: true } },
            result: { data: { jobRoles: JOB_ROLES_ROWS } },
          },
          {
            request: { query: ChaptersDocument, variables: { includeInactive: true } },
            result: {
              data: {
                chapters: [
                  { id: "c-1", name: "Engineering", isActive: true, jobRoles: [], __typename: "Chapter" },
                ],
              },
            },
          },
        ]}
      >
        <ToastProvider>
          <JobRolesPage />
        </ToastProvider>
      </MockedProvider>
    );
    await screen.findByText("Backend Engineer");

    fireEvent.change(screen.getByRole("searchbox", { name: "Cari nama job role" }), {
      target: { value: "designer" },
    });

    expect(screen.getByText("Product Designer")).toBeInTheDocument();
    expect(screen.getByText("Tanpa chapter")).toBeInTheDocument();
    expect(screen.queryByText("Backend Engineer")).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole("searchbox", { name: "Cari nama job role" }), {
      target: { value: "" },
    });
    expect(screen.getByText("Backend Engineer")).toBeInTheDocument();
    expect(screen.getByText("Engineering")).toBeInTheDocument();
  });

  it("filters projects by name and keeps the unit column (US2)", async () => {
    render(
      <MockedProvider
        mocks={[
          {
            request: { query: ProjectsDocument, variables: { includeInactive: true } },
            result: { data: { projects: PROJECTS_ROWS } },
          },
          {
            request: { query: UnitsDocument, variables: { includeInactive: true } },
            result: {
              data: {
                units: [
                  {
                    id: "u-2",
                    name: "Human Capital",
                    isActive: true,
                    projects: [],
                    __typename: "Unit",
                  },
                ],
              },
            },
          },
        ]}
      >
        <ToastProvider>
          <ProjectsPage />
        </ToastProvider>
      </MockedProvider>
    );
    await screen.findByText("Alpha Transformation");

    fireEvent.change(screen.getByRole("searchbox", { name: "Cari nama proyek" }), {
      target: { value: "rollout" },
    });

    expect(screen.getByText("Beta Rollout")).toBeInTheDocument();
    expect(screen.getByText("Human Capital")).toBeInTheDocument();
    expect(screen.queryByText("Alpha Transformation")).not.toBeInTheDocument();
  });
});

describe("master-data read-only per role (matrix: lihat untuk semua peran)", () => {
  it("gives Chapter the units list without any edit surface", async () => {
    auth.role = "CHAPTER";
    render(
      <MockedProvider mocks={[UNITS_QUERY]}>
        <ToastProvider>
          <UnitsPage />
        </ToastProvider>
      </MockedProvider>
    );

    expect(await screen.findByText("Digital Business & Technology")).toBeInTheDocument();
    expect(screen.getByText(/hanya baca/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tambah Unit" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Aksi / })).toBeNull();
    expect(screen.queryByRole("columnheader", { name: "Aksi" })).toBeNull();
  });

  it("gives Talent the chapters list read-only, without the add action", async () => {
    auth.role = "TALENT";
    render(
      <MockedProvider
        mocks={[
          {
            request: { query: ChaptersDocument, variables: { includeInactive: true } },
            result: {
              data: {
                chapters: [
                  { id: "ch-1", name: "Product", isActive: true, jobRoles: [], __typename: "Chapter" },
                ],
              },
            },
          },
        ]}
      >
        <ToastProvider>
          <ChaptersPage />
        </ToastProvider>
      </MockedProvider>
    );

    expect(await screen.findByText("Product")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tambah Chapter" })).toBeNull();
  });
});
