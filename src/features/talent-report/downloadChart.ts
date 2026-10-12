import type { EChartHandle } from "./EChart";

/**
 * T027 — FR-14: nama file unduh `<nama-grafik>-<mulai>-<akhir>.png`
 * (mis. `talent-per-role-2025-01-2026-10.png`).
 */
export function chartFileName(chartName: string, startMonth: string, endMonth: string): string {
  return `${chartName}-${startMonth}-${endMonth}.png`;
}

/**
 * T027 — unduh PNG satu grafik (FR-13): `getDataURL` dengan `pixelRatio: 2`
 * (resolusi ≥2× kanvas) dan `backgroundColor: "#ffffff"` (identik di semua
 * tampilan). Tanpa handle/data URL, tidak ada yang diunduh (gagal aman).
 */
export function downloadChart(chart: EChartHandle | null, fileName: string): void {
  const dataUrl = chart?.getDataURL({ pixelRatio: 2, backgroundColor: "#ffffff" });
  if (!dataUrl) return;
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  link.click();
}
