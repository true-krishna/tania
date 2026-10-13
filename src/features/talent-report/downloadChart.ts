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
 * tampilan). Keputusan (TAN-159): latar export **tetap putih**, bukan mengikuti
 * `--tp-surface` — PNG adalah artefak yang dibagikan (lampiran, deck, cetak)
 * dan harus deterministik di luar konteks tema viewer; `--tp-surface` di mode
 * gelap bernilai #1d2939 sehingga ikut tema akan menghasilkan PNG gelap yang
 * pecah di dokumen terang. Tanpa handle/data URL, tidak ada yang diunduh
 * (gagal aman).
 */
export function downloadChart(chart: EChartHandle | null, fileName: string): void {
  const dataUrl = chart?.getDataURL({ pixelRatio: 2, backgroundColor: "#ffffff" });
  if (!dataUrl) return;
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  link.click();
}
