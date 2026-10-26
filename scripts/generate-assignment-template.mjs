// Menghasilkan templat Excel untuk pembuatan assignment massal (TAN-337, opsi A).
// Jalankan: node scripts/generate-assignment-template.mjs
import ExcelJS from "exceljs";
import { mkdirSync } from "node:fs";

const workbook = new ExcelJS.Workbook();
const sheet = workbook.addWorksheet("Talent");
sheet.columns = [{ header: "nomor_induk", key: "nomorInduk", width: 24 }];
// Baris contoh — ganti dengan nomor induk talent yang akan di-assign.
sheet.addRow({ nomorInduk: "NIA-001" });
sheet.addRow({ nomorInduk: "NIA-002" });
sheet.addRow({ nomorInduk: "NIA-003" });
sheet.getCell("A1").font = { bold: true };

mkdirSync(new URL("../public/templates/", import.meta.url), { recursive: true });
const out = new URL("../public/templates/template-buat-assignment-massal.xlsx", import.meta.url);
await workbook.xlsx.writeFile(out);
console.log(`Template ditulis: ${out.pathname}`);
