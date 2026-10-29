import type {
  ChapterListView,
  LoadClassification,
  OrgDistributionView,
  ScopeSummary,
  TalentSummary,
  WorkloadFreshness,
  WorkloadMetrics,
} from "./types";

export const classification = (v: LoadClassification): LoadClassification => v;

// --- Shared people ---------------------------------------------------------

export const DPS_TALENTS: TalentSummary[] = [
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

export const TREND_DPS = [
  { label: "Apr", loadPercentage: 78 },
  { label: "Mei", loadPercentage: 84 },
  { label: "Jun", loadPercentage: 91 },
  { label: "Jul", loadPercentage: 87 },
  { label: "Agu", loadPercentage: 95 },
  { label: "Sep", loadPercentage: 92 },
];

export const TREND_ILHAM = [
  { label: "Apr", loadPercentage: 71 },
  { label: "Mei", loadPercentage: 76 },
  { label: "Jun", loadPercentage: 82 },
  { label: "Jul", loadPercentage: 80 },
  { label: "Agu", loadPercentage: 85 },
  { label: "Sep", loadPercentage: 87 },
];

export const SPLIT_SELF = { workingPercentage: 78, trainingPercentage: 22 };
export const SPLIT_ILHAM = { workingPercentage: 74, trainingPercentage: 26 };

export const PLACEMENTS_ILHAM = [
  { id: "prj-billing", projectName: "Migrasi Billing Core", loadPercentage: 52 },
  { id: "prj-platform", projectName: "Data Platform Revamp", loadPercentage: 33 },
  { id: "prj-noc", projectName: "Dukungan NOC", loadPercentage: 15 },
];

export function metrics(overrides: Partial<WorkloadMetrics>): WorkloadMetrics {
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

export const OWN_SUCCESS = metrics({
  loadPercentage: 92,
  classification: classification("OPTIMAL"),
  capacityUsedHours: 36,
  capacityTotalHours: 40,
  split: SPLIT_SELF,
  trend: TREND_DPS,
});

export const CHAPTER_SUMMARY: ScopeSummary = {
  scopeLabel: "Chapter DPS",
  talentCount: 89,
  overloadCount: 7,
  underloadCount: 12,
  averageLoadPercentage: 87,
};

export const ORG_SUMMARY: ScopeSummary = {
  scopeLabel: "Seluruh organisasi",
  talentCount: 412,
  overloadCount: 31,
  underloadCount: 44,
  averageLoadPercentage: 86,
};

export const CHAPTER_SUCCESS: ChapterListView = {
  state: "success",
  summary: CHAPTER_SUMMARY,
  talents: DPS_TALENTS,
  totalCount: 89,
};

export const ORG_SUCCESS: OrgDistributionView = {
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

export const FRESH: WorkloadFreshness = {
  sourceStatus: "OK",
  lastUpdatedAt: "2026-10-07T08:15:00+07:00",
  isStale: false,
  staleAfterHours: null,
  expectedReflectionHours: 24,
};

export const STALE: WorkloadFreshness = {
  sourceStatus: "OK",
  lastUpdatedAt: "2026-10-02T09:30:00+07:00",
  isStale: true,
  staleAfterHours: 48,
  expectedReflectionHours: 24,
};

export const UNAVAILABLE: WorkloadFreshness = {
  sourceStatus: "UNAVAILABLE",
  lastUpdatedAt: "2026-10-05T16:40:00+07:00",
  isStale: true,
  staleAfterHours: 48,
  expectedReflectionHours: 24,
};

// --- Period fixtures (one state per period, design §6) ----------------------
