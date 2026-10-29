import type {
  IndividualBacklogNormalizedRow,
  IndividualBacklogRow,
  IndividualDetailProjectRow,
  IndividualStatusBacklogRow,
  IndividualSummary,
  IndividualTimespentPerProjectRow,
  IndividualTrendBacklogPoint,
} from "./types";
import type { TalentMetrics } from "./reportMetrics";
import { MONTH_WOBBLE, PERIOD_FACTOR, availabilityPercent, leavesFor } from "./reportMetrics";
import { addMonths, classify, formatHours, formatInt, round } from "./reportPeriods";
import { TALENT_SEEDS } from "./talentSeeds";

// --- Individual (per-talent) -------------------------------------------------

export const BACKLOG_TITLES = [
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

export const BACKLOG_STATUSES = ["To Do", "In Progress", "Done"] as const;
export const BACKLOG_PRIORITIES = ["Critical", "High", "Medium", "Low"] as const;

export function buildBacklogRows(seed: TalentMetrics): IndividualBacklogRow[] {
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

export function buildBacklogNormalized(
  rows: IndividualBacklogRow[],
): IndividualBacklogNormalizedRow[] {
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

export function buildIndividualSummary(
  seed: TalentMetrics,
  periodFactor: number,
): IndividualSummary {
  const complianceRatio =
    seed.activities > 0 ? seed.activitiesWithTimespent / seed.activities : null;
  const jiraCompliance = complianceLabel(complianceRatio);

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
    percentageNormalized:
      seed.activities > 0 ? round((seed.normalizedCount / seed.activities) * 100, 1) : 0,
    totalTraining: formatHours(seed.training * 2),
    totalWorkHours: formatInt(seed.availability - seed.leaveHours * periodFactor),
    leaves: leavesFor(seed.id),
  };
}

export function buildAssignedProjects(seed: TalentMetrics): IndividualDetailProjectRow[] {
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

export function buildTimespentPerProject(seed: TalentMetrics): IndividualTimespentPerProjectRow[] {
  const rows: IndividualTimespentPerProjectRow[] = [
    {
      squad: seed.squad,
      projectName: seed.projectKey,
      timespentTotalAct: seed.timespent > 0 ? round(seed.timespent * 0.85) : 0,
    },
  ];
  if (seed.training > 0) {
    rows.push({
      squad: seed.squad,
      projectName: "ADHOC",
      timespentTotalAct: round(seed.timespent * 0.15),
    });
  }
  return rows;
}

export function buildTrendBacklog(
  seed: TalentMetrics,
  periode: string,
): IndividualTrendBacklogPoint[] {
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

export function buildStatusBacklog(rows: IndividualBacklogRow[]): IndividualStatusBacklogRow[] {
  return BACKLOG_STATUSES.map((status) => ({
    statusCategory: status,
    total: rows.filter((row) => row.status === status).length,
  }));
}

function complianceLabel(ratio: number | null): string | null {
  if (ratio === null) return null;
  if (ratio >= 0.8) return "Super Active User";
  if (ratio >= 0.5) return "Medium User";
  return "Passive User";
}
