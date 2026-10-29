// @vitest-environment jsdom

import * as React from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MockedProvider, type MockedResponse } from "@apollo/client/testing";
import { describe, expect, it, vi } from "vitest";
import ExcelJS from "exceljs";
import { ToastProvider } from "@/components/Toast";
import { ImportProjectsDocument, ImportUnitsDocument, ProjectsDocument, UnitsDocument } from "@/generated/graphql";
import { MasterDataImportModal } from "./MasterDataImportModal";

const XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

async function unitFile(
  rows: string[][],
  header: string[] = ["code", "name"],
  name = "unit.xlsx",
): Promise<File> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Unit");
  sheet.addRow(header);
  for (const row of rows) sheet.addRow(row);
  const buffer = await workbook.xlsx.writeBuffer();
  return new File([buffer], name, { type: XLSX_TYPE });
}

function unitRows(count: number): string[][] {
  return Array.from({ length: count }, (_, i) => [`C${i + 1}`, `Nama ${i + 1}`]);
}

function expectedVariables(count: number): { code: string; name: string }[] {
  return Array.from({ length: count }, (_, i) => ({ code: `C${i + 1}`, name: `Nama ${i + 1}` }));
}

function importUnitsMock(
  rows: { code: string; name: string }[],
  outcome: { succeeded: number; failed?: { index: number; message: string }[] },
): MockedResponse {
  return {
    request: { query: ImportUnitsDocument, variables: { input: { rows } } },
    result: {
      data: {
        importUnits: {
          __typename: "BulkUnitResult",
          succeeded: Array.from({ length: outcome.succeeded }, (_, index) => ({
            __typename: "BulkUnitItemResult",
            index,
          })),
          failed: (outcome.failed ?? []).map((failure) => ({
            __typename: "BulkUnitItemResult",
            index: failure.index,
            error: {
              __typename: "BulkMasterDataError",
              code: "CONFLICT",
              message: failure.message,
            },
          })),
        },
      },
    },
  };
}

const unitsRefreshMock: MockedResponse = {
  request: { query: UnitsDocument, variables: { includeInactive: true } },
  result: { data: { units: [] } },
};

const projectsRefreshMock: MockedResponse = {
  request: { query: ProjectsDocument, variables: { includeInactive: true } },
  result: { data: { projects: [] } },
};

function renderImportModal(
  mocks: MockedResponse[],
  onImported: () => void = () => {},
  entity: "unit" | "project" = "unit",
) {
  function Harness() {
    const [open, setOpen] = React.useState(true);
    return (
      <MockedProvider mocks={mocks}>
        <ToastProvider>
          <MasterDataImportModal
            entity={entity}
            onClose={() => setOpen(false)}
            onImported={onImported}
            open={open}
          />
        </ToastProvider>
      </MockedProvider>
    );
  }
  render(<Harness />);
}

async function uploadFile(file: File, noun = "unit") {
  await act(async () => {
    fireEvent.change(screen.getByLabelText(`Unggah berkas Excel ${noun}`), {
      target: { files: [file] },
    });
  });
}

function submitForm(formLabel = "Unggah Massal Unit") {
  fireEvent.submit(screen.getByRole("form", { name: formLabel }));
}

describe("MasterDataImportModal — unggah massal Unit (TAN-350)", () => {
  it("links the official per-entity template for download (FR-10)", () => {
    renderImportModal([unitsRefreshMock]);
    const link = screen.getByRole("link", { name: "Unduh Template" });
    expect(link).toHaveAttribute("href", "/templates/template-buat-unit-massal.xlsx");
    expect(link).toHaveAttribute("download");
  });

  it("imports every row and closes after full success (US1-1, FR-01)", async () => {
    const onImported = vi.fn();
    renderImportModal(
      [importUnitsMock(expectedVariables(2), { succeeded: 2 }), unitsRefreshMock],
      onImported,
    );
    await uploadFile(await unitFile(unitRows(2)));
    await screen.findByText(/2 baris unit terbaca/);
    submitForm();

    expect(await screen.findByRole("alert")).toHaveTextContent("2 Unit berhasil dibuat massal.");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(onImported).toHaveBeenCalledTimes(1);
  });

  it("executes a >100-row file as sequential ≤100-row operations with one merged per-row report (FR-06, Opsi A)", async () => {
    const rows = expectedVariables(150);
    renderImportModal([
      importUnitsMock(rows.slice(0, 100), { succeeded: 100 }),
      importUnitsMock(rows.slice(100), {
        succeeded: 49,
        failed: [{ index: 0, message: 'Kode Unit "C101" sudah terdaftar dengan nilai unik yang sama.' }],
      }),
      unitsRefreshMock,
    ]);
    await uploadFile(await unitFile(unitRows(150)));
    await screen.findByText(/150 baris unit terbaca/);
    submitForm();

    const summary = await screen.findByRole("status");
    expect(summary).toHaveTextContent("149 baris berhasil, 1 gagal.");
    expect(summary).toHaveTextContent(
      'Baris 102 (C101 — Nama 101) — Kode Unit "C101" sudah terdaftar dengan nilai unik yang sama.',
    );
    expect(screen.getByRole("button", { name: "Ulangi 1 baris belum berhasil" })).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Unggah Massal Unit" })).toBeInTheDocument();
  });

  it("stops the remaining chunks when an operation fails whole and lists the rows not executed", async () => {
    const rows = expectedVariables(150);
    renderImportModal([
      importUnitsMock(rows.slice(0, 100), { succeeded: 100 }),
      {
        request: { query: ImportUnitsDocument, variables: { input: { rows: rows.slice(100) } } },
        error: new Error("network down"),
      },
      unitsRefreshMock,
    ]);
    await uploadFile(await unitFile(unitRows(150)));
    await screen.findByText(/150 baris unit terbaca/);
    submitForm();

    const summary = await screen.findByRole("status");
    expect(summary).toHaveTextContent("100 baris berhasil, 50 belum dieksekusi.");
    expect(within(summary).getByRole("alert")).toHaveTextContent(
      "Impor dihentikan: Gagal mengimpor data massal.",
    );
    const notExecuted = within(summary).getByRole("list", { name: "Baris tidak dieksekusi" });
    expect(within(notExecuted).getAllByRole("listitem")).toHaveLength(50);
    expect(screen.getByRole("button", { name: "Ulangi 50 baris belum berhasil" })).toBeInTheDocument();
  });

  it("rejects a file whose header misses a template column", async () => {
    renderImportModal([unitsRefreshMock]);
    await uploadFile(await unitFile(unitRows(2), ["code", "nama"]));
    expect(await screen.findByText(/Kolom "name" tidak ditemukan/)).toBeInTheDocument();
    expect(screen.queryByText(/baris unit terbaca/)).not.toBeInTheDocument();
  });

  it("rejects a non-.xlsx file", async () => {
    renderImportModal([unitsRefreshMock]);
    await uploadFile(new File(["kode,name"], "unit.csv", { type: "text/csv" }));
    expect(await screen.findByText("Berkas harus berformat .xlsx.")).toBeInTheDocument();
  });

  it("lists structurally invalid rows and sends only the valid ones (FR-02)", async () => {
    const onImported = vi.fn();
    renderImportModal([importUnitsMock(expectedVariables(2), { succeeded: 2 }), unitsRefreshMock], onImported);
    await uploadFile(await unitFile([["C1", "Nama 1"], ["", "Tanpa kode"], ["C2", "Nama 2"]]));
    await screen.findByText(/2 baris unit terbaca, 1 baris tidak valid/);
    expect(screen.getByRole("list", { name: "Baris tidak valid" })).toHaveTextContent(
      "Baris 3: kolom code wajib diisi.",
    );
    submitForm();

    expect(await screen.findByRole("alert")).toHaveTextContent("2 Unit berhasil dibuat massal.");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(onImported).toHaveBeenCalledTimes(1);
  });

  it("rejects rows referencing a missing or inactive unit with the single-create message (US1-3)", async () => {
    const rows = [
      { name: "Project Alpha", unit: "DBT" },
      { name: "Project Beta", unit: "MISSING" },
      { name: "Project Gamma", unit: "HC" },
    ];
    renderImportModal(
      [
        {
          request: { query: ImportProjectsDocument, variables: { input: { rows } } },
          result: {
            data: {
              importProjects: {
                __typename: "BulkProjectResult",
                succeeded: [{ __typename: "BulkProjectItemResult", index: 0 }],
                failed: [
                  {
                    __typename: "BulkProjectItemResult",
                    index: 1,
                    error: {
                      __typename: "BulkMasterDataError",
                      code: "REF_NOT_FOUND",
                      message: "Unit tujuan tidak ditemukan — pilih unit yang aktif.",
                    },
                  },
                  {
                    __typename: "BulkProjectItemResult",
                    index: 2,
                    error: {
                      __typename: "BulkMasterDataError",
                      code: "REF_INACTIVE",
                      message: "Unit tujuan nonaktif — pilih unit yang aktif.",
                    },
                  },
                ],
              },
            },
          },
        },
        projectsRefreshMock,
      ],
      undefined,
      "project",
    );
    await uploadFile(
      await unitFile(
        rows.map((row) => [row.name, row.unit]),
        ["name", "unit"],
      ),
      "initiative",
    );
    await screen.findByText(/3 baris initiative terbaca/);
    submitForm("Unggah Massal Initiative");

    // Pesan persis seperti pembuatan tunggal; baris sah tetap dibuat (FR-02).
    const summary = await screen.findByRole("status");
    expect(summary).toHaveTextContent("1 baris berhasil, 2 gagal.");
    expect(summary).toHaveTextContent(
      "Baris 3 (Project Beta) — Unit tujuan tidak ditemukan — pilih unit yang aktif.",
    );
    expect(summary).toHaveTextContent(
      "Baris 4 (Project Gamma) — Unit tujuan nonaktif — pilih unit yang aktif.",
    );
    expect(screen.getByRole("button", { name: "Ulangi 2 baris belum berhasil" })).toBeInTheDocument();
  });

  it("re-runs only the rows that did not succeed on retry (FR-02)", async () => {
    const onImported = vi.fn();
    renderImportModal(
      [
        importUnitsMock(expectedVariables(2), {
          succeeded: 1,
          failed: [{ index: 1, message: 'Kode Unit "C2" sudah terdaftar dengan nilai unik yang sama.' }],
        }),
        importUnitsMock([{ code: "C2", name: "Nama 2" }], { succeeded: 1 }),
        unitsRefreshMock,
      ],
      onImported,
    );
    await uploadFile(await unitFile(unitRows(2)));
    await screen.findByText(/2 baris unit terbaca/);
    submitForm();

    const summary = await screen.findByRole("status");
    expect(summary).toHaveTextContent("1 baris berhasil, 1 gagal.");
    fireEvent.click(screen.getByRole("button", { name: "Ulangi 1 baris belum berhasil" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("1 Unit berhasil dibuat massal.");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(onImported).toHaveBeenCalledTimes(2);
  });
});
