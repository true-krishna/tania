/**
 * Fixtures for the workload-report dashboards (TAN-227, mock-data first).
 *
 * Every exported value stands in for a server-provided figure: the builder in
 * this module plays the role the WAD data mart plays in production, so the UI
 * consumes finished values only (no percentages, averages or pivots computed
 * at render time). Swapping in GraphQL later (TAN-236+) means replacing
 * `getExecutiveFixture` / `getTalentWorkloadFixture` and nothing else.
 *
 * Period ids are the raw `YYYYMM` the API uses — a single period id, never a
 * date range (FR-027).
 */
import type {
  AnalyticsTablesData,
  DistributionDimension,
  DistributionNormalizedRow,
  DistributionRow,
  DistributionScope,
  DistributionTables,
  ExecutiveChartsData,
  ExecutiveReportFixture,
  IndividualBacklogNormalizedRow,
  IndividualBacklogRow,
  IndividualDetailProjectRow,
  IndividualLeaves,
  IndividualStatusBacklogRow,
  IndividualSummary,
  IndividualTimespentPerProjectRow,
  IndividualTrendBacklogPoint,
  LoggedVsEstimatedRow,
  TalentCountByStatus,
  TalentOption,
  TalentWorkloadFixture,
  TtdComplianceLevel,
  TtdComplianceRow,
  WorkloadOvertimePoint,
  WorkloadReportSummary,
  WorkloadStatus,
} from "./types";
import { GRAND_TOTAL, WORKLOAD_STATUSES } from "./types";
import type { WorkloadFreshness } from "@/features/workload";

interface PeriodOption {
  id: string;
  label: string;
}

/** Periode yang ditawarkan selector, terbaru lebih dulu. */
export const REPORT_PERIODS: readonly PeriodOption[] = [
  { id: "202609", label: "September 2026" },
  { id: "202608", label: "Agustus 2026" },
  { id: "202607", label: "Juli 2026" },
  { id: "202606", label: "Juni 2026" },
];

export const DEFAULT_REPORT_PERIOD = REPORT_PERIODS[0].id;

export function isReportPeriod(id: string | null | undefined): id is string {
  return !!id && REPORT_PERIODS.some((p) => p.id === id);
}

const MONTHS_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function periodParts(periode: string): { year: number; month: number } {
  return { year: Number(periode.slice(0, 4)), month: Number(periode.slice(4, 6)) };
}

/** "202609" → "September 2026" (selector & subjudul). */
export function formatPeriodLabel(periode: string): string {
  const { year, month } = periodParts(periode);
  return `${MONTHS_ID[month - 1]} ${year}`;
}

/** "202609" → "Sep 26" (sumbu chart overtime). */
export function formatPeriodShort(periode: string): string {
  const { year, month } = periodParts(periode);
  return `${MONTHS_SHORT[month - 1]} ${String(year).slice(2)}`;
}

function addMonths(periode: string, delta: number): string {
  const { year, month } = periodParts(periode);
  const total = year * 12 + (month - 1) + delta;
  const nextYear = Math.floor(total / 12);
  const nextMonth = (((total % 12) + 12) % 12) + 1;
  return `${nextYear}${String(nextMonth).padStart(2, "0")}`;
}

function round(value: number, digits = 1): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

/** Jam bulat — string polos tanpa pemisah ribuan (format server). */
function formatInt(value: number): string {
  return String(Math.round(value));
}

/** Jam desimal — satu digit di belakang koma titik (format server). */
function formatHours(value: number): string {
  return String(round(value, 1));
}

/** IDR terformat id-ID (pemisah ribuan titik) — deterministik lintas environment. */
function formatIdr(value: number): string {
  const digits = String(Math.round(Math.abs(value)));
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `Rp ${value < 0 ? "-" : ""}${grouped}`;
}

function classify(ratio: number, activities: number, timespent: number): WorkloadStatus {
  if (activities === 0) return "Undefined Activity";
  if (timespent === 0) return "Undefined Time Spent";
  if (ratio < 0.85) return "Underload";
  if (ratio <= 1.15) return "Fit";
  if (ratio <= 1.3) return "Stretch";
  return "Overload";
}

function ttdLevelFor(percent: number): TtdComplianceLevel {
  if (percent >= 150) return "Very Good";
  if (percent >= 100) return "Good";
  if (percent >= 70) return "Fair";
  return "Need Improvement";
}

// --- Talent seed -------------------------------------------------------------
// Satu baris per talent; metrik per periode = seed × faktor periode. Angka di
// sini adalah bahan mentah yang "dihitung server" oleh builder di bawah.

interface TalentSeed {
  id: string;
  name: string;
  tribe: string;
  tribeId: string;
  product: string;
  productId: string;
  squad: string;
  squadId: string;
  unitcode: string;
  jobRole: string;
  /** Jam kerja tersedia dalam sebulan. */
  availability: number;
  /** Jam tercatat. */
  timespent: number;
  /** Jam estimasi. */
  estimate: number;
  backlog: number;
  activities: number;
  activitiesWithTimespent: number;
  training: number;
  assignments: number;
  /** Persen kepatuhan TTD talent. */
  ttdComp: number;
  /** Biaya bulanan talent (IDR). */
  costMonthly: number;
  /** Aktivitas yang melewati normalisasi (count). */
  normalizedCount: number;
  /** Jam cuti dalam periode. */
  leaveHours: number;
  projectKey: string;
  projectPrefix: string;
}

const TALENT_SEEDS: readonly TalentSeed[] = [
  { id: "tal-01", name: "Rani Puspita", tribe: "Digital Core", tribeId: "tr-dc", product: "Tania", productId: "pr-tania", squad: "Squad Alpha", squadId: "sq-alpha", unitcode: "Chapter DPS", jobRole: "Backend Engineer", availability: 160, timespent: 216, estimate: 176, backlog: 24, activities: 46, activitiesWithTimespent: 41, training: 2, assignments: 2, ttdComp: 163, costMonthly: 82_000_000, normalizedCount: 2, leaveHours: 0, projectKey: "TANIA", projectPrefix: "TAN" },
  { id: "tal-02", name: "Dimas Aryo", tribe: "Digital Core", tribeId: "tr-dc", product: "Tania", productId: "pr-tania", squad: "Squad Alpha", squadId: "sq-alpha", unitcode: "Chapter DPS", jobRole: "Frontend Engineer", availability: 160, timespent: 184, estimate: 160, backlog: 19, activities: 38, activitiesWithTimespent: 33, training: 1, assignments: 2, ttdComp: 128, costMonthly: 74_000_000, normalizedCount: 0, leaveHours: 0, projectKey: "TANIA", projectPrefix: "TAN" },
  { id: "tal-03", name: "Sinta Mahesa", tribe: "Digital Core", tribeId: "tr-dc", product: "Tania", productId: "pr-tania", squad: "Squad Alpha", squadId: "sq-alpha", unitcode: "Chapter DPS", jobRole: "Data Analyst", availability: 160, timespent: 128, estimate: 128, backlog: 11, activities: 27, activitiesWithTimespent: 21, training: 4, assignments: 1, ttdComp: 88, costMonthly: 63_000_000, normalizedCount: 0, leaveHours: 16, projectKey: "TANIA", projectPrefix: "TAN" },
  { id: "tal-04", name: "Ilham Fadillah", tribe: "Digital Core", tribeId: "tr-dc", product: "Tania", productId: "pr-tania", squad: "Squad Beta", squadId: "sq-beta", unitcode: "Chapter DPS", jobRole: "Project Manager", availability: 160, timespent: 190, estimate: 152, backlog: 8, activities: 31, activitiesWithTimespent: 29, training: 0, assignments: 3, ttdComp: 141, costMonthly: 95_000_000, normalizedCount: 1, leaveHours: 0, projectKey: "TANIA", projectPrefix: "TAN" },
  { id: "tal-05", name: "Nadia Wulandari", tribe: "Digital Core", tribeId: "tr-dc", product: "Tania", productId: "pr-tania", squad: "Squad Beta", squadId: "sq-beta", unitcode: "Chapter DPS", jobRole: "QA Engineer", availability: 160, timespent: 110, estimate: 144, backlog: 15, activities: 24, activitiesWithTimespent: 18, training: 2, assignments: 1, ttdComp: 64, costMonthly: 58_000_000, normalizedCount: 0, leaveHours: 0, projectKey: "TANIA", projectPrefix: "TAN" },
  { id: "tal-06", name: "Bayu Prakoso", tribe: "Digital Core", tribeId: "tr-dc", product: "PWA", productId: "pr-pwa", squad: "Squad Gamma", squadId: "sq-gamma", unitcode: "Chapter FES", jobRole: "DevOps Engineer", availability: 152, timespent: 0, estimate: 152, backlog: 9, activities: 12, activitiesWithTimespent: 0, training: 1, assignments: 1, ttdComp: 40, costMonthly: 70_000_000, normalizedCount: 0, leaveHours: 0, projectKey: "PWA", projectPrefix: "PWA" },
  { id: "tal-07", name: "Citra Lestari", tribe: "Digital Core", tribeId: "tr-dc", product: "PWA", productId: "pr-pwa", squad: "Squad Gamma", squadId: "sq-gamma", unitcode: "Chapter FES", jobRole: "Frontend Engineer", availability: 152, timespent: 199, estimate: 160, backlog: 21, activities: 42, activitiesWithTimespent: 36, training: 0, assignments: 2, ttdComp: 152, costMonthly: 76_000_000, normalizedCount: 1, leaveHours: 8, projectKey: "PWA", projectPrefix: "PWA" },
  { id: "tal-08", name: "Fajar Nugroho", tribe: "Data & AI", tribeId: "tr-dai", product: "WAD", productId: "pr-wad", squad: "Squad Delta", squadId: "sq-delta", unitcode: "Chapter FES", jobRole: "Data Engineer", availability: 168, timespent: 171, estimate: 168, backlog: 17, activities: 35, activitiesWithTimespent: 30, training: 3, assignments: 2, ttdComp: 104, costMonthly: 81_000_000, normalizedCount: 0, leaveHours: 0, projectKey: "WAD", projectPrefix: "WAD" },
  { id: "tal-09", name: "Gita Hapsari", tribe: "Data & AI", tribeId: "tr-dai", product: "WAD", productId: "pr-wad", squad: "Squad Delta", squadId: "sq-delta", unitcode: "Chapter FES", jobRole: "ML Engineer", availability: 168, timespent: 224, estimate: 176, backlog: 26, activities: 51, activitiesWithTimespent: 44, training: 1, assignments: 3, ttdComp: 168, costMonthly: 88_000_000, normalizedCount: 3, leaveHours: 0, projectKey: "WAD", projectPrefix: "WAD" },
  { id: "tal-10", name: "Hendra Wijaya", tribe: "Data & AI", tribeId: "tr-dai", product: "LLM Ops", productId: "pr-llm", squad: "Squad Epsilon", squadId: "sq-eps", unitcode: "Chapter QA", jobRole: "Platform Engineer", availability: 168, timespent: 0, estimate: 168, backlog: 6, activities: 0, activitiesWithTimespent: 0, training: 0, assignments: 1, ttdComp: 0, costMonthly: 79_000_000, normalizedCount: 0, leaveHours: 0, projectKey: "LLMOPS", projectPrefix: "LLM" },
];

const PERIOD_FACTOR: Record<string, number> = {
  "202609": 1,
  "202608": 0.96,
  "202607": 0.93,
  "202606": 0.9,
};

/** Wobble 12 bulan untuk seri overtime/trend di luar periode ber-fixture. */
const MONTH_WOBBLE = [1, 0.97, 1.03, 0.99, 1.05, 0.96, 1.02, 0.98, 1.04, 1, 0.95, 1.01];

const REVENUE_BASE = 2_450_000_000;

interface TalentMetrics extends TalentSeed {
  ratio: number;
  fte: number;
  statusLoad: WorkloadStatus;
  estimateRatio: number;
  statusLoadEstimate: WorkloadStatus;
  compLvl: TtdComplianceLevel;
}

function metricsFor(periode: string): TalentMetrics[] {
  const factor = PERIOD_FACTOR[periode] ?? 1;
  return TALENT_SEEDS.map((seed) => {
    const timespent = round(seed.timespent * factor);
    const estimate = round(seed.estimate * factor);
    const activities = Math.round(seed.activities * factor);
    const backlog = Math.round(seed.backlog * factor);
    const activitiesWithTimespent = Math.min(activities, Math.round(seed.activitiesWithTimespent * factor));
    const ratio = seed.availability > 0 ? timespent / seed.availability : 0;
    const estimateRatio = seed.availability > 0 ? estimate / seed.availability : 0;
    return {
      ...seed,
      timespent,
      estimate,
      activities,
      backlog,
      activitiesWithTimespent,
      ratio,
      fte: round(ratio * 100, 1),
      statusLoad: classify(ratio, activities, timespent),
      estimateRatio,
      statusLoadEstimate: classify(estimateRatio, activities, estimate),
      compLvl: ttdLevelFor(seed.ttdComp),
    };
  });
}

function availabilityPercent(t: TalentMetrics): number {
  return round((t.availability / 168) * 100, 1);
}

function leavesFor(talentId: string): IndividualLeaves | null {
  if (talentId === "tal-03") {
    return {
      totalHours: "16",
      totalHoursHumanReadable: "2 hari",
      leavesList: [
        { leavesDate: "2026-09-14", leavesDateHumanReadable: "Sen, 14 Sep 2026", leavesDescription: "Cuti tahunan", source: "Diarium", totalHours: "8", totalDays: "1" },
        { leavesDate: "2026-09-15", leavesDateHumanReadable: "Sel, 15 Sep 2026", leavesDescription: "Cuti tahunan", source: "Diarium", totalHours: "8", totalDays: "1" },
      ],
    };
  }
  if (talentId === "tal-07") {
    return {
      totalHours: "8",
      totalHoursHumanReadable: "1 hari",
      leavesList: [
        { leavesDate: "2026-09-21", leavesDateHumanReadable: "Sen, 21 Sep 2026", leavesDescription: "Izin sakit", source: "Diarium", totalHours: "8", totalDays: "1" },
      ],
    };
  }
  return null;
}

// --- Executive summary -------------------------------------------------------

function buildSummary(ms: TalentMetrics[], periodFactor: number): WorkloadReportSummary {
  const totalTalent = ms.length;
  const sum = (pick: (t: TalentMetrics) => number) => ms.reduce((acc, t) => acc + pick(t), 0);
  const totalAvailableTime = sum((t) => t.availability);
  const totalTimespent = sum((t) => t.timespent);
  const totalEstimate = sum((t) => t.estimate);
  const totalActivities = sum((t) => t.activities);
  const totalCost = sum((t) => t.costMonthly);
  const revenue = REVENUE_BASE * periodFactor;
  const avgTtd = totalTalent > 0 ? sum((t) => t.ttdComp) / totalTalent : 0;

  return {
    totalTalent,
    totalBacklog: sum((t) => t.backlog),
    totalTaskSubtask: totalActivities,
    totalTaskSubtaskWithTimespent: sum((t) => t.activitiesWithTimespent),
    totalAvailableTime: formatInt(totalAvailableTime),
    totalTimespent: formatHours(totalTimespent),
    weeklyTimespentPerTalent: round(totalTimespent / totalTalent / 4.33, 1),
    dailyTimespentPerTalent: round(totalTimespent / totalTalent / 20, 1),
    fte: round((totalTimespent / totalAvailableTime) * 100, 1),
    statusLoad: classify(totalTimespent / totalAvailableTime, totalActivities, totalTimespent),
    totalTimespentEstimate: formatHours(totalEstimate),
    loadEstimate: round((totalEstimate / totalAvailableTime) * 100, 1),
    statusLoadEstimate: classify(totalEstimate / totalAvailableTime, totalActivities, totalEstimate),
    ttdCompliance: round(avgTtd, 1),
    talentComplyTtd: ms.filter((t) => t.ttdComp >= 100).length,
    totalTalentNormalized: ms.filter((t) => t.normalizedCount > 0).length,
    totalActivityNormalized: sum((t) => t.normalizedCount),
    cost: formatIdr(totalCost),
    avgCost: formatIdr(totalCost / totalTalent),
    revenue: formatIdr(revenue),
    revenuePerMonth: formatIdr(revenue),
    revenuePerMonthPerTalent: formatIdr(revenue / totalTalent),
    rbv: formatIdr(revenue * 1.15),
    rbvPerMonth: formatIdr(revenue * 1.15),
    rbvPerMonthPerTalent: formatIdr((revenue * 1.15) / totalTalent),
  };
}

// --- Distribution ------------------------------------------------------------

interface Group {
  id: string;
  nama: string;
  scope: DistributionScope;
  members: TalentMetrics[];
}

function groupByDimension(
  level: DistributionDimension,
  ms: TalentMetrics[],
): Group[] {
  const groups = new Map<string, Group>();
  for (const t of ms) {
    let id: string;
    let nama: string;
    let scope: DistributionScope;
    if (level === "tribe") {
      id = t.tribeId; nama = t.tribe;
      scope = { tribeId: t.tribeId, productId: null, squadId: null, unitcode: null };
    } else if (level === "product") {
      id = t.productId; nama = t.product;
      scope = { tribeId: t.tribeId, productId: t.productId, squadId: null, unitcode: null };
    } else if (level === "squad") {
      id = t.squadId; nama = t.squad;
      scope = { tribeId: t.tribeId, productId: t.productId, squadId: t.squadId, unitcode: null };
    } else if (level === "unitcode") {
      // Unit code hidup di bawah satu squad (tribe → product → squad →
      // unitcode → talent); menggabungkan unitcode lintas squad membuat
      // agregat tak cocok dengan talent konstituennya saat drill-down.
      id = `${t.tribeId}/${t.productId}/${t.squadId}/${t.unitcode}`;
      nama = t.unitcode;
      scope = { tribeId: t.tribeId, productId: t.productId, squadId: t.squadId, unitcode: t.unitcode };
    } else {
      id = t.id; nama = t.name;
      scope = { tribeId: t.tribeId, productId: t.productId, squadId: t.squadId, unitcode: t.unitcode };
    }
    const existing = groups.get(id);
    if (existing) {
      existing.members.push(t);
    } else {
      groups.set(id, { id, nama, scope, members: [t] });
    }
  }
  return [...groups.values()];
}

function buildDistributionRow(group: Group): DistributionRow {
  const ms = group.members;
  const n = ms.length;
  const sum = (pick: (t: TalentMetrics) => number) => ms.reduce((acc, t) => acc + pick(t), 0);
  const totalAvailableTime = sum((t) => t.availability);
  const totalTimespent = sum((t) => t.timespent);
  const totalEstimate = sum((t) => t.estimate);
  const totalActivities = sum((t) => t.activities);
  const ratio = totalAvailableTime > 0 ? totalTimespent / totalAvailableTime : 0;
  const single = n === 1 ? ms[0] : null;

  return {
    id: group.id,
    nama: group.nama,
    scope: group.scope,
    talentId: single ? single.id : null,
    talentName: single ? single.name : null,
    jumlahTalent: n,
    totalBacklog: sum((t) => t.backlog),
    totalTaskSubtask: totalActivities,
    taskSubtaskPerTalent: String(round(totalActivities / n, 1)),
    availability: round(ms.reduce((acc, t) => acc + availabilityPercent(t), 0) / n, 1),
    totalAvailableTime: formatInt(totalAvailableTime),
    totalTimespent: formatHours(totalTimespent),
    fte: round(ratio * 100, 1),
    statusLoad: classify(ratio, totalActivities, totalTimespent),
    backlogPerTalent: Math.round(sum((t) => t.backlog) / n),
    taskSubtaskWithTimespent: sum((t) => t.activitiesWithTimespent),
    training: sum((t) => t.training),
    avgFte: round(ms.reduce((acc, t) => acc + t.fte, 0) / n, 1),
    jmlAssignment: sum((t) => t.assignments),
    totalTimespentEstimate: formatHours(totalEstimate),
    loadEstimate: round((totalEstimate / totalAvailableTime) * 100, 1),
    statusLoadEstimate: classify(totalEstimate / totalAvailableTime, totalActivities, totalEstimate),
    ttdComp: round(ms.reduce((acc, t) => acc + t.ttdComp, 0) / n, 1),
    compLvl: ttdLevelFor(ms.reduce((acc, t) => acc + t.ttdComp, 0) / n),
    isNormalized: ms.some((t) => t.normalizedCount > 0),
    totalCost: formatIdr(sum((t) => t.costMonthly)),
  };
}

function buildNormalizedRows(
  level: DistributionDimension,
  ms: TalentMetrics[],
): DistributionNormalizedRow[] {
  return groupByDimension(level, ms)
    .map((group) => {
      const normalized = group.members.filter((t) => t.normalizedCount > 0);
      if (normalized.length === 0) return null;
      const totalTimespent = group.members.reduce((acc, t) => acc + t.timespent, 0);
      const row: DistributionNormalizedRow = {
        id: group.id,
        nama: group.nama,
        scope: group.scope,
        jumlahTalent: normalized.length,
        jmlActivityNormalized: String(normalized.reduce((acc, t) => acc + t.normalizedCount, 0)),
        totalTimespent: formatHours(totalTimespent),
        totalTimespentNormDay: formatHours(totalTimespent / 20),
      };
      return row;
    })
    .filter((row): row is DistributionNormalizedRow => row !== null);
}

function buildDistribution(ms: TalentMetrics[]): DistributionTables {
  const rows = {} as Record<DistributionDimension, DistributionRow[]>;
  const normalizedRows = {} as Record<DistributionDimension, DistributionNormalizedRow[]>;
  for (const level of ["tribe", "product", "squad", "unitcode", "talent"] as const) {
    rows[level] = groupByDimension(level, ms).map(buildDistributionRow);
    normalizedRows[level] = buildNormalizedRows(level, ms);
  }
  return { rows, normalizedRows };
}

// --- Analytics pivots --------------------------------------------------------

const ESTIMATE_COLUMN = {
  "Undefined Activity": "undefinedActivity",
  "Undefined Time Spent": "undefinedTimespent",
  Underload: "underload",
  Fit: "fit",
  Stretch: "stretch",
  Overload: "overload",
} as const satisfies Record<WorkloadStatus, keyof Omit<LoggedVsEstimatedRow, "statusLoad" | "total">>;

const TTD_COLUMN = {
  "Need Improvement": "notAchieved",
  Fair: "lowAchieved",
  Good: "achieved",
  "Very Good": "highAchieved",
} as const satisfies Record<TtdComplianceLevel, keyof Omit<TtdComplianceRow, "statusLoad" | "total">>;

interface MutableLoggedVsEstimatedRow {
  statusLoad: WorkloadStatus | typeof GRAND_TOTAL;
  undefinedActivity: number;
  undefinedTimespent: number;
  underload: number;
  fit: number;
  stretch: number;
  overload: number;
  total: number;
}

function emptyLoggedVsEstimatedRow(statusLoad: WorkloadStatus | typeof GRAND_TOTAL): MutableLoggedVsEstimatedRow {
  return {
    statusLoad,
    undefinedActivity: 0,
    undefinedTimespent: 0,
    underload: 0,
    fit: 0,
    stretch: 0,
    overload: 0,
    total: 0,
  };
}

function buildLoggedVsEstimated(ms: TalentMetrics[]): LoggedVsEstimatedRow[] {
  const rows = new Map<WorkloadStatus, MutableLoggedVsEstimatedRow>();
  for (const status of WORKLOAD_STATUSES) {
    rows.set(status, emptyLoggedVsEstimatedRow(status));
  }
  const grandTotal = emptyLoggedVsEstimatedRow(GRAND_TOTAL);
  for (const t of ms) {
    const row = rows.get(t.statusLoad);
    const column = ESTIMATE_COLUMN[t.statusLoadEstimate];
    if (row) {
      row[column] += 1;
      row.total += 1;
    }
    grandTotal[column] += 1;
    grandTotal.total += 1;
  }
  return [...rows.values(), grandTotal];
}

interface MutableTtdComplianceRow {
  statusLoad: WorkloadStatus | typeof GRAND_TOTAL;
  notAchieved: number;
  lowAchieved: number;
  achieved: number;
  highAchieved: number;
  total: number;
}

function emptyTtdRow(statusLoad: WorkloadStatus | typeof GRAND_TOTAL): MutableTtdComplianceRow {
  return {
    statusLoad,
    notAchieved: 0,
    lowAchieved: 0,
    achieved: 0,
    highAchieved: 0,
    total: 0,
  };
}

function buildTtdCompliance(ms: TalentMetrics[]): TtdComplianceRow[] {
  const rows = new Map<WorkloadStatus, MutableTtdComplianceRow>();
  for (const status of WORKLOAD_STATUSES) {
    rows.set(status, emptyTtdRow(status));
  }
  const grandTotal = emptyTtdRow(GRAND_TOTAL);
  for (const t of ms) {
    const row = rows.get(t.statusLoad);
    const column = TTD_COLUMN[t.compLvl];
    if (row) {
      row[column] += 1;
      row.total += 1;
    }
    grandTotal[column] += 1;
    grandTotal.total += 1;
  }
  return [...rows.values(), grandTotal];
}

// --- Executive charts --------------------------------------------------------

function buildTalentByWorkloadLevel(ms: TalentMetrics[]): TalentCountByStatus[] {
  return WORKLOAD_STATUSES.map((status) => ({
    statusLoad: status,
    total: ms.filter((t) => t.statusLoad === status).length,
  }));
}

function buildWorkloadOvertime(periode: string, base: TalentMetrics[]): WorkloadOvertimePoint[] {
  const points: WorkloadOvertimePoint[] = [];
  for (let offset = 11; offset >= 0; offset -= 1) {
    const pointPeriod = addMonths(periode, -offset);
    const factor = PERIOD_FACTOR[pointPeriod] ?? MONTH_WOBBLE[offset];
    const scoped = base.map((t) => {
      const timespent = round(t.timespent * factor);
      const activities = Math.round(t.activities * factor);
      const ratio = t.availability > 0 ? timespent / t.availability : 0;
      return { statusLoad: classify(ratio, activities, timespent) };
    });
    const point: WorkloadOvertimePoint = {
      periode: pointPeriod,
      undefinedActivity: 0,
      undefinedTimespent: 0,
      underload: 0,
      fit: 0,
      stretch: 0,
      overload: 0,
    };
    for (const t of scoped) {
      if (t.statusLoad === "Undefined Activity") point.undefinedActivity += 1;
      else if (t.statusLoad === "Undefined Time Spent") point.undefinedTimespent += 1;
      else if (t.statusLoad === "Underload") point.underload += 1;
      else if (t.statusLoad === "Fit") point.fit += 1;
      else if (t.statusLoad === "Stretch") point.stretch += 1;
      else point.overload += 1;
    }
    points.push(point);
  }
  return points;
}

// --- Individual (per-talent) -------------------------------------------------

const BACKLOG_TITLES = [
  "Perbaiki validasi form assignment",
  "Tambah filter periode pada laporan",
  "Rapikan pagination tabel karyawan",
  "Sinkronisasi data master unit",
  "Optimasi query daftar aktivitas",
  "Perbaiki redirect setelah login",
  "Tambah audit trail perubahan kontrak",
  "Perbarui template evaluasi periode",
  "Migrasi auth ke sesi terpusat",
  "Perbaiki EmptyState halaman IDP",
  "Tambah ekspor CSV laporan talent",
  "Rapikan i18n halaman profil",
  "Tambah indikator stale data workload",
  "Perbaiki fokus keyboard modal assign",
];

const BACKLOG_STATUSES = ["To Do", "In Progress", "Done"] as const;
const BACKLOG_PRIORITIES = ["Critical", "High", "Medium", "Low"] as const;

function buildBacklogRows(seed: TalentMetrics): IndividualBacklogRow[] {
  const seedIndex = TALENT_SEEDS.findIndex((t) => t.id === seed.id);
  const baseDate = Date.UTC(2026, 8, 28);
  return BACKLOG_TITLES.map((title, k) => {
    const timespent = k % 5 === 0 ? null : ((seedIndex * 3 + k * 7) % 11) + 1;
    const updated = new Date(baseDate - (k * 2 + seedIndex) * 86_400_000).toISOString();
    const row: IndividualBacklogRow = {
      issueKey: `${seed.projectPrefix}-${240 + seedIndex * 17 + k}`,
      projectKey: seed.projectKey,
      backlog: title,
      status: BACKLOG_STATUSES[(seedIndex + k) % BACKLOG_STATUSES.length],
      priority: BACKLOG_PRIORITIES[(seedIndex * 2 + k) % BACKLOG_PRIORITIES.length],
      updated,
      timespent,
      isNormalized: timespent !== null && timespent > 8,
    };
    return row;
  });
}

function buildBacklogNormalized(rows: IndividualBacklogRow[]): IndividualBacklogNormalizedRow[] {
  return rows
    .filter((row) => row.isNormalized && row.timespent !== null)
    .map((row) => ({
      issueKey: row.issueKey,
      projectKey: row.projectKey,
      backlog: row.backlog,
      updated: row.updated,
      timespent: formatHours(row.timespent ?? 0),
      timespentNormalized: formatHours(8),
    }));
}

function buildIndividualSummary(seed: TalentMetrics, periodFactor: number): IndividualSummary {
  const complianceRatio = seed.activities > 0 ? seed.activitiesWithTimespent / seed.activities : null;
  const jiraCompliance =
    complianceRatio === null
      ? null
      : complianceRatio >= 0.8
        ? "Super Active User"
        : complianceRatio >= 0.5
          ? "Medium User"
          : "Passive User";

  return {
    talentName: seed.name,
    jiraName: seed.projectPrefix === "LLM" ? null : `${seed.name.split(" ")[0].toLowerCase()}`,
    fte: seed.fte,
    statusLoad: seed.statusLoad,
    totalAvailableTime: seed.availability,
    totalTimespent: seed.timespent,
    totalActivity: seed.activities,
    totalBacklog: seed.backlog,
    jiraCompliance,
    totalActivityNormalized: seed.normalizedCount,
    percentageNormalized: seed.activities > 0 ? round((seed.normalizedCount / seed.activities) * 100, 1) : 0,
    totalTraining: formatHours(seed.training * 2),
    totalWorkHours: formatInt(seed.availability - seed.leaveHours * periodFactor),
    leaves: leavesFor(seed.id),
  };
}

function buildAssignedProjects(seed: TalentMetrics): IndividualDetailProjectRow[] {
  const rows: IndividualDetailProjectRow[] = [
    {
      tribe: seed.tribe,
      product: seed.product,
      squad: seed.squad,
      projectKey: seed.projectKey,
      availability: availabilityPercent(seed),
      timespent: formatHours(seed.timespent * 0.85),
      category: "Workload tracked.",
    },
  ];
  if (seed.training > 0) {
    rows.push({
      tribe: seed.tribe,
      product: "TRAINING & ADHOC",
      squad: seed.squad,
      projectKey: "ADHOC",
      availability: round(100 - availabilityPercent(seed), 1),
      timespent: formatHours(seed.timespent * 0.15),
      category: "Workload tracked.",
    });
  }
  if (seed.statusLoad === "Undefined Time Spent") {
    rows[0] = { ...rows[0], category: "No activities logged." };
  }
  if (seed.statusLoad === "Undefined Activity") {
    rows[0] = { ...rows[0], category: "Assignment is not mapped to any project." };
  }
  return rows;
}

function buildTimespentPerProject(seed: TalentMetrics): IndividualTimespentPerProjectRow[] {
  const rows: IndividualTimespentPerProjectRow[] = [
    { squad: seed.squad, projectName: seed.projectKey, timespentTotalAct: seed.timespent > 0 ? round(seed.timespent * 0.85) : 0 },
  ];
  if (seed.training > 0) {
    rows.push({ squad: seed.squad, projectName: "ADHOC", timespentTotalAct: round(seed.timespent * 0.15) });
  }
  return rows;
}

function buildTrendBacklog(seed: TalentMetrics, periode: string): IndividualTrendBacklogPoint[] {
  const points: IndividualTrendBacklogPoint[] = [];
  for (let offset = 11; offset >= 0; offset -= 1) {
    const pointPeriod = addMonths(periode, -offset);
    const factor = PERIOD_FACTOR[pointPeriod] ?? MONTH_WOBBLE[offset];
    const timespent = round(seed.timespent * factor, 1);
    const activities = Math.round(seed.activities * factor);
    const ratio = seed.availability > 0 ? timespent / seed.availability : 0;
    points.push({
      periode: pointPeriod,
      totalBacklog: Math.max(0, Math.round(seed.backlog * factor)),
      totalTimespent: timespent > 0 ? timespent : null,
      fte: round(ratio * 100, 1),
      statusLoad: classify(ratio, activities, timespent),
    });
  }
  return points;
}

function buildStatusBacklog(rows: IndividualBacklogRow[]): IndividualStatusBacklogRow[] {
  return BACKLOG_STATUSES.map((status) => ({
    statusCategory: status,
    total: rows.filter((row) => row.status === status).length,
  }));
}

// --- Fixture assembly --------------------------------------------------------

const BASE_FRESHNESS: Omit<WorkloadFreshness, "sourceStatus" | "lastUpdatedAt" | "isStale"> = {
  staleAfterHours: 72,
  expectedReflectionHours: 24,
};

function executiveFixtureFor(periode: string): ExecutiveReportFixture {
  if (periode === "202607") {
    return {
      period: periode,
      state: "empty",
      freshness: {
        ...BASE_FRESHNESS,
        sourceStatus: "OK",
        lastUpdatedAt: "2026-10-16T02:15:00+07:00",
        isStale: false,
      },
      summary: null,
      charts: null,
      distribution: null,
      analytics: null,
    };
  }

  const ms = metricsFor(periode);
  const periodFactor = PERIOD_FACTOR[periode] ?? 1;
  const unavailable = periode === "202606";
  const charts: ExecutiveChartsData = {
    talentByWorkloadLevel: buildTalentByWorkloadLevel(ms),
    workloadOvertime: buildWorkloadOvertime(periode, ms),
  };
  const analytics: AnalyticsTablesData = {
    loggedVsEstimated: buildLoggedVsEstimated(ms),
    ttdCompliance: buildTtdCompliance(ms),
  };

  return {
    period: periode,
    state: unavailable ? "unavailable" : "ready",
    freshness: {
      ...BASE_FRESHNESS,
      sourceStatus: unavailable ? "UNAVAILABLE" : "OK",
      lastUpdatedAt: unavailable ? "2026-10-09T09:00:00+07:00" : "2026-10-16T02:15:00+07:00",
      isStale: unavailable,
    },
    summary: buildSummary(ms, periodFactor),
    charts,
    distribution: buildDistribution(ms),
    analytics,
  };
}

function talentFixtureFor(periode: string, talentId: string): TalentWorkloadFixture | null {
  const seed = TALENT_SEEDS.find((t) => t.id === talentId);
  if (!seed) return null;

  if (periode === "202607") {
    return {
      talentId,
      period: periode,
      state: "empty",
      freshness: {
        ...BASE_FRESHNESS,
        sourceStatus: "OK",
        lastUpdatedAt: "2026-10-16T02:15:00+07:00",
        isStale: false,
      },
      summary: null,
      assignedProjects: null,
      statusBacklog: null,
      timespentPerProject: null,
      trendBacklog: null,
      backlog: null,
      backlogNormalized: null,
    };
  }

  const ms = metricsFor(periode);
  const talent = ms.find((t) => t.id === talentId);
  if (!talent) return null;
  const backlogRows = buildBacklogRows(talent);
  const unavailable = periode === "202606";

  return {
    talentId,
    period: periode,
    state: unavailable ? "unavailable" : "ready",
    freshness: {
      ...BASE_FRESHNESS,
      sourceStatus: unavailable ? "UNAVAILABLE" : "OK",
      lastUpdatedAt: unavailable ? "2026-10-09T09:00:00+07:00" : "2026-10-16T02:15:00+07:00",
      isStale: unavailable,
    },
    summary: buildIndividualSummary(talent, PERIOD_FACTOR[periode] ?? 1),
    assignedProjects: buildAssignedProjects(talent),
    statusBacklog: buildStatusBacklog(backlogRows),
    timespentPerProject: buildTimespentPerProject(talent),
    trendBacklog: buildTrendBacklog(talent, periode),
    backlog: backlogRows,
    backlogNormalized: buildBacklogNormalized(backlogRows),
  };
}

const executiveCache = new Map<string, ExecutiveReportFixture>();
const talentCache = new Map<string, TalentWorkloadFixture | null>();

export function getExecutiveFixture(periode: string): ExecutiveReportFixture | null {
  if (!isReportPeriod(periode)) return null;
  const cached = executiveCache.get(periode);
  if (cached) return cached;
  const fixture = executiveFixtureFor(periode);
  executiveCache.set(periode, fixture);
  return fixture;
}

export function getTalentWorkloadFixture(
  periode: string,
  talentId: string,
): TalentWorkloadFixture | null {
  if (!isReportPeriod(periode)) return null;
  const cacheKey = `${periode}:${talentId}`;
  const cached = talentCache.get(cacheKey);
  if (cached !== undefined) return cached;
  const fixture = talentFixtureFor(periode, talentId);
  talentCache.set(cacheKey, fixture);
  return fixture;
}

/** Daftar talent untuk selector halaman per-talent — tidak pernah masuk URL. */
export const REPORT_TALENT_OPTIONS: readonly TalentOption[] = TALENT_SEEDS.map((t) => ({
  talentId: t.id,
  name: t.name,
  tribe: t.tribe,
  squad: t.squad,
}));

export const DEFAULT_TALENT_ID = REPORT_TALENT_OPTIONS[0].talentId;

/** Baris sumber cost/revenue untuk headline tab Cost & Revenue. */
export const COST_REVENUE_SOURCE_NOTE =
  "Revenue Source: PMA · Estimated Talent Cost Source: DPI, DPG, & PMA Report";
