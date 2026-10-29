import type { TtdComplianceLevel, WorkloadStatus } from "./types";

export interface PeriodOption {
  id: string;
  label: string;
}

/** Periode yang ditawarkan selector, terbaru lebih dulu. */
export const REPORT_PERIODS: readonly PeriodOption[] = [
  { id: "202609", label: "September 2026" },
  { id: "202608", label: "Agustus 2026" },
  { id: "202607", label: "Juli 2026" },
  { id: "202606", label: "Juni 2026" },
];

export const DEFAULT_REPORT_PERIOD = REPORT_PERIODS[0].id;

export function isReportPeriod(id: string | null | undefined): id is string {
  return !!id && REPORT_PERIODS.some((p) => p.id === id);
}

export const MONTHS_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];
export const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

export function periodParts(periode: string): { year: number; month: number } {
  return { year: Number(periode.slice(0, 4)), month: Number(periode.slice(4, 6)) };
}

/** "202609" → "September 2026" (selector & subjudul). */
export function formatPeriodLabel(periode: string): string {
  const { year, month } = periodParts(periode);
  return `${MONTHS_ID[month - 1]} ${year}`;
}

/** "202609" → "Sep 26" (sumbu chart overtime). */
export function formatPeriodShort(periode: string): string {
  const { year, month } = periodParts(periode);
  return `${MONTHS_SHORT[month - 1]} ${String(year).slice(2)}`;
}

export function addMonths(periode: string, delta: number): string {
  const { year, month } = periodParts(periode);
  const total = year * 12 + (month - 1) + delta;
  const nextYear = Math.floor(total / 12);
  const nextMonth = (((total % 12) + 12) % 12) + 1;
  return `${nextYear}${String(nextMonth).padStart(2, "0")}`;
}

export function round(value: number, digits = 1): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

/** Jam bulat — string polos tanpa pemisah ribuan (format server). */
export function formatInt(value: number): string {
  return String(Math.round(value));
}

/** Jam desimal — satu digit di belakang koma titik (format server). */
export function formatHours(value: number): string {
  return String(round(value, 1));
}

/** IDR terformat id-ID (pemisah ribuan titik) — deterministik lintas environment. */
export function formatIdr(value: number): string {
  const digits = String(Math.round(Math.abs(value)));
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `Rp ${value < 0 ? "-" : ""}${grouped}`;
}

export function classify(ratio: number, activities: number, timespent: number): WorkloadStatus {
  if (activities === 0) return "Undefined Activity";
  if (timespent === 0) return "Undefined Time Spent";
  if (ratio < 0.85) return "Underload";
  if (ratio <= 1.15) return "Fit";
  if (ratio <= 1.3) return "Stretch";
  return "Overload";
}

export function ttdLevelFor(percent: number): TtdComplianceLevel {
  if (percent >= 150) return "Very Good";
  if (percent >= 100) return "Good";
  if (percent >= 70) return "Fair";
  return "Need Improvement";
}
