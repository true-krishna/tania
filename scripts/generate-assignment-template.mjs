/**
 * Membuat public/templates/template-buat-assignment-massal.xlsx — templat resmi
 * bulk create assignment (TAN-337, keputusan pemilik produk pada thread TAN-337).
 * Satu assignment per baris, data sama seperti pembuatan tunggal:
 * employee_id (nomor induk atau ID talent), project_id (nama project aktif atau
 * ID project), period_start (YYYY-MM-DD), period_end (opsional, kosong = berjalan).
 *
 * Jalankan: node scripts/generate-assignment-template.mjs
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import ExcelJS from "exceljs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(
  scriptDir,
  "..",
  "public",
  "templates",
  "template-buat-assignment-massal.xlsx",
);

const workbook = new ExcelJS.Workbook();
const sheet = workbook.addWorksheet("Assignment");

sheet.columns = [
  { header: "employee_id", key: "employeeId", width: 20 },
  { header: "project_id", key: "projectId", width: 28 },
  { header: "period_start", key: "periodStart", width: 16 },
  { header: "period_end", key: "periodEnd", width: 16 },
];
sheet.getRow(1).font = { bold: true };

sheet.addRows([
  {
    employeeId: "TAL-0001",
    projectId: "Project Alpha",
    periodStart: "2026-02-01",
    periodEnd: "2026-08-31",
  },
  { employeeId: "TAL-0002", projectId: "Project Alpha", periodStart: "2026-03-01", periodEnd: "" },
  {
    employeeId: "TAL-0003",
    projectId: "Project Beta",
    periodStart: "2026-02-15",
    periodEnd: "2026-12-31",
  },
]);

await workbook.xlsx.writeFile(outPath);
console.log(`Template ditulis: ${outPath}`);
