/**
 * T015 — fixture uji laporan talent.
 *
 * ⚠️ BUKAN MOCK PRODUKSI — modul ini hanya boleh diimpor oleh berkas test.
 * Kode produksi (`useTalentReport`, `TalentReportPageView`, …) mengambil data
 * lewat GraphQL (`talent-report.graphql.pending`); fixture di sini memasok `MockedProvider`
 * dan uji data-prep sampai T025 (codegen swap). Tidak ada jalur yang membaca
 * fixture ini saat runtime aplikasi (aturan merge FE: tanpa mock produksi).
 *
 * Bentuk data mengikuti fragmen §5 plan-003 (D10): kategori `kind: VALUE` sah,
 * `MISSING` = "Belum diisi" (selalu terakhir, abu-abu), `OTHER` = agregat di
 * luar Top-10 lokasi ("Lainnya"). Tren selalu zero-fill penuh (US2 AC-9).
 */
import type {
  ReportCategoryCount,
  ReportMonthlyMovement,
  TalentReport,
  TalentReportRange,
} from "./types";

/** Rentang default fixture — mencerminkan `talentReportRange` (FR-11). */
export const MOCK_TALENT_REPORT_RANGE: TalentReportRange = {
  startMonth: "2025-01",
  endMonth: "2026-10",
};

const value = (label: string, count: number): ReportCategoryCount => ({
  label,
  count,
  kind: "VALUE",
});

export const MOCK_ROLE_DISTRIBUTION: ReportCategoryCount[] = [
  value("Engineer", 12),
  value("Designer", 7),
  value("Quality Assurance", 4),
  { label: "Belum diisi", count: 2, kind: "MISSING" },
];

export const MOCK_GENERATION_DISTRIBUTION: ReportCategoryCount[] = [
  value("Baby Boomer", 1),
  value("Gen X", 3),
  value("Milenial", 14),
  value("Gen Z", 7),
];

export const MOCK_EDUCATION_DISTRIBUTION: ReportCategoryCount[] = [
  value("SMA/SMK Sederajat", 2),
  value("D3", 3),
  value("S1", 13),
  value("S2", 5),
  { label: "Belum diisi", count: 2, kind: "MISSING" },
];

export const MOCK_WORK_LOCATION_DISTRIBUTION: ReportCategoryCount[] = [
  value("Jakarta", 10),
  value("Bandung", 6),
  value("Surabaya", 3),
  { label: "Lainnya", count: 4, kind: "OTHER" },
  { label: "Belum diisi", count: 2, kind: "MISSING" },
];

const MOVEMENT: readonly (readonly [string, number, number])[] = [
  ["2025-01", 2, 0],
  ["2025-02", 0, 1],
  ["2025-03", 3, 0],
  ["2025-04", 0, 0],
  ["2025-05", 1, 2],
  ["2025-06", 0, 0],
  ["2025-07", 2, 1],
  ["2025-08", 0, 0],
  ["2025-09", 1, 0],
  ["2025-10", 0, 3],
  ["2025-11", 0, 0],
  ["2025-12", 2, 1],
  ["2026-01", 1, 0],
  ["2026-02", 0, 0],
  ["2026-03", 0, 2],
  ["2026-04", 3, 0],
  ["2026-05", 0, 0],
  ["2026-06", 1, 1],
  ["2026-07", 0, 0],
  ["2026-08", 2, 0],
  ["2026-09", 0, 1],
  ["2026-10", 1, 0],
];

export const MOCK_MOVEMENT_TREND: ReportMonthlyMovement[] = MOVEMENT.map(
  ([month, newTalent, churn]) => ({ month, newTalent, churn }),
);

/** Laporan lengkap (5 visual dari satu payload — D2). */
export const MOCK_TALENT_REPORT: TalentReport = {
  snapshotMonth: "2026-10",
  roleDistribution: MOCK_ROLE_DISTRIBUTION,
  generationDistribution: MOCK_GENERATION_DISTRIBUTION,
  educationDistribution: MOCK_EDUCATION_DISTRIBUTION,
  workLocationDistribution: MOCK_WORK_LOCATION_DISTRIBUTION,
  movementTrend: MOCK_MOVEMENT_TREND,
};

/** Laporan tanpa data — untuk uji empty state (edge case spek: rentang kosong). */
export const MOCK_TALENT_REPORT_EMPTY: TalentReport = {
  snapshotMonth: "2026-10",
  roleDistribution: [],
  generationDistribution: [],
  educationDistribution: [],
  workLocationDistribution: [],
  movementTrend: [],
};
