/**
 * Templat & pembaca berkas Excel untuk bulk create assignment (TAN-337, opsi A —
 * keputusan pemilik produk pada thread TAN-337): daftar talent diambil dari
 * berkas templat (kolom `nomor_induk`) alih-alih pemilihan multi-select.
 * Pemetaan nomor induk → talent dilakukan di sisi klien terhadap daftar
 * kandidat assignable, sehingga mutasi `bulkCreateAssignments` (employeeIds)
 * dan backend tidak berubah.
 */

/** Kolom wajib pada baris pertama berkas templat. */
export const TEMPLATE_COLUMN = "nomor_induk";

/** Lokasi berkas templat yang dapat diunduh dari aplikasi. */
export const TEMPLATE_URL = "/templates/template-buat-assignment-massal.xlsx";

/** Pesan penolakan pembacaan berkas (siap tampil, FR-12). */
export const TEMPLATE_FILE_ERROR =
  "Gagal membaca berkas. Pastikan berkas Excel (.xlsx) valid.";

export type TalentCandidate = { id: string; fullName: string; nomorInduk: string | null };

export type TalentTemplateRow = {
  /** Posisi baris data pada berkas (1-based, header tidak dihitung). */
  rowNumber: number;
  nomorInduk: string;
  /** Terisi bila nomor induk terpetakan ke kandidat talent assignable. */
  talent?: TalentCandidate;
};

export type TalentTemplateParse =
  | { ok: true; nomorInduk: string[] }
  | { ok: false; reason: string };

function cellText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

/** Membaca daftar nomor induk dari lembar kerja pertama berkas .xlsx. */
export async function parseTalentTemplate(file: File): Promise<TalentTemplateParse> {
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
  return readNomorInduk(sheet);
}

/** Bentuk minimal lembar kerja exceljs yang dipakai parser (memudahkan test). */
export type TemplateSheet = {
  getRow(rowNumber: number): {
    cellCount: number;
    getCell(column: number): { text: string };
  };
  rowCount: number;
};

function readNomorInduk(sheet: TemplateSheet): TalentTemplateParse {
  const header = sheet.getRow(1);
  let column = 0;
  for (let c = 1; c <= header.cellCount; c += 1) {
    if (cellText(header.getCell(c)?.text).toLowerCase() === TEMPLATE_COLUMN) {
      column = c;
      break;
    }
  }
  if (column === 0) {
    return {
      ok: false,
      reason: `Kolom "${TEMPLATE_COLUMN}" tidak ditemukan pada baris pertama berkas.`,
    };
  }
  const nomorInduk: string[] = [];
  for (let r = 2; r <= sheet.rowCount; r += 1) {
    const text = cellText(sheet.getRow(r).getCell(column)?.text);
    if (text) nomorInduk.push(text);
  }
  if (nomorInduk.length === 0) {
    return { ok: false, reason: "Berkas tidak berisi baris talent." };
  }
  return { ok: true, nomorInduk };
}

/**
 * Memetakan daftar nomor induk ke kandidat assignable (perbandingan tanpa
 * memedulikan besar-kecil huruf, setelah trim). Baris yang tidak ditemukan
 * tetap masuk hasil tanpa `talent` — dilaporkan per baris sebelum eksekusi.
 */
export function mapTemplateRows(
  nomorInduk: readonly string[],
  candidates: readonly TalentCandidate[],
): TalentTemplateRow[] {
  const byNomor = new Map<string, TalentCandidate>();
  for (const candidate of candidates) {
    const nomor = candidate.nomorInduk?.trim().toLowerCase();
    if (nomor) byNomor.set(nomor, candidate);
  }
  return nomorInduk.map((nomor, index) => {
    const trimmed = nomor.trim();
    return {
      rowNumber: index + 1,
      nomorInduk: trimmed,
      talent: byNomor.get(trimmed.toLowerCase()),
    };
  });
}