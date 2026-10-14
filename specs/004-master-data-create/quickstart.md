# Quickstart — Validasi: Tambah Master Data (Create) — Job Role, Initiative, Unit

**Feature**: `004-master-data-create` (TAN-187) · **Date**: 2026-10-14

Panduan validasi runnable untuk membuktikan fitur Create bekerja end-to-end. Detail kontrak & model ada di [`contracts/master-data-create.md`](./contracts/master-data-create.md) dan [`data-model.md`](./data-model.md) — tidak diduplikasi di sini.

## Prasyarat

- Akun **Admin** aktif (untuk jalur sukses) **dan** akun non-Admin (mis. Operation) untuk memverifikasi penolakan.
- Minimal satu **Unit** terdaftar (prasyarat membuat Initiative).
- Lingkungan lokal: `tania-backend` (PostgreSQL + Redis via `make up`) dan `tania-dashboard` (`pnpm install`).

## A. Gerbang mesin (otomatis)

```bash
# tania-dashboard
pnpm run lint
pnpm run typecheck
pnpm test          # vitest run — termasuk master-data.test.tsx

# tania-backend — verifikasi kontrak create & otorisasi (tanpa kode baru)
make test          # unit + contract tests (usecase/create, authz, e2e httpapi)
```

**Harapan**: seluruh perintah hijau; test create Job Role (dengan & tanpa chapter) dan Initiative (dengan Unit / blokir tanpa Unit) lulus; `e2e/rbac.spec.ts` tidak tersentuh.

## B. UAT manual sebagai Admin

Jalankan `pnpm dev` lalu login sebagai Admin.

1. **Unit (US1)** — buka `/master-data/units`, klik **Tambah Unit**, isi nama valid (mis. `Digital Business`), Simpan.
   - Harapan: toast sukses; Unit baru muncul di daftar; kolom Proyek = 0.
2. **Job Role tanpa chapter (US2, FR-22)** — buka `/master-data/job-roles`, **Tambah Job Role**, isi nama, biarkan **Chapter kosong**, Simpan.
   - Harapan: **berhasil** tersimpan; baris menampilkan "Tanpa chapter" (regresi G1 — sebelumnya diblokir).
3. **Job Role dengan chapter** — ulangi dengan memilih Chapter; harapan: tersimpan dengan chapter yang dipilih.
4. **Initiative (US3)** — buka `/master-data/projects`, **Tambah Proyek/Initiative**, isi nama, pilih **Unit**, Simpan.
   - Harapan: tersimpan dan tampil beserta Unit-nya.
5. **Initiative tanpa Unit (FR-006)** — submit tanpa memilih Unit.
   - Harapan: ditolak dengan pesan "Unit wajib dipilih."; tidak ada data baru.
6. **Nama kosong (FR-004)** — pada form mana pun, kosongkan Nama lalu Simpan.
   - Harapan: ditolak dengan pesan "… wajib diisi."; tidak ada data baru.
7. **Nama duplikat (FR-005)** — tambah entitas dengan nama yang sudah ada.
   - Harapan: ditolak dengan pesan dari server; tidak ada data baru.
8. **Unit baru terpakai modul lain (FR-009)** — setelah langkah 1, buka form Initiative; harapan: Unit baru tersedia sebagai pilihan.

## C. Verifikasi otorisasi (US4, FR-010)

1. Login sebagai **Operation** (bukan Admin).
   - Harapan UI: menu Master Data tidak tampil; membuka `/master-data/units` langsung → halaman tidak dirender.
2. Kirim request create langsung (Postman/`curl` ke GraphQL) dengan token Operation:
   ```graphql
   mutation { createUnit(name: "X") { id } }        # → FORBIDDEN
   mutation { createJobRole(name: "X") { id } }     # → FORBIDDEN
   mutation { createProject(name: "X", unitId: "<uuid>") { id } }  # → FORBIDDEN
   ```
   - Harapan: ketiganya ditolak server (`FORBIDDEN`); tidak ada data baru.
   - **Sumber**: `docs/qa-test-guide.md` (`tania-backend`) memuat matriks ini; `internal/transport/httpapi/e2e_test.go` menegakkannya.

## D. Verifikasi jejak audit (FR-016)

- Setelah create sebagai Admin, buka modul **Jejak audit** (Admin) dan pastikan tercatat entri `AuditCreate` untuk `unit`/`job_role`/`project` dengan aktor, waktu, dan nilai sesudah.

## Kriteria lulus

- [ ] Gerbang mesin (A) hijau.
- [ ] Seluruh langkah UAT (B) memberi hasil sesuai harapan — khususnya Job Role tanpa chapter berhasil (G1).
- [ ] Otorisasi (C) menolak semua create non-Admin di server — 100%.
- [ ] Jejak audit (D) tercatat untuk setiap create.
