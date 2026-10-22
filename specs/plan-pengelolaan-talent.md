# Implementation Plan: Pengelolaan Talent — Kontrak Kerja, Siklus Kerja & Provisi Akun Entra

**Branch**: `feat/pengelolaan-talent-specs` | **Date**: 2026-10-08 | **Spec**: `specs/spec-pengelolaan-talent.md` (TAN-98, FINAL 2026-10-07)

**Input**: Amandemen Spesifikasi 002 — Pengelolaan Talent (Data Diri, Kontrak Kerja, Siklus Kerja & Provisi Akun Entra) — `specs/spec-pengelolaan-talent.md`

**Perintah**: `/speckit.plan` — hasil untuk tiket TAN-141

**Repo**: fitur ini melintasi dua repo — `codex/backend/tania-backend` (pemilik data: skema, API siklus kerja, provisi Entra, jejak audit) dan `codex/frontend/tania-dashboard` (UI data diri/kontrak, alur siklus, dashboard Operation). Plan induk (`specs/001-employee-digital-talent-management/plan.md` di masing-masing repo) tetap menjadi sumber arsitektur; dokumen ini adalah **plan slice** yang memetakan amandemen 002 ke implementasi eksisting dan menutup gap-nya.

**Catatan keputusan turunan (2026-10-08, pemilik produk — setelah dokumen amandemen difinalisasi)**: `employee_code` **dihapus dari tabel `employees`** — tabel karyawan murni data diri. Identitas kepegawaian (employee ID / nomor induk karyawan) hanya disimpan di tabel kontrak (`employment_contracts.nomor_induk`, wajib per kontrak, unik antar kontrak aktif). Plan ini memakai keputusan terbaru ini; dokumen amandemen telah diselaraskan (§2.1–2.2, §4 FR-33/FR-34, §6 butir 8) dan direstorasi ke repo sebagai `specs/spec-pengelolaan-talent.md`.

---

## Summary

Pemisahan data diri karyawan dari data kepegawaian: tabel `employees` dipangkas menjadi data diri (termasuk **NIK** terenkripsi), seluruh identitas & penugasan kerja pindah ke tabel baru **`employment_contracts`** (atribut selaras TMS: email kantor, nomor induk, band_position, jobRole, jobTitle, jobLevel, work location, unit, periode). Di atasnya dibangun **siklus kerja** (US9–US13): CRUD kontrak, perpanjangan PKWT (termasuk perpindahan unit), resign, mutasi (kontrak lama berakhir + kontrak baru efektif tanggal mutasi), pensiun — plus turunan "kontrak habis tanpa perpanjangan" (non-assignable, status tetap `active`, daftar "perlu tindak lanjut"). Sumber kebenaran chapter/keter-assign-an berpindah ke `kontrak aktif → jobRole → chapter`. Ditutup dengan **provisi akun Microsoft Entra** (US14: provisioning manual dari menu Provisi Akun Entra tanpa auto-create saat create talent, UI daftar "belum ada Entra" dengan pencarian nama dan pengurutan, aturan domain `telkom.co.id` → invitation / lainnya → create account dengan UPN `nama-depan.nama-belakang@digitaltelkom.id`, penonaktifan saat terminasi).

Pendekatan teknis: **skema & API baru di atas infra eksisting** — tabel `employment_contracts` + perluasan `employees`, mutasi lifecycle yang memakai pola `recordChange` (persist + audit satu transaksi), derivasi status/assignability turunan tanggal (tanpa cron), dan integrasi Graph API Entra pasca-commit. Tidak ada dependensi runtime baru kecuali klien HTTP Graph API untuk Entra (justifikasi di bawah). Eksekusi mengikuti 6 sub-issue yang sudah dibuat di TAN-98 (TAN-127 → TAN-126 → TAN-128/TAN-129/TAN-131 → TAN-130).

---

## Technical Context

Stack dipin dari plan induk (konstitusi v1.1.0); **satu dependensi baru**: klien Microsoft Graph API untuk provisi Entra (K5, justifikasi: tidak mungkin memprovision akun tanpa klien HTTP terautentikasi; alternatif REST manual tanpa SDK sudah dievaluasi — lihat research §Entra).

| Aspek | Keputusan |
| --- | --- |
| Bahasa backend | Go 1.26, clean architecture (transport → usecase → domain → repository), gqlgen schema-first |
| Database | PostgreSQL 16 — migrasi forward-only embedded runner (`NNNN_name.sql`, terakhir `0004_seed.sql`) |
| Bahasa frontend | TypeScript 5, Next.js 16.3.4 (App Router), React 19, TailwindCSS 4 |
| Lapisan data frontend | Apollo Client + GraphQL codegen (`src/generated/graphql/`, sumber SDL `graph/schema.graphqls` disalin dari backend) |
| Enkripsi PII | AES-256-GCM application-level untuk NIK (`nik_enc`) + `nik_hash` untuk keunikan; key dari environment/secret store (konstitusi III) |
| Integrasi Entra | Microsoft Graph API (app registration, client credentials) — invitation vs create per domain; disable saat terminasi |
| Testing backend | `testing` + fake repository (unit usecase), Postgres nyata via `TEST_DATABASE_URL` (integrasi), e2e GraphQL di `internal/transport/httpapi` |
| Testing frontend | Vitest + React Testing Library + Apollo `MockedProvider` |
| Target performa | Daftar karyawan/kontrak tetap responsif hingga ±5.000 karyawan (pagination cursor, indeks "segera berakhir") |
| Constraints | Otorisasi 100% di server (Operation untuk seluruh alur; audit penuh Admin); tanpa PII di URL/log; NIK tak pernah plaintext; label UI berbahasa Indonesia |
| Scale/Scope | 1 tabel baru + 1 tabel dipangkas, ±12 operasi GraphQL baru/berubah, 2 modul frontend baru/diubah, 1 integrasi eksternal (Entra) |

---

## Kondisi Repositori (audit 2026-10-08)

### Backend (`tania-backend`, `master`)

- `employees` (`internal/platform/migrations/sql/0002_core_model.sql:70-85`): `id`, `user_id` (UNIQUE, 1:1 akun), `full_name`, `employee_code` (UNIQUE), `email` (citext UNIQUE), `unit_id`, `job_role_id`, `joined_at`, `status` (`ACTIVE`/`INACTIVE`). **Belum ada**: NIK, tanggal lahir, jenis kelamin, telepon, alamat, pendidikan terakhir/nama institusi/jurusan; belum ada tabel kontrak; status belum mengenal `RESIGNED`/`RETIRED`.
- Domain `internal/domain/employee.go:8-32`: `DeriveAssignable()` = `Status == ACTIVE && JobRole.Chapter != nil` — definisi tunggal yang dipakai semua read path; `UpdateEmployeeInput` membuat `employeeCode` tidak dapat diubah.
- GraphQL (`graph/schema.graphqls`): `Employee` (193-213), `CreateEmployeeInput` (227), `UpdateEmployeeInput` (237), mutasi `createEmployee`/`updateEmployee`/`deactivateEmployee(id, acknowledgeActiveWork)` (690-692), `assignableTalents` (624). **Tidak ada** tipe/mutasi kontrak kerja.
- Turunan chapter: `employee_chapter_scope` view (`0002_core_model.sql:88-91`, join `employees.job_role_id → job_roles`) ada di DB tapi read path memakai join kode (`internal/repository/postgres/employeerow.go:12-22`).
- Audit (FR-17): `domain.AuditRecorder.Record` + pola `recordChange` (`internal/usecase/authz.go:36-91`) — persist + insert `audit_logs` (partitioned, `0003_audit_partition.sql`) dalam satu transaksi; baca Admin-only (`internal/usecase/audit.go`). Entity `employee` sudah masuk cakupan; **belum ada** entity kontrak / aksi lifecycle.
- Akun: `users` punya kolom dorman `auth_provider`, `entra_object_id`, `saml_name_id` (`0002_core_model.sql:26-28`); deaktivasi akun sudah ada (`internal/usecase/account.go:161-210`, revoke refresh tokens + audit). **Kode Entra/SSO tidak ada sama sekali** — hanya kolom dorman.
- Test: fake repositori di `internal/usecase/fakes_test.go`, integrasi Postgres di `internal/repository/postgres/*_test.go`, e2e `internal/transport/httpapi/e2e_test.go`; `make test` / `make test-integration`.

### Frontend (`tania-dashboard`, `master`)

- Halaman karyawan: `src/app/(app)/employees/page.tsx` (daftar + filter search/status), `/employees/new` (form create), `/employees/[id]` (detail + kartu nonaktifkan; tab Ringkasan + Workload). **Tidak ada halaman ubah data** (`updateEmployee` ada di SDL & generated types, belum ada dokumen/hook/UI).
- Form create saat ini: `fullName`, `employeeCode`, `email`, `unitId`, `jobRoleId`, `joinedAt` — belum ada field data diri baru (NIK, ttl, gender, telepon, alamat, pendidikan terakhir/nama institusi/jurusan).
- Daftar: kolom Nama (+kode), Email, Unit, Job Role, Status; filter `unitId`/`jobRoleId`/`assignableOnly` di SDL belum tampil di UI; tanpa pagination UI (fetch 100).
- Dashboard Operation (`src/app/(app)/dashboard/page.tsx` + `src/features/dashboard/`): StatCards aktif/non-assignable/unit + "Karyawan per Unit" + "Perubahan Karyawan Terbaru" — **belum ada** widget kontrak segera berakhir / pra-pensiun.
- Jejak audit: halaman `/audit` (Admin-only, `src/features/audit/useAuditLogs.ts`) dengan cursor pagination; **belum ada** "riwayat perubahan per record" untuk Operation (pola historis per record baru ada di IDP: `src/app/(app)/idp/[id]/page.tsx:290,348`).
- Codegen: `codegen.ts` membaca `graph/schema.graphqls` lokal (saat ini byte-identik dengan `specs/001-employee-digital-talent-management/contracts/schema.graphql`); `npm run generate` wajib bersih.
- Entra: tidak ada paket/MSAL; login lokal saja (placeholder SSO di `src/app/(auth)/login/LoginForm.tsx`).

---

## Pemetaan Spec → Implementasi (Gap Analysis)

Hampir seluruh amandemen adalah **pekerjaan baru**; infra audit, derivasi assignable, dan deaktivasi akun menjadi fondasi yang dipakai ulang.

| Spec | Status | Bukti / Gap |
| --- | --- | --- |
| FR-33 data diri (+NIK, tanpa employee ID) | **Gap G1** | Kolom `nik`/`birth_date`/`gender`/`phone`/`address`/`latest_education`/`institution_name`/`major` belum ada; `employee_code` dihapus dari `employees` (keputusan 2026-10-08) → migrasi ke `employment_contracts.nomor_induk`; form & `CreateEmployeeInput` ikut berubah |
| FR-34 kontrak kerja terpisah (atribut TMS) | **Gap G2** | Tabel/tipe `employment_contracts` belum ada — greenfield: migrasi + domain + repository + GraphQL type/CRUD + UI daftar/form/detail |
| FR-35 turunan unit/posisi/chapter via kontrak aktif | **Gap G3** | Saat ini `employees.unit_id`/`job_role_id` kolom langsung; derivasi harus berpindah ke kontrak aktif (`DeriveAssignable` + `employee_chapter_scope` + filter `EmployeeFilter`) |
| FR-36 perpanjangan kontrak (+pindah unit) | **Gap G4** | Greenfield: `predecessor_contract_id`, anti-overlap server, UI wizard perpanjangan + daftar "segera berakhir" |
| FR-37 resign | **Gap G5** | `deactivateEmployee` hanya `ACTIVE`→`INACTIVE`; perlu aksi resign (akhiri kontrak `end_reason=resign`, status `RESIGNED`, nonaktifkan akun + Entra, peringatan dependensi — pola `acknowledgeActiveWork` sudah ada) |
| FR-38 mutasi (opsi B: akhiri + kontrak baru) | **Gap G6** | Greenfield: satu transaksi akhiri kontrak lama + buat kontrak baru efektif tanggal mutasi; turunan chapter/assignable mengikuti sejak tanggal efektif |
| FR-39 pensiun | **Gap G7** | Sama seperti resign dengan `end_reason=retirement`, status `RETIRED` |
| FR-40 dashboard H-90/H-30 + pra-pensiun | **Gap G8** | Widget belum ada; data turunan tanggal (indeks `end_date`), usia pensiun dari setelan Admin (default 56, keputusan 2026-10-10) berbasis `birth_date` |
| FR-41 jejak audit lifecycle + riwayat per record | **Partial** | `recordChange` siap dipakai; cakupan perlu entity `employment_contract` + aksi lifecycle (RENEW/RESIGN/MUTATE/RETIRE/END); UI riwayat per record untuk Operation belum ada (baca `auditLogs` filter `entityType`+`entityId`) |
| FR-42 enkripsi & masking NIK | **Gap G9** | Greenfield: `nik_hash` (unik) + `nik_enc`, masking 4 digit akhir di API (resolver) & UI untuk semua peran — nilai penuh tidak pernah diekspos (keputusan 2026-10-10), audit menyimpan NIK tersamar |
| FR-43 provisioning hanya dari menu Entra | **Gap G10** | Greenfield — form create tidak memicu provisioning; seluruh aksi ada di menu Provisi Akun Entra |
| FR-44 UI daftar "belum ada Entra" + provisioning manual | **Gap G11** | Greenfield — query status provisi + halaman khusus Operation |
| FR-45 aturan domain + UPN | **Gap G12** | `telkom.co.id` → invitation; selain itu → create account UPN `nama-depan.nama-belakang@digitaltelkom.id` (sufiks angka bila bentrok); hasil tercatat |
| FR-46 nonaktifkan Entra saat terminasi | **Gap G13** | Hook pada resign/pensiun — ganti `entra_object_id` (kolom dorman sudah ada) |
| US9-5 / skenario validasi (wajib, duplikat email/NIK/nomor induk) | **Gap G14** | Penolakan server sudah pola umum; pemetaan pesan per field di form belum ada (lihat juga gap form ubah frontend) |

**Kesimpulan**: backend mengerjakan G1–G7, G9–G13 (skema, API, lifecycle, Entra, audit); frontend mengerjakan G8, G11, G14 plus UI untuk G1/G2/G4–G7. Satu gap lintas: **form ubah data diri karyawan belum ada di UI** (operasi `updateEmployee` sudah dilayani) — termasuk scope K3.

---

## Desain Data & API

### Model data (ringkasan — detail DDL di `specs/001-employee-digital-talent-management/data-model.md` saat disinkronkan, O1)

**`employees` (dipangkas — murni data diri)**

| Kolom | Perubahan |
| --- | --- |
| `id`, `full_name`, `email` (unik), `joined_at`, `user_id` | tetap |
| `nik_hash`, `nik_enc` | **baru** — 16 digit; `nik_hash` untuk keunikan (tidak pernah plaintext), `nik_enc` AES-256-GCM |
| `birth_date`, `gender`, `phone`, `address` | **baru** — field data diri (wajib: `birth_date` untuk kalkulasi pra-pensiun; `gender` enum wajib `female`/`male` — keputusan 2026-10-10) |
| `latest_education`, `institution_name`, `major` | **baru** — field data diri (pendidikan terakhir, nama institusi, jurusan; opsional) |
| `status` | diperluas: `ACTIVE` / `RESIGNED` / `RETIRED` / `INACTIVE` |
| `employee_code`, `unit_id`, `job_role_id` | **dihapus** — identitas/penugasan pindah ke kontrak (keputusan 2026-10-08); kolom lama di-deprecate dua fase sesuai `docs/migrations.md` |

**`employment_contracts` (baru — atribut selaras TMS)**

`id`, `employee_id`, `contract_no` (unik), `contract_type` (`pkwt`/`pkwtt`), `office_email`, **`nomor_induk`** (wajib, unik antar kontrak aktif — `uq_employment_contracts_nomor_induk_active`), `band_position` (enum `I`–`VI`/`undefined` — keputusan 2026-10-10), `job_role_id` (Master Data Role), `job_title`, `job_level`, `work_location` (enum wajib `Jakarta`/`Bandung` — keputusan 2026-10-10), `unit_id` (Master Data Unit), `start_date`, `end_date` (NULL untuk PKWTT), `end_reason` (nullable, hanya pengakhiran dini: `resign`/`retirement`/`mutation`), `terminated_at`, `predecessor_contract_id` (nullable), `notes`, `created_by`, timestamps.

**Aturan indeks & turunan (keputusan teknis):**

- **D1 — status kontrak turunan, tanpa cron.** Kolom tersimpan hanya `terminated_at` + `end_reason` (untuk pengakhiran dini — `resign`/`retirement`/`mutation`; `expiry` tidak pernah dituliskan — alasan habis masa diturunkan dari status `ended`). Status efektif diturunkan saat query: `active` bila `start_date ≤ hari ini` dan (`end_date IS NULL` atau `end_date ≥ hari ini`) dan `terminated_at IS NULL`; `terminated` bila `terminated_at` terisi; selain itu `ended` (habis masa). Menutup FR-34 & AC TAN-127 "status berakhir otomatis diturunkan dari tanggal".
- **D2 — satu kontrak aktif per karyawan**: partial unique index (`WHERE status-aktif`) — race-safe, mengikuti pola FR-25; validasi server tetap ada untuk pesan yang ramah.
- **D3 — turunan aktif**: unit/posisi/jobRole/email kantor/lokasi aktif = nilai pada kontrak aktif. `assignable` = karyawan `ACTIVE` **dan** punya kontrak aktif **dan** `job_role.chapter_id IS NOT NULL`. Kontrak habis tanpa perpanjangan → otomatis non-assignable, status karyawan tetap `ACTIVE`, muncul di daftar "perlu tindak lanjut" (OQ-3).
- **D4 — migrasi dua fase** (konstitusi: perubahan destruktif dua fase): fase 1 tambah tabel/kolom + pindahkan data (`employee_code` eksisting → `nomor_induk` kontrak awal per karyawan; `unit_id`/`job_role_id` → kontrak awal; satu kontrak awal per karyawan yang punya data); fase 2 deprecate kolom lama setelah kode beralih. View `employee_chapter_scope` diubah join via kontrak aktif.
- **D5 — enkripsi NIK**: AES-256-GCM application-level (`internal/platform/secret` memperluas pola key management), `nik_hash` = SHA-256 ter-salted untuk keunikan; masking (4 digit akhir) dilakukan di layer resolver — model GraphQL tidak pernah membawa NIK plaintext; nilai penuh tidak diekspos ke peran mana pun (keputusan 2026-10-10).

### Kontrak GraphQL (delta atas `graph/schema.graphqls`)

- `Employee`: + `nikMasked`, + `latestEducation`/`institutionName`/`major`, + `nomorInduk` (turunan kontrak aktif), `unit`/`jobRole` berubah sumber (turunan kontrak aktif — bentuk field tetap), `status` enum diperluas, + `contracts(first, after)`; `employeeCode` **dihapus** (breaking — frontend disesuaikan pada gelombang yang sama).
- Tipe baru `EmploymentContract` (+ `EmploymentContractStatus`, `ContractType`, `EndReason`), input `CreateEmploymentContractInput`, `RenewContractInput`, `MutationInput` (mutasi), `ResignInput`/`RetireInput`.
- Mutasi baru: `createEmploymentContract`, `updateEmploymentContract` (field terbatas selama aktif), `renewEmploymentContract` (predecessor + anti-overlap + boleh ganti unit/posisi), `resignEmployee` (tanggal efektif + alasan + `acknowledgeActiveWork`), `recordEmployeeMutation` (unit/posisi baru + tanggal efektif → akhiri + kontrak baru satu transaksi), `retireEmployee`, `provisionEntraAccount(employeeId)`.
- Query baru: `employmentContracts(filter: unitId/jobRoleId/contractType/status/expiringBefore/search)`, `employeesNeedingFollowUp` (kontrak habis tanpa perpanjangan), `expiringContracts(days: 90)`, `employeesWithoutEntra`.
- Semua mutasi lifecycle memakai pola `recordChange` (before/after per kontrak & per karyawan dalam satu transaksi) — menutup FR-41; pesan penolakan (periode tumpang tindih, nomor induk duplikat, field wajib) konsisten `INVALID`/`CONFLICT` dan dipetakan per field di UI.

### Provisi Entra (FR-43–FR-46)

- **Alur**: form create **tidak** mengirim opsi provisioning; penyimpanan karyawan tidak memicu provisioning otomatis. Seluruh provisioning dijalankan Operation dari menu Provisi Akun Entra (FR-44), dan hasilnya (jenis aksi, status berhasil/gagal, UPN/object-id) dicatat + masuk audit. Kegagalan tampil di daftar FR-44 untuk retry manual; daftar dapat dicari berdasarkan nama dan diurutkan pada seluruh kolom data.
- **Aturan**: domain email data diri `telkom.co.id` → **invitation**; selain itu → **create account** dengan UPN `nama-depan.nama-belakang@digitaltelkom.id` (titik; `nama-depan` = kata pertama, `nama-belakang` = kata kedua nama lengkap — kata ke-3 dst diabaikan, mis. `Rina Kusuma Wardani` → `rina.kusuma@…`); partikel (`bin`, `binti`, `van`, `de`, `al`) tidak dihitung sebagai kata (`Muhammad bin Abdullah` → `muhammad.abdullah@…`); nama satu kata tanpa titik (`Sukarno` → `sukarno@…`); setiap kandidat UPN wajib dicek terhadap daftar email yang ada (anti-duplikat); bentrok → angka mulai dari `1` di belakang bagian akhir UPN (`rina.kusuma1`, `sukarno1`, …) sampai unik. Karyawan yang sudah terlink `entra_object_id` tidak diprovisi ulang.
- **Terminasi**: resign/pensiun memanggil penonaktifan akun Entra yang dikelola (`FR-46`) + audit; akun lokal terkait tetap nonaktif seperti pola `SetStatus` eksisting.
- **Konfigurasi**: tenant ID, client ID, client secret lewat environment/secret store (konstitusi III — tidak pernah di-commit); klien Graph API modular (`internal/platform/entra/`) agar lifecycle tetap teruji via fake tanpa jaringan.

---

## Constitution Check

*GATE: harus lulus sebelum fase eksekusi; dievaluasi ulang setelah desain rinci.*

| Prinsip (konstitusi v1.2.0) | Pemeriksaan | Status |
| --- | --- | --- |
| I. Lawful basis & purpose limitation | Pemrosesan NIK/KTP punya tujuan eksplisit (identitas kepegawaian & kepatuhan) yang terdokumentasi di amandemen §2; field baru diklasifikasi (NIK = data spesifik) di data-model | **Lulus** |
| II. Data minimization & klasifikasi | `employees` justru dipangkas; NIK masked di API/UI; tanpa PII di URL/log (akses via `id`) | **Lulus** |
| III. Security by design | NIK terenkripsi at-rest (D5); RBAC Operation untuk alur — ditegakkan server (`RequireRole`, `ChapterScope`); secret Entra via secret store. `audit_logs` + permukaan audit penuh tetap Admin-only; riwayat per record untuk Operation = proyeksi turunan bertopeng & terbatas cakupan, diizinkan eksplisit oleh pin konstitusi v1.2.0 (amandemen MINOR 2026-10-10) | **Lulus** |
| IV. Data subject rights & retention | Penghapusan tetap semantik "tanpa hard delete" (keputusan disetujui); riwayat kontrak/audit retained append-only; retensi dataset `employees`/`employment_contracts` **5 tahun** setelah resign/pensiun → data pribadi dianonimkan (keputusan 2026-10-09) oleh job berjadwal (T041, K6) | **Lulus** |
| V. Smallest change | Hanya menutup FR-33–FR-46 + dampak turunannya; master data `work_location` tidak dibuat (keputusan); tanpa notifikasi email (out of scope) | **Lulus** |
| VI. Quality by machines | `make lint vet test` (backend), `npm run lint typecheck test` (frontend), `make generate`/`npm run generate` idempoten di CI | **Lulus** |
| VII. Testing non-negotiable | Unit usecase (fake) untuk semua aturan lifecycle + constraint migrasi + test kontrak GraphQL + RTL per layar + e2e jalur siklus | **Lulus** |
| VIII. Boundaries & dependency hygiene | Layering transport → usecase → domain → repository dipertahankan; satu dependensi baru (klien Graph API) diisolasi di `internal/platform/entra/` dengan alasan terdokumentasi di MR | **Lulus** |
| IX. Fail visibly, log safely | Gagal provisioning Entra tidak ditelan — status + audit + daftar retry; pesan validasi eksplisit per field | **Lulus** |

**Complexity Tracking**: tidak ada pelanggaran yang perlu dijustifikasi.

---

## Project Structure

### Documentation (fitur ini)

```text
tania-backend/specs/
├── spec-pengelolaan-talent.md               # amandemen spesifikasi 002 (TAN-98) — restorasi TAN-141
├── plan-pengelolaan-talent.md               # dokumen ini (plan slice amandemen 002)
└── 001-employee-digital-talent-management/
    ├── spec.md, data-model.md, diagrams/erd.mmd   # disinkronkan oleh sub-issue terkait (O1)
    └── contracts/schema.graphql                   # disinkronkan dengan graph/schema.graphqls
```

### Source Code (delta yang diubah plan ini)

```text
tania-backend/
├── internal/platform/migrations/sql/
│   └── 0005_employment_contracts.sql          # tabel kontrak + kolom data diri + indeks + migrasi data dua fase
├── internal/domain/
│   ├── employee.go                            # field data diri, status RESIGNED/RETIRED, derivasi via kontrak
│   └── contract.go                            # EmploymentContract + enum + aturan turunan (D1-D3)
├── internal/usecase/
│   ├── contract.go                            # CRUD + perpanjangan + mutasi + resign + pensiun (recordChange)
│   ├── employee.go                            # create/update data diri + NIK, snapshot audit
│   └── entra.go                               # orkestrasi provisi (auto/manual/terminasi) — mockable
├── internal/repository/postgres/
│   ├── contract.go, contractrow.go            # query kontrak + anti-overlap + "segera berakhir" + "perlu tindak lanjut"
│   └── employee.go, employeerow.go            # join turunan kontrak aktif, masking NIK di boundary
├── internal/platform/entra/                   # klien Microsoft Graph (invitation/create/disable) + fake
├── graph/schema.graphqls + generated.go       # tipe/mutasi/query baru (make generate)
└── internal/transport/httpapi/…_test.go       # e2e lifecycle + provisi Entra (fake)

tania-dashboard/
├── src/app/(app)/employees/
│   ├── page.tsx                               # + filter unit/posisi/status & pencarian nomor induk, kolom data diri (NIK masked)
│   ├── new/page.tsx                           # form data diri baru (tanpa toggle auto-create Entra)
│   ├── [id]/page.tsx                          # detail: data diri + riwayat kontrak + riwayat perubahan
│   └── [id]/edit/page.tsx                     # form ubah data diri (gap form ubah — K3)
├── src/app/(app)/contracts/                   # daftar/form/detail kontrak + wizard perpanjangan
├── src/app/(app)/contracts/[id]/              # detail kontrak + aksi perpanjangan/mutasi/resign/pensiun
├── src/app/(app)/entra/                       # daftar "belum ada Entra" + provisioning manual (FR-44)
├── src/features/employees/, contracts/, entra/# operasi .graphql + hooks + test
├── src/features/dashboard/                    # + widget kontrak segera berakhir (H-90/H-30) & pra-pensiun
└── src/generated/graphql/                     # hasil npm run generate (jangan diedit manual)
```

**Structure Decision**: modul kontrak mengikuti pola modul `assignments` yang sudah ada (feature folder + operasi `.graphql` + hooks); aksi siklus kerja diletakkan di halaman detail kontrak (satu pintu untuk perpanjangan/mutasi/resign/pensiun) karena semuanya memutuskan kontrak aktif yang sama; UI daftar "belum ada Entra" berdiri sendiri sesuai FR-44.

---

## Security (rekap slice)

- **NIK (data spesifik)**: terenkripsi at-rest (`nik_enc`), keunikan via `nik_hash`, tampil tersamar 4 digit akhir untuk **semua peran** — nilai penuh tidak pernah ditampilkan (keputusan 2026-10-10); audit menyimpan bentuk tersamar — tidak pernah plaintext (FR-42).
- **RBAC**: seluruh alur kontrak & siklus kerja milik **Operation** (OQ-4); Talent/Chapter tidak punya akses tulis; baca lintas cakupan tetap `ErrNotFound` (pola `CanAccessEmployee`); jejak audit penuh Admin — riwayat per record untuk Operation hanya untuk entitas karyawan/kontrak miliknya (pin konstitusi v1.2.0).
- **Entra**: client secret dari secret store; UPN dibangun dari nama (bukan input bebas) untuk mencegah injection identitas; penonaktifan akun saat terminasi (FR-46) mencegah akses liar pasca-resign; hasil provisioning dicatat tanpa menyimpan kredensial.
- **Input validation**: semua input eksternal divalidasi di usecase (tanggal, enum, 16 digit NIK, format email); frontend hanya untuk UX.

---

## Testing

| Level | Cakupan | Alat |
| --- | --- | --- |
| Backend — unit usecase | Aturan kontrak: satu aktif per karyawan, anti-overlap, nomor induk unik aktif, perpanjangan (predecessor, boleh pindah unit), resign/mutasi/pensiun (end_reason + status + nonaktifkan akun), kontrak habis → non-assignable + "perlu tindak lanjut"; audit `recordChange` pada tiap aksi; aturan UPN & domain Entra (fake client) | `go test ./internal/usecase/...` (fake repositori, `now` injeksi) |
| Backend — migrasi & repository | Migrasi bersih di DB kosong & data eksisting (employee_code → nomor_induk, unit/posisi → kontrak awal); partial unique index menolak kontrak aktif kedua & nomor induk ganda; `nik_hash` unik; derivasi query kontrak aktif | `go test ./internal/repository/postgres/...` + `TEST_DATABASE_URL` |
| Backend — kontrak & e2e | SDL memuat tipe/mutasi baru; alur GraphQL lengkap: create karyawan (+Entra fake) → kontrak → perpanjangan → mutasi → resign/pensiun; pesan validasi per kasus | `make generate` + `internal/transport/httpapi/e2e_test.go` |
| Frontend — unit/komponen | Form data diri (validasi wajib/duplikat + NIK masked + toggle Entra), form/kontrak & wizard perpanjangan (termasuk pindah unit), aksi resign/mutasi/pensiun (+peringatan dependensi), daftar "belum ada Entra", widget dashboard H-90/H-30 | Vitest + RTL + `MockedProvider` (pola `employees/new/page.test.tsx`) |
| Kontrak | Operasi baru cocok dengan SDL ter-generate | codegen + CI `npm run generate` bersih |
| UAT & regression | Checklist acceptance US9–US14; regression: perubahan kontrak → derivasi chapter/assignable, dashboard, dan audit tetap konsisten | Manual checklist + Playwright harness induk |

---

## Roadmap (gelombang eksekusi — sesuai 6 sub-issue TAN-98)

| Gelombang | Pekerjaan | Sub-issue | Menutup |
| --- | --- | --- | --- |
| **K1 — Skema & migrasi** | Migrasi `employment_contracts` + kolom data diri (NIK hash/enc), enum status, indeks (satu aktif, nomor induk unik), view turunan, migrasi dua fase employee_code → nomor_induk; sinkron `data-model.md`/ERD | **TAN-127** (stage 1) | G1–G3 (bagian data), D1–D5 |
| **K2 — API kontrak & siklus kerja** | GraphQL CRUD kontrak, perpanjangan, resign, mutasi, pensiun, "perlu tindak lanjut"; derivasi assignability; audit tiap aksi; hook nonaktif-akun untuk Entra | **TAN-126** (stage 2) | G2, G4–G7, FR-41 (server) |
| **K3 — UI data diri & kontrak** | Form data diri (+NIK masked, tanpa employee ID), form ubah data diri (gap), daftar/filter karyawan, daftar/form/detail kontrak, riwayat kontrak & riwayat perubahan per record | **TAN-128** (stage 3) | G1, G2, G14 (UI), bagian FR-41 (UI) |
| **K4 — UI alur siklus & dashboard** | Wizard perpanjangan (+pindah unit), aksi resign/mutasi/pensiun + peringatan dependensi, widget "segera berakhir" (H-90/H-30) & pra-pensiun (usia dari setelan Admin, default 56) | **TAN-129** (stage 3) | G4–G8 (UI) |
| **K5 — Provisi Entra** | Klien Graph API (invitation vs create per domain, UPN + sufiks), UI daftar "belum ada Entra" + pencarian/pengurutan + retry, penonaktifan saat terminasi | **TAN-131** (stage 3) | G10–G13 |
| **K6 — Jejak audit** | Audit diperluas ke entitas kontrak + aksi lifecycle; tampilan riwayat per record untuk Operation (baca `auditLogs` per entitas); job anonimisasi retensi 5 tahun (T041) | **TAN-130** (stage 4) | FR-41 (tampilan) |

K1 menjadi prasyarat K2; K2 menjadi prasyarat K3–K5 (kontrak API); K6 menyusul namun dependensi skemanya sudah ikut K1. K3, K4, dan K5 dapat berjalan paralel setelah K2.

---

## Open Items

| # | Item | Dampak | Rencana |
| --- | --- | --- | --- |
| O1 | **Commit finalisasi TAN-98 tidak ditemukan di repo** — `c3d3498`, `74650e2`, `27d489c`, `8cdf9a5`, `166352f` (update `spec.md`, `data-model.md`, `diagrams/erd.mmd`, `contracts/schema.graphql`, dan dokumen amandemen) tidak ada di branch mana pun `tania-backend` maupun `tania-dashboard` per 2026-10-08 | Referensi spec di sub-issue sempat mengarah ke berkas yang absen dari repo | **Selesai sebagian 2026-10-08 (TAN-141)** — dokumen amandemen direstorasi dari lampiran TAN-98 + sinkronisasi keputusan `employee_code`→`nomor_induk` sebagai `specs/spec-pengelolaan-talent.md`. Menyusul: sinkronisasi `spec.md`/`data-model.md`/ERD 001 oleh sub-issue terkait (K1) |
| O2 | Kelengkapan atribut TMS | Skema kontrak bisa kurang kolom bila TMS punya atribut lain | Amandemen §2.2 mengundang pemilik produk melengkapi sebelum implementasi K1 — konfirmasi daftar final atribut TMS |
| O3 | Mirror plan ke `tania-dashboard` | Konsistensi antar repo (plan induk 001 ada di kedua repo) | Ikuti pola TAN-133 (mirror saat diminta pemilik produk); plan ini tetap satu dokumen di repo backend (rumah amandemen, TAN-127) |
| O4 | Kredensial Entra (tenant/app registration) | K5 tidak dapat diverifikasi end-to-end tanpa tenant uji | Disediakan pemilik/platform via secret store sebelum K5; pengembangan memakai fake client |

---

## Risks

| # | Risiko | Dampak | Tindakan |
| --- | --- | --- | --- |
| R1 | Integrasi Entra (Graph API) bergantung eksternal — throttling/kegagalan | Provisioning gagal untuk sebagian talent | Provisioning pasca-commit best-effort + status gagal tercatat + retry manual FR-44; tidak pernah memblokir penyimpanan karyawan |
| R2 | Migrasi dua fase data eksisting (employee_code/unit/posisi → kontrak awal) | Data historis salah bila asumsi kontrak awal meleset | Migrasi dikunci lewat test DB eksisting (K1); satu kontrak awal per karyawan dengan periode `joined_at → NULL`; hasil dicatat untuk verifikasi Operation |
| R3 | Semantik status turunan (D1) memengaruhi semua read path (`assignable`, filter, dashboard) | Regresi kandidat talent / chapter scope | Definisi `DeriveAssignable` tetap tunggal di domain; test matrix derivasi (kontrak habis, Role tanpa chapter, resign) di K1/K2 |
| R4 | Perubahan kontrak GraphQL (`employeeCode` dihapus, `unit`/`jobRole` menjadi turunan) bersifat breaking bagi klien | Codegen/frontend gagal build | Backend + frontend digabung dalam gelombang berurutan (K2 sebelum K3); `npm run generate` wajib bersih di CI sebelum merge |
| R5 | Ambiguitas "kontrak habis tanpa perpanjangan" (status karyawan tetap `active`) | Karyawan lama tidak tertindak | Sesuai OQ-3: daftar "perlu tindak lanjut" (query `employeesNeedingFollowUp`) + widget dashboard — aksi eksplisit Operation, tercatat log |
