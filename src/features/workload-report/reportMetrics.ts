import type { IndividualLeaves, TtdComplianceLevel, WorkloadStatus } from "./types";
import { TALENT_SEEDS, type TalentSeed } from "./talentSeeds";
import { classify, round, ttdLevelFor } from "./reportPeriods";

// --- Talent seed -------------------------------------------------------------
// Satu baris per talent; metrik per periode = seed × faktor periode. Angka di
// sini adalah bahan mentah yang "dihitung server" oleh builder di bawah.

export const PERIOD_FACTOR: Record<string, number> = {
  "202609": 1,
  "202608": 0.96,
  "202607": 0.93,
  "202606": 0.9,
};

/** Wobble 12 bulan untuk seri overtime/trend di luar periode ber-fixture. */
export const MONTH_WOBBLE = [1, 0.97, 1.03, 0.99, 1.05, 0.96, 1.02, 0.98, 1.04, 1, 0.95, 1.01];

export const REVENUE_BASE = 2_450_000_000;

export interface TalentMetrics extends TalentSeed {
  ratio: number;
  fte: number;
  statusLoad: WorkloadStatus;
  estimateRatio: number;
  statusLoadEstimate: WorkloadStatus;
  compLvl: TtdComplianceLevel;
}

export function metricsFor(periode: string): TalentMetrics[] {
  const factor = PERIOD_FACTOR[periode] ?? 1;
  return TALENT_SEEDS.map((seed) => {
    const timespent = round(seed.timespent * factor);
    const estimate = round(seed.estimate * factor);
    const activities = Math.round(seed.activities * factor);
    const backlog = Math.round(seed.backlog * factor);
    const activitiesWithTimespent = Math.min(
      activities,
      Math.round(seed.activitiesWithTimespent * factor),
    );
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

export function availabilityPercent(t: TalentMetrics): number {
  return round((t.availability / 168) * 100, 1);
}

export function leavesFor(talentId: string): IndividualLeaves | null {
  if (talentId === "tal-03") {
    return {
      totalHours: "16",
      totalHoursHumanReadable: "2 hari",
      leavesList: [
        {
          leavesDate: "2026-09-14",
          leavesDateHumanReadable: "Sen, 14 Sep 2026",
          leavesDescription: "Cuti tahunan",
          source: "Diarium",
          totalHours: "8",
          totalDays: "1",
        },
        {
          leavesDate: "2026-09-15",
          leavesDateHumanReadable: "Sel, 15 Sep 2026",
          leavesDescription: "Cuti tahunan",
          source: "Diarium",
          totalHours: "8",
          totalDays: "1",
        },
      ],
    };
  }
  if (talentId === "tal-07") {
    return {
      totalHours: "8",
      totalHoursHumanReadable: "1 hari",
      leavesList: [
        {
          leavesDate: "2026-09-21",
          leavesDateHumanReadable: "Sen, 21 Sep 2026",
          leavesDescription: "Izin sakit",
          source: "Diarium",
          totalHours: "8",
          totalDays: "1",
        },
      ],
    };
  }
  return null;
}
