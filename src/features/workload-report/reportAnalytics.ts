import { GRAND_TOTAL, WORKLOAD_STATUSES } from "./types";
import type {
  LoggedVsEstimatedRow,
  TalentCountByStatus,
  TtdComplianceLevel,
  TtdComplianceRow,
  WorkloadOvertimePoint,
  WorkloadStatus,
} from "./types";
import type { TalentMetrics } from "./reportMetrics";
import { MONTH_WOBBLE, PERIOD_FACTOR } from "./reportMetrics";
import { addMonths, classify, round } from "./reportPeriods";

// --- Analytics pivots --------------------------------------------------------

export const ESTIMATE_COLUMN = {
  "Undefined Activity": "undefinedActivity",
  "Undefined Time Spent": "undefinedTimespent",
  Underload: "underload",
  Fit: "fit",
  Stretch: "stretch",
  Overload: "overload",
} as const satisfies Record<
  WorkloadStatus,
  keyof Omit<LoggedVsEstimatedRow, "statusLoad" | "total">
>;

export const TTD_COLUMN = {
  "Need Improvement": "notAchieved",
  Fair: "lowAchieved",
  Good: "achieved",
  "Very Good": "highAchieved",
} as const satisfies Record<
  TtdComplianceLevel,
  keyof Omit<TtdComplianceRow, "statusLoad" | "total">
>;

export interface MutableLoggedVsEstimatedRow {
  statusLoad: WorkloadStatus | typeof GRAND_TOTAL;
  undefinedActivity: number;
  undefinedTimespent: number;
  underload: number;
  fit: number;
  stretch: number;
  overload: number;
  total: number;
}

export function emptyLoggedVsEstimatedRow(
  statusLoad: WorkloadStatus | typeof GRAND_TOTAL,
): MutableLoggedVsEstimatedRow {
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

export function buildLoggedVsEstimated(ms: TalentMetrics[]): LoggedVsEstimatedRow[] {
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

export interface MutableTtdComplianceRow {
  statusLoad: WorkloadStatus | typeof GRAND_TOTAL;
  notAchieved: number;
  lowAchieved: number;
  achieved: number;
  highAchieved: number;
  total: number;
}

export function emptyTtdRow(
  statusLoad: WorkloadStatus | typeof GRAND_TOTAL,
): MutableTtdComplianceRow {
  return {
    statusLoad,
    notAchieved: 0,
    lowAchieved: 0,
    achieved: 0,
    highAchieved: 0,
    total: 0,
  };
}

export function buildTtdCompliance(ms: TalentMetrics[]): TtdComplianceRow[] {
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

export function buildTalentByWorkloadLevel(ms: TalentMetrics[]): TalentCountByStatus[] {
  return WORKLOAD_STATUSES.map((status) => ({
    statusLoad: status,
    total: ms.filter((t) => t.statusLoad === status).length,
  }));
}

export function buildWorkloadOvertime(
  periode: string,
  base: TalentMetrics[],
): WorkloadOvertimePoint[] {
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
