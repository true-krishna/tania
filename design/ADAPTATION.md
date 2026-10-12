# Catatan Adaptasi — Pulse diselaraskan ke Legion

Paket ini adalah `tania-design-system` (Pulse Indigo) yang **warna dan tipografinya diganti** menjadi nilai Legion Design System. Struktur komponen, radius, bayangan, ikon, dan dark mode dari Pulse **dipertahankan**. Legion tidak digantikan — paket ini adalah lapisan tambahan di atasnya.

Sumber nilai: `DESIGN-legion.md` (Legion design system analysis, alpha) + `constitution-design.md` v1.0.0.

## Pemetaan warna (terang)

| Token | Sebelum (Pulse) | Sesudah (Legion) | Langkah Legion |
|---|---|---|---|
| `--tp-primary` | `#6246EA` | `#875bf7` | primary-500 |
| `--tp-primary-deep` | `#4D34C9` | `#7839ee` | primary-600 |
| `--tp-lilac` | `#A998F5` | `#c3b5fd` | primary-300 |
| `--tp-nav` | `#241B63` | `#491c96` | primary-900 |
| `--tp-mint` | `#3CCFB0` | `#12b76a` | success-500 |
| `--tp-mint-ink` / `--tp-ink-mint` | `#0E8F7A` / `#0A6B5B` | `#027a48` | success-700 |
| `--tp-peach` | `#FF8F7A` | `#f97066` | error-400 |
| `--tp-ink-peach` | `#B3412F` | `#b32318` | error-700 |
| `--tp-sun` | `#F6D65A` | `#fec84b` | warning-300 |
| `--tp-ink-sun` | `#7A5B00` | `#b54708` | warning-700 |
| `--tp-ink-violet` | `#4A32C8` | `#6927da` | primary-700 |
| `--tp-midnight` / `--tp-text` | `#101A47` | `#212121` | ink Legion |
| `--tp-muted` / `--tp-neutral` | `#5B6785` | `#667085` | tertiary-500 |
| `--tp-bg` (Mist) | `#F2F5FB` | `#f2f4f7` | tertiary-100 |
| `--tp-line` | `#DFE5F1` | `#d0d5dd` | tertiary-300 |
| `--tp-tint-violet` | `#EEEBFF` | `#ece9fe` | primary-100 |
| `--tp-tint-mint` | `#DDF7F1` | `#d1fadf` | success-100 |
| `--tp-tint-sun` | `#FFF4C9` | `#feefc6` | warning-100 |
| `--tp-tint-peach` | `#FFEDE8` | `#fee4e2` | error-100 |
| `--tp-shadow` | `rgba(16,26,71,…)` | `rgba(16,24,40,…)` | basis tertiary-900 |

## Pemetaan warna (gelap)

Semua nilai diambil dari ramp Legion yang ada — tidak ada heks baru di luar ramp.

| Token | Sebelum | Sesudah | Langkah |
|---|---|---|---|
| `--tp-bg` | `#0B1030` | `#101828` | tertiary-900 |
| `--tp-surface` | `#151B45` | `#1d2939` | tertiary-800 |
| `--tp-line` | `#2A3170` | `#344054` | tertiary-700 |
| `--tp-nav` | `#3A2E8C` | `#5720b7` | primary-800 |
| `--tp-text` | `#EEF0FF` | `#fcfcfd` | tertiary-25 |
| `--tp-muted` / `--tp-neutral` | `#A3ACD6` | `#98a2b3` | tertiary-400 |
| `--tp-mint-ink` / `--tp-ink-mint` | `#5EE0C5` / `#7FE8D2` | `#6ce9a6` | success-300 |
| `--tp-ink-peach` | `#FFB3A3` | `#fda19b` | error-300 |
| `--tp-ink-sun` | `#F6D65A` | `#fec84b` | warning-300 |
| `--tp-ink-violet` | `#C9BEFF` | `#c3b5fd` | primary-300 |
| `--tp-tint-*` | gelap custom | `#7a271a` / `#054f31` / `#792e0d` / `#491c96` | error-900 / success-900 / warning-900 / primary-900 |

## Tipografi

| Aspek | Sebelum (Pulse) | Sesudah (Legion) |
|---|---|---|
| Keluarga font | Sora (display) + Inter (body) | **Nunito Sans** (satu keluarga) |
| Judul / angka besar | 700–800, tracking negatif | **Bold 700, tracking 0** |
| Isi / label | Inter 400–500 | **Regular 400** |
| Teks aksi (tombol, chip, label form, nav, header tabel) | 500–600 campuran | **Semibold 600** |

Perubahan terkait: `.tp-h1` 800→700, `.tp-tab`/`.tp-nav-item` 500→600, semua `letter-spacing` negatif dihapus, Google Fonts link diganti ke `Nunito+Sans:wght@400;600;700`.

## Yang tidak diubah (sesuai batasan permintaan)

- Struktur kelas `.tp-*`, layout, komponen contoh.
- Radius: kartu 20 px, panel 28 px, pill 999 px.
- Bayangan kartu (`--tp-shadow`).
- Dark mode (`prefers-color-scheme` + `data-theme="dark"`).
- Ikon (16 ikon outline 2 px) — warna detailnya mengikuti token baru.

## Konflik dengan konstitusi desain v1.0.0 (perlu amendemen)

1. **Dark mode** — konstitusi: "light canvas only; dark mode requires a ratified amendment". Paket ini tetap menyertakan dark mode dengan nilai turunan ramp Legion; ratifikasi tetap dibutuhkan.
2. **Bayangan** — Prinsip IV: "No drop shadows, ever". `--tp-shadow` dan `box-shadow` tab aktif dipertahankan sebagai karakter Pulse.
3. **Radius pill 999px** — Legion: `rounded.full` = token 900px. Nilai visual hampir identik; satuan berbeda.
4. **Kontras tombol utama** — teks putih di atas primary-500 = 4.3:1 (di bawah 4.5:1 untuk teks kecil). Ini karakteristik Legion sendiri. Mitigasi terdokumentasi: gunakan `--tp-primary-deep` (primary-600, 5.8:1) bila audit aksesibilitas menuntut AA ketat.
5. **Bobot 800** — dihapus sesuai biner bobot Legion (400/600/700).

Rekomendasi: amendemen konstitusi menjadi v1.1.0 yang melegitimasi lapisan "Tania Pulse (Legion-aligned)" dengan cakupan di atas, supaya reviewer punya dasar saat memeriksa implementasi FE.
