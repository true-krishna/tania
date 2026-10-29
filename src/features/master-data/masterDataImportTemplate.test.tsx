// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import {
  MASTER_DATA_IMPORT_TEMPLATES,
  MASTER_DATA_TEMPLATE_FILE_ERROR,
  parseMasterDataImportTemplate,
} from "./masterDataImportTemplate";

const XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

async function templateFile(
  entity: keyof typeof MASTER_DATA_IMPORT_TEMPLATES,
  header: string[],
  rows: string[][],
  fileName = `${entity}.xlsx`,
): Promise<File> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(MASTER_DATA_IMPORT_TEMPLATES[entity].sheetName);
  sheet.addRow(header);
  for (const row of rows) sheet.addRow(row);
  const buffer = await workbook.xlsx.writeBuffer();
  return new File([buffer], fileName, { type: XLSX_TYPE });
}

describe("parseMasterDataImportTemplate (TAN-350)", () => {
  it("rejects a non-.xlsx file", async () => {
    const parsed = await parseMasterDataImportTemplate(
      "unit",
      new File(["kode,name"], "unit.csv", { type: "text/csv" }),
    );
    expect(parsed).toEqual({ ok: false, reason: "Berkas harus berformat .xlsx." });
  });

  it("rejects a corrupt .xlsx file with the file-read message", async () => {
    const parsed = await parseMasterDataImportTemplate(
      "unit",
      new File(["bukan excel"], "unit.xlsx", { type: XLSX_TYPE }),
    );
    expect(parsed).toEqual({ ok: false, reason: MASTER_DATA_TEMPLATE_FILE_ERROR });
  });

  it("rejects a file whose first row misses a template column", async () => {
    const parsed = await parseMasterDataImportTemplate(
      "project",
      await templateFile("project", ["name"], [["Project Alpha"]]),
    );
    expect(parsed).toEqual({
      ok: false,
      reason: 'Kolom "unit" tidak ditemukan pada baris pertama berkas.',
    });
  });

  it("reads unit rows with their file rowNumbers and trims values", async () => {
    const parsed = await parseMasterDataImportTemplate(
      "unit",
      await templateFile(
        "unit",
        ["code", "name"],
        [
          ["  DBT  ", " Digital Business "],
          ["ECSS", "Enabler & Corporate Shared Services"],
        ],
      ),
    );
    expect(parsed).toEqual({
      ok: true,
      rows: [
        { rowNumber: 2, values: { code: "DBT", name: "Digital Business" } },
        { rowNumber: 3, values: { code: "ECSS", name: "Enabler & Corporate Shared Services" } },
      ],
      invalid: [],
    });
  });

  it("skips fully empty rows", async () => {
    const parsed = await parseMasterDataImportTemplate(
      "chapter",
      await templateFile("chapter", ["name"], [["Engineering"], ["", ""], ["Product"]]),
    );
    expect(parsed).toEqual({
      ok: true,
      rows: [
        { rowNumber: 2, values: { name: "Engineering" } },
        { rowNumber: 4, values: { name: "Product" } },
      ],
      invalid: [],
    });
  });

  it("lists rows with missing required cells as invalid, keeping valid rows", async () => {
    const parsed = await parseMasterDataImportTemplate(
      "unit",
      await templateFile(
        "unit",
        ["code", "name"],
        [
          ["DBT", "Digital Business"],
          ["", "Nama tanpa kode"],
          ["ENG", ""],
        ],
      ),
    );
    expect(parsed).toEqual({
      ok: true,
      rows: [{ rowNumber: 2, values: { code: "DBT", name: "Digital Business" } }],
      invalid: [
        { rowNumber: 3, reason: "kolom code wajib diisi" },
        { rowNumber: 4, reason: "kolom name wajib diisi" },
      ],
    });
  });

  it("treats the job role chapter column as optional", async () => {
    const parsed = await parseMasterDataImportTemplate(
      "jobRole",
      await templateFile(
        "jobRole",
        ["name", "chapter"],
        [
          ["Backend Engineer", "Engineering"],
          ["Frontend Engineer", ""],
        ],
      ),
    );
    expect(parsed).toEqual({
      ok: true,
      rows: [
        { rowNumber: 2, values: { name: "Backend Engineer", chapter: "Engineering" } },
        { rowNumber: 3, values: { name: "Frontend Engineer", chapter: "" } },
      ],
      invalid: [],
    });
  });

  it("rejects a header-only file as empty", async () => {
    const parsed = await parseMasterDataImportTemplate(
      "chapter",
      await templateFile("chapter", ["name"], []),
    );
    expect(parsed).toEqual({ ok: false, reason: "Berkas tidak berisi baris chapter." });
  });
});
