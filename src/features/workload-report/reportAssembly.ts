import type {
  AnalyticsTablesData,
  ExecutiveChartsData,
  ExecutiveReportFixture,
  TalentOption,
  TalentWorkloadFixture,
} from "./types";
import type { WorkloadFreshness } from "@/features/workload";
import { buildDistribution, buildSummary } from "./reportSummary";
import {
  buildLoggedVsEstimated,
  buildTalentByWorkloadLevel,
  buildTtdCompliance,
  buildWorkloadOvertime,
} from "./reportAnalytics";
import {
  buildAssignedProjects,
  buildBacklogNormalized,
  buildBacklogRows,
  buildIndividualSummary,
  buildStatusBacklog,
  buildTimespentPerProject,
  buildTrendBacklog,
} from "./reportIndividual";
import { PERIOD_FACTOR, metricsFor } from "./reportMetrics";
import { isReportPeriod } from "./reportPeriods";
import { TALENT_SEEDS } from "./talentSeeds";

// --- Fixture assembly --------------------------------------------------------

export const BASE_FRESHNESS: Omit<WorkloadFreshness, "sourceStatus" | "lastUpdatedAt" | "isStale"> =
  {
    staleAfterHours: 72,
    expectedReflectionHours: 24,
  };

/**
 * Matriks skenario state per periode (TAN-235): 202609 siap & fresh, 202608
 * stale (sumber OK, stempel pembaruan sudah lewat ambang 72 jam), 202607
 * kosong, 202606 sumber tak tersedia dengan data terakhir sebagai data lama.
 */
export function freshnessFor(periode: string): WorkloadFreshness {
  if (periode === "202608") {
    return {
      ...BASE_FRESHNESS,
      sourceStatus: "OK",
      lastUpdatedAt: "2026-10-12T09:00:00+07:00",
      isStale: true,
    };
  }
  if (periode === "202606") {
    return {
      ...BASE_FRESHNESS,
      sourceStatus: "UNAVAILABLE",
      lastUpdatedAt: "2026-10-09T09:00:00+07:00",
      isStale: true,
    };
  }
  return {
    ...BASE_FRESHNESS,
    sourceStatus: "OK",
    lastUpdatedAt: "2026-10-16T02:15:00+07:00",
    isStale: false,
  };
}

export function executiveFixtureFor(periode: string): ExecutiveReportFixture {
  if (periode === "202607") {
    return {
      period: periode,
      state: "empty",
      freshness: freshnessFor(periode),
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
    freshness: freshnessFor(periode),
    summary: buildSummary(ms, periodFactor),
    charts,
    distribution: buildDistribution(ms),
    analytics,
  };
}

export function talentFixtureFor(periode: string, talentId: string): TalentWorkloadFixture | null {
  const seed = TALENT_SEEDS.find((t) => t.id === talentId);
  if (!seed) return null;

  if (periode === "202607") {
    return {
      talentId,
      period: periode,
      state: "empty",
      freshness: freshnessFor(periode),
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
    freshness: freshnessFor(periode),
    summary: buildIndividualSummary(talent, PERIOD_FACTOR[periode] ?? 1),
    assignedProjects: buildAssignedProjects(talent),
    statusBacklog: buildStatusBacklog(backlogRows),
    timespentPerProject: buildTimespentPerProject(talent),
    trendBacklog: buildTrendBacklog(talent, periode),
    backlog: backlogRows,
    backlogNormalized: buildBacklogNormalized(backlogRows),
  };
}

export const executiveCache = new Map<string, ExecutiveReportFixture>();
export const talentCache = new Map<string, TalentWorkloadFixture | null>();

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

/**
 * Stand-in mock untuk talent milik sesi (workload sendiri di level user);
 * wiring GraphQL nanti yang memetakan user login ke talent-nya.
 */
export const SELF_TALENT_ID = DEFAULT_TALENT_ID;

/** Baris sumber cost/revenue untuk headline tab Cost & Revenue. */
export const COST_REVENUE_SOURCE_NOTE =
  "Revenue Source: PMA · Estimated Talent Cost Source: DPI, DPG, & PMA Report";
