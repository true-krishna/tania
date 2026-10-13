# TANIA design system (Pulse, selaras Legion)

Aturan ini wajib diikuti saat membuat atau mengubah UI TANIA. Detail lengkap ada di `design/reference/brand-guideline.html` dan `design/reference/developer-reference.html`.

## Hubungan dengan Legion Design System

Nilai brand mengikuti arah owner-approved TAN-99 + kit Color Guideline v1.2, ditegaskan lagi di TAN-165 (konstitusi desain TANIA v4.3.1): navy sebagai voltage aksi utama, merah sebagai aksen brand (menu aktif, link, ring fokus, aksi AI), biru untuk status informasional; token danger tetap terpisah dari brand dan wajib dibedakan dengan ikon + teks; seri data visualisasi memakai urutan `chart-1..4` kit. Yang dipertahankan dari Pulse adalah struktur komponen `.tp-*`, radius besar, satu kartu gelap per layar, ikon, dan dark mode. Jika ada konflik dengan konstitusi desain, konstitusi menang dan konflik dilaporkan ke forum design/dev sync.

## Sumber kebenaran
- Warna, radius, bayangan, font: `design/tokens/tokens.css` (variabel `--tp-*`). Jangan menulis heks baru di komponen — pakai peran brand navy/red dan token semantik yang disetujui (konstitusi desain v4.3.1).
- Kelas komponen: `design/tokens/components.css` (`.tp-btn`, `.tp-card`, `.tp-chip`, `.tp-tab`, `.tp-nav-item`, `.tp-ai`).
- Tailwind: `design/tokens/tailwind.preset.js`.
- Ikon: `design/icons/` (`<TaniaIcon name="idp" />` atau sprite SVG). Jangan membuat ikon baru dengan gaya lain.
- Contoh halaman acuan: `design/reference/contoh-*.html`.

## Aturan visual
1. Font: satu keluarga **Nunito Sans** (sesuai Legion). Judul dan angka besar Bold 700, isi Regular 400, teks aksi (tombol, chip, label form, item nav, header tabel) Semibold 600. Tanpa letter-spacing, tanpa uppercase. Sentence case di semua teks.
2. Satu tombol utama (`--tp-brand-navy` = `#172B4D`; hover/press `--tp-brand-navy-deep`) per area. Satu kartu gelap (`--tp-nav` = navy yang sama) per layar. Item menu aktif memakai pola Cockpit: latar `--tp-brand-red-tint` (`#FCE9E8`; mode gelap `#3A1715`), teks `--tp-brand-red-ink` (`#B71C14`; mode gelap `#FF8A82`), ikon `--tp-brand-red`, dot merah di kanan.
3. Tidak ada gradien. Header profil memakai latar netral (`--tp-bg` = kanvas `#F5F7FA`), progres memakai `--tp-neutral` = `#6B778C`.
4. Merah brand (`--tp-brand-red`) adalah aksen brand: menu aktif, link, ring fokus, aksi AI, plus logo — **bukan** token error. Jangan pakai `#E1231A` untuk teks kecil di latar terang/kanvas tanpa uji kontras (`--tp-brand-red-deep` `#B71C14` untuk teks kecil). Danger/error memakai token sendiri (`--tp-peach` / `--tp-tint-peach` / `--tp-ink-peach`) dan **wajib dibedakan** dari merah brand dengan ikon + teks. Hijau (success-ink) hanya untuk data/ikon, bukan teks putih di atasnya. Teks putih hanya di atas navy/navy-deep atau fill yang kontrasnya tervalidasi.
5. Radius: kartu 20 px, panel 28 px, tombol/chip/input pill. Ikon outline 2 px, grid 24 px (20 px untuk menu padat), satu detail navy atau hijau (success).
6. Nilai kosong ditulis "—" dengan keterangan alasannya. Mode hanya baca ditandai teks "Hanya baca", tanpa tombol ubah.
7. Fokus keyboard harus terlihat (outline `--tp-brand-red` 2 px, 4.39:1 di atas kanvas `#F5F7FA`; di dalam item nav aktif teks/ikon memakai `--tp-brand-red-ink`). Hormati `prefers-reduced-motion`. Kontras teks minimal 4.5:1; teks putih di atas navy = 14.1:1 dan di atas brand red = 4.7:1 (lulus AA).
8. Logo TANIA memakai aset resmi brand kit di `public/brand/` (wordmark navy untuk latar terang, wordmark putih untuk panel navy, ikon "T" untuk favicon) — jangan menggambar ulang wordmark sebagai teks/SVG buatan sendiri. Logo Telkom Indonesia hanya dari aset asli.
9. Data visualisasi memakai urutan seri kit `--tp-chart-1..4` (`#E1231A` churn/penurunan, `#2684FF` distribusi, `#168A5B` new talent, `#D9822B` cadangan warn); track bar memakai kanvas `--tp-bg`, "Belum diisi" tetap `--tp-neutral`. Jangan memakai warna status untuk seri tanpa makna status.

## Peran akses
Admin, Operation, Chapter, Talent (RBAC tetap). Tampilan menyesuaikan peran, warna brand sama untuk semua peran.

## Catatan tata kelola
Dark mode: hanya pasangan nav aktif (`--tp-brand-red-tint`/`--tp-brand-red-ink`) yang punya nilai gelap resmi (varian dark mockup TAN-99); solid navy/red tidak punya varian gelap. Bayangan kartu (`--tp-shadow`) dan radius pill adalah karakter Pulse yang belum diratifikasi dalam konstitusi desain TANIA (lihat `ADAPTATION.md`). Gunakan sebagaimana adanya di lapisan ini sampai amendemen diratifikasi.
