/**
 * Templat & pembaca berkas Excel untuk bulk create assignment (TAN-337, keputusan
 * pemilik produk pada thread TAN-337): satu assignment per baris, dengan data yang
 * sama seperti pembuatan tunggal — kolom `employee_id`, `project_id`, `period_start`,
 * `period_end`. Referensi diselesaikan di server (employee_id = nomor induk atau ID
 * talent; project_id = nama project aktif atau ID project) via mutasi
 * `importAssignments`, jadi parser klien hanya memvalidasi struktur baris.
 */

/** Kolom pada baris pertama berkas templat (period_end opsional diisi). */
export const TEMPLATE_COLUMNS = ["employee_id", "project_id", "period_start", "period_end"] as const;

/** Lokasi berkas templat yang dapat diunduh dari aplikasi. */
export const TEMPLATE_URL = "/templates/template-buat-assignment-massal.xlsx";

/** Pesan penolakan pembacaan berkas (siap tampil, FR-12). */
export const TEMPLATE_FILE_ERROR =
  "Gagal membaca berkas. Pastikan berkas Excel (.xlsx) valid.";

export type ImportTemplateRow = {
  /** Nomor baris pada berkas (1-based termasuk header). */
  rowNumber: number;
  employeeId: string;
  projectId: string;
  periodStart: string;
  /** Kosong berarti assignment berjalan (period_end opsional). */
  periodEnd: string;
};

export type ImportTemplateInvalidRow = {
  rowNumber: number;
  reason: string;
};

export type ImportTemplateParse =
  | { ok: true; rows: ImportTemplateRow[]; invalid: ImportTemplateInvalidRow[] }
  | { ok: false; reason: string };

function cellText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

/** Membaca baris assignment dari lembar kerja pertama berkas .xlsx. */
export async function parseTemplate(file: File): Promise<ImportTemplateParse> {
  if (!/\.xlsx$/i.test(file.name)) {
    return { ok: false, reason: "Berkas harus berformat .xlsx." };
  }
  let sheet: TemplateSheet | undefined;
  try {
    const buffer = await file.arrayBuffer();
    const excel = await import("exceljs");
    const workbook = new excel.Workbook();
    await workbook.xlsx.load(buffer);
    sheet = workbook.worksheets[0] as unknown as TemplateSheet;
  } catch {
    return { ok: false, reason: TEMPLATE_FILE_ERROR };
  }
  if (!sheet) {
    return { ok: false, reason: "Berkas tidak memiliki lembar kerja." };
  }
  return readImportRows(sheet);
}

/** Bentuk minimal lembar kerja exceljs yang dipakai parser (memudahkan test). */
export type TemplateSheet = {
  getRow(rowNumber: number): {
    cellCount: number;
    getCell(column: number): { text: string };
  };
  rowCount: number;
};

function readImportRows(sheet: TemplateSheet): ImportTemplateParse {
  const header = sheet.getRow(1);
  const columns = new Map<string, number>();
  for (let c = 1; c <= header.cellCount; c += 1) {
    const name = cellText(header.getCell(c)?.text).toLowerCase();
    if (name && !columns.has(name)) columns.set(name, c);
  }
  const missing = TEMPLATE_COLUMNS.filter((name) => !columns.has(name));
  if (missing.length > 0) {
    return {
      ok: false,
      reason: `Kolom ${missing.map((name) => `"${name}"`).join(", ")} tidak ditemukan pada baris pertama berkas.`,
    };
  }

  const rows: ImportTemplateRow[] = [];
  const invalid: ImportTemplateInvalidRow[] = [];
  for (let r = 2; r <= sheet.rowCount; r += 1) {
    const get = (column: string) => cellText(sheet.getRow(r).getCell(columns.get(column) ?? 0)?.text);
    const employeeId = get("employee_id");
    const projectId = get("project_id");
    const periodStart = get("period_start");
    const periodEnd = get("period_end");
    if (!employeeId && !projectId && !periodStart && !periodEnd) continue;
    if (!employeeId || !projectId || !periodStart) {
      const missingCells = [
        !employeeId ? "employee_id" : null,
        !projectId ? "project_id" : null,
        !periodStart ? "period_start" : null,
      ].filter(Boolean);
      invalid.push({
        rowNumber: r,
        reason: `kolom ${missingCells.join(", ")} wajib diisi`,
      });
      continue;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(periodStart) || (periodEnd && !/^\d{4}-\d{2}-\d{2}$/.test(periodEnd))) {
      invalid.push({
        rowNumber: r,
        reason: "tanggal harus berformat YYYY-MM-DD",
      });
      continue;
    }
    rows.push({ rowNumber: r, employeeId, projectId, periodStart, periodEnd });
  }
  if (rows.length === 0 && invalid.length === 0) {
    return { ok: false, reason: "Berkas tidak berisi baris assignment." };
  }
  return { ok: true, rows, invalid };
}
