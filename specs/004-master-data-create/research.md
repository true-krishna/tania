# Phase 0 — Research: Tambah Master Data (Create) — Job Role, Initiative, Unit

**Feature**: `004-master-data-create` (TAN-187) · **Date**: 2026-10-14

Audit 2026-10-14 atas `tania-dashboard@origin/master` (`b446fe2`) dan `tania-backend`. Seluruh butir teknis di bawah diselesaikan sebelum desain; tidak ada `NEEDS CLARIFICATION` tersisa.

## R-1 — Apakah operasi Create sudah ada?

- **Decision**: Operasi Create untuk Unit, Job Role, dan Initiative (Project) **sudah terimplementasi** di kedua repo; plan hanya menutup gap terhadap spec.
- **Rationale**: `MasterDataSection.tsx` sudah menyediakan tombol tambah + form dan ketiga halaman (`units`, `job-roles`, `projects`) sudah mengirim `onCreate`. Backend sudah menyediakan `createUnit`, `createJobRole`, `createProject` (SDL + `internal/usecase/*`). Test create Unit juga sudah ada.
- **Alternatives considered**: Membangun ulang form/hook create (ditolak — duplikasi, melanggar Tech I).

## R-2 — Peran yang berhak mengelola master data

- **Decision**: **Admin** (hanya Admin) yang dapat CRUD master data. Matriks RBAC `002-tania-rbac` tetap berlaku tanpa amandemen.
- **Rationale**: Keputusan pemilik produk (`/speckit.clarify`, TAN-187, 2026-10-14), menegaskan FR-16 induk. Backend sudah `RequireRole(domain.RoleAdmin)` untuk ketiga create (`authz_test.go`); e2e membuktikan Operation/Chapter → `FORBIDDEN`.
- **Alternatives considered**: Operation sebagai pengelola (permintaan awal TAN-187) — ditolak/dikoreksi pemilik produk; berbagi Admin+Operation (opsi B) — tidak dipilih.

## R-3 — Kewajiban pemilihan referensi (chapter vs unit) pada form

- **Decision**: Kewajiban `select` dibuat **eksplisit per halaman**: Unit (Project) **wajib**, Chapter (Job Role) **opsional**.
- **Rationale**: `MasterDataSection.handleSubmit` saat ini memperlakukan "halaman mengirim `select`" sebagai "referensi wajib", sehingga Job Role tidak bisa dibuat tanpa chapter — bertentangan dengan FR-22 induk (Role boleh tanpa chapter) dan bahkan dengan placeholder form sendiri ("boleh kosong"). Project memang wajib merujuk tepat satu Unit (FR-19/FR-006).
- **Alternatives considered**: Menghapus validasi referensi sepenuhnya (ditolak — Project kehilangan proteksi FR-006); cabang khusus per entitas di dalam komponen (ditolak — melanggar D1/Tech I); prop `selectRequired` per halaman (dipilih).

## R-4 — Penegakan otorisasi & audit

- **Decision**: Tetap server-side dan tanpa permukaan baru; UI (guard `layout.tsx`, nav `roles: ["ADMIN"]`) hanya kenyamanan.
- **Rationale**: Security III konstitusi; `RequireRole` + `recordChange` dalam satu transaksi sudah ada di ketiga usecase (FR-16/FR-17).
- **Alternatives considered**: Menambah pengecekan otorisasi baru di klien (ditolak — bukan batas keamanan, tidak perlu).

## R-5 — Penamaan "Initiative" vs "Project"

- **Decision**: Pertahankan entitas & label existing "Project" pada plan ini; pemetaan Initiative = Project tetap (keputusan TAN-180). Penggantian label submenu berada di luar scope.
- **Rationale**: Spec 004 mengeluarkan perluasan field/penamaan; entitas yang dirujuk sudah benar.
- **Alternatives considered**: Mengganti label nav/halaman menjadi "Initiative" — ditunda sebagai follow-up terpisah (D5).

## R-6 — Strategi pengujian

- **Decision**: Perluas `master-data.test.tsx` dengan test create Job Role (dengan & tanpa chapter) dan Initiative (dengan Unit / blokir tanpa Unit); verifikasi backend memakai test usecase/authz/e2e yang sudah ada.
- **Rationale**: Tech III (testing non-negotiable); create Unit sudah teruji, Job Role/Initiative belum.
- **Alternatives considered**: Hanya UAT manual (ditolak — perubahan perilaku butuh test).
