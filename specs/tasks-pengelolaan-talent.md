# Tasks: Pengelolaan Talent — Kontrak Kerja, Siklus Kerja & Provisi Akun Entra

**Input**: Design documents dari `specs/` (amandemen 002)

**Prerequisites**: `spec-pengelolaan-talent.md` (required — FR-33–FR-46, US9–US14), `plan-pengelolaan-talent.md` (required — gelombang K1–K6, keputusan D1–D5), artefak 001 tersinkron (`specs/001-employee-digital-talent-management/{spec,data-model}.md`, `diagrams/erd.mmd`, `contracts/schema.graphql`)

**Tests**: **WAJIB** — diminta eksplisit oleh konstitusi §VII dan `plan-pengelolaan-talent.md` §Testing. Setiap gelombang menyertakan task test-nya.

**Organization**: Task dikelompokkan per gelombang plan (§Roadmap) dan dipetakan ke sub-issue eksekusi yang sudah dibuat dari TAN-98: K1 → TAN-127 (stage 1), K2 → TAN-126 (stage 2), K3 → TAN-128, K4 → TAN-129, K5 → TAN-131 (stage 3), K6 → TAN-130 (stage 4). ID lokal dokumen ini (T001…) berdiri sendiri — jangan dicampur dengan T001–T144 di `specs/001-employee-digital-talent-management/tasks.md`.

## Format: `[ID] [P?] [Gelombang] Description`

- **[P]**: dapat paralel (berkas/area berbeda, tanpa dependensi pada task yang belum selesai)
- `[x]` = sudah terpenuhi sebelum dokumen ini (bukti commit disertakan); `[ ]` = belum dikerjakan
- Setiap deskripsi memuat path berkas/area persis + repo (`tania-backend` / `tania-dashboard`)

## Path Conventions

- **Backend** (`tania-backend`, Go 1.26 + gqlgen + PostgreSQL 16): `internal/platform/migrations/sql/000N_*.sql` (forward-only), `internal/domain/`, `internal/usecase/`, `internal/repository/postgres/`, `internal/platform/{secret,entra}/`, `graph/schema.graphqls` + `make generate`, `internal/transport/httpapi/` (e2e)
- **Frontend** (`tania-dashboard`, Next.js App Router + TS + Tailwind + Vitest): `src/app/(app)/<rute>/`, `src/features/<modul>/` (operasi `.graphql` + hooks), `src/generated/graphql/` (hasil `npm run generate`, jangan diedit manual)
- Kontrak desain: `specs/001-employee-digital-talent-management/contracts/schema.graphql` (mirror byte-identik ke `tania-dashboard`; wajib sinkron dengan `graph/schema.graphqls`)

---

## Phase K1 — Skema & migrasi (TAN-127, stage 1) — `tania-backend`

**Purpose**: fondasi data amandemen 002 — tabel `employment_contracts`, pemangkasan `employees` menjadi data diri (NIK terenkripsi), turunan via kontrak aktif (D1–D5). Prasyarat seluruh gelombang lain.

- [x] T001 [K1] Sinkronisasi artefak 001 dengan amandemen (O1): `specs/001-employee-digital-talent-management/spec.md` (US9–US14, FR-33–FR-46), `data-model.md`, `diagrams/erd.mmd`, `contracts/schema.graphql` + mirror ke `tania-dashboard` — **selesai 2026-10-08 (TAN-141)**: commit `df9f635` (backend) / `3aea1a0` (dashboard)
- [ ] T002 [K1] Migrasi baru `internal/platform/migrations/sql/0005_employment_contracts.sql`: tabel `employment_contracts` (atribut TMS: `contract_no` unik, `contract_type` `pkwt`/`pkwtt`, `office_email`, `nomor_induk`, `band_position`, `job_role_id`, `job_title`, `job_level`, `work_location`, `unit_id`, `start_date`/`end_date` (NULL untuk PKWTT), `terminated_at`, `end_reason` enum 3 nilai (`resign`/`retirement`/`mutation` — `expiry` tidak disimpan; alasan habis masa = turunan `ended`, diekspos sebagai `EXPIRY` pada enum GraphQL), `predecessor_contract_id`, `notes`, `created_by`, timestamps) + kolom data diri baru `employees` (`nik_hash`, `nik_enc`, `birth_date`, `gender`, `phone`, `address`, `latest_education`, `institution_name`, `major`) + perluasan enum status karyawan (`RESIGNED`, `RETIRED`)
- [ ] T003 [K1] Indeks & turunan DB (D1–D3): partial unique index satu kontrak aktif per karyawan (D2, race-safe) + `uq_employment_contracts_nomor_induk_active`; view `employee_chapter_scope` diubah join via kontrak aktif → jobRole → chapter; **status kontrak turunan tanggal** (kolom tersimpan hanya `terminated_at` + `end_reason` — tanpa kolom status yang di-cron, D1)
- [ ] T004 [K1] Migrasi dua fase data eksisting (D4, R2): `employee_code` → `nomor_induk` kontrak awal, `unit_id`/`job_role_id` → kontrak awal (periode `joined_at → NULL`, satu kontrak awal per karyawan); pencabutan kolom lama fase 2 setelah kode beralih — dokumentasikan rollback path pada `docs/migrations.md`
- [ ] T005 [P] [K1] Modul enkripsi NIK (D5): AES-256-GCM application-level `nik_enc` + `nik_hash` (SHA-256 ter-salted untuk keunikan) pada `internal/platform/secret`; key dari environment/secret store (konstitusi III); masking 4 digit akhir di boundary resolver — model GraphQL tidak pernah membawa NIK plaintext (FR-42)
- [ ] T006 [K1] Test migrasi & repository (`internal/repository/postgres/*_test.go` + `TEST_DATABASE_URL`): migrasi bersih di DB kosong & data eksisting; partial unique index menolak kontrak aktif kedua dan nomor induk ganda; `nik_hash` unik; view chapter via kontrak aktif; NIK tidak pernah tersimpan plaintext

**Checkpoint**: migrasi ter-apply, constraint & turunan lulus; `data-model.md`/ERD sinkron (T001).

## Phase K2 — API kontrak & siklus kerja (TAN-126, stage 2) — `tania-backend`

**Purpose**: GraphQL CRUD kontrak + seluruh alur siklus (perpanjangan, resign, mutasi, pensiun) dengan audit `recordChange`. Prasyarat K3–K5.

- [ ] T007 [K2] Domain `internal/domain/contract.go`: `EmploymentContract` + enum (`ContractType`, `EmploymentContractStatus`, `EndReason`) + aturan turunan status/assignability (D1–D3); perluas `internal/domain/employee.go`: field data diri, enum `ACTIVE`/`RESIGNED`/`RETIRED`/`INACTIVE`, `DeriveAssignable` = `ACTIVE` + kontrak aktif + `job_role.chapter_id` terisi — definisi tunggal yang dipakai semua read path (R3)
- [ ] T008 [P] [K2] Repository `internal/repository/postgres/contract.go` + `contractrow.go`: query kontrak + filter (`unitId`/`jobRoleId`/`contractType`/`status`/`expiringBefore`/`search`), anti-overlap server, `expiringContracts(days)`, `employeesNeedingFollowUp`; `employee.go`/`employeerow.go` membaca turunan unit/posisi/jobRole/email kantor dari kontrak aktif + masking NIK di boundary
- [ ] T009 [K2] Usecase `internal/usecase/contract.go`: `createEmploymentContract` / `updateEmploymentContract` (field terbatas selama aktif) — persist + audit satu transaksi via pola `recordChange` (FR-41)
- [ ] T010 [K2] Usecase perpanjangan `renewEmploymentContract` (FR-36): kontrak baru terkait `predecessor_contract_id`, mulai setelah kontrak lama berakhir, boleh ganti unit/posisi (perpindahan unit saat perpanjangan), periode tumpang tindih ditolak server (`CONFLICT`)
- [ ] T011 [K2] Usecase siklus kerja: `resignEmployee` (FR-37 — `end_reason=resign`, status `RESIGNED`, `acknowledgeActiveWork` untuk peringatan dependensi), `recordEmployeeMutation` (FR-38 opsi B — akhiri kontrak lama + kontrak baru efektif tanggal mutasi dalam satu transaksi), `retireEmployee` (FR-39 — `end_reason=retirement`, status `RETIRED`) + hook penonaktifan akun untuk Entra (FR-46)
- [ ] T012 [K2] Turunan "kontrak habis tanpa perpanjangan" (OQ-3, D3): otomatis non-assignable, status karyawan tetap `ACTIVE`, query `employeesNeedingFollowUp` → daftar "perlu tindak lanjut"
- [ ] T013 [P] [K2] Usecase `internal/usecase/employee.go`: create/update data diri + NIK (FR-33, FR-42) dengan validasi unik email/NIK/nomor induk dan pesan penolakan per field (`INVALID`/`CONFLICT`) + snapshot audit
- [ ] T014 [K2] GraphQL `graph/schema.graphqls` + `make generate`: tipe `EmploymentContract` + enum + input (`CreateEmploymentContractInput`, `RenewContractInput`, `MutationInput`, `ResignInput`, `RetireInput`), mutasi lifecycle, query `employmentContracts`/`employeesNeedingFollowUp`/`expiringContracts(days)`; `Employee` + `nikMasked`/`latestEducation`/`institutionName`/`major`/`nomorInduk`/`contracts(first, after)`, `unit`/`jobRole` menjadi turunan kontrak aktif (bentuk field tetap), **`employeeCode` dihapus** (breaking — R4)
- [ ] T015 [K2] Sinkron `specs/001-employee-digital-talent-management/contracts/schema.graphql` dengan SDL terpasang + mirror byte-identik ke `tania-dashboard` (pola T131)
- [ ] T016 [K2] Test unit usecase (fake repositori, `now` injeksi, `internal/usecase/*_test.go`): satu kontrak aktif per karyawan, anti-overlap periode, nomor induk unik antar kontrak aktif, perpanjangan (predecessor + pindah unit), resign/mutasi/pensiun (end_reason + status + nonaktifkan akun), kontrak habis → non-assignable + "perlu tindak lanjut", audit `recordChange` before/after setiap aksi
- [ ] T017 [K2] Test e2e GraphQL (`internal/transport/httpapi/e2e_test.go`): alur lengkap create karyawan → kontrak → perpanjangan → mutasi → resign/pensiun; otorisasi Operation-only (Talent/Chapter tanpa akses tulis — OQ-4); pesan validasi per kasus (periode tumpang tindih, nomor induk duplikat, field wajib)

**Checkpoint**: `make generate` idempoten; `make lint vet test` + `make test-integration` hijau; `contracts/schema.graphql` tersinkron (T015).

## Phase K3 — UI data diri & kontrak (TAN-128, stage 3) — `tania-dashboard`

**Purpose**: tutup gap form ubah data diri + seluruh permukaan kontrak. Prasyarat API K2. **Dapat paralel dengan K4–K5.**

- [ ] T018 [P] [K3] Operasi `.graphql` + hooks pada `src/features/employees/` dan `src/features/contracts/` (pola modul `assignments`): create/update data diri, daftar + filter, detail, CRUD kontrak; jalankan `npm run generate` sampai bersih (R4)
- [ ] T019 [K3] Form data diri baru `src/app/(app)/employees/new/page.tsx`: field wajib NIK (16 digit), tanggal lahir, jenis kelamin, telepon, alamat, pendidikan terakhir/nama institusi/jurusan (opsional) — **tanpa field employee ID** (identitas kepegawaian hanya pada kontrak); validasi unik email & NIK dengan pesan per field (G14)
- [ ] T020 [K3] Form ubah data diri `src/app/(app)/employees/[id]/edit/page.tsx` (gap form ubah — memakai `updateEmployee` yang sudah dilayani server): field data diri; NIK tampil tersamar dengan nilai penuh hanya lewat tampilan khusus berizin (FR-42)
- [ ] T021 [K3] Daftar karyawan `src/app/(app)/employees/page.tsx`: kolom data diri (NIK masked 4 digit akhir), pencarian nomor induk (via kontrak), filter divisi/status dari kontrak aktif, pagination cursor di UI (saat ini fetch 100 tanpa pagination)
- [ ] T022 [K3] Detail karyawan `src/app/(app)/employees/[id]/page.tsx`: data diri + **riwayat kontrak berurutan** (kontrak lama tetap terbaca, atribut TMS lengkap) + **riwayat perubahan per record** untuk Operation (FR-41 UI — membaca `auditLogs` per entitas; NIK selalu tersamar)
- [ ] T023 [K3] Daftar/form/detail kontrak `src/app/(app)/contracts/` (+ `[id]/`): atribut TMS (no kontrak, jenis, unit, posisi/jobRole, jobTitle, jobLevel, band_position, work location, email kantor, **nomor induk wajib — unik antar kontrak aktif**), periode, status turunan, alasan berakhir; error server dipetakan per field via `src/lib/errors.ts` (`INVALID`/`CONFLICT`)
- [ ] T024 [K3] Test Vitest + RTL (`src/features/employees/`, `src/features/contracts/`, pola `employees/new/page.test.tsx`): form data diri (validasi wajib/duplikat + masking NIK), form ubah, daftar + filter, riwayat kontrak, pesan error per field (duplikat email/NIK/nomor induk)

**Checkpoint**: NIK masked terverifikasi di UI; form/daftar/detail teruji terhadap API K2; `npm run lint` + `npm run typecheck` + `vitest run` hijau.

## Phase K4 — UI alur siklus & dashboard (TAN-129, stage 3) — `tania-dashboard`

**Purpose**: seluruh aksi siklus kerja lewat satu pintu (halaman detail kontrak) + widget Operation. Prasyarat API K2.

- [ ] T025 [P] [K4] Wizard perpanjangan kontrak (FR-36) dari daftar "segera berakhir" / detail karyawan-kontrak pada `src/app/(app)/contracts/[id]/` + `src/features/contracts/`: periode baru mulai setelah kontrak lama, opsi perpindahan unit/posisi, hasil terkait `predecessor_contract_id`
- [ ] T026 [K4] Aksi resign/mutasi/pensiun pada `src/app/(app)/contracts/[id]/page.tsx` (satu pintu — Structure Decision plan): resign (tanggal efektif + alasan), mutasi (unit/posisi baru + tanggal efektif), pensiun (tanggal efektif); **peringatan dependensi** (assignment aktif/IDP berjalan) sebelum konfirmasi (pola `acknowledgeActiveWork`)
- [ ] T027 [K4] Widget dashboard Operation `src/features/dashboard/` + `src/app/(app)/dashboard/page.tsx`: **kontrak segera berakhir** (jendela H-90/H-30, query `expiringContracts`), **perlu tindak lanjut** (`employeesNeedingFollowUp`), **pra-pensiun** (usia pensiun 56 parametri dari `birth_date`)
- [ ] T028 [K4] Test Vitest + RTL alur siklus + widget: wizard perpanjangan (termasuk pindah unit → turunan baru efektif sejak kontrak baru), konfirmasi + peringatan dependensi resign/mutasi/pensiun, daftar "perlu tindak lanjut", angka widget H-90/H-30 & pra-pensiun konsisten dengan data

**Checkpoint**: US10–US13 tertutup di UI; `npm run lint` + `npm run typecheck` + `vitest run` hijau.

## Phase K5 — Provisi akun Entra (TAN-131, stage 3) — fullstack

**Purpose**: US14 / FR-43–FR-46. Prasyarat K1 (tautan `user_id`) + hook terminasi K2 (FR-46). **Dapat paralel dengan K3–K4.** Verifikasi end-to-end tergantung **O4** (kredensial tenant uji via secret store) — pengembangan memakai fake client.

- [ ] T029 [P] [K5] Klien Microsoft Graph `internal/platform/entra/` (satu dependensi baru — justifikasi plan §Technical Context): invitation / create account / disable + **fake client** untuk test tanpa jaringan; konfigurasi tenant ID, client ID, client secret dari environment/secret store (konstitusi III — tidak pernah di-commit)
- [ ] T030 [K5] Orkestrasi `internal/usecase/entra.go`: auto-create pasca-commit **best-effort di luar transaksi DB** (gagal tidak membatalkan penyimpanan karyawan — R1), hasil (invitation/create/gagal, UPN/object-id) tercatat + masuk audit; anti-duplikat — yang sudah terlink `entra_object_id` tidak diprovisi ulang
- [ ] T031 [K5] Aturan domain & UPN (FR-45): email data diri `telkom.co.id` → **invitation**; selain itu → **create account** dengan UPN `nama-depan.nama-belakang@digitaltelkom.id`; tokenisasi: `nama-depan` = kata pertama, `nama-belakang` = kata kedua nama lengkap (kata ke-3 dst diabaikan — `Rina Kusuma Wardani` → `rina.kusuma@…`); setiap pembuatan UPN **wajib cek daftar email** (anti-duplikat); bentrok dengan akun eksisting → sufiks angka di belakang nama belakang **mulai dari `1`** (mis. `rina.kusuma1@digitaltelkom.id`, `rina.kusuma2@…`) sampai unik; UPN dibangun dari nama (bukan input bebas)
- [ ] T032 [K5] Penonaktifan Entra saat terminasi (FR-46): hook resign/pensiun memanggil disable akun Entra yang dikelola + audit; akun lokal terkait tetap nonaktif mengikuti pola `SetStatus` eksisting
- [ ] T033 [K5] GraphQL `provisionEntraAccount(employeeId)` + query `employeesWithoutEntra` + status provisi pada `graph/schema.graphqls` + `make generate` + sinkron mirror kontrak (T015)
- [ ] T034 [K5] UI provisi: toggle auto-create Entra pada form `src/app/(app)/employees/new/page.tsx` (default aktif, dapat dimatikan per karyawan — FR-43) + halaman `src/app/(app)/entra/` daftar **"belum ada Entra"** dengan aksi provisioning manual/retry dan hasil terlihat (FR-44)
- [ ] T035 [K5] Test provisi (fake client): aturan domain & UPN + sufiks (`internal/usecase/entra_test.go`) — kasus tokenisasi (`Rina Kusuma Wardani` → `rina.kusuma`, nama tunggal), cek daftar email mencegah duplikat, loop sufiks `1`,`2`,… sampai unik; auto-create gagal → karyawan tetap tersimpan + tampil di daftar retry; sudah terlink → tidak diprovisi ulang; disable saat resign/pensiun tercatat audit; test RTL daftar "belum ada Entra" + toggle auto-create

**Checkpoint**: alur provisioning (invitation/create/gagal/reprovisi) dan disable-on-termination teruji via fake; verifikasi tenant uji menyusul setelah O4 tersedia.

## Phase K6 — Jejak audit (TAN-130, stage 4) — `tania-backend` + `tania-dashboard`

**Purpose**: FR-41 penuh (server + tampilan) setelah API siklus stabil. Prasyarat K2 (`recordChange` sudah mencatat); melengkapi panel riwayat K3.

- [ ] T036 [K6] Audit diperluas ke entitas `employment_contract` + seluruh aksi lifecycle (RENEW/RESIGN/MUTATE/RETIRE/END) pada `internal/usecase/contract.go` — semua lewat `recordChange` (before/after per kontrak & per karyawan dalam satu transaksi, FR-41)
- [ ] T037 [K6] Riwayat per record untuk Operation: query `auditLogs` filter `entityType` + `entityId`, dibatasi entitas karyawan/kontrak dalam cakupannya (pola historis per record IDP); jejak audit penuh tetap Admin-only; NIK pada audit selalu tersamar (FR-42)
- [ ] T038 [K6] Test cakupan audit (`internal/usecase/audit_test.go` + e2e): setiap jenis aksi siklus tercatat dengan aktor, waktu, aksi, nilai sebelum→sesudah; NIK tidak pernah plaintext di audit; Operation hanya melihat riwayat entitas miliknya

**Checkpoint**: FR-41 tertutup penuh (jejak + tampilan).

## Phase UAT — Penerimaan & regression (lintas gelombang)

**Purpose**: gerbang penerimaan amandemen 002 — checklist acceptance US9–US14 (plan §Testing).

- [ ] T039 Checklist manual seluruh acceptance scenario US9–US14 + regression lintas modul: perubahan kontrak → derivasi chapter/assignable (R3), angka dashboard, dan jejak audit tetap konsisten; kontrak habis tanpa perpanjangan → non-assignable + "perlu tindak lanjut" (US13/OQ-3); NIK masked di seluruh permukaan; kontrak lama tetap terbaca
- [ ] T040 Gerbang kualitas lintas repo: `make lint vet test` + `make test-integration` (backend) dan `npm run lint` + `npm run typecheck` + `vitest run` + `npm run generate` bersih (frontend); verifikasi end-to-end provisi Entra pada tenant uji setelah **O4** tersedia

---

## Dependencies & Execution Order

1. **K1 (stage 1)** — memblokir semua; migrasi & constraint harus lulus sebelum API
2. **K2 (stage 2)** — prasyarat K3, K4, K5 (API lifecycle); K5 backend (T029–T033) dapat dimulai setelah K1
3. **K3, K4, K5 (stage 3)** — paralel setelah K2 (sesuai stage barrier sub-issue)
4. **K6 (stage 4)** — setelah K2; menutup tampilan FR-41 yang dikonsumsi K3
5. **UAT** — gerbang akhir; verifikasi Entra end-to-end menunggu O4

## Notes

- Semua mutasi lifecycle memakai `recordChange` (persist + audit satu transaksi) — tidak ada aksi yang mengubah data tanpa jejak (FR-41)
- `employeeCode` dihapus dari SDL (R4): backend + frontend digabung gelombang berurutan (K2 sebelum K3); `make generate`/`npm run generate` wajib bersih
- NIK tidak pernah plaintext di mana pun (API, log, audit, URL) — masking 4 digit akhir; nilai penuh hanya lewat tampilan khusus berizin (FR-42)
- Provisioning Entra tidak pernah memblokir penyimpanan karyawan (R1); kegagalan tercatat + retry manual FR-44
- Otorisasi 100% di server: seluruh alur kontrak & siklus kerja milik **Operation**; audit penuh Admin (OQ-4); UI hanya menyembunyikan
- Commit per task atau kelompok logis; jalankan test sebelum commit
- Open items yang menggantung: **O2** (daftar final atribut TMS — konfirmasi pemilik produk sebelum K1), **O4** (kredensial Entra — sebelum verifikasi K5 end-to-end)
