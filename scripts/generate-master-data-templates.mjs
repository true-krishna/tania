/**
 * Membuat empat templat resmi bulk insert master data di public/templates/ —
 * TAN-350 (fitur TAN-347, kontrak TAN-348, keputusan pemilik produk "Opsi A"
 * pada thread TAN-348). Satu entri per baris, data sama seperti pembuatan
 * tunggal; kolom mengikuti field input mutasi impor backend:
 *
 * - template-buat-unit-massal.xlsx       — Unit: `code`, `name`
 * - template-buat-initiative-massal.xlsx — Initiative (Project): `name`, `unit`
 *   (kode Unit unik atau ID unit)
 * - template-buat-jobrole-massal.xlsx    — Job Role: `name`, `chapter` (opsional,
 *   nama chapter atau ID; kosong = tanpa chapter)
 * - template-buat-chapter-massal.xlsx    — Chapter: `name`
 *
 * Kontrak kolom harus tetap sinkron dengan `src/features/master-data/masterDataImportTemplate.ts`.
 *
 * Jalankan: node scripts/generate-master-data-templates.mjs
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import ExcelJS from "exceljs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const templatesDir = path.join(scriptDir, "..", "public", "templates");

const TEMPLATES = [
  {
    file: "template-buat-unit-massal.xlsx",
    sheet: "Unit",
    columns: [
      { header: "code", key: "code", width: 16 },
      { header: "name", key: "name", width: 40 },
    ],
    rows: [
      { code: "DBT", name: "Digital Business & Technology" },
      { code: "ECSS", name: "Enabler & Corporate Shared Services" },
    ],
  },
  {
    file: "template-buat-initiative-massal.xlsx",
    sheet: "Initiative",
    columns: [
      { header: "name", key: "name", width: 40 },
      { header: "unit", key: "unit", width: 24 },
    ],
    rows: [
      { name: "Project Alpha", unit: "DBT" },
      { name: "Project Beta", unit: "DBT" },
    ],
  },
  {
    file: "template-buat-jobrole-massal.xlsx",
    sheet: "Job Role",
    columns: [
      { header: "name", key: "name", width: 40 },
      { header: "chapter", key: "chapter", width: 28 },
    ],
    rows: [
      { name: "Backend Engineer", chapter: "Engineering" },
      { name: "Frontend Engineer", chapter: "" },
    ],
  },
  {
    file: "template-buat-chapter-massal.xlsx",
    sheet: "Chapter",
    columns: [{ header: "name", key: "name", width: 40 }],
    rows: [{ name: "Engineering" }],
  },
];

for (const template of TEMPLATES) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(template.sheet);
  sheet.columns = template.columns;
  sheet.getRow(1).font = { bold: true };
  sheet.addRows(template.rows);
  const outPath = path.join(templatesDir, template.file);
  await workbook.xlsx.writeFile(outPath);
  console.log(`Template ditulis: ${outPath}`);
}
