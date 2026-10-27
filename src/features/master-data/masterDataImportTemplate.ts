/**
 * Templat & pembaca berkas Excel untuk bulk insert master data (TAN-350,
 * keputusan pemilik produk "Opsi A" pada thread TAN-348): satu entri per baris
 * dengan data yang sama seperti pembuatan tunggal. Kontrak kolom mengikuti
 * field input mutasi impor backend — Unit: `code`, `name`; Project/Initiative:
 * `name`, `unit`; Job Role: `name`, `chapter` (opsional); Chapter: `name`.
 * Kolom referensi menerima nilai manusiawi atau ID (kode Unit unik atau ID
 * unit; nama chapter atau ID) dan diselesaikan di server via mutasi
 * `importUnits`/`importProjects`/`importJobRoles`/`importChapters`, jadi parser
 * klien hanya memvalidasi struktur baris.
 */

export type MasterDataImportEntity = "unit" | "project" | "jobRole" | "chapter";

export type MasterDataImportRow = {
  /** Nomor baris pada berkas (1-based termasuk header). */
  rowNumber: number;
  values: Record<string, string>;
};

export type MasterDataImportInvalidRow = {
  rowNumber: number;
  reason: string;
};

export type MasterDataImportParse =
  | { ok: true; rows: MasterDataImportRow[]; invalid: MasterDataImportInvalidRow[] }
  | { ok: false; reason: string };

export type MasterDataImportEntityConfig = {
  /** Label entitas untuk judul/pesan (mengikuti penamaan UI: "Initiative" = Project). */
  label: string;
  columns: readonly string[];
  requiredColumns: readonly string[];
  sheetName: string;
  templateUrl: string;
  sampleRows: readonly Record<string, string>[];
  /** Petunjuk pengisian kolom pada modal unggah. */
  helperText: string;
  describeRow: (values: Record<string, string>) => string;
};

export const MASTER_DATA_IMPORT_TEMPLATES: Record<
  MasterDataImportEntity,
  MasterDataImportEntityConfig
> = {
  unit: {
    label: "Unit",
    columns: ["code", "name"],
    requiredColumns: ["code", "name"],
    sheetName: "Unit",
    templateUrl: "/templates/template-buat-unit-massal.xlsx",
    sampleRows: [
      { code: "DBT", name: "Digital Business & Technology" },
      { code: "ECSS", name: "Enabler & Corporate Shared Services" },
    ],
    helperText: "Unduh template, isi kode unit unik dan nama unit.",
    describeRow: (values) => `${values.code} — ${values.name}`,
  },
  project: {
    label: "Initiative",
    columns: ["name", "unit"],
    requiredColumns: ["name", "unit"],
    sheetName: "Initiative",
    templateUrl: "/templates/template-buat-initiative-massal.xlsx",
    sampleRows: [
      { name: "Project Alpha", unit: "DBT" },
      { name: "Project Beta", unit: "DBT" },
    ],
    helperText: "Unduh template, isi nama initiative dan unit pemiliknya (kode Unit unik atau ID unit).",
    describeRow: (values) => values.name,
  },
  jobRole: {
    label: "Job Role",
    columns: ["name", "chapter"],
    requiredColumns: ["name"],
    sheetName: "Job Role",
    templateUrl: "/templates/template-buat-jobrole-massal.xlsx",
    sampleRows: [
      { name: "Backend Engineer", chapter: "Engineering" },
      { name: "Frontend Engineer", chapter: "" },
    ],
    helperText:
      "Unduh template, isi nama job role; kolom chapter opsional (nama chapter atau ID, kosong = tanpa chapter).",
    describeRow: (values) => values.name,
  },
  chapter: {
    label: "Chapter",
    columns: ["name"],
    requiredColumns: ["name"],
    sheetName: "Chapter",
    templateUrl: "/templates/template-buat-chapter-massal.xlsx",
    sampleRows: [{ name: "Engineering" }],
    helperText: "Unduh template, isi nama chapter.",
    describeRow: (values) => values.name,
  },
};

/** Pesan penolakan pembacaan berkas (siap tampil, FR-10). */
export const MASTER_DATA_TEMPLATE_FILE_ERROR =
  "Gagal membaca berkas. Pastikan berkas Excel (.xlsx) valid.";

/** Bentuk minimal lembar kerja exceljs yang dipakai parser (memudahkan test). */
export type MasterDataTemplateSheet = {
  getRow(rowNumber: number): {
    cellCount: number;
    getCell(column: number): { text: string };
  };
  rowCount: number;
};

function cellText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

/** Membaca baris entitas dari lembar kerja pertama berkas .xlsx templat. */
export async function parseMasterDataImportTemplate(
  entity: MasterDataImportEntity,
  file: File,
): Promise<MasterDataImportParse> {
  if (!/\.xlsx$/i.test(file.name)) {
    return { ok: false, reason: "Berkas harus berformat .xlsx." };
  }
  let sheet: MasterDataTemplateSheet | undefined;
  try {
    const buffer = await file.arrayBuffer();
    const excel = await import("exceljs");
    const workbook = new excel.Workbook();
    await workbook.xlsx.load(buffer);
    sheet = workbook.worksheets[0] as unknown as MasterDataTemplateSheet;
  } catch {
    return { ok: false, reason: MASTER_DATA_TEMPLATE_FILE_ERROR };
  }
  if (!sheet) {
    return { ok: false, reason: "Berkas tidak memiliki lembar kerja." };
  }
  return readImportRows(entity, sheet);
}

function readImportRows(
  entity: MasterDataImportEntity,
  sheet: MasterDataTemplateSheet,
): MasterDataImportParse {
  const config = MASTER_DATA_IMPORT_TEMPLATES[entity];
  const header = sheet.getRow(1);
  const columns = new Map<string, number>();
  for (let c = 1; c <= header.cellCount; c += 1) {
    const name = cellText(header.getCell(c)?.text).toLowerCase();
    if (name && !columns.has(name)) columns.set(name, c);
  }
  const missing = config.columns.filter((name) => !columns.has(name));
  if (missing.length > 0) {
    return {
      ok: false,
      reason: `Kolom ${missing.map((name) => `"${name}"`).join(", ")} tidak ditemukan pada baris pertama berkas.`,
    };
  }

  const rows: MasterDataImportRow[] = [];
  const invalid: MasterDataImportInvalidRow[] = [];
  for (let r = 2; r <= sheet.rowCount; r += 1) {
    const get = (column: string) => cellText(sheet.getRow(r).getCell(columns.get(column) ?? 0)?.text);
    const values: Record<string, string> = {};
    let hasValue = false;
    for (const column of config.columns) {
      values[column] = get(column);
      if (values[column]) hasValue = true;
    }
    if (!hasValue) continue;
    const missingCells = config.requiredColumns.filter((column) => !values[column]);
    if (missingCells.length > 0) {
      invalid.push({ rowNumber: r, reason: `kolom ${missingCells.join(", ")} wajib diisi` });
      continue;
    }
    rows.push({ rowNumber: r, values });
  }
  if (rows.length === 0 && invalid.length === 0) {
    return { ok: false, reason: `Berkas tidak berisi baris ${config.label.toLowerCase()}.` };
  }
  return { ok: true, rows, invalid };
}
