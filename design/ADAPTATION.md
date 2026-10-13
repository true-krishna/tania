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


## Amendemen v4.2.0 (2026-10-14) — brand navy+red (TAN-99)

Konstitusi desain v4.2.0 mengganti voltage interaktif Violet dengan navy dan
menetapkan merah sebagai aksen brand terpisah. Nilai kanon yang menggantikan
alias Violet v4.0.0:

| Token lama (retired) | Nilai lama | Token baru | Nilai baru |
|---|---|---|---|
| `--tp-primary` | `#875bf7` | `--tp-brand-navy` | `#172B4D` |
| `--tp-primary-deep` | `#7839ee` | `--tp-brand-navy-deep` | `#0B1F4D` |
| `--tp-lilac` (aksi) | `#c3b5fd` | `--tp-brand-red` | `#E1231A` |
| — | — | `--tp-brand-red-deep` | `#B71C14` |
| `--tp-nav` | `#491c96` | `--tp-nav` = `--tp-brand-navy` | `#172B4D` |
| `--tp-mint` / `--tp-mint-ink` | `#12b76a` / `#027a48` | sama | `#168A5B` / `#0F6E48` |
| `--tp-sun` | `#fec84b` | sama | `#D9822B` |

Catatan:
- `--tp-peach`/`--tp-ink-peach` tetap token error/danger khusus; **tidak**
  meng-alias brand red.
- `--tp-tint-violet`/`--tp-ink-violet` dipertahankan hanya sebagai kategori
  semantik legacy (in-progress/grouping) non-interaktif (konstitusi §IX) —
  **digantikan di amendemen v4.3.0 di bawah** (jadi Info biru, pasangan violet
  di-retire).
- Nilai dark navy/red tidak di-ship (TAN-99 light-only); token dark non-brand
  tetap seperti v4.0.0.
- Alias Violet di atas sudah dihapus dari `tokens.css`, `tailwind.preset.js`,
  ikon, dan halaman acuan. Tindak lanjut: migrasi kategori semantik violet.


## Amendemen v4.3.0 (2026-10-13) — keputusan owner atas audit gap TAN-165

Owner menutup lima butir audit; nilai berikut sudah dipropagasi ke
`tokens/tokens.css`, `tailwind.preset.js`, `components.css`, ikon, dan halaman
acuan.

| Keputusan | Nilai | Mengganti |
|---|---|---|
| Kategori violet → status informasional | `--tp-info` `#2684FF` / `--tp-tint-info` `#E9F2FF` / `--tp-ink-info` `#0B5FD6` | `--tp-tint-violet` `#ece9fe` / `--tp-ink-violet` `#6927da` (**di-retire**) |
| Aksen merah diaktifkan | nav aktif (`--tp-brand-red-tint` `#FCE9E8` + teks/ikon merah), link, ring fokus `2px #E1231A`, aksi AI `.tp-ai` | nav aktif navy + teks putih; link navy; ring fokus `--tp-mint-ink` |
| Danger wajib dibedakan | tetap `--tp-peach` `#f97066` / `--tp-tint-peach` `#fee4e2` / `--tp-ink-peach` `#b32318` + **ikon & teks wajib** | usulan kit `danger = brand red` **ditolak** |
| Logo resmi | `public/brand/` (wordmark navy/putih + ikon "T" dari brand kit) | placeholder berlabel + teks "T" di sidebar |
| Permukaan netral ikut kit | kanvas `#F5F7FA`, garis `#DFE1E6`, `--tp-neutral` `#6B778C`, `--tp-muted` `#5E6C84` | `#f2f4f7` / `#d0d5dd` / `#667085` |

Catatan:
- `--tp-brand-red-tint-line` `#F5B8B5` dan `--tp-brand-on-red` `#FFFFFF`
  ditambahkan sebagai pendukung peran aksen merah.
- `--tp-muted` memakai `#5E6C84` (kit "mute-strong"), bukan `#6B778C`: warna
  mute hanya 4.2:1 di atas kanvas baru sementara teks sekunder juga muncul di
  atas kanvas.
- Detail ikon di item menu aktif ikut merah (resep "Cockpit" kit); di luar itu
  bridge `--tania-primary` tetap navy (Prinsip VII).
- Nilai dark navy/red tetap **tidak** di-ship (kit light-only) — dependency
  yang sama seperti v4.2.0.
- Tema gelap: `--tp-tint-info` gelap `#14305A` / ink `#6AA6FF` mengikuti blok
  dark kit untuk token non-brand.
- Preseden konstitusi naik ke **v4.3.0** (`docs/constitution/` +
  `.specify/memory/`): §I/§II/§V/§VI/§VII/§IX dan Additional Constraints
  diamendemen, catatan amendemen ditambahkan.

## Amendemen v4.3.1 (2026-10-13) — putaran kedua jawaban owner (TAN-165)

Owner menutup lima deviasi yang dilaporkan pada pengiriman v4.3.0.

| Keputusan owner | Nilai / tindakan |
|---|---|
| Link = `--tp-brand-red-deep` `#B71C14` (ikuti rekomendasi) | **tidak berubah** — sudah begitu sejak v4.3.0; `#E1231A` tetap untuk non-teks |
| `--tp-text` tetap `#212121` | **tidak berubah** |
| “Remap seri chart ke `chart-1..4` kit” | token baru `--tp-chart-1..4` (`#E1231A` / `#2684FF` / `#168A5B` / `#D9822B`); seri laporan dipetakan menurut makna: churn → `chart-1`, distribusi → `chart-2`, new talent → `chart-3`, `chart-4` disiapkan untuk seri warn; “Belum diisi” tetap `--tp-neutral` |
| Nav aktif mode gelap dari varian dark mockup TAN-99 | token baru `--tp-brand-red-ink` (light `#B71C14`, dark `#FF8A82`); `--tp-brand-red-tint` dark `#3A1715`; resep nav aktif memakai pasangan ini |
| Aset logo memakai file yang dilampirkan | **tidak berubah** — `public/brand/` sudah memakai aset zip resmi |

Catatan:
- Pasangan nav aktif kini **punya** nilai gelap (sebelumnya satu-satunya
  dependency dark-mode yang belum tertutup): tint `#3A1715` + ink `#FF8A82`,
  kontras 7.0:1. Ini juga memperbaiki blok `.tp-ai` yang sebelum ini memakai
  tint terang bersama teks tema gelap (`#FCFCFD` di atas `#FCE9E8` = 1.03:1,
  tidak terbaca); sekarang 15.6:1.
- Nilai dark diambil apa adanya dari `tania-profil-navy.html` varian dark,
  bukan inferensi. Solid navy/red tetap tanpa varian dark.
- Pemetaan seri menjaga makna (§IX): hijau tetap pertumbuhan, merah tetap
  penurunan; urutan seri kit tidak dipakai untuk membalik makna seri yang sudah
  ada. Seri tunggal lain (BarList, grafik beban kerja) belum ikut dipetakan —
  menunggu keputusan owner.
- Track bar `#F5F7FA` (kanvas) belum diterapkan di semua komponen; `BarList`
  masih memakai `zinc-100` (di luar kanon) — item lanjutan.
- `chart-4` `#D9822B` hanya 2.9:1 di atas putih (2.7:1 di kanvas). Karena itu
  belum dipakai seri mana pun; kalau nanti dipakai sebagai fill, wajib disertai
  label/outline atau varian yang lebih gelap.
- Preseden konstitusi naik ke **v4.3.1**.
