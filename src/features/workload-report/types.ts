/**
 * Read-only view models for the WAD-style workload dashboards (TAN-227):
 * executive overview + per-talent report.
 *
 * Shapes mirror the fields WAD serves today and that the Tania GraphQL layer
 * will serve for these dashboards — snake_case 1:1 to camelCase
 * (`total_talent` → `totalTalent`, `undefined_jira` → `undefinedActivity`).
 * Wiring GraphQL later (TAN-236+) replaces the fixture source without touching
 * these shapes or the UI.
 *
 * Every figure is a value the server provides, carried through `mocks.ts` for
 * this mock-data-first slice — nothing is computed at render time. Percent
 * figures (`fte`, `loadEstimate`, `ttdCompliance`, `availability`) arrive
 * already scaled as percentages by the server, so the UI only appends the `%`
 * sign. Hours, cost and revenue arrive as server-formatted strings.
 */

import type { AccessRole } from "@/generated/graphql";
import type { WorkloadFreshness } from "@/features/workload";

/** Klasifikasi beban yang dikirim WAD, dalam urutan kanoniknya. */
export const WORKLOAD_STATUSES = [
  "Undefined Activity",
  "Undefined Time Spent",
  "Underload",
  "Fit",
  "Stretch",
  "Overload",
] as const;

export type WorkloadStatus = (typeof WORKLOAD_STATUSES)[number];

export const GRAND_TOTAL = "Grand Total";

/** Level kepatuhan TTD (`comp_lvl`), urutan terendah → tertinggi. */
export const TTD_LEVELS = ["Need Improvement", "Fair", "Good", "Very Good"] as const;

export type TtdComplianceLevel = (typeof TTD_LEVELS)[number];

/**
 * UI gate untuk angka cost/revenue/RBV (TAN-229) — UX saja, server tetap
 * penegak sebenarnya (FR-16). Asumsi kerja (menunggu keputusan pemilik
 * produk): angka finansial org-wide → OPERATION/ADMIN; CHAPTER/TALENT tidak.
 * Mengikuti preseden WAD yang menyembunyikan tab cost dari manajemen menengah.
 */
export const COST_REVENUE_ROLES: readonly AccessRole[] = ["OPERATION", "ADMIN"];

/** Role yang berhak melihat dashboard executive & per-talent (UI gate). */
export const WORKLOAD_REPORT_ROLES: readonly AccessRole[] = ["CHAPTER", "OPERATION", "ADMIN"];

export interface WorkloadReportSummary {
  totalTalent: number;
  totalBacklog: number;
  totalTaskSubtask: number;
  totalTaskSubtaskWithTimespent: number;
  /** Jam, terformat dari server (mis. "1.542"). */
  totalAvailableTime: string;
  /** Jam, terformat dari server. */
  totalTimespent: string;
  weeklyTimespentPerTalent: number;
  dailyTimespentPerTalent: number;
  /** Persen (mis. 108), sudah diskalakan server. */
  fte: number;
  statusLoad: WorkloadStatus;
  /** Jam, terformat dari server. */
  totalTimespentEstimate: string;
  /** Persen. */
  loadEstimate: number;
  statusLoadEstimate: WorkloadStatus;
  /** Persen. */
  ttdCompliance: number;
  talentComplyTtd: number;
  totalTalentNormalized: number;
  totalActivityNormalized: number;
  /** Hanya terisi untuk role berhak; `null` lainnya (gate server, TAN-229). */
  cost: string | null;
  avgCost: string | null;
  revenue: string | null;
  revenuePerMonth: string | null;
  revenuePerMonthPerTalent: string | null;
  rbv: string | null;
  rbvPerMonth: string | null;
  rbvPerMonthPerTalent: string | null;
}

export interface TalentCountByStatus {
  statusLoad: WorkloadStatus;
  total: number;
}

export interface WorkloadOvertimePoint {
  /** `YYYYMM`. */
  periode: string;
  undefinedActivity: number;
  undefinedTimespent: number;
  underload: number;
  fit: number;
  stretch: number;
  overload: number;
}

export interface ExecutiveChartsData {
  talentByWorkloadLevel: TalentCountByStatus[];
  workloadOvertime: WorkloadOvertimePoint[];
}

export type DistributionDimension = "tribe" | "product" | "squad" | "unitcode" | "talent";

export const DISTRIBUTION_DIMENSIONS: readonly DistributionDimension[] = [
  "tribe",
  "product",
  "squad",
  "unitcode",
  "talent",
];

export const DIMENSION_LABELS: Record<DistributionDimension, string> = {
  tribe: "Tribe",
  product: "Product",
  squad: "Squad",
  unitcode: "Unit Code",
  talent: "Talent",
};

/**
 * Kunci induk baris untuk drill-down: baris tribe hanya mengisi `tribeId`,
 * baris talent mengisi semuanya. Baris unitcode/kapabilitas memakai
 * `unitcode` sebagai kunci levelnya.
 */
export interface DistributionScope {
  tribeId: string | null;
  productId: string | null;
  squadId: string | null;
  unitcode: string | null;
}

export interface DistributionRow {
  id: string;
  /** Nama entitas pada dimensi aktif (`nama` di WAD). */
  nama: string;
  scope: DistributionScope;
  /**
   * Nama tampilan tribe/squad — hanya terisi pada baris dimensi `talent`
   * (baris `tribe_name` WAD); `null` pada dimensi lain.
   */
  tribe: string | null;
  squad: string | null;
  /** Identitas talent — hanya untuk dimensi `talent`; tidak pernah ke URL. */
  talentId: string | null;
  talentName: string | null;
  jumlahTalent: number;
  totalBacklog: number;
  totalTaskSubtask: number;
  taskSubtaskPerTalent: string;
  /** Persen. */
  availability: number;
  /** Jam, terformat dari server. */
  totalAvailableTime: string;
  /** Jam, terformat dari server. */
  totalTimespent: string;
  /** Persen. */
  fte: number;
  statusLoad: WorkloadStatus;
  backlogPerTalent: number;
  taskSubtaskWithTimespent: number;
  training: number;
  /** Persen. */
  avgFte: number;
  jmlAssignment: number;
  totalTimespentEstimate: string | null;
  /** Persen. */
  loadEstimate: number | null;
  statusLoadEstimate: WorkloadStatus | null;
  /** Persen. */
  ttdComp: number | null;
  compLvl: TtdComplianceLevel | null;
  isNormalized: boolean;
  /** Hanya terisi untuk role berhak; `null` lainnya (gate server, TAN-229). */
  totalCost: string | null;
}

export interface DistributionNormalizedRow {
  id: string;
  nama: string;
  scope: DistributionScope;
  jumlahTalent: number | null;
  /** Jam, terformat dari server. */
  jmlActivityNormalized: string | null;
  /** Jam, terformat dari server. */
  totalTimespent: string | null;
  /** Jam ternormalisasi per hari, terformat dari server. */
  totalTimespentNormDay: string | null;
}

export interface DistributionTables {
  rows: Record<DistributionDimension, DistributionRow[]>;
  normalizedRows: Record<DistributionDimension, DistributionNormalizedRow[]>;
}

export interface LoggedVsEstimatedRow {
  statusLoad: WorkloadStatus | typeof GRAND_TOTAL;
  undefinedActivity: number | null;
  undefinedTimespent: number | null;
  underload: number | null;
  fit: number | null;
  stretch: number | null;
  overload: number | null;
  total: number | null;
}

export interface TtdComplianceRow {
  statusLoad: WorkloadStatus | typeof GRAND_TOTAL;
  notAchieved: number | null;
  lowAchieved: number | null;
  achieved: number | null;
  highAchieved: number | null;
  total: number | null;
}

export interface AnalyticsTablesData {
  loggedVsEstimated: LoggedVsEstimatedRow[];
  ttdCompliance: TtdComplianceRow[];
}

/** Filter tingkat lanjut untuk tabel distribusi (TAN-231). */
export interface DistributionFilter {
  tribeId: string | null;
  productId: string | null;
  squadId: string | null;
  unitcode: string | null;
  statusLoad: WorkloadStatus | null;
}

export type ReportState = "ready" | "empty" | "unavailable";

export interface ExecutiveReportFixture {
  period: string;
  state: ReportState;
  freshness: WorkloadFreshness;
  summary: WorkloadReportSummary | null;
  charts: ExecutiveChartsData | null;
  distribution: DistributionTables | null;
  analytics: AnalyticsTablesData | null;
}

// --- Per-talent (individual) -------------------------------------------------

export interface TalentOption {
  /** Id internal talent — hanya untuk memilih mock & React key, tidak ke URL. */
  talentId: string;
  name: string;
  tribe: string;
  squad: string;
}

export interface IndividualLeaveItem {
  leavesDate: string;
  leavesDateHumanReadable: string;
  leavesDescription: string;
  source: string;
  totalHours: string;
  totalDays: string;
}

export interface IndividualLeaves {
  totalHours: string;
  totalHoursHumanReadable: string;
  leavesList: IndividualLeaveItem[];
}

export interface IndividualSummary {
  talentName: string;
  jiraName: string | null;
  /** Persen. */
  fte: number;
  statusLoad: WorkloadStatus | null;
  /** Jam. */
  totalAvailableTime: number;
  /** Jam. */
  totalTimespent: number;
  totalActivity: number;
  totalBacklog: number;
  /** Active/Passive/Medium/Super Active User — label dari server. */
  jiraCompliance: string | null;
  totalActivityNormalized: number;
  /** Persen. */
  percentageNormalized: number;
  /** Jam, terformat dari server; `null` bila tak tersedia. */
  totalTraining: string | null;
  /** Jam, terformat dari server; `null` bila tak tersedia. */
  totalWorkHours: string | null;
  leaves: IndividualLeaves | null;
}

export interface IndividualDetailProjectRow {
  tribe: string;
  product: string;
  squad: string;
  projectKey: string;
  /** Persen. */
  availability: number;
  /** Jam, terformat dari server. */
  timespent: string;
  /** Keterangan kategori mapping dari server (mis. "Workload tracked."). */
  category: string;
}

export interface IndividualStatusBacklogRow {
  /** "To Do" | "In Progress" | "Done" — nilai dari server. */
  statusCategory: string;
  total: number;
}

export interface IndividualTimespentPerProjectRow {
  squad: string | null;
  projectName: string | null;
  timespentTotalAct: number | null;
}

export interface IndividualTrendBacklogPoint {
  /** `YYYYMM`. */
  periode: string;
  totalBacklog: number;
  /** Jam, `null` bila tidak tercatat. */
  totalTimespent: number | null;
  /** Persen. */
  fte: number | null;
  statusLoad: WorkloadStatus | null;
}

export interface IndividualBacklogRow {
  issueKey: string | null;
  projectKey: string | null;
  backlog: string | null;
  /** Label status dari server (mis. "To Do", "In Progress", "Done"). */
  status: string | null;
  priority: string | null;
  /** ISO timestamp dari server. */
  updated: string | null;
  /** Jam; `null` bila belum ada timespent. */
  timespent: number | null;
  isNormalized: boolean;
}

export interface IndividualBacklogNormalizedRow {
  issueKey: string | null;
  projectKey: string | null;
  backlog: string | null;
  updated: string | null;
  /** Jam terisi, terformat dari server. */
  timespent: string | null;
  /** Jam ternormalisasi, terformat dari server. */
  timespentNormalized: string | null;
}

export interface TalentWorkloadFixture {
  talentId: string;
  period: string;
  state: ReportState;
  freshness: WorkloadFreshness;
  summary: IndividualSummary | null;
  assignedProjects: IndividualDetailProjectRow[] | null;
  statusBacklog: IndividualStatusBacklogRow[] | null;
  timespentPerProject: IndividualTimespentPerProjectRow[] | null;
  trendBacklog: IndividualTrendBacklogPoint[] | null;
  backlog: IndividualBacklogRow[] | null;
  backlogNormalized: IndividualBacklogNormalizedRow[] | null;
}
