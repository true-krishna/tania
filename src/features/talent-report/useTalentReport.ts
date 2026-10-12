"use client";

import * as React from "react";
import { useQuery } from "@apollo/client";
import type { ApolloError } from "@apollo/client";
import {
  TalentReportDocument,
  TalentReportRangeDocument,
  type TalentReportPeriodInput,
} from "@/generated/graphql";
import type {
  TalentReport,
  TalentReportRange,
} from "@/generated/graphql/types";
import { errorMessage, graphQLErrorCode } from "@/lib/errors";

/**
 * T022/T025 — hook laporan talent.
 *
 * Dokumen & tipe berasal dari hasil codegen (client preset) atas SDL yang
 * dilayani — kontrak sementara T015 sudah dilepas di T025 (codegen swap).
 *
 * Perilaku: satu query agregat `talentReport(period)` memperbarui kelima visual
 * sekaligus (FR-12/SC-04); `fetchPolicy: "cache-and-network"` (FR-15 — cache
 * tampil lebih dulu, jaringan menyusul tanpa sinkronisasi manual); default
 * periode = seluruh `talentReportRange` (FR-11).
 */
export const TALENT_REPORT_RANGE_QUERY = TalentReportRangeDocument;
export const TALENT_REPORT_QUERY = TalentReportDocument;

export type TalentReportStatus = "loading" | "ready" | "empty" | "forbidden" | "error";

export interface UseTalentReportResult {
  range: TalentReportRange | null;
  /** Periode terpakai — `null` sampai rentang tersedia (default = seluruh rentang). */
  period: TalentReportPeriodInput | null;
  applyPeriod: (period: TalentReportPeriodInput) => void;
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
  const range = rangeResult.data?.talentReportRange ?? null;

  const [period, setPeriod] = React.useState<TalentReportPeriodInput | null>(null);
  const defaultPeriod = React.useMemo<TalentReportPeriodInput | null>(
    () => (range ? { startMonth: range.startMonth, endMonth: range.endMonth } : null),
    [range],
  );
  const effectivePeriod = period ?? defaultPeriod;

  const reportResult = useQuery(TALENT_REPORT_QUERY, {
    variables: { period: effectivePeriod as TalentReportPeriodInput },
    skip: !effectivePeriod,
    fetchPolicy: "cache-and-network",
  });
  const report = reportResult.data?.talentReport ?? null;

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
