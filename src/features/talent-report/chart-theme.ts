/**
 * T017 — satu sumber tema chart (D1).
 *
 * Kanvas ECharts tidak bisa membaca CSS variable, jadi token `--tp-*` di-resolve
 * sekali via `getComputedStyle` ke warna hex. Semua warna laporan berasal dari
 * modul ini — jangan hardcode warna di komponen chart.
 *
 * Pemetaan semantik warna — seri data visualisasi kit v1.2 (`--tp-chart-1..4`,
 * urutan kit: merah/biru/hijau/oranye) dengan makna seri kami dipertahankan:
 * - churn (V-5, penurunan) → `--tp-chart-1` `#E1231A` (kit: seri 1 = merah)
 * - distribusi (V-1…V-4, satu seri) → `--tp-chart-2` `#2684FF` (hue laporan,
 *   menggantikan navy yang kini khusus aksi primer)
 * - new talent (V-5, pertumbuhan) → `--tp-chart-3` `#168A5B`
 * - "Belum diisi" (MISSING) → `--tp-neutral` (abu-abu, selalu terakhir &
 *   berbeda visual — bukan bagian urutan seri)
 * - `--tp-chart-4` `#D9822B` disiapkan untuk seri peringatan (warn) berikutnya;
 *   belum ada seri yang memakainya.
 * Keputusan owner TAN-165 (13 Okt): "remap seri chart ke chart-1..4 kit".
 *
 * Fallback mengikuti nilai `--tp-*` v4.3.1 di `src/app/globals.css` (TANIA Pulse)
 * agar hasil tetap deterministik di SSR/jsdom (token tak ter-resolve) — uji di
 * `talent-report.test.tsx`.
 */

export interface ChartTheme {
  fontFamily: string;
  /** Teks sumbu/legend — `--tp-text`. */
  textColor: string;
  /** Teks sekunder (tick, catatan) — `--tp-muted`. */
  mutedColor: string;
  /** Garis sumbu/pembagi — `--tp-line`. */
  lineColor: string;
  /** Bar/kolom kategori sah (VALUE) — `--tp-chart-2`. */
  distributionColor: string;
  /** Kategori "Belum diisi" (MISSING) — `--tp-neutral`. */
  missingColor: string;
  /** Seri new talent (V-5) — `--tp-chart-3`. */
  newTalentColor: string;
  /** Seri churn (V-5) — `--tp-chart-1`. */
  churnColor: string;
}

/** Nilai fallback = literal token `--tp-*` v4.3.1 di `src/app/globals.css`. */
const FALLBACK: ChartTheme = {
  fontFamily: "Nunito Sans, system-ui, sans-serif",
  textColor: "#212121",
  mutedColor: "#5e6c84",
  lineColor: "#dfe1e6",
  distributionColor: "#2684ff",
  missingColor: "#6b778c",
  newTalentColor: "#168a5b",
  churnColor: "#e1231a",
};

function readToken(root: Element | undefined, name: string, fallback: string): string {
  const view =
    root?.ownerDocument?.defaultView ?? (typeof window !== "undefined" ? window : undefined);
  if (!view) return fallback;
  const target = root ?? view.document.documentElement;
  const value = view.getComputedStyle(target).getPropertyValue(name).trim();
  return value || fallback;
}

/**
 * Resolve tema chart dari token `--tp-*` pada `root` (default: elemen root
 * dokumen). Aman dipanggil saat SSR — tanpa DOM, kembali ke fallback.
 */
export function resolveChartTheme(root?: Element): ChartTheme {
  return {
    fontFamily: readToken(root, "--tp-font-display", FALLBACK.fontFamily),
    textColor: readToken(root, "--tp-text", FALLBACK.textColor),
    mutedColor: readToken(root, "--tp-muted", FALLBACK.mutedColor),
    lineColor: readToken(root, "--tp-line", FALLBACK.lineColor),
    distributionColor: readToken(root, "--tp-chart-2", FALLBACK.distributionColor),
    missingColor: readToken(root, "--tp-neutral", FALLBACK.missingColor),
    newTalentColor: readToken(root, "--tp-chart-3", FALLBACK.newTalentColor),
    churnColor: readToken(root, "--tp-chart-1", FALLBACK.churnColor),
  };
}
