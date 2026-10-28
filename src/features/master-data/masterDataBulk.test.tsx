// @vitest-environment jsdom

import * as React from "react";
import type { DocumentNode } from "graphql";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MockedProvider, type MockedResponse } from "@apollo/client/testing";
import { ToastProvider } from "@/components/Toast";
import ChaptersPage from "@/app/(app)/master-data/chapters/page";
import JobRolesPage from "@/app/(app)/master-data/job-roles/page";
import ProjectsPage from "@/app/(app)/master-data/projects/page";
import UnitsPage from "@/app/(app)/master-data/units/page";
import {
  BulkSetChapterActiveDocument,
  BulkSetJobRoleActiveDocument,
  BulkSetJobRoleChapterDocument,
  BulkSetUnitActiveDocument,
  ChaptersDocument,
  JobRolesDocument,
  ProjectsDocument,
  UnitsDocument,
} from "@/generated/graphql";

const auth = vi.hoisted(() => ({ role: "ADMIN" as string | null }));
vi.mock("@/lib/auth/guard", () => ({
  useSessionRole: () => auth.role,
  AuthGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function bulkSetActiveMock(
  document: DocumentNode,
  resultKey: string,
  variables: Record<string, unknown>,
  failed: { index: number; message: string }[] = [],
): MockedResponse {
  return {
    request: { query: document, variables },
    result: {
      data: {
        [resultKey]: {
          __typename: "BulkUnitResult",
          succeeded: (variables.ids as string[])
            .map((_, index) => ({ __typename: "BulkUnitItemResult", index }))
            .filter((row) => !failed.some((failure) => failure.index === row.index)),
          failed: failed.map((failure) => ({
            __typename: "BulkUnitItemResult",
            index: failure.index,
            error: { __typename: "BulkMasterDataError", code: "REFERENCED", message: failure.message },
          })),
        },
      },
    },
  };
}

const UNITS_ROWS = [
  {
    id: "u-1",
    code: "DBT",
    name: "Digital Business & Technology",
    isActive: true,
    projects: [],
    __typename: "Unit",
  },
  {
    id: "u-2",
    code: "HC",
    name: "Human Capital",
    isActive: true,
    projects: [],
    __typename: "Unit",
  },
];

const unitsListMock: MockedResponse = {
  request: { query: UnitsDocument, variables: { includeInactive: true } },
  result: { data: { units: UNITS_ROWS } },
};

const unitsRefreshMock: MockedResponse = {
  request: { query: UnitsDocument, variables: { includeInactive: true } },
  result: { data: { units: [] } },
};

function renderPage(element: React.ReactElement, mocks: MockedResponse[]) {
  render(
    <MockedProvider mocks={mocks}>
      <ToastProvider>{element}</ToastProvider>
    </MockedProvider>,
  );
}

function selectAllRows() {
  fireEvent.click(screen.getByRole("checkbox", { name: "Pilih semua baris di halaman ini" }));
}

describe("master-data multi-select & aksi massal (TAN-351)", () => {
  it("hides selection from read-only roles (FR-07)", async () => {
    auth.role = "CHAPTER";
    renderPage(<UnitsPage />, [unitsListMock]);

    expect(await screen.findByText("Digital Business & Technology")).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: /Pilih/ })).toBeNull();
    expect(screen.queryByRole("toolbar")).toBeNull();
  });

  it("confirms bulk deactivation with a count summary before executing (FR-05, US3-3)", async () => {
    auth.role = "ADMIN";
    renderPage(
      <UnitsPage />,
      [
        unitsListMock,
        bulkSetActiveMock(BulkSetUnitActiveDocument, "bulkSetUnitActive", {
          ids: ["u-1", "u-2"],
          isActive: false,
        }),
        unitsRefreshMock,
      ],
    );

    expect(await screen.findByText("Digital Business & Technology")).toBeInTheDocument();
    selectAllRows();
    expect(screen.getByRole("toolbar", { name: "Aksi massal Unit" })).toHaveTextContent("2 dipilih");

    fireEvent.click(screen.getByRole("button", { name: "Nonaktifkan" }));
    const dialog = screen.getByRole("dialog", { name: "Nonaktifkan 2 Unit" });
    expect(dialog).toHaveTextContent("Nonaktifkan 2 unit terpilih?");
    expect(within(dialog).getByText("Digital Business & Technology")).toBeInTheDocument();

    // Batal tidak mengeksekusi apa pun dan seleksi tetap ada.
    fireEvent.click(within(dialog).getByRole("button", { name: "Batal" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("toolbar", { name: "Aksi massal Unit" })).toHaveTextContent("2 dipilih");

    fireEvent.click(screen.getByRole("button", { name: "Nonaktifkan" }));
    fireEvent.click(
      within(screen.getByRole("dialog", { name: "Nonaktifkan 2 Unit" })).getByRole("button", {
        name: "Nonaktifkan 2 unit",
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("2 unit berhasil dinonaktifkan massal.");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.queryByRole("toolbar")).toBeNull();
  });

  it("reports per-row results, including the server dependency explanation (FR-02, FR-04)", async () => {
    auth.role = "ADMIN";
    const dependencyMessage =
      'Unit "Human Capital" masih dipakai 2 initiative dan 1 kontrak — pindahkan referensinya terlebih dahulu.';
    renderPage(
      <UnitsPage />,
      [
        unitsListMock,
        bulkSetActiveMock(BulkSetUnitActiveDocument, "bulkSetUnitActive", {
          ids: ["u-1", "u-2"],
          isActive: false,
        }, [{ index: 1, message: dependencyMessage }]),
        unitsRefreshMock,
      ],
    );

    expect(await screen.findByText("Digital Business & Technology")).toBeInTheDocument();
    selectAllRows();
    fireEvent.click(screen.getByRole("button", { name: "Nonaktifkan" }));
    fireEvent.click(
      within(screen.getByRole("dialog", { name: "Nonaktifkan 2 Unit" })).getByRole("button", {
        name: "Nonaktifkan 2 unit",
      }),
    );

    const report = await screen.findByRole("status");
    expect(report).toHaveTextContent("1 baris berhasil, 1 gagal.");
    expect(report).toHaveTextContent(dependencyMessage);
    // Dialog tetap terbuka untuk ditinjau; Tutup mengosongkan seleksi.
    const dialog = screen.getByRole("dialog", { name: "Nonaktifkan 2 Unit" });
    const tutupButtons = within(dialog).getAllByRole("button", { name: "Tutup" });
    fireEvent.click(tutupButtons[tutupButtons.length - 1]);
    await waitFor(() => expect(screen.queryByRole("toolbar")).not.toBeInTheDocument());
  });

  it("activates selected rows in one click without a confirmation step (US3-5)", async () => {
    auth.role = "ADMIN";
    renderPage(
      <UnitsPage />,
      [
        unitsListMock,
        bulkSetActiveMock(BulkSetUnitActiveDocument, "bulkSetUnitActive", {
          ids: ["u-1"],
          isActive: true,
        }),
        unitsRefreshMock,
      ],
    );

    expect(await screen.findByText("Digital Business & Technology")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: "Pilih Digital Business & Technology" }));
    fireEvent.click(screen.getByRole("button", { name: "Aktifkan" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("1 unit berhasil diaktifkan massal.");
    await waitFor(() => expect(screen.queryByRole("toolbar")).not.toBeInTheDocument());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("applies the same owner chapter to selected job roles in one action (FR-03, US2-1)", async () => {
    auth.role = "ADMIN";
    renderPage(
      <JobRolesPage />,
      [
        {
          request: { query: JobRolesDocument, variables: { includeInactive: true } },
          result: {
            data: {
              jobRoles: [
                { id: "r-1", name: "Backend Engineer", isActive: true, chapter: null, __typename: "JobRole" },
                { id: "r-2", name: "Product Designer", isActive: true, chapter: null, __typename: "JobRole" },
              ],
            },
          },
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
        bulkSetActiveMock(BulkSetJobRoleActiveDocument, "bulkSetJobRoleActive", {
          ids: ["r-1", "r-2"],
          isActive: false,
        }),
        bulkSetActiveMock(BulkSetJobRoleChapterDocument, "bulkSetJobRoleChapter", {
          ids: ["r-1", "r-2"],
          chapterId: "c-1",
        }),
        {
          request: { query: JobRolesDocument, variables: { includeInactive: true } },
          result: { data: { jobRoles: [] } },
        },
      ],
    );

    expect(await screen.findByText("Backend Engineer")).toBeInTheDocument();
    selectAllRows();
    fireEvent.click(screen.getByRole("button", { name: "Ubah Chapter…" }));
    const dialog = screen.getByRole("dialog", { name: "Ubah Chapter Massal" });
    fireEvent.change(within(dialog).getByLabelText("Chapter"), { target: { value: "c-1" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Terapkan ke 2 job role" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("2 job role berhasil diubah massal.");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("requires the target unit when moving initiatives in bulk (FR-19)", async () => {
    auth.role = "ADMIN";
    renderPage(
      <ProjectsPage />,
      [
        {
          request: { query: ProjectsDocument, variables: { includeInactive: true } },
          result: {
            data: {
              projects: [
                {
                  id: "p-1",
                  name: "Alpha Transformation",
                  isActive: true,
                  unit: { id: "u-1", name: "Digital Business", __typename: "Unit" },
                  __typename: "Project",
                },
              ],
            },
          },
        },
        {
          request: { query: UnitsDocument, variables: { includeInactive: true } },
          result: {
            data: {
              units: [{ id: "u-1", name: "Digital Business", isActive: true, projects: [], __typename: "Unit" }],
            },
          },
        },
      ],
    );

    expect(await screen.findByText("Alpha Transformation")).toBeInTheDocument();
    selectAllRows();
    fireEvent.click(screen.getByRole("button", { name: "Ubah Unit…" }));
    const dialog = screen.getByRole("dialog", { name: "Ubah Unit Massal" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Terapkan ke 1 initiative" }));

    expect(await within(dialog).findByText("Unit wajib dipilih.")).toBeInTheDocument();
    // Validasi menahan eksekusi: tidak ada laporan hasil dan tidak ada toast sukses.
    expect(within(dialog).queryByRole("status")).toBeNull();
    expect(screen.queryByText(/berhasil diubah/)).toBeNull();
  });

  it("deactivates chapters in bulk after confirmation", async () => {
    auth.role = "ADMIN";
    renderPage(
      <ChaptersPage />,
      [
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
        bulkSetActiveMock(BulkSetChapterActiveDocument, "bulkSetChapterActive", {
          ids: ["c-1"],
          isActive: false,
        }),
        {
          request: { query: ChaptersDocument, variables: { includeInactive: true } },
          result: { data: { chapters: [] } },
        },
      ],
    );

    expect(await screen.findByText("Engineering")).toBeInTheDocument();
    selectAllRows();
    fireEvent.click(screen.getByRole("button", { name: "Nonaktifkan" }));
    fireEvent.click(
      within(screen.getByRole("dialog", { name: "Nonaktifkan 1 Chapter" })).getByRole("button", {
        name: "Nonaktifkan 1 chapter",
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("1 chapter berhasil dinonaktifkan massal.");
  });
});
