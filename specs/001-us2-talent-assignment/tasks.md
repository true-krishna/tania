# Tasks: Manajemen Assignment Talent

**Input**: Design documents from `/specs/001-us2-talent-assignment/`

**Prerequisites**: `plan.md` (required — gelombang K1–K6), `spec.md` (required — FR-01–FR-10, US1–US5), mirror spesifikasi induk di `tania-backend/specs/001-us2-talent-assignment/`

**Tests**: Test RTL/explisit diminta plan (konstitusi §VII) — setiap gelombang frontend menyertakan task test-nya.

**Organization**: Task dikelompokkan per gelombang plan (`plan.md` §Roadmap). ID lokal slice ini
(T001…) berdiri sendiri; gelombang backend K1 **tidak** dinomori ulang — tereksekusi sebagai
**T144** di `tania-backend/specs/001-employee-digital-talent-management/tasks.md` (keputusan O1).
Backlog eksekusi dibuat sebagai sub-issue TAN-133 (2026-10-08).

## Format: `[ID] [P?] [Gelombang] Description`

- **[P]**: dapat paralel (berkas berbeda, tanpa dependensi)
- Semua task frontend kecuali K1; jalankan dari root `tania-dashboard`

## Path Conventions

- Frontend: `src/app/(app)/assignments/`, `src/features/assignments/`, `src/lib/errors.ts`
- Backend (K1 saja): `tania-backend/internal/usecase/assignment.go` + `assignment_test.go`

---

## Phase K1 — Verifikasi Backend (stage 1)

**Purpose**: Buktikan implementasi backend eksisting memenuhi FR-01–FR-10 spec dedikasi —
tanpa perubahan kode bila semua lolos.

- [x] T144 *(di repo backend — `tasks.md` fitur induk)* Verifikasi test matrix FR-01–FR-10
      terhadap `internal/usecase/assignment.go`: otorisasi 4 peran × (buat/ubah/akhiri/baca),
      cakupan chapter (lintas cakupan → `ErrNotFound`), kandidat assignable (FR-03), validasi
      periode (FR-09), pengakhiran kedua ditolak, duplikat aktif per talent+project (`CONFLICT`),
      audit sinkron before/after (FR-10). Lengkapi test bila ada cabang yang belum tertutup;
      laporkan hasil pada TAN-133.

**Checkpoint**: semua cabang matrix hijau atau cacat dicatat; TAN-133 mendapat laporan K1.

---

## Phase K2 — Form ubah assignment (stage 2) — menutup G1 (US2-2, FR-05)

- [x] T001 Tambahkan operasi `src/features/assignments/updateAssignment.graphql`
      (mutation `updateAssignment(id, input)` dari SDL yang dilayani) + mutation hook pada
      `src/features/assignments/useAssignment.ts`; jalankan `npm run generate` sampai bersih
- [x] T002 Form ubah pada `src/app/(app)/assignments/[id]/page.tsx`: hanya untuk status
      berjalan (ACTIVE); field project (Master Data Project aktif), periode mulai–selesai;
      talent **tidak** bisa diganti; simpan → refetch detail
- [x] T003 Test Vitest + RTL form ubah pada `src/features/assignments/assignments.test.tsx`:
      mutasi terkirim dengan payload benar, tampilan versi terbaru, error server tampil

---

## Phase K3 — Pengakhiran dengan tanggal (stage 2) — menutup G2 + G6 (US2-3, FR-06, FR-09)

- [x] T004 [P] Input tanggal selesai pada aksi akhiri di
      `src/app/(app)/assignments/[id]/page.tsx`: **tanpa** default otomatis (hapus fallback
      `periodEnd ?? hari ini` dan pola `toISOString().slice(0,10)` yang rawan UTC); validasi
      klien tanggal selesai ≥ tanggal mulai sebelum kirim
- [x] T005 [P] Test Vitest + RTL pengakhiran: tanggal diisi Chapter, validasi tanggal < mulai
      ditolak di klien, penolakan server (`ErrPrecondition`) tampil sebagai pesan

**Checkpoint**: US2 (ubah + akhiri) tertutup penuh di UI; riwayat tidak pernah berkurang.

---

## Phase K4 — Pemetaan error form (stage 3) — menutup G5 (US1-4, US2-4)

- [x] T006 Peta error server → pesan per field/pesan aksi pada form buat & ubah via
      `src/lib/errors.ts`: validasi tanggal (`BAD_USER_INPUT`), duplikat aktif
      (`CONFLICT`), cakupan chapter (`FORBIDDEN`); tanpa swallowed error (konstitusi §IX)
- [x] T007 Test Vitest + RTL tampilan error: tanggal tidak valid, `CONFLICT` duplikat aktif,
      `FORBIDDEN` lintas cakupan — pada form buat dan form ubah

---

## Phase K5 — Verifikasi US5 & label (stage 3) — O2/O4 (US5, FR-08)

- [x] T008 Verifikasi bucket otomatis section Experiences pada Profil CV menampilkan riwayat
      assignment milik Talent — hanya-baca, selalu terkini, termasuk yang diakhiri, empty state
      jelas — sesuai FR-10 spec CV Profile (TAN-91); rapikan label status berjalan/selesai yang
      konsisten di daftar, detail, dan form (nilai server `ACTIVE`/`COMPLETED` tidak berubah)

---

## Phase K6 — UAT & Regression (stage 4)

**Purpose**: Gerbang penerimaan fitur.

- [x] T009 Checklist manual seluruh acceptance scenario spec (US1–US5) + regression lintas
      modul: assignment diakhiri → muncul pada pengalaman kerja CV dan angka dashboard berubah
      konsisten (SC-003); riwayat utuh setelah ubah/akhiri (SC-004); `npm run lint` +
      `npm run typecheck` + `vitest run` hijau

---

## Dependencies & Execution Order

1. **K1 (stage 1)** — prasyarat kepercayaan; frontend bisa disiapkan paralel karena seluruh
   operasi SDL sudah dilayani, tapi penutupan K2–K4 menunggu K1 hijau
2. **K2 + K3 (stage 2)** — saling bebas; K4 menunggu K2 (form ubah harus ada)
3. **K4 + K5 (stage 3)** — setelah K2
4. **K6 (stage 4)** — setelah semua; gerbang penerimaan

## Notes

- Semua mutasi tetap ditegakkan server; UI hanya menyembunyikan (SC-002)
- Kontrak GraphQL berubah **sekali** karena keputusan produk 2026-10-19 (peran dihapus dari assignment — gelombang K7 di bawah); di luar itu tidak ada operasi/tipe baru dan `npm run generate` wajib bersih
- Commit per task atau kelompok logis; jalankan test sebelum commit
- ID T133–T143 terpakai di daftar bersama fitur induk — slice ini memakai ID lokal T001–T009

---

## Phase K7 — Hapus peran dari assignment (stage 5, 19–20 Okt 2026) — keputusan produk

Revisi spec 2026-10-19: peran (`job_role`) bukan bagian model assignment — assignment berisi talent, project, dan periode. Tidak ada field pengganti; peran fungsional talent dibaca dari kontrak aktifnya. Gelombang ini tidak berasal dari gap plan awal, melainkan dari keputusan produk pada TAN-133.

- [x] T010 *(backend)* Buang peran dari domain, usecase (`resolveRole`), repository + row scanner, guard `CountAssignments` pada repo Role, tool chat, wiring `main.go`; migrasi forward-only `0016_drop_assignment_job_role.sql`; SDL + `go tool gqlgen generate`; cermin kontrak; ERD. MR !61 → `master` `d2381b1` (commit `e4fe5cf`)
- [x] T011 *(dashboard)* Buang peran dari operasi GraphQL + UI (form buat/ubah, detail, daftar per project, profil, Pengalaman Kerja CV) dan dari pemetaan error K4; sesuaikan test. MR !114 → `master`; salinan SDL + cermin kontrak + codegen disinkronkan lewat MR !118

**Checkpoint**: tidak ada lagi `job_role` pada assignment di kode, SDL, cermin kontrak, ERD, maupun test; migrasi `0016` terverifikasi pada PostgreSQL 16 (kolom `job_role_id` dan FK-nya hilang, baris assignment dan jejak audit utuh).

---

## Hasil UAT (stage 4, 20 Okt 2026)

- **K6-FE (TAN-138)**: 18/18 skenario lewat UI nyata (Playwright); SC-001 5,8 detik; SC-005 801 baris 1,8–4,8 detik. Branch uji `test/talent-assignment-uat-frontend` (`fa4d198`, 3 berkas `e2e/`, tanpa perubahan kode produk)
- **K6-BE (TAN-242)**: SC-002 (matriks 4 peran + kode error per percobaan, nol efek samping), SC-004 (baris tidak terhapus, audit `CREATE`/`UPDATE`/`DEACTIVATE` tanpa `DELETE`), sisi server SC-003, dan penjaga duplikat aktif pada jalur update (TAN-237) terverifikasi pada stack nyata. Branch uji `test/talent-assignment-uat-backend` (`d366c76`), diverifikasi ulang oleh koordinator
- **Temuan yang dicatat, bukan ditutup di sini**: (1) detail assignment di luar 100 baris teratas tidak dapat dibuka — keputusan pemilik produk: tanpa perubahan kontrak; (2) chip status pada dashboard Talent masih "Aktif"; (3) Pengalaman Kerja CV tidak tampil untuk talent yang belum punya baris profil CV (milik fitur CV `002-cv-profile-spec`). Rincian + alasan pada `plan.md` §Hasil & batasan pasca-UAT
