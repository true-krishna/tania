# Specification Quality Checklist: RBAC Tania (Kontrol Akses Berbasis Peran)

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-10-08
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- Klarifikasi 1 (2026-10-08, TAN-144): hak baca modul Assignment = Operation (lihat semua), bukan Admin — keputusan pemilik produk diterapkan pada Matriks Peran & Modul dengan catatan revisi pada spec.
- Klarifikasi 5 (2026-10-16, TAN-212): (a) Chapter **boleh membaca Kontrak kerja** (cakupan chapter, hanya baca) — baris kontrak dipisahkan dari baris Data karyawan; (b) Chapter & Talent **tidak** punya akses Master Data (kemudian dilunakkan untuk Chapter oleh klarifikasi 6); (c) IDP & evaluasi performa dibuka aksesnya (rinciannya disempurnakan klarifikasi 6); hak *periode* & *template* evaluasi saat itu masih usulan (`†`).
- Klarifikasi 6 (2026-10-16, TAN-212): (a) **Operation membaca Profil CV** (hanya baca; penulisan tetap Talent); (b) **Chapter membaca Master Data dalam cakupannya** (Talent tetap tanpa akses — O6 tetap tertutup untuk Talent); (c) **seluruh modul evaluasi** (evaluasi performa, periode, template) = Admin `kelola` · Operation `lihat` · Chapter `kelola cakupan` · Talent `kelola cakupan (miliknya)` — menggantikan usulan `†` clarify 5; (d) **IDP & evaluasi: rekam akses sekarang, aktifkan nanti** — deny-by-default berlaku sampai modulnya diaktifkan.
- Klarifikasi 2 (2026-10-08, TAN-144): modul IDP & evaluasi performa (termasuk periode & template evaluasi) ditunda dari iterasi 2 dan diarahkan ke integrasi WAD — baris matriks ditandai ditunda (\*), definisi akses tetap terdokumentasi, modul diperlakukan belum tersedia (deny-by-default) selama ditunda. **Aksesnya dibuka oleh klarifikasi 5/6 (2026-10-16)** — direkam sekarang, aktivasi teknis menyusul (klarifikasi 6d).
- Klarifikasi 7 (2026-10-16, TAN-212): pemilik produk mengonfirmasi dua tafsiran yang masih terbuka — (a) **Cakupan Master Data untuk Chapter = `lihat cakupan`** (bukan akses penuh `lihat`); batas teknisnya menunggu relasi chapter pada Unit/Project (plan §14.8, T086); (b) **IDP disamakan dengan modul evaluasi**: Chapter `kelola cakupan` (naik dari `lihat cakupan`), Talent `kelola miliknya` — IDP & evaluasi kini seragam (Admin kelola · Operation lihat · Chapter kelola cakupan · Talent kelola miliknya); waktu aktivasi tidak berubah (klarifikasi 6d).
- Klarifikasi 4 (2026-10-15, TAN-212): Admin = **kelola penuh** pada seluruh modul aktif — baris Data karyawan & kontrak kerja (Admin "lihat semua" → "kelola"), Assignment (Admin "—" → "kelola"), dan Profil CV (Admin "—" → "kelola"). Membalik clarify 1. (Profil CV kemudian dikoreksi menjadi baca-saja oleh klarifikasi 2026-10-15 lanjutan.)
- Validasi lolos pada iterasi pertama; spesifikasi konsisten dengan spesifikasi induk (`specs/001-employee-digital-talent-management/spec.md`) — semua ketentuan RBAC induk diturunkan, tidak ada yang bertentangan (lihat tabel Rujukan Silang).
- Keputusan di luar spesifikasi induk terkonfirmasi pemilik produk (klarifikasi TAN-144): proteksi satu-satunya akun Admin aktif — menonaktifkan maupun mengubah peran menjauh dari Admin (diperluas amandemen 2026-10-12); pembatasan laju login — ambang dipin di plan (10 gagal / 15 menit / sumber); tanpa perubahan kata sandi mandiri (kredensial dikelola Entra).
