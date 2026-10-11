"use client";

import * as React from "react";
import { gql, useQuery } from "@apollo/client";
import type { ApolloError } from "@apollo/client";
import { errorMessage, graphQLErrorCode } from "@/lib/errors";
import type {
  TalentReport,
  TalentReportPeriod,
  TalentReportRange,
} from "./types";

/**
 * T022 — hook laporan talent.
 *
 * ⚠️ Dokumen `gql` di bawah adalah pasangan sementara `talent-report.graphql`
 * (T015) — diganti `TalentReportDocument`/`TalentReportRangeDocument` hasil
 * codegen saat T025 (codegen swap). Tipe hasil memakai `types.ts` (kontrak
 * sementara) sampai saat itu.
 *
 * Perilaku: satu query agregat `talentReport(period)` memperbarui kelima visual
 * sekaligus (FR-12/SC-04); `fetchPolicy: "cache-and-network"` (FR-15 — cache
 * tampil lebih dulu, jaringan menyusul tanpa sinkronisasi manual); default
 * periode = seluruh `talentReportRange` (FR-11).
 */
export const TALENT_REPORT_RANGE_QUERY = gql`
  query TalentReportRange {
    talentReportRange {
      startMonth
      endMonth
    }
  }
`;

export const TALENT_REPORT_QUERY = gql`
  query TalentReport($period: TalentReportPeriodInput!) {
    talentReport(period: $period) {
      snapshotMonth
      roleDistribution {
        label
        count
        kind
      }
      generationDistribution {
        label
        count
        kind
      }
      educationDistribution {
        label
        count
        kind
      }
      workLocationDistribution {
        label
        count
        kind
      }
      movementTrend {
        month
        newTalent
        churn
      }
    }
  }
`;

export type TalentReportStatus = "loading" | "ready" | "empty" | "forbidden" | "error";

export interface UseTalentReportResult {
  range: TalentReportRange | null;
  /** Periode terpakai — `null` sampai rentang tersedia (default = seluruh rentang). */
  period: TalentReportPeriod | null;
  applyPeriod: (period: TalentReportPeriod) => void;
  status: TalentReportStatus;
  report: TalentReport | null;
  message: string | null;
}

/** "Rentang tidak berisi data apa pun" (edge case spek) → empty state, bukan error. */
export function isEmptyReport(report: TalentReport): boolean {
  const distributionsEmpty =
    report.roleDistribution.length === 0 &&
    report.generationDistribution.length === 0 &&
    report.educationDistribution.length === 0 &&
    report.workLocationDistribution.length === 0;
  const noMovement = report.movementTrend.every(
    (m) => m.newTalent === 0 && m.churn === 0,
  );
  return distributionsEmpty && noMovement;
}

function toStatus(error: ApolloError | undefined, report: TalentReport | undefined): TalentReportStatus {
  if (error) {
    return graphQLErrorCode(error) === "FORBIDDEN" ? "forbidden" : "error";
  }
  if (!report) return "loading";
  return isEmptyReport(report) ? "empty" : "ready";
}

export function useTalentReport(): UseTalentReportResult {
  const rangeResult = useQuery(TALENT_REPORT_RANGE_QUERY, {
    fetchPolicy: "cache-and-network",
  });
  const range = (rangeResult.data as { talentReportRange: TalentReportRange } | undefined)
    ?.talentReportRange ?? null;

  const [period, setPeriod] = React.useState<TalentReportPeriod | null>(null);
  const defaultPeriod = React.useMemo<TalentReportPeriod | null>(
    () => (range ? { startMonth: range.startMonth, endMonth: range.endMonth } : null),
    [range],
  );
  const effectivePeriod = period ?? defaultPeriod;

  const reportResult = useQuery(TALENT_REPORT_QUERY, {
    variables: { period: effectivePeriod },
    skip: !effectivePeriod,
    fetchPolicy: "cache-and-network",
  });
  const report = (reportResult.data as { talentReport: TalentReport } | undefined)
    ?.talentReport ?? null;

  const error = rangeResult.error ?? reportResult.error;
  const status = toStatus(error, report ?? undefined);
  const message = status === "forbidden" || status === "error"
    ? errorMessage(error, "Gagal memuat laporan.")
    : null;

  return {
    range,
    period: effectivePeriod,
    applyPeriod: setPeriod,
    status,
    report,
    message,
  };
}
