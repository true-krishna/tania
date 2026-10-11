/**
 * T015 — kontrak sementara laporan talent, hand-typed dari fragmen SDL §5
 * plan-003 (kontrak beku D10) untuk `tania-dashboard`.
 *
 * ⚠️ KONTRAK SEMENTARA — bukan mock produksi dan bukan sumber data. Tipe ini
 * menemani `talent-report.graphql.pending` sampai **T025 (codegen swap)**: setelah
 * `graph/schema.graphqls` tersinkron dengan SDL dilayani backend, jalankan
 * `npm run codegen` lalu ganti impor `./types` dengan `@/generated/graphql`.
 * Jangan menambah/mengubah field di sini tanpa revisi plan (D10).
 *
 * Sumber kebenaran: plan-003 (TAN-151) §5 — `TalentReportPeriodInput`,
 * `TalentReportRange`, `ReportCategoryKind`, `ReportCategoryCount`,
 * `ReportMonthlyMovement`, `TalentReport`.
 */

/** Bulan dalam format `YYYY-MM` (string `String!` di SDL). */
export type YearMonth = string;

export type ReportCategoryKind = "VALUE" | "MISSING" | "OTHER";

/** Satu kategori beserta jumlahnya — label + count + kind, tanpa PII (D-minimization). */
export interface ReportCategoryCount {
  label: string;
  count: number;
  kind: ReportCategoryKind;
}

/**
 * Satu bulan pada tren gerakan (V-5). Backend selalu mengirim seluruh bulan
 * rentang terpilih (zero-fill, US2 AC-9) — frontend tidak mengisi nol sendiri.
 */
export interface ReportMonthlyMovement {
  month: YearMonth;
  newTalent: number;
  churn: number;
}

/** Snapshot distribusi = bulan akhir rentang terpilih (FR-04). */
export interface TalentReport {
  snapshotMonth: YearMonth;
  roleDistribution: ReportCategoryCount[];
  generationDistribution: ReportCategoryCount[];
  educationDistribution: ReportCategoryCount[];
  workLocationDistribution: ReportCategoryCount[];
  movementTrend: ReportMonthlyMovement[];
}

/** Batas rentang filter laporan (FR-11). */
export interface TalentReportRange {
  startMonth: YearMonth;
  endMonth: YearMonth;
}

/** Input periode `TalentReportPeriodInput` (inklusif, `endMonth >= startMonth`). */
export interface TalentReportPeriod {
  startMonth: YearMonth;
  endMonth: YearMonth;
}
