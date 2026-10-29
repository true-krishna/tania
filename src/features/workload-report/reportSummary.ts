import type {
  DistributionDimension,
  DistributionScope,
  DistributionNormalizedRow,
  DistributionRow,
  DistributionTables,
  WorkloadReportSummary,
} from "./types";
import type { TalentMetrics } from "./reportMetrics";
import { REVENUE_BASE, availabilityPercent } from "./reportMetrics";
import { classify, formatHours, formatIdr, formatInt, round, ttdLevelFor } from "./reportPeriods";

// --- Executive summary -------------------------------------------------------

export function buildSummary(ms: TalentMetrics[], periodFactor: number): WorkloadReportSummary {
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
    statusLoadEstimate: classify(
      totalEstimate / totalAvailableTime,
      totalActivities,
      totalEstimate,
    ),
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

export interface Group {
  id: string;
  nama: string;
  scope: DistributionScope;
  members: TalentMetrics[];
}

export function groupByDimension(level: DistributionDimension, ms: TalentMetrics[]): Group[] {
  const groups = new Map<string, Group>();
  for (const t of ms) {
    let id: string;
    let nama: string;
    let scope: DistributionScope;
    if (level === "tribe") {
      id = t.tribeId;
      nama = t.tribe;
      scope = { tribeId: t.tribeId, productId: null, squadId: null, unitcode: null };
    } else if (level === "product") {
      id = t.productId;
      nama = t.product;
      scope = { tribeId: t.tribeId, productId: t.productId, squadId: null, unitcode: null };
    } else if (level === "squad") {
      id = t.squadId;
      nama = t.squad;
      scope = { tribeId: t.tribeId, productId: t.productId, squadId: t.squadId, unitcode: null };
    } else if (level === "unitcode") {
      // Unit code hidup di bawah satu squad (tribe → product → squad →
      // unitcode → talent); menggabungkan unitcode lintas squad membuat
      // agregat tak cocok dengan talent konstituennya saat drill-down.
      id = `${t.tribeId}/${t.productId}/${t.squadId}/${t.unitcode}`;
      nama = t.unitcode;
      scope = {
        tribeId: t.tribeId,
        productId: t.productId,
        squadId: t.squadId,
        unitcode: t.unitcode,
      };
    } else {
      id = t.id;
      nama = t.name;
      scope = {
        tribeId: t.tribeId,
        productId: t.productId,
        squadId: t.squadId,
        unitcode: t.unitcode,
      };
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

export function buildDistributionRow(group: Group): DistributionRow {
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
    tribe: single ? single.tribe : null,
    squad: single ? single.squad : null,
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
    statusLoadEstimate: classify(
      totalEstimate / totalAvailableTime,
      totalActivities,
      totalEstimate,
    ),
    ttdComp: round(ms.reduce((acc, t) => acc + t.ttdComp, 0) / n, 1),
    compLvl: ttdLevelFor(ms.reduce((acc, t) => acc + t.ttdComp, 0) / n),
    isNormalized: ms.some((t) => t.normalizedCount > 0),
    totalCost: formatIdr(sum((t) => t.costMonthly)),
  };
}

export function buildNormalizedRows(
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

export function buildDistribution(ms: TalentMetrics[]): DistributionTables {
  const rows = {} as Record<DistributionDimension, DistributionRow[]>;
  const normalizedRows = {} as Record<DistributionDimension, DistributionNormalizedRow[]>;
  for (const level of ["tribe", "product", "squad", "unitcode", "talent"] as const) {
    rows[level] = groupByDimension(level, ms).map(buildDistributionRow);
    normalizedRows[level] = buildNormalizedRows(level, ms);
  }
  return { rows, normalizedRows };
}
