/**
 * Read-only view models for the workload feature (design spec TAN-124 §5–§6).
 *
 * These describe exactly what the UI renders. No load percentage, split,
 * trend or average is computed here — every figure is a value the server (WAD)
 * provides, carried through `mocks.ts` for this mock-data-first slice. The
 * GraphQL wiring (TAN-114/115/117/118/119) replaces the fixture source without
 * touching these shapes.
 */

/** Classification returned by WAD for a talent in a period. */
export type LoadClassification =
  | "OPTIMAL"
  | "OVERLOAD"
  | "UNDERLOAD"
  | "UNDEFINED_ACTIVITY"
  | "UNDEFINED_TIME_SPENT";

export interface ActivitySplit {
  workingPercentage: number;
  trainingPercentage: number;
}

export interface TrendPoint {
  /** Short period label, e.g. `Sep`. */
  label: string;
  loadPercentage: number;
}

/** Figures for one talent in one period. Undefined values stay `null`. */
export interface WorkloadMetrics {
  loadPercentage: number | null;
  classification: LoadClassification | null;
  capacityUsedHours: number | null;
  capacityTotalHours: number | null;
  split: ActivitySplit | null;
  trend: TrendPoint[];
}

export type SourceStatus = "OK" | "UNAVAILABLE";

/** Freshness stamp (FR-017/018/019, SC-008). */
export interface WorkloadFreshness {
  sourceStatus: SourceStatus;
  /** ISO timestamp of the last successful WAD refresh. */
  lastUpdatedAt: string | null;
  isStale: boolean;
  /** Age threshold that made the data stale, in hours. */
  staleAfterHours: number | null;
  /** Reflection window after an activity is logged, in hours. */
  expectedReflectionHours: number | null;
}

/** Row shape shared by the chapter list and distribution drill-downs. */
export interface TalentSummary {
  id: string;
  fullName: string;
  unitName: string;
  jobRoleName: string;
  loadPercentage: number | null;
  classification: LoadClassification | null;
}

export interface ScopeSummary {
  scopeLabel: string;
  talentCount: number;
  overloadCount: number;
  underloadCount: number;
  averageLoadPercentage: number;
}

/** Own-view (`Workload saya`) state matrix (design §6). */
export type OwnState = "success" | "no-data" | "tms-null" | "unavailable" | "error";

/** List / distribution state matrix. */
export type ListState = "success" | "no-data" | "unavailable" | "error";

export interface ProjectPlacement {
  id: string;
  projectName: string;
  /** Share of the talent's total load, as reported by the server. */
  loadPercentage: number;
}

export interface OwnWorkloadView {
  state: OwnState;
  /** Present for `success` and `unavailable` (last-known figures). */
  metrics: WorkloadMetrics | null;
  projectPlacements: ProjectPlacement[];
}

export interface ChapterListView {
  state: ListState;
  summary: ScopeSummary | null;
  talents: TalentSummary[];
  totalCount: number;
}

export type DistributionDimension = "UNIT" | "CHAPTER" | "PROJECT";

export interface DistributionRowData {
  id: string;
  label: string;
  averageLoadPercentage: number;
  talentCount: number;
  counts: {
    optimal: number;
    underload: number;
    overload: number;
    undefined: number;
  };
  talents: TalentSummary[];
}

export interface OrgDistributionView {
  state: ListState;
  summary: ScopeSummary | null;
  rows: Record<DistributionDimension, DistributionRowData[]>;
}

/** A period and everything the three workspace tabs render for it. */
export interface PeriodFixture {
  id: string;
  label: string;
  freshness: WorkloadFreshness;
  own: OwnWorkloadView;
  chapter: ChapterListView;
  org: OrgDistributionView;
}
