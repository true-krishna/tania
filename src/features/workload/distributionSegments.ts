import type { DistributionRowData } from "./types";

export const LEGEND = [
  { key: "optimal", label: "Optimal", color: "var(--tp-ink-mint)" },
  { key: "underload", label: "Beban kurang", color: "var(--tp-ink-info)" },
  { key: "overload", label: "Kelebihan beban", color: "var(--tp-ink-peach)" },
  { key: "undefined", label: "Data tidak lengkap", color: "var(--tp-line)" },
] as const;

export const SEGMENT_CLASS: Record<(typeof LEGEND)[number]["key"], string> = {
  optimal: "bg-tp-tint-mint",
  underload: "bg-tp-tint-info",
  overload: "bg-tp-tint-peach",
  undefined: "bg-tp-line",
};

export function distributionAriaLabel(row: DistributionRowData): string {
  return `${row.counts.optimal} optimal, ${row.counts.underload} beban kurang, ${row.counts.overload} kelebihan beban, ${row.counts.undefined} data tidak lengkap`;
}
