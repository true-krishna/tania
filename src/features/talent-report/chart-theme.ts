/**
 * T017 — satu sumber tema chart (D1).
 *
 * Kanvas ECharts tidak bisa membaca CSS variable, jadi token `--tp-*` di-resolve
 * sekali via `getComputedStyle` ke warna hex. Semua warna laporan berasal dari
 * modul ini — jangan hardcode warna di komponen chart.
 *
 * Pemetaan semantik warna (spek — Bentuk Visual):
 * - distribusi (V-1…V-4) → `--tp-primary` (netral laporan; hijau/merah hanya untuk gerakan)
 * - "Belum diisi" (MISSING) → `--tp-neutral` (abu-abu, selalu terakhir & berbeda visual)
 * - new talent (V-5) → `--tp-mint-ink` (hijau; fallback `--tp-mint` bila perlu lebih terang)
 * - churn (V-5) → **`--tp-ink-peach` (merah)** — keputusan O-R4 dicatat di sini:
 *   kandidat `--tp-peach` (#f97066, terlalu terang untuk seri di atas kanvas putih)
 *   vs `--tp-ink-peach` (#b32318, satu-satunya token merah-ink di palet, kontras
 *   memadai untuk garis/bar dan sejajar pasangan `--tp-mint-ink` new talent).
 *   Dipilih `--tp-ink-peach`; keputusan visual, mudah ditukar di satu tempat ini.
 *
 * Fallback mengikuti nilai `--tp-*` v4.0.0 di `src/app/globals.css` (TANIA Pulse
 * selaras Legion) agar hasil tetap deterministik di SSR/jsdom (token tak
 * ter-resolve) — uji di `talent-report.test.tsx`.
 */

export interface ChartTheme {
  fontFamily: string;
  /** Teks sumbu/legend — `--tp-text`. */
  textColor: string;
  /** Teks sekunder (tick, catatan) — `--tp-muted`. */
  mutedColor: string;
  /** Garis sumbu/pembagi — `--tp-line`. */
  lineColor: string;
  /** Bar/kolom kategori sah (VALUE) — `--tp-primary`. */
  distributionColor: string;
  /** Kategori "Belum diisi" (MISSING) — `--tp-neutral`. */
  missingColor: string;
  /** Seri new talent (V-5) — `--tp-mint-ink`. */
  newTalentColor: string;
  /** Seri churn (V-5) — `--tp-ink-peach` (keputusan O-R4). */
  churnColor: string;
}

/** Nilai fallback = literal token `--tp-*` v4.0.0 di `src/app/globals.css`. */
const FALLBACK: ChartTheme = {
  fontFamily: 'Nunito Sans, system-ui, sans-serif',
  textColor: "#212121",
  mutedColor: "#667085",
  lineColor: "#d0d5dd",
  distributionColor: "#875bf7",
  missingColor: "#667085",
  newTalentColor: "#027a48",
  churnColor: "#b32318",
};

function readToken(root: Element | undefined, name: string, fallback: string): string {
  const view =
    root?.ownerDocument?.defaultView ??
    (typeof window !== "undefined" ? window : undefined);
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
    distributionColor: readToken(root, "--tp-primary", FALLBACK.distributionColor),
    missingColor: readToken(root, "--tp-neutral", FALLBACK.missingColor),
    newTalentColor: readToken(root, "--tp-mint-ink", FALLBACK.newTalentColor),
    churnColor: readToken(root, "--tp-ink-peach", FALLBACK.churnColor),
  };
}
