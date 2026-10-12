# TANIA design system (Pulse, selaras Legion)

Aturan ini wajib diikuti saat membuat atau mengubah UI TANIA. Detail lengkap ada di `design/reference/brand-guideline.html` dan `design/reference/developer-reference.html`.

## Hubungan dengan Legion Design System

Lapisan ini **tidak menggantikan** Legion. Nilai warna dan tipografi diambil langsung dari ramp Legion (`DESIGN-legion.md`, konstitusi desain TANIA v1.0.0); yang dipertahankan dari Pulse adalah struktur komponen `.tp-*`, radius besar, satu kartu gelap per layar, ikon, dan dark mode. Jika ada konflik dengan konstitusi desain, konstitusi menang dan konflik dilaporkan ke forum design/dev sync.

## Sumber kebenaran
- Warna, radius, bayangan, font: `design/tokens/tokens.css` (variabel `--tp-*`). Jangan menulis heks baru di komponen — semua nilai adalah langkah ramp Legion (primary/tertiary/success/error/warning).
- Kelas komponen: `design/tokens/components.css` (`.tp-btn`, `.tp-card`, `.tp-chip`, `.tp-tab`, `.tp-nav-item`, `.tp-ai`).
- Tailwind: `design/tokens/tailwind.preset.js`.
- Ikon: `design/icons/` (`<TaniaIcon name="idp" />` atau sprite SVG). Jangan membuat ikon baru dengan gaya lain.
- Contoh halaman acuan: `design/reference/contoh-*.html`.

## Aturan visual
1. Font: satu keluarga **Nunito Sans** (sesuai Legion). Judul dan angka besar Bold 700, isi Regular 400, teks aksi (tombol, chip, label form, item nav, header tabel) Semibold 600. Tanpa letter-spacing, tanpa uppercase. Sentence case di semua teks.
2. Satu tombol utama (ungu Legion `--tp-primary` = primary-500) per area. Satu kartu gelap (`--tp-nav` = primary-900) per layar.
3. Tidak ada gradien. Header profil memakai latar netral (`--tp-bg` = tertiary-100), progres memakai `--tp-neutral` = tertiary-500.
4. Lilac (primary-300) dan hijau (success-500) hanya untuk dekorasi dan ikon, bukan teks. Teks putih hanya di atas `--tp-primary` atau `--tp-nav`.
5. Radius: kartu 20 px, panel 28 px, tombol/chip/input pill. Ikon outline 2 px, grid 24 px (20 px untuk menu padat), satu detail ungu atau hijau (success).
6. Nilai kosong ditulis "—" dengan keterangan alasannya. Mode hanya baca ditandai teks "Hanya baca", tanpa tombol ubah.
7. Fokus keyboard harus terlihat. Hormati `prefers-reduced-motion`. Kontras teks minimal 4.5:1 (catatan: teks putih di atas primary-500 Legion = 4.3:1; untuk teks kecil di atas tombol utama gunakan `--tp-primary-deep` = primary-600 bila audit menuntut AA ketat).
8. Logo Telkom Indonesia dan wordmark TANIA resmi dari aset asli, bukan teks pengganti di halaman contoh.

## Peran akses
Admin, Operation, Chapter, Talent (RBAC tetap). Tampilan menyesuaikan peran, warna brand sama untuk semua peran.

## Catatan tata kelola
Dark mode, bayangan kartu (`--tp-shadow`), dan radius pill adalah karakter Pulse yang belum diratifikasi dalam konstitusi desain TANIA (lihat `ADAPTATION.md`). Gunakan sebagaimana adanya di lapisan ini sampai amendemen diratifikasi.
