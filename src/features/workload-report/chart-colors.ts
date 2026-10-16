import type { WorkloadStatus } from "./types";

/**
 * Warna seri chart per klasifikasi beban — konsumsi token `--tp-*`, bukan hex
 * baru (constitution design §I/§Data-viz). Kanvas ECharts tidak bisa membaca
 * CSS variable, jadi token di-resolve via `getComputedStyle` dengan fallback
 * nilai token v4.3.1 `src/app/globals.css` (pola `talent-report/chart-theme`).
 *
 * Pemetaan makna (mengikuti WAD, diekspresikan dengan token Tania):
 * Overload → chart-1 (merah), Stretch → chart-2 (biru, primary WAD),
 * Fit → chart-3 (hijau), Underload → chart-4 (jingga/warn),
 * Undefined Time Spent → peach (soft-warn data tak lengkap),
 * Undefined Activity → neutral (abu-abu, WAD memakai abu untuk undefined).
 */
const FALLBACK: Record<WorkloadStatus, string> = {
  Overload: "#e1231a",
  Stretch: "#2684ff",
  Fit: "#168a5b",
  Underload: "#d9822b",
  "Undefined Time Spent": "#f97066",
  "Undefined Activity": "#6b778c",
};

const TOKEN: Record<WorkloadStatus, string> = {
  Overload: "--tp-chart-1",
  Stretch: "--tp-chart-2",
  Fit: "--tp-chart-3",
  Underload: "--tp-chart-4",
  "Undefined Time Spent": "--tp-peach",
  "Undefined Activity": "--tp-neutral",
};

function readToken(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const value = window.getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

export function workloadChartColor(status: WorkloadStatus): string {
  return readToken(TOKEN[status], FALLBACK[status]);
}

/** Warna netral untuk seri non-status (mis. "To Do" pada pie status backlog). */
export function neutralChartColor(): string {
  return readToken("--tp-neutral", "#6b778c");
}

/** Warna seri kit `--tp-chart-1..4` untuk seri non-klasifikasi. */
export function kitChartColor(series: 1 | 2 | 3 | 4): string {
  const tokens = {
    1: ["--tp-chart-1", "#e1231a"],
    2: ["--tp-chart-2", "#2684ff"],
    3: ["--tp-chart-3", "#168a5b"],
    4: ["--tp-chart-4", "#d9822b"],
  } as const;
  const [token, fallback] = tokens[series];
  return readToken(token, fallback);
}
