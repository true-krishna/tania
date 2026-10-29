/**
 * Workload fixtures — the single isolated mock source for the visual slice
 * (TAN-125). Swapping WAD/GraphQL in later (TAN-114/115/117/118/119) means
 * replacing `getPeriodFixture` / `getEmployeeWorkload` and nothing else.
 *
 * Every figure below is a stand-in for a server-provided value; nothing here
 * is derived at render time (data-model §4, design §10). Period ids are opaque
 * tokens — they are the only thing allowed in the `?period=` query string
 * (FR-027).
 */
import type { PeriodFixture, OwnWorkloadView, WorkloadFreshness } from "./types";
import { FIXTURES } from "./periodFixtures";
import {
  FRESH,
  PLACEMENTS_ILHAM,
  SPLIT_ILHAM,
  TREND_ILHAM,
  classification,
  metrics,
} from "./fixtures";

interface PeriodOption {
  id: string;
  label: string;
}

/** Periods offered by the selector, newest first. */
export const WORKLOAD_PERIODS: readonly PeriodOption[] = [
  { id: "prd_8f21", label: "September 2026" },
  { id: "prd_7c04", label: "Agustus 2026" },
  { id: "prd_6b93", label: "Juli 2026" },
  { id: "prd_5a12", label: "Juni 2026" },
  { id: "prd_49d7", label: "Mei 2026" },
  { id: "prd_3870", label: "April 2026" },
  { id: "prd_26e5", label: "Maret 2026" },
];

export const DEFAULT_PERIOD_ID = WORKLOAD_PERIODS[0].id;

export function isWorkloadPeriod(id: string | null | undefined): id is string {
  return !!id && WORKLOAD_PERIODS.some((p) => p.id === id);
}

export function getPeriodFixture(periodId: string): PeriodFixture | undefined {
  return FIXTURES[periodId];
}

// --- Employee workload tab (design scene 7) ---------------------------------

export interface EmployeeWorkloadFixture {
  employeeId: string;
  fullName: string;
  jobRoleName: string;
  freshness: WorkloadFreshness;
  view: OwnWorkloadView;
}

const EMPLOYEE_FIXTURES: Record<string, EmployeeWorkloadFixture> = {
  "emp-ilham": {
    employeeId: "emp-ilham",
    fullName: "Ilham Fadillah",
    jobRoleName: "Project Manager",
    freshness: FRESH,
    view: {
      state: "success",
      metrics: metrics({
        loadPercentage: 87,
        classification: classification("OPTIMAL"),
        capacityUsedHours: 35,
        capacityTotalHours: 40,
        split: SPLIT_ILHAM,
        trend: TREND_ILHAM,
      }),
      projectPlacements: PLACEMENTS_ILHAM,
    },
  },
  "emp-bayu": {
    employeeId: "emp-bayu",
    fullName: "Bayu Prakoso",
    jobRoleName: "DevOps Engineer",
    freshness: FRESH,
    view: { state: "tms-null", metrics: null, projectPlacements: [] },
  },
};

/** Falls back to a representative success view for any other employee id. */
export function getEmployeeWorkload(employeeId: string): EmployeeWorkloadFixture {
  return (
    EMPLOYEE_FIXTURES[employeeId] ?? {
      employeeId,
      fullName: "Talent",
      jobRoleName: "—",
      freshness: FRESH,
      view: {
        state: "success",
        metrics: metrics({
          loadPercentage: 87,
          classification: classification("OPTIMAL"),
          capacityUsedHours: 35,
          capacityTotalHours: 40,
          split: SPLIT_ILHAM,
          trend: TREND_ILHAM,
        }),
        projectPlacements: PLACEMENTS_ILHAM,
      },
    }
  );
}
