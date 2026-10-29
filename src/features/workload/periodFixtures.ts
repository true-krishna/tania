import type { PeriodFixture } from "./types";
import {
  CHAPTER_SUCCESS,
  FRESH,
  ORG_SUCCESS,
  OWN_SUCCESS,
  PLACEMENTS_ILHAM,
  SPLIT_SELF,
  STALE,
  TREND_DPS,
  UNAVAILABLE,
  classification,
  metrics,
} from "./fixtures";

export const FIXTURES: Record<string, PeriodFixture> = {
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
