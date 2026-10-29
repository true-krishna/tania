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
import type {
  ChapterListView,
  LoadClassification,
  OrgDistributionView,
  OwnWorkloadView,
  PeriodFixture,
  ScopeSummary,
  TalentSummary,
  WorkloadFreshness,
  WorkloadMetrics,
} from "./types";

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

const classification = (v: LoadClassification): LoadClassification => v;

// --- Shared people ---------------------------------------------------------

const DPS_TALENTS: TalentSummary[] = [
  {
    id: "emp-rani",
    fullName: "Rani Puspita",
    unitName: "Chapter DPS",
    jobRoleName: "Data Engineer",
    loadPercentage: 128,
    classification: classification("OVERLOAD"),
  },
  {
    id: "emp-dimas",
    fullName: "Dimas Aryo",
    unitName: "Chapter DPS",
    jobRoleName: "Backend Engineer",
    loadPercentage: 104,
    classification: classification("OVERLOAD"),
  },
  {
    id: "emp-sinta",
    fullName: "Sinta Mahesa",
    unitName: "Chapter DPS",
    jobRoleName: "Data Analyst",
    loadPercentage: 92,
    classification: classification("OPTIMAL"),
  },
  {
    id: "emp-ilham",
    fullName: "Ilham Fadillah",
    unitName: "Chapter DPS",
    jobRoleName: "Project Manager",
    loadPercentage: 87,
    classification: classification("OPTIMAL"),
  },
  {
    id: "emp-nadia",
    fullName: "Nadia Wulandari",
    unitName: "Chapter DPS",
    jobRoleName: "QA Engineer",
    loadPercentage: 54,
    classification: classification("UNDERLOAD"),
  },
  {
    id: "emp-bayu",
    fullName: "Bayu Prakoso",
    unitName: "Chapter DPS",
    jobRoleName: "DevOps Engineer",
    loadPercentage: null,
    classification: classification("UNDEFINED_TIME_SPENT"),
  },
];

const TREND_DPS = [
  { label: "Apr", loadPercentage: 78 },
  { label: "Mei", loadPercentage: 84 },
  { label: "Jun", loadPercentage: 91 },
  { label: "Jul", loadPercentage: 87 },
  { label: "Agu", loadPercentage: 95 },
  { label: "Sep", loadPercentage: 92 },
];

const TREND_ILHAM = [
  { label: "Apr", loadPercentage: 71 },
  { label: "Mei", loadPercentage: 76 },
  { label: "Jun", loadPercentage: 82 },
  { label: "Jul", loadPercentage: 80 },
  { label: "Agu", loadPercentage: 85 },
  { label: "Sep", loadPercentage: 87 },
];

const SPLIT_SELF = { workingPercentage: 78, trainingPercentage: 22 };
const SPLIT_ILHAM = { workingPercentage: 74, trainingPercentage: 26 };

const PLACEMENTS_ILHAM = [
  { id: "prj-billing", projectName: "Migrasi Billing Core", loadPercentage: 52 },
  { id: "prj-platform", projectName: "Data Platform Revamp", loadPercentage: 33 },
  { id: "prj-noc", projectName: "Dukungan NOC", loadPercentage: 15 },
];

function metrics(overrides: Partial<WorkloadMetrics>): WorkloadMetrics {
  return {
    loadPercentage: null,
    classification: null,
    capacityUsedHours: null,
    capacityTotalHours: null,
    split: null,
    trend: [],
    ...overrides,
  };
}

const OWN_SUCCESS = metrics({
  loadPercentage: 92,
  classification: classification("OPTIMAL"),
  capacityUsedHours: 36,
  capacityTotalHours: 40,
  split: SPLIT_SELF,
  trend: TREND_DPS,
});

const CHAPTER_SUMMARY: ScopeSummary = {
  scopeLabel: "Chapter DPS",
  talentCount: 89,
  overloadCount: 7,
  underloadCount: 12,
  averageLoadPercentage: 87,
};

const ORG_SUMMARY: ScopeSummary = {
  scopeLabel: "Seluruh organisasi",
  talentCount: 412,
  overloadCount: 31,
  underloadCount: 44,
  averageLoadPercentage: 86,
};

const CHAPTER_SUCCESS: ChapterListView = {
  state: "success",
  summary: CHAPTER_SUMMARY,
  talents: DPS_TALENTS,
  totalCount: 89,
};

const ORG_SUCCESS: OrgDistributionView = {
  state: "success",
  summary: ORG_SUMMARY,
  rows: {
    CHAPTER: [
      {
        id: "dim-dps",
        label: "Chapter DPS",
        averageLoadPercentage: 87,
        talentCount: 89,
        counts: { optimal: 66, underload: 12, overload: 7, undefined: 4 },
        talents: DPS_TALENTS.slice(0, 4),
      },
      {
        id: "dim-bi",
        label: "Chapter BI",
        averageLoadPercentage: 91,
        talentCount: 93,
        counts: { optimal: 78, underload: 9, overload: 4, undefined: 2 },
        talents: [],
      },
      {
        id: "dim-infra",
        label: "Chapter Infra",
        averageLoadPercentage: 79,
        talentCount: 77,
        counts: { optimal: 52, underload: 16, overload: 6, undefined: 3 },
        talents: [],
      },
      {
        id: "dim-core",
        label: "Chapter Core",
        averageLoadPercentage: 84,
        talentCount: 74,
        counts: { optimal: 61, underload: 7, overload: 5, undefined: 1 },
        talents: [],
      },
    ],
    UNIT: [
      {
        id: "dim-platform",
        label: "Unit Platform",
        averageLoadPercentage: 86,
        talentCount: 150,
        counts: { optimal: 110, underload: 20, overload: 14, undefined: 6 },
        talents: [],
      },
      {
        id: "dim-digital",
        label: "Unit Digital",
        averageLoadPercentage: 88,
        talentCount: 140,
        counts: { optimal: 104, underload: 18, overload: 12, undefined: 6 },
        talents: [],
      },
      {
        id: "dim-infra-unit",
        label: "Unit Infra",
        averageLoadPercentage: 81,
        talentCount: 122,
        counts: { optimal: 88, underload: 20, overload: 9, undefined: 5 },
        talents: [],
      },
    ],
    PROJECT: [
      {
        id: "dim-billing",
        label: "Migrasi Billing Core",
        averageLoadPercentage: 90,
        talentCount: 60,
        counts: { optimal: 44, underload: 6, overload: 8, undefined: 2 },
        talents: [],
      },
      {
        id: "dim-revamp",
        label: "Data Platform Revamp",
        averageLoadPercentage: 84,
        talentCount: 70,
        counts: { optimal: 52, underload: 10, overload: 6, undefined: 2 },
        talents: [],
      },
      {
        id: "dim-noc",
        label: "Dukungan NOC",
        averageLoadPercentage: 72,
        talentCount: 40,
        counts: { optimal: 30, underload: 8, overload: 1, undefined: 1 },
        talents: [],
      },
    ],
  },
};

const FRESH: WorkloadFreshness = {
  sourceStatus: "OK",
  lastUpdatedAt: "2026-10-07T08:15:00+07:00",
  isStale: false,
  staleAfterHours: null,
  expectedReflectionHours: 24,
};

const STALE: WorkloadFreshness = {
  sourceStatus: "OK",
  lastUpdatedAt: "2026-10-02T09:30:00+07:00",
  isStale: true,
  staleAfterHours: 48,
  expectedReflectionHours: 24,
};

const UNAVAILABLE: WorkloadFreshness = {
  sourceStatus: "UNAVAILABLE",
  lastUpdatedAt: "2026-10-05T16:40:00+07:00",
  isStale: true,
  staleAfterHours: 48,
  expectedReflectionHours: 24,
};

// --- Period fixtures (one state per period, design §6) ----------------------

const FIXTURES: Record<string, PeriodFixture> = {
  // 1 · own-view success + chapter list + org distribution
  prd_8f21: {
    id: "prd_8f21",
    label: "September 2026",
    freshness: FRESH,
    own: { state: "success", metrics: OWN_SUCCESS, projectPlacements: PLACEMENTS_ILHAM },
    chapter: CHAPTER_SUCCESS,
    org: ORG_SUCCESS,
  },
  // 2 · empty (FR-016)
  prd_7c04: {
    id: "prd_7c04",
    label: "Agustus 2026",
    freshness: FRESH,
    own: { state: "no-data", metrics: null, projectPlacements: [] },
    chapter: { state: "no-data", summary: null, talents: [], totalCount: 0 },
    org: { state: "no-data", summary: null, rows: { UNIT: [], CHAPTER: [], PROJECT: [] } },
  },
  // 3 · source unavailable (FR-017): last-known figures + banner
  prd_6b93: {
    id: "prd_6b93",
    label: "Juli 2026",
    freshness: UNAVAILABLE,
    own: { state: "unavailable", metrics: OWN_SUCCESS, projectPlacements: PLACEMENTS_ILHAM },
    chapter: { ...CHAPTER_SUCCESS, state: "unavailable" },
    org: { ...ORG_SUCCESS, state: "unavailable" },
  },
  // 4 · stale (SC-008): figures + `Data lama` chips
  prd_5a12: {
    id: "prd_5a12",
    label: "Juni 2026",
    freshness: STALE,
    own: {
      state: "success",
      metrics: metrics({
        loadPercentage: 85,
        classification: classification("OPTIMAL"),
        capacityUsedHours: 34,
        capacityTotalHours: 40,
        split: SPLIT_SELF,
        trend: TREND_DPS,
      }),
      projectPlacements: PLACEMENTS_ILHAM,
    },
    chapter: CHAPTER_SUCCESS,
    org: ORG_SUCCESS,
  },
  // 5 · undefined split (UNDEFINED_TIME_SPENT): neutral chip, no fabricated numbers
  prd_49d7: {
    id: "prd_49d7",
    label: "Mei 2026",
    freshness: FRESH,
    own: {
      state: "success",
      metrics: metrics({
        loadPercentage: null,
        classification: classification("UNDEFINED_TIME_SPENT"),
        capacityUsedHours: null,
        capacityTotalHours: null,
        split: null,
        trend: TREND_DPS,
      }),
      projectPlacements: PLACEMENTS_ILHAM,
    },
    chapter: CHAPTER_SUCCESS,
    org: ORG_SUCCESS,
  },
  // 6 · tmsId null (employee outside TMS)
  prd_3870: {
    id: "prd_3870",
    label: "April 2026",
    freshness: FRESH,
    own: { state: "tms-null", metrics: null, projectPlacements: [] },
    chapter: CHAPTER_SUCCESS,
    org: ORG_SUCCESS,
  },
  // 7 · hard error (no last-known data)
  prd_26e5: {
    id: "prd_26e5",
    label: "Maret 2026",
    freshness: FRESH,
    own: { state: "error", metrics: null, projectPlacements: [] },
    chapter: { state: "error", summary: null, talents: [], totalCount: 0 },
    org: { state: "error", summary: null, rows: { UNIT: [], CHAPTER: [], PROJECT: [] } },
  },
};

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
