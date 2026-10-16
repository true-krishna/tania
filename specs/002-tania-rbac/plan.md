# Implementation Plan — RBAC Tania (Kontrol Akses Berbasis Peran)

**Feature Branch**: `002-tania-rbac` | **Date**: 2026-10-11 (revisi 2026-10-15, **revisi
2026-10-16**) | **Spec**:
`specs/002-tania-rbac/spec.md` + `specs/001-employee-digital-talent-management/spec.md`
(clarify 12, amandemen 2026-10-10; **clarify 4 — Admin kelola penuh**, amandemen 2026-10-15;
**clarify 5–9 — cakupan, Master Data, dan aktivasi IDP & evaluasi**, amandemen 2026-10-16)

**Input**: Spesifikasi RBAC dari `/speckit.specify` + `/speckit.clarify` (TAN-144),
diperintahkan lewat `/speckit.plan` (TAN-156); diperbarui lewat `/speckit.plan` lanjutan
(TAN-212) untuk amandemen **clarify 4** (Admin = kelola penuh, §14), lalu **clarify 5–8**
(§14.5–§14.9) dan **clarify 9 — aktivasi IDP & evaluasi** (§14.11), yang dikonfirmasi
pemilik produk lewat `/speckit.plan` pada 2026-10-16; badan plan (§1–§13) diselaraskan
dengan keputusan itu.

**Repos**: `codex/backend/tania-backend` + `codex/frontend/tania-dashboard` — plan ini
mencakup kedua repo (RBAC adalah perubahan lintas-repo yang kecil dan menyatu; pola
pendahulunya ada di `specs/001-employee-digital-talent-management/plan.md` Tania
Foundation). Spec `002-tania-rbac` di-mirror byte-identik ke kedua repo mengikuti
praktik TAN-141; plan.md ini mengikuti pola yang sama.

> **Pendekatan**: sama seperti plan Tania Foundation — fondasi (auth, akun, chapter-scope,
> audit) **sudah terbangun**; plan ini adalah **delta penegakan** (enforcement) untuk
> menyelaraskan sistem dengan satu matriks hak, bukan membangun modul baru.

---

## 1. Ringkasan & Ruang Lingkup Teknis

RBAC Tania mengunci **satu matriks hak — 12 modul × 4 peran (Admin, Operation, Chapter,
Talent)** — sebagai **satu-satunya definisi otorisasi sistem** (FR-03, deny-by-default).
Spesifikasi + 12 ronde klarifikasi (final 2026-10-10, IdP = Entra Microsoft) mengunci tiga
keputusan bentuk yang memandu plan ini:

1. **Matriks = SoT**: keputusan akses hanya boleh merujuk matriks; modul/pembaruan baru
   wajib menambah baris matriks sebelum bisa diakses siapa pun (FR-03).
2. **Penundaan ≠ penghapusan** (keputusan 2026-10-08; **modulnya diaktifkan 2026-10-16,
   clarify 9 — §14.11**): modul IDP & Evaluation pernah ditunda dengan kode yang sudah
   terimplementasi di backend **tidak dihapus** — cukup "ditutup pintunya" (deny semua
   peran, termasuk Admin) dan menu/route-nya disembunyikan. ~~Selama ditunda, template &
   periode evaluasi (baris bertanda \*) ikut ditutup.~~ **Sejak aktivasi 2026-10-16**
   baris matriks (clarify 5–7) berlaku penuh dengan gate **per operasi**, entri menu
   tampil untuk semua peran dengan akses berbeda, dan mekanisme `ErrModuleUnavailable`
   dipertahankan **dorman** untuk penundaan berikutnya.
3. **Reuse fondasi yang ada**: penegakan memakai primitif yang sudah ada — `RequireRole`,
   `ChapterScope`/`CanAccessEmployee`, audit sinkron in-transaction, rate limiter,
   revokasi sesi — delta-nya hanya penyelarasan baris matriks, bukan konvensi kedua.

**Keluaran utama plan ini** (delta di atas kode existing):

- **Admin kelola penuh (clarify 4, 2026-10-15 — §14)**: Admin berwenang penuh pada
  seluruh modul aktif, termasuk Assignment, Kontrak, Data karyawan, CV, dan Provisi
  Entra. Baris matriks Admin berubah (Assignment/CV: `—` → `kelola`; Data karyawan &
  kontrak: `lihat semua` → `kelola`) dan gate backend/FE diselaraskan.
- Menyelaraskan baca Assignment untuk Operation: Operation ✔ read-only "lihat semua"
  (sebelumnya ditolak di kode); mutasi tetap untuk peran berwenang (Chapter dalam
  cakupan, Admin).
- ~~Menutup modul IDP & Evaluation (query + mutation, semua peran) dengan pesan FORBIDDEN
  yang jelas ("modul ditunda"), bukan menghapus kode.~~ → **Aktivasi (clarify 9, §14.11)**:
  IDP & Evaluation **dibuka sesuai matriks** lewat gate per operasi (bukan gerbang modul);
  kode dan field SDL-nya tetap utuh (T040 dibatalkan).
- Menegakkan **kebaruan data akun per request** (FR-17): perubahan peran/status berlaku
  untuk operasi berikutnya, bukan setelah refresh token (gap nyata — §3.1).
- Menambah **perlindungan Admin terakhir** (US2): menonaktifkan / mengubah peran
  satu-satunya akun Admin aktif → ditolak.
- Menyelaraskan frontend: matriks per-modul sebagai satu sumber gating UI, perbaiki
  dashboard per peran, perbaiki halaman Assignment, dan (clarify 4) buka seluruh menu
  aktif untuk Admin.

**Ruang lingkup keluar** (tetap di luar): login SSO Entra (Entra hanya untuk provisi
akun — workstream pengelolaan talent, TAN-140/TAN-145), perubahan kata sandi mandiri,
MFA, delegasi Admin, modul WAD (`/activities`, `/workload` — belum ada di matriks;
lihat R2), kontrak kerja & siklus kerja (workstream terpisah).

## 2. Technical Context

Stack **tidak berubah** — identik dengan yang di-pin konstitusi v1.1.0 (Additional
Constraints — backend stack) dan plan Foundation §2:

- **Backend**: Go, clean architecture (transport → usecase → domain ← repository),
  PostgreSQL/pgx, gqlgen schema-first (SDL `graph/schema.graphqls` = SoT), Redis
  (rate-limit + denylist token), JWT HS256 + refresh rotation, migrasi forward-only
  embedded, Docker Compose.
- **Frontend**: Next.js + React + TypeScript, Tailwind, Apollo Client (cookie-backed
  synchronous session store, refresh rotasi), Vitest + Testing Library, Playwright.
- **Dependensi baru: tidak ada.** Semua perubahan adalah penegakan di lapisan yang sudah
  ada. Satu sentinel error domain baru (`ErrModuleUnavailable`) + satu modul gating
  frontend (`src/lib/auth/matrix.ts`) — bukan dependensi.

## 3. Temuan Inspeksi Repositori (wajib: reuse, bukan bikin konvensi kedua)

### 3.1 `tania-backend` (`gitlab.playcourt.id/codex/backend/tania-backend`)

Yang **sudah ada** dan di-reuse (semua terverifikasi di kode `master`):

| Primitif | Lokasi | Kondisi |
| --- | --- | --- |
| JWT HS256 + claim peran | `internal/auth/token.go` | Access TTL 15 menit (`JWT_ACCESS_TTL`), refresh 7 hari (`JWT_REFRESH_TTL`); `Claims` memuat role |
| Login/Refresh/Logout | `internal/usecase/auth.go` | Pesan login generik (anti-enumerasi, hanya akun `active`), refresh **rotasi + deteksi reuse** (reuse → cabut semua sesi + audit), logout → denylist jti |
| Layanan akun | `internal/usecase/account.go` | Admin-only: List/Create/UpdateRole/SetStatus/RevokeSessions; deaktivasi karyawan → kaskade akun nonaktif; audit `recordChange` dalam transaksi; snapshot audit `userSnapshot`/`roleSnapshot` **tanpa password** |
| Gate peran | `internal/usecase/authz.go` | `RequireRole` di lapisan usecase (bukan resolver) — sesuai FR-14 |
| Cakupan chapter | `internal/usecase/scope.go` | `ChapterScope` (user → karyawan → jobRole → chapter; scope tak terdefinisi → ditolak), `CanAccessEmployee`; baca di luar cakupan → `ErrNotFound` (anti-enumerasi) |
| Middleware authN | `internal/transport/httpapi/middleware.go` | `authenticate`: verifikasi JWT + cek denylist per request → `graph.WithIdentity` |
| Rate limit login | Redis (config `LOGIN_RATE_MAX=10`, window 15 menit, per sumber) | Sesuai FR-13 |
| Bootstrap Admin | `cmd/bootstrap-admin` | Akun Admin awal (frasa sandi ≥12) |
| Migrasi | `internal/platform/migrations` (0001–0004, forward-only embedded) | `users`, `refresh_tokens`, master data, `employees` (job_role **langsung**, pra-kontrak), assignments, idps, evaluations, cv, `audit_logs` |
| Dashboard per peran | `internal/usecase/dashboard.go` + `graph/schema.graphqls` (union `Dashboard`) | `AdminDashboard`/`OperationDashboard`/`ChapterDashboard`/`TalentDashboard` |
| Baca audit | `internal/usecase/audit.go` | Admin-only |

**Gap terhadap matriks** (delta yang dikerjakan plan ini):

| # | Gap | Bukti di kode | Aksi |
| --- | --- | --- | --- |
| G1 | **Kebaruan per request belum ada**: identitas (peran) hanya dari klaim JWT — middleware tidak membaca ulang baris akun; perubahan peran/status baru berlaku setelah refresh (≤15 menit), akun nonaktif masih bisa beroperasi sampai access token kadaluarsa | `middleware.go:140-170` — hanya `verifier.Parse` + denylist | Middleware membaca ulang akun (status + peran) per request via sub (R1.3) |
| G2 | **Gate Assignment belum sesuai matriks**: Operation ditolak padahal berhak "lihat semua" read-only; Admin belum diberi kelola penuh (clarify 4) | `internal/usecase/assignment.go` | Operation baca semua (read-only); Admin kelola penuh; mutasi Chapter dalam cakupan (R1.1/R6.2) |
| G3 | **IDP & Evaluation belum sesuai matriks** — modul ditunda sehingga semua peran ditolak, padahal matriks (clarify 5–7) sudah memetakan aksesnya | `internal/usecase/idp.go`, `evaluation.go` | ~~Gerbang modul: deny semua peran (R1.2)~~ → **Aktivasi (klarifikasi 9, §14.11)**: `deferredModules` dikosongkan; gate **per operasi** mengikuti matriks (R1.2/R7.3) |
| G4 | **Widget dashboard IDP/eval** masih ada di `ChapterDashboard`/`TalentDashboard` | `graph/schema.graphqls:580-594` | FE berhenti mem-query (T035, selesai); ~~hapus field SDL — dua fase (R3.1)~~ → **field dipertahankan** karena modulnya aktif (T040 dibatalkan, klarifikasi 9) |
| G5 | **Admin terakhir belum dilindungi**: tidak ada guard "satu-satunya Admin aktif" pada SetStatus/UpdateRole | `internal/usecase/account.go` | Guard dalam transaksi yang sama (R1.4) |
| G6 | Riwayat assignment pada detail karyawan untuk Admin | `AssignmentService.ForEmployee` dipakai FE detail karyawan | Admin boleh melihat (kelola penuh, clarify 4) — gate `ForEmployee` + Admin |
| G7 | **Cakupan tidak terdefinisi belum punya pesan khusus**: `ChapterScope` menolak dengan `ErrForbidden` generik — FR-20/US4-5 menuntut "penjelasan bahwa cakupan tidak terdefinisi" (berbeda dari anti-enumerasi FR-16) | `internal/usecase/scope.go:15-31` | Sentinel `ErrScopeUndefined` → FORBIDDEN + pesan khusus + test US4-5 (R1.5) |

Yang **sudah selaras matriks** (tidak diubah kecuali penambahan Admin dari clarify 4):
master data baca semua peran / kelola Admin; `Employee.List` Admin+Operation (Chapter
ditolak — daftar seluruh karyawan bukan modul Chapter); `Employee.Get` via
`CanAccessEmployee`; CV Talent kelola-milik / Chapter baca-cakupan read-only; akun &
audit Admin-only; kaskade deaktivasi karyawan → akun. Clarify 4 menambahkan **Admin**
ke gate kelola modul-modul ini (§14).

### 3.2 `tania-dashboard` (`gitlab.playcourt.id/codex/frontend/tania-dashboard`)

- `src/components/Sidebar/nav.ts` — **sumber kebenaran menu** dengan array peran eksplisit.
  Catatan 2026-10-15: sejak TAN-178 nav **tidak lagi membaca `MODULE_ROLES`** dan
  dikembalikan ke baseline desain, sehingga `nav.ts` dan `matrix.ts` bisa berbeda — R6
  menyelaraskannya. Target clarify 4: Admin tampil di semua menu aktif (termasuk Provisi
  Entra & CV); `assignments` = `["CHAPTER","OPERATION","TALENT","ADMIN"]`;
  `employees`/`contracts` + Admin (kelola penuh); ~~entri `idp` & `evaluations`
  disembunyikan untuk semua peran selagi ditunda (keputusan 2026-10-15, §14.3)~~ →
  **sejak aktivasi (klarifikasi 9, §14.11)** keduanya tampil untuk semua peran dengan
  akses berbeda (IDP satu entri, konten per peran; grup Evaluations: Roster
  Admin/Operation/Chapter, Periode & Template Admin, Evaluasi Saya Talent);
  `master-data` tampil untuk Chapter/Operation/Admin dengan permukaan kelola hanya Admin —
  **O6 ditutup 2026-10-15** (§14.3), dipersempit clarify 5/6 (§14.5–§14.6).
  Klaim "sudah sesuai" sebelumnya dicabut (N2).
- `src/lib/auth/roles.ts` + `guard.tsx` — gating route memakai hierarki `atLeast()`
  (TALENT<CHAPTER<OPERATION<ADMIN) yang **menyimpang dari matriks** (menganggap Admin
  dapat semuanya). Perlu set peran eksplisit per modul (G5/R2.1) — **selesai (R6.1)**:
  semua gating modul memakai `src/lib/auth/matrix.ts`.
- Route `/idp`, `/evaluations/*` ada — ~~dijaga nonaktif untuk semua peran (kode fitur
  tetap, tidak dihapus — keputusan bentuk #2)~~ → **aktif sejak klarifikasi 9**: rute
  dibuka, penjagaan per operasi mengikuti matriks (§14.11).
- Query dashboard (`DashboardQuery`) ~~masih meminta field IDP/eval — dipangkas~~ →
  **sudah dipangkas (T035)**: FE berhenti mem-query field IDP/eval, dan field SDL-nya
  tetap karena modul aktif (T040 dibatalkan, klarifikasi 9).
- Halaman Assignment memakai query baca yang sama untuk semua peran — Operation butuh
  tampilan read-only (aksi disembunyikan).
- `token-store.ts` cookie-backed sinkron + `refresh.ts` rotasi — **tidak diubah**.
- Mode dev `localOnly` (authConfig) — dipertahankan untuk pengembangan lokal.
- `e2e/` + `playwright.config.ts` + suite Vitest/RTL ada — di-reuse untuk regresi RBAC.

### 3.3 Status artefak spesifikasi

`specs/002-tania-rbac/spec.md` (+ checklist) dan amandemen 001 (clarify 12) baru ada di
branch **belum ter-merge** `agent/cobra/9e2ad56b14ef` (kedua repo). Plan ini ditulis di
branch kerja `agent/cobra/0e4c8dfd6395` dan **R0 (§9) mewajibkan merge spec branch lebih
dulu** agar folder `specs/002-tania-rbac/` utuh (spec + plan) di kedua repo.

## 4. Architecture Diagram

### 4.1 Alur penegakan RBAC (read & write)

```mermaid
flowchart TD
    title="Alur penegakan RBAC per request"
    A[Request GraphQL + Bearer token] --> B{Middleware authN<br/>transport/httpapi}
    B -->|token invalid| X1[401 Unauthorized]
    B --> C{jti di denylist? Redis}
    C -->|revoked| X1
    C -->|OK| D["BARU: baca ulang akun by sub<br/>status + peran terkini"]
    D -->|status != active| X1
    D --> E["Identity = peran TERKINI<br/>(bukan klaim JWT)"]
    E --> F{Gate usecase}
    F -->|"RequireRole: modul tidak diberikan<br/>(mis. Operation mengelola akun)"| X2[403 FORBIDDEN + pesan jelas]
    F -->|"Gerbang modul: penundaan (dorman;<br/>sejak 2026-10-16 modul aktif)"| X2
    F -->|"Gate per operasi modul IDP/Evaluasi<br/>(klarifikasi 5–7, §14.11)"| X2
    F -->|"ChapterScope: data di luar cakupan"| X3[404 NOT_FOUND anti-enumerasi]
    F -->|OK| G[Resolver → Repository]
    G --> H["Audit sinkron in-transaction<br/>(mutasi akun & perubahan data)"]
```

### 4.2 Siklus sesi & efek perubahan peran

```mermaid
sequenceDiagram
    title="Sesi: login, refresh rotasi, dan kebaruan peran (FR-17)"
    participant U as Pengguna
    participant FE as tania-dashboard
    participant API as tania-backend
    U->>FE: login (email + frasa sandi)
    FE->>API: Login
    API-->>FE: access (15 m) + refresh (7 d, rotasi)
    U->>FE: operasi
    FE->>API: request + access token
    API->>API: verifikasi + denylist + baca ulang akun (BARU)
    Note over API: peran/status terkini dipakai —<br/>perubahan berlaku di operasi berikutnya
    U->>FE: refresh
    FE->>API: Refresh (token lama)
    API->>API: rotasi; reuse terdeteksi → cabut semua sesi + audit
    U->>FE: logout
    FE->>API: Logout → jti ke denylist
    Note over API: Admin: SetStatus nonaktif / RevokeSessions →<br/>refresh ditolak; access mati di operasi berikutnya
```

### 4.3 Aktivasi modul & jalur penundaan kembali

```mermaid
flowchart LR
    title="Defer = gerbang, bukan penghapusan; aktivasi = gate per operasi"
    M["Matriks (SoT)<br/>baris IDP/Evaluation (clarify 5–7)"] --> G["Gate per operasi<br/>RequireRole + ChapterScope (usecase)"]
    M -.penundaan baru.-> D["Isi deferredModules<br/>ErrModuleUnavailable → FORBIDDEN"]
    G --> B["Backend: kode & SDL modul tetap"]
    G --> F["FE: entri nav tampil untuk semua peran,<br/>permukaan kelola per peran"]
    D -.reaktivasi.-> R["Kosongkan deferredModules<br/>(§14.11, 2026-10-16)"]
```

Status 2026-10-16: **modul aktif** — `deferredModules` kosong, gerbang penundaan dorman,
dan akses ditentukan matriks per operasi (§14.11).

## 5. Module Breakdown

### 5.1 Backend — delta per modul

| Modul | Matriks (status) | Delta plan ini |
| --- | --- | --- |
| Autentikasi | ✔ fondasi ada | **R1.3** baca ulang akun per request di middleware (G1); lainnya reuse |
| Akun user | ✔ Admin-only | **R1.4** guard Admin-terakhir (G5); cakupan test audit semua operasi akun |
| Assignment | ⚠ gate belum sesuai | **R1.1** Operation baca "lihat semua" read-only; **R6.2** Admin kelola penuh (G2/G6) |
| Data karyawan | ⚠ Admin belum kelola | **R6.3** tambah Admin ke operasi kelola (`Create`/`Update`); baca Admin sudah ada |
| Kontrak kerja | ⚠ Admin belum | **R6.2** tambah Admin ke baca + mutasi (`contract.go` — Operation-only saat ini) |
| Provisi Entra | ⚠ Admin belum | **R6.2** tambah Admin ke `entra.go` (Operation-only saat ini) |
| Master data | ✔ selaras | Tanpa perubahan (baca semua peran, kelola Admin) |
| CV | ⚠ Admin belum | **R6.3** tambah Admin ke gate CV (lewat `ProfileFor`/daftar talent) |
| IDP | ✔ aktif (klarifikasi 9) | **R7.3** gate per operasi: baca Admin/Operation/Chapter(cakupan)/Talent(miliknya), kelola Chapter(cakupan)/Admin; kode & SDL tetap |
| Evaluation (+template/periode) | ✔ aktif (klarifikasi 9) | **R7.3** gate per operasi: `ListEvaluations`/`Roster` Admin/Operation/Chapter, `Upsert`/`Submit` Chapter(cakupan)/Admin; **periode & template — baca** Admin/Operation/Chapter (+Talent pada `CurrentPeriod`), **tulis tetap Admin** (konfigurasi global tanpa dimensi chapter — §14.11) |
| Dashboard | ✔ | **R2.5/T035** FE berhenti mem-query field IDP/eval; field SDL **tetap** (T040 dibatalkan, klarifikasi 9) |
| Audit | ✔ Admin-only | Perluas test cakupan; permukaan tetap Admin-only (pin konstitusi v1.2.0) |

### 5.2 Frontend — delta per modul

| Modul | Delta |
| --- | --- |
| Sumber gating | **R2.1** `src/lib/auth/matrix.ts` — set peran eksplisit per modul (cermin matriks); `nav.ts` & `guard.tsx` memakainya; hierarki `atLeast()` dipensiunkan dari gating modul |
| Sidebar/nav | **R2.2** `assignments → ["CHAPTER","OPERATION","TALENT"]` **+ Admin**; `entra` + Admin, `cv` + Admin (clarify 4); ~~entri `idp`/`evaluations` **as is**~~ → **R7.4 (klarifikasi 9)**: IDP & grup Evaluations `ALL`, dengan anak grup mengikuti akses |
| Route terjaga | **R2.3** `/idp`, `/evaluations/*` — ~~dijaga nonaktif (baseline TAN-178)~~ → **aktif sejak klarifikasi 9**: rute dibuka, penjagaan per operasi di halaman (§14.11) |
| Assignment | **R2.4** halaman baca: Operation read-only & Talent lihat miliknya (keputusan F3 plan 001, 2026-10-12); aksi kelola Chapter dan **Admin** (clarify 4) |
| Employees | Tampil untuk Operation + Admin + Chapter + Talent (keputusan F2 plan 001, 2026-10-12): **Admin kelola penuh** (clarify 4 — menggantikan read-only administratif), Chapter lihat cakupan (per talent), Talent lihat data diri; Operation kelola |
| Dashboard | **R2.5** pangkas query & widget IDP/eval per peran; ringkasan per peran sesuai matriks |
| Token store / refresh | Tidak diubah |

## 6. Folder Structure

Delta minimal — **tidak ada folder/paket baru** di luar:

```
tania-backend/
├─ internal/transport/httpapi/middleware.go   # R1.3: baca ulang akun per request (butuh akses repo users)
├─ internal/usecase/assignment.go             # R1.1/R6.2: peran baca + Admin kelola penuh
├─ internal/usecase/contract.go, entra.go     # R6.2: +Admin (baca & mutasi)
├─ internal/usecase/cv.go, employee.go        # R6.3: +Admin (kelola)
├─ internal/usecase/idp.go, evaluation.go     # R1.2/R7.3: gate per operasi (modul aktif)
├─ internal/usecase/rbac.go                   # BARU: matriks peran + gate modul (dorman)
├─ internal/domain/errors.go                  # sentinel ErrModuleUnavailable (dorman; FORBIDDEN)
├─ internal/usecase/account.go                # R1.4: guard Admin-terakhir
├─ internal/usecase/*_test.go                 # test matriks per sel (§10)
└─ graph/schema.graphqls                      # R6: komentar peran; field dashboard TETAP (T040 batal)

tania-dashboard/
├─ src/lib/auth/matrix.ts                     # BARU: set peran per modul (cermin matriks)
├─ src/components/Sidebar/nav.ts              # R2.2/R6.4
├─ src/lib/auth/guard.tsx (atau setara)       # R2.1: pakai matrix.ts
├─ src/app/(app)/idp/**, evaluations/**        # R2.3/R7.4: rute aktif, konten per peran
├─ src/features/assignments/**                # R2.4
└─ src/features/dashboard/**                  # R2.5 (+ codegen Apollo)
```

## 7. Security Design

### 7.1 Matriks sebagai SoT & deny-by-default (FR-03/14/15)
Semua keputusan akses merujuk matriks di `spec.md`. Penegakan di **server** (usecase
layer), UI hanya lapisan kenyamanan. Penolakan akses modul → FORBIDDEN dengan pesan
jelas; tidak ada jalur default-izinkan.

### 7.1a Gate operasi vs gate modul (status 2026-10-16)
Setelah aktivasi klarifikasi 9 (§14.11), seluruh modul yang punya baris matriks **aktif**,
jadi penolakan memakai **gate per operasi** (`RequireRole` + `ChapterScope`). Gate modul
(`deferredModules` → `ErrModuleUnavailable`) **tidak lagi menolak apa pun** dan disimpan
dorman sebagai satu titik penundaan bila modul perlu ditutup lagi; itu sebabnya
`ErrModuleUnavailable` tetap ada di `internal/domain/errors.go`.

### 7.2 Anti-enumerasi (FR-16)
Baca data di luar cakupan → `ErrNotFound` (NOT_FOUND identik dengan data tak ada) —
pola `CanAccessEmployee` existing. **Beda semantik**: penolakan modul (tidak diberikan)
→ FORBIDDEN dengan pesan jelas; data di luar cakupan → NOT_FOUND. Input tidak valid →
validasi eksplisit. Guard baru wajib memakai pola yang sama. Kasus khusus **FR-20**:
akun Chapter dengan cakupan tidak terdefinisi ditolak **dengan penjelasan khusus**
("cakupan chapter tidak terdefinisi") lewat sentinel `ErrScopeUndefined` — bukan pola
NOT_FOUND (yang hanya untuk data di luar cakupan).

### 7.3 Kebaruan per request (FR-17)
Middleware memverifikasi token + denylist (sudah ada) **dan membaca ulang baris akun**
(status + peran) per request; keputusan otorisasi selalu memakai data terkini —
perubahan peran/status berlaku di operasi berikutnya, akun nonaktif tertolak meski
access token masih berlaku. Tanpa cache (baca PK ~sub-ms; §8) — penyimpanan sementara
hanya dipertimbangkan bila terukur perlu (konstitusi §V).

### 7.4 Chapter-as-data (FR-18–21)
Cakupan tetap turunan `user → karyawan → jobRole → chapter` lewat helper `ChapterScope`
satu-satunya; baca lintas cakupan = NOT_FOUND. Saat workstream pengelolaan-talent
memindahkan sumber cakupan ke kontrak aktif, hanya isi helper yang berubah — antarmuka
dan semua gate tidak menyentuh detail turunan.

### 7.5 Akun & Admin terakhir (FR-04–09)
- Guard Admin-terakhir dalam transaksi yang sama: menonaktifkan **dan** mengubah peran
  menjauh dari Admin pada satu-satunya akun Admin aktif → ditolak (US2; edge case spec).
- 1 akun per karyawan; akun Chapter wajib posisi milik chapter (sudah ada).
- Deaktivasi karyawan → kaskade akun nonaktif + cabut sesi (sudah ada); reaktivasi
  karyawan **tidak** mengaktifkan akun otomatis (reaktivasi manual oleh Admin —
  ditegakkan + ditest).
- `cmd/bootstrap-admin` tetap jamin minimal satu Admin aktif.

### 7.6 Autentikasi (FR-10–13)
Login generik (anti-enumerasi), hanya akun aktif; frasa sandi ≥ 12, bcrypt; kata sandi
sementara dibuat Admin & disampaikan di luar band; rate limit **dipin di plan ini:
maks. 10 kegagalan / 15 menit / sumber** (`LOGIN_RATE_MAX`, `LOGIN_RATE_WINDOW`,
default sesuai implementasi existing) — selaras FR-13.

### 7.7 Audit (FR-22–24)
`recordChange` sinkron dalam transaksi (gagal audit = gagal mutasi) — sudah ada untuk
semua operasi akun; snapshot tanpa rahasia (`userSnapshot` membuang hash). Baca audit
Admin-only. Test cakupan diperluas memastikan setiap mutasi akun tercatat dan payload
bebas kredensial.

### 7.8 Admin sebagai superuser (clarify 4, 2026-10-15)
Admin berwenang penuh pada seluruh modul aktif — bukan read-only, bukan pengecualian.
Deny-by-default (FR-03) tetap berlaku: baris bertanda \* (IDP/evaluasi/periode/template)
masih ditutup untuk semua peran, termasuk Admin. Pola guard (`RequireRole`,
`ChapterScope`) tidak berubah — hanya daftar peran yang bertambah. Modul personal
(CV “milik saya”, “Evaluasi Saya”) tetap tidak bermakna bagi Admin: akses CV Admin
lewat `ProfileFor`/daftar talent, bukan “profil sendiri”.

## 8. Scalability Consideration

- Baca ulang akun per request = lookup PK `users` (±5.000 akun, terindeks) — sub-ms di
  pool pgx; tidak menambah indeks. Bila kelak terukur mahal, cache TTL pendek dicatat
  sebagai amendment (tidak spekulatif sekarang).
- Test matriks O(modul × peran × operasi) tapi murni unit/fake — murah di CI.
- Dashboard, nav, dan query FE tidak bertambah kompleksitas (hanya mengurangi).
- Rate limit & denylist tetap Redis (in-memory, sub-ms).

## 9. Development Roadmap

| Gelombang | Isi | Prasyarat |
| --- | --- | --- |
| **R0 — Sinkronisasi** | Merge branch spec `agent/cobra/9e2ad56b14ef` (002 + amandemen 001) ke `master` kedua repo; plan.md ikut ter-merge | — |
| **R1 — Backend enforcement** | R1.1 baca Assignment Operation "lihat semua" read-only (G2/G6) · R1.2 gerbang modul IDP/Evaluation (G3) · R1.3 kebaruan per request (G1) · R1.4 guard Admin-terakhir (G5) · R1.5 pesan khusus cakupan tidak terdefinisi (G7, `ErrScopeUndefined`) · pemetaan error FORBIDDEN/NOT_FOUND · test matriks per sel | R0 |
| **R2 — Frontend** | R2.1 `matrix.ts` + nav/guard (G5) · R2.2 nav (assignments +Operation/+Talent, employees +Chapter/+Talent — §3.2) · R2.3 route terjaga · R2.4 Assignment baca Operation/Talent · R2.5 pangkas dashboard | R0 |
| **R3 — Kontrak & integrasi** | ~~R3.1 hapus field dashboard ditunda~~ → **FE berhenti mem-query** (T035, selesai); **field SDL dipertahankan** karena modulnya aktif (T040 dibatalkan, klarifikasi 9) · `make generate` / `npm run generate` idempoten | R1, R2 |
| **R4 — UAT & regresi** | Skrip UAT per peran (matriks 12×4; termasuk pengukuran SC-003 buat akun < 2 menit) · regresi lintas-modul §11.3 · gerbang CI penuh | R3 |
| **R5 — Penutupan** | ~~Runbook reaktivasi modul (ubah matriks → buka gerbang → kembalikan nav)~~ — **dijalankan 2026-10-16** (T060/§14.11): matriks diamandemenkan (clarify 5–9), gerbang dikosongkan, nav dikembalikan; retrospektif tetap bagian penutupan | R4 |
| **R6 — Admin kelola penuh** (clarify 4, 2026-10-15) | R6.1 `matrix.ts` +Admin (`assignments`/`entra`/`cv` + `MANAGE_ROLES`) · R6.2 backend +Admin di gate Assignment, Kontrak, Entra · R6.3 backend +Admin di gate CV (baca; tulis tetap Talent) & kelola Data karyawan · R6.4 nav: Provisi Entra & CV untuk Admin · R6.5 test matriks per sel + RTL nav + e2e 4 peran · **R6.6 visibilitas menu per peran**: Master Data hanya-baca semua peran (O6) + IDP/Evaluasi disembunyikan (§14.3) | R1, R2 |
| **R7 — clarify 5–9** (2026-10-16) | R7.1 Kontrak Chapter baca cakupan · R7.2 CV Operation baca + Master Data Chapter cakupan (T086, O7) · **R7.3 aktivasi IDP & evaluasi** — `deferredModules` dikosongkan, gate per operasi (T084) · **R7.4 nav**: IDP & Evaluations tampil semua peran, permukaan per peran · R7.5 docs/e2e diselaraskan | R6 |

Pemetaan user story 002 → gelombang: US1 (R1, R3) · US2 (R1.4, test akun existing) ·
US3 (R1.1/R1.2, R3) · US4 (scope existing, R3 e2e) · US5 (R1.3) · US6 (audit existing,
R1 verifikasi cakupan). Keputusan clarify 12: R1.3 (kebaruan), R1.1+R2.2 (baca
Assignment), R1.2 (defer), R2.5 (dashboard). Amandemen **clarify 4** (Admin kelola
penuh) → **R6**. Keputusan pemetaan submenu TAN-144
(2026-10-12): R1.5 (G7), nav Employees utk Chapter/Talent (N1), R2.4 +Talent (R7
selesai); O5 (baris matriks WAD) tetap keputusan terbuka (tercatat di plan 001),
**O6 ditutup 2026-10-15** (nav Master Data hanya-baca untuk semua peran — §14.3).

**Dependensi lintas-workstream**: pengelolaan-talent (TAN-140/TAN-145) memindahkan
sumber `ChapterScope` ke kontrak aktif & menambah provisi Entra — di luar plan ini;
koordinasinya hanya: (a) antarmuka `ChapterScope` tidak berubah, (b) FR-41 (riwayat
per record utk Operation) tetap di workstream itu.

## 10. Test Strategy

- **Backend — test matriks**: tabel per modul × peran × operasi (OK / FORBIDDEN /
  NOT_FOUND) di lapisan usecase (fake) — satu tabel eksplisit mencerminkan 12×4.
  Termasuk: baca Assignment (Operation ✔ semua / Chapter cakupan / Talent miliknya /
  **Admin ✔**), mutasi Assignment (Chapter & **Admin** ✔, lainnya ✘), Kontrak/Entra/CV/
  Data karyawan **Admin ✔ kelola penuh** (R6), **IDP & evaluasi gate per operasi**
  (klarifikasi 5–7, aktif sejak klarifikasi 9 — §14.11), akun & audit (Admin-only),
  master data (baca Chapter/Operation/Admin dengan cakupan chapter & role, kelola Admin).
- **Backend — khusus**: kebaruan per request (ubah peran/status → operasi berikutnya
  memakai nilai baru; akun nonaktif tertolak); guard Admin-terakhir (SetStatus dan
  UpdateRole; kasus multi-Admin); deteksi reuse refresh (existing, dipertahankan);
  rate limit; anti-enumerasi (NOT_FOUND vs FORBIDDEN); cakupan & kebersihan payload
  audit; kaskade deaktivasi; reaktivasi tidak otomatis.
- **Backend — kontrak & integrasi**: contract test SDL (termasuk penghapusan field
  dashboard), suite integrasi Postgres/Redis yang ada.
- **Frontend — RTL**: render nav per peran (IDP & Evaluations tampil untuk semua peran
  sejak klarifikasi 9; Assignment utk Operation+Chapter), guard route per matriks,
  halaman Assignment/idp/evaluasi read-only sesuai peran, dashboard tanpa widget IDP/eval.
- **Frontend — e2e (Playwright)**: login 4 peran; visibilitas menu & akses route;
  operasi yang ditolak tampil sebagai error jelas (bukan crash).
- **CI & gerbang**: `make lint vet test` (backend), `npm run lint typecheck test`
  (frontend), `make generate`/`npm run generate` idempoten — tanpa perubahan gerbang.

## 11. Regression Strategy

### 11.1 Smoke (jalur kritis, cepat)
Login 4 peran; dashboard ke-render tanpa widget IDP/eval untuk semua peran; halaman
Assignment terbuka utk Operation, Chapter & Admin; CV Talent & Admin; Provisi Entra
Operation & Admin.

### 11.2 Feature (per modul)
Sel matriks yang berubah: Assignment (baca Operation), IDP/Evaluation (deny semua), akun
(Admin-terakhir), dashboard (pangkas field), **sel Admin kelola penuh (R6: Assignment,
Kontrak, Entra, CV, Data karyawan)**. Setiap PR wajib lulus smoke + test matriks.

### 11.3 Cross-module (risiko integrasi tertinggi)
Perubahan peran di tengah sesi → berlaku di operasi berikutnya; deaktivasi karyawan →
akun nonaktif → login & operasi tertolak; pemindahan kepemilikan chapter → cakupan
ikut pindah; guard Admin-terakhir tidak mengunci Admin aktif lain; reaktivasi modul
via matriks saja; ritme audit utk semua mutasi akun.

### 11.4 Pemicu menjalankan
Setiap PR: smoke + test matriks; sebelum rilis: suite penuh + regresi lintas-modul.

## 12. Risks, Assumptions & Open Decisions

| # | Risiko/Keputusan | Dampak | Tindakan |
| --- | --- | --- | --- |
| R1 | Baris matriks "Data karyawan & kontrak — Admin: lihat semua" vs clarify 12(c) "Admin hanya RBAC & Master Data" | Sudah tidak ambigu | **Diperbarui 2026-10-15 (clarify 4)**: Admin = **kelola penuh** — menggantikan keputusan "administratif read-only" 2026-10-12; catatan matriks + revisi spec disesuaikan |
| R2 | Modul WAD (`/activities`, `/workload`) belum ada di matriks — FR-03 mewajibkan baris matriks sebelum akses | Kepatuhan matriks | **Open item O5** (plan 001, 2026-10-12): usulan baris "Aktivitas & workload — semua peran: lihat"; diputuskan bersama project Tania WAD Integration (TAN-96+); tidak memblokir plan ini |
| R3 | Branch spec `agent/cobra/9e2ad56b14ef` belum ter-merge | Folder spec terbelah | R0 mewajibkan merge lebih dulu |
| R4 | ~~Penghapusan field dashboard = perubahan kontrak destruktif~~ | Contract test | ~~Dua fase (§9 R3.1): FE berhenti query → hapus field + test~~ → **batal (klarifikasi 9)**: modul IDP/evaluasi aktif sehingga field SDL tetap dipakai; tidak ada perubahan destruktif (T040 dibatalkan) |
| R5 | Interplay pengelolaan-talent (kontrak aktif sebagai sumber cakupan; FR-09 Entra) | Perubahan antarmuka | Antarmuka `ChapterScope` tidak berubah; **gerbang penerimaan**: US4-4 (kontrak aktif berpindah) dieksekusi setelah workstream ter-merge — iterasi ini FR-18 diterima sampai antarmuka helper + isolasi data (US4-1/2/3/5); catatan status ditambahkan ke FR-18 spec (amandemen 2026-10-12) |
| R6 | Hierarki `atLeast()` FE menyimpang dari matriks; `nav.ts` tak lagi memakai `MODULE_ROLES` (TAN-178) | Gating UI tak konsisten dgn `matrix.ts`/server | R2.1 set peran eksplisit per modul + **R6.1/R6.4** sinkronkan `nav.ts` dengan matriks Admin-kelola-penuh |
| R7 | Talent "lihat miliknya" (Assignment) — permukaan UI | Ekspektasi fitur | **Selesai 2026-10-12** (pemetaan submenu TAN-144 + keputusan F3 plan 001): Talent membaca miliknya di halaman Assignment (server `ForEmployee` sudah mendukung); nav Admin dihapus sesuai matriks |
| R8 | Angka rate limit | Ambang kepatuhan | **Terkunci** (klarifikasi TAN-144): 10 kegagalan / 15 menit / sumber — `LOGIN_RATE_MAX=10`, `LOGIN_RATE_WINDOW=15m` (default existing, env-tunable) |
| R9 | Clarify 4 (Admin kelola penuh) membalik clarify 1 & keputusan 2026-10-12; ~~modul IDP/Evaluation tetap ditunda **as is**~~ | Perubahan otorisasi permanen; ~~menu IDP/Evaluation masih tampil di FE padahal server menolak~~ | Diputuskan pemilik produk (2026-10-15, TAN-212); spec + plan diamandemen; sel FE/BE diselaraskan via **R6**; **ditutup clarify 9 (§14.11)**: modul IDP/Evaluation aktif dengan gate per operasi, menu tampil semua peran, dan tafsiran periode/template (baca vs tulis) dikonfirmasi pemilik produk |
| R10 | Aktivasi IDP & evaluasi (clarify 9) mengubah tiga hal sekaligus: gerbang modul dibuka, field SDL IDP dipertahankan (T040 batal), menu tampil semua peran | Modul yang sebelumnya ditolak kini melayani permintaan per peran; permukaan UI berbeda per peran pada satu entri menu | Diputuskan & **dikonfirmasi pemilik produk** (2026-10-16, `/speckit.plan`); badan plan §1–§13 diselaraskan (as-built §14.11); `ErrModuleUnavailable` dipertahankan dorman sebagai jalur penundaan berikutnya; uji per operasi menegakkan matriks (SC-001) |

### Constitution Check

Konstitusi **v1.2.0** (`.specify/memory/constitution.md`, Last Amended 2026-10-10)
mengikat. Pemeriksaan:

| Prinsip (konstitusi v1.2.0) | Pemeriksaan | Status |
| --- | --- | --- |
| I. Lawful basis & purpose limitation | Tidak ada pemrosesan data pribadi baru; semua gate bekerja pada data yang sudah diproses | **Lulus** |
| II. Data minimization & klasifikasi | Tidak ada field baru; snapshot audit tanpa rahasia; tanpa PII di URL/log | **Lulus** |
| III. Security by design | RBAC ditegakkan server (usecase layer); matriks SoT; audit Admin-only dengan riwayat per record utk Operation tetap diizinkan pin v1.2.0 | **Lulus** |
| IV. Data subject rights & retention | Tidak berubah oleh plan ini (retensi diatur workstream pengelolaan-talent) | **Lulus** |
| V. Smallest change | ~~Defer = gerbang (kode tetap)~~ → defer = gerbang **dorman**, aktivasi = gate per operasi; kode & SDL dipertahankan (T040 dibatalkan); tanpa dependensi baru; tanpa cache spekulatif; delta hanya penegakan | **Lulus** |
| VI. Quality by machines | Gerbang CI tak berubah: `make lint vet test` / `npm run lint typecheck test`; generate idempoten | **Lulus** |
| VII. Testing non-negotiable | Test matriks per sel + kebaruan + Admin-terakhir + kontrak + RTL + e2e (§10) | **Lulus** |
| VIII. Boundaries & dependency hygiene | Layering transport → usecase → domain ← repository dipertahankan; gate di usecase, bukan resolver | **Lulus** |
| IX. Fail visibly, log safely | Penolakan modul = FORBIDDEN dengan pesan jelas; anti-enumerasi utk data; tanpa rahasia di log/audit | **Lulus** |

**Complexity Tracking**: tidak ada pelanggaran yang perlu dijustifikasi.

---

## 13. Milestone Artefak

- `specs/002-tania-rbac/plan.md` — di-mirror byte-identik ke kedua repo (pola TAN-141);
  **revisi 2026-10-15** menambahkan gelombang **R6 — Admin kelola penuh** (clarify 4,
  TAN-212); **revisi 2026-10-16** menambahkan **R7 + §14.5–§14.11** (clarify 5–8, cakupan
  Master Data, dan **aktivasi IDP & evaluasi** — klarifikasi 9).
- Berikutnya: `/speckit.tasks` (project **Tania RBAC**) — urutan task mengikuti §9,
  task UI tetap tercatat di `tasks.md` backend (keputusan "opsi C" plan Foundation).
- ~~Runbook reaktivasi modul ditunda (R5)~~ → **dijalankan 2026-10-16** (§14.11); runbooknya
  tetap berlaku untuk penundaan berikutnya karena `ErrModuleUnavailable` dipertahankan dorman.

---

## 14. Amandemen 2026-10-15 (clarify 4) — Admin kelola penuh

**Keputusan pemilik produk (TAN-212)**: Admin berwenang **kelola penuh** pada seluruh
modul aktif; modul bertanda \* (IDP, evaluasi performa, periode & template) **tetap
ditunda as is**. Ini membalik clarify 1 (Assignment: Admin "—") dan menggantikan
keputusan "administratif read-only" 2026-10-12, serta menyesuaikan spec.md + checklist.

| # | Delta | Berkas | Test |
| --- | --- | --- | --- |
| R6.1 | FE gating: +Admin pada `assignments`, `entra`, `cv`; `MANAGE_ROLES` +Admin utk `employees` & `assignments` | `src/lib/auth/matrix.ts` | `matrix.test.ts` per sel |
| R6.2 | BE: +`RoleAdmin` pada gate Assignment (baca + mutasi), Kontrak (baca + mutasi), Entra | `internal/usecase/assignment.go`, `contract.go`, `entra.go` | tabel matriks per sel |
| R6.3 | BE: +`RoleAdmin` pada CV (`ProfileFor`; **tulis tetap Talent**) & operasi kelola Data karyawan (`Create`/`Update`) | `internal/usecase/cv.go`, `employee.go` | tabel matriks per sel |
| R6.4 | FE nav: tampilkan **Provisi Entra** & **CV** untuk Admin; entri `idp`/`evaluations` dibiarkan as is | `src/components/Sidebar/nav.ts` | sidebar render per peran |
| R6.5 | UAT: matriks per sel + e2e 4 peran (Admin membuka tiap modul aktif) | e2e Playwright | — |

**Kasus semantik**: "CV milik saya" dan "Evaluasi Saya" adalah konsep personal — Admin
tidak punya karyawan sendiri. Admin mengakses CV lewat `ProfileFor`/daftar talent;
menu "Evaluasi Saya" tetap hanya Talent (modul evaluasi juga masih ditunda).

**Yang sengaja dibiarkan (as is)**: menu IDP & Evaluations tetap tampil di sidebar
(baseline desain TAN-178) sementara backend menolak dengan FORBIDDEN "modul ditunda".
Gap ini dicatat sebagai utang yang disengaja sampai pemilik produk memutuskan
reaktivasi (§4.3).

**Deny-by-default tetap berlaku** (FR-03): baris bertanda \* tetap ditutup untuk semua
peran, termasuk Admin.

### 14.1 Status implementasi (2026-10-15)

Gelombang R6 sudah diimplementasikan pada branch `agent/diggie/291774dc1b58`:
`tania-backend` commit **b6571ee**, `tania-dashboard` commit **2392352**.

- **R6.1** selesai — `matrix.ts`: `assignments`/`entra`/`cv` + ADMIN, `MANAGE_ROLES`
  `employees` & `assignments` + ADMIN; tabel `canManage` ditambahkan di `matrix.test.ts`.
- **R6.2/R6.3** selesai — gate `internal/usecase/{assignment,contract,entra,employee}.go`
  menerima `RoleAdmin`; `cv.go` `ProfileFor` menerima Admin.
  **Penyimpangan yang diminta keputusan**: penulisan CV tetap hanya milik Talent
  (`Upsert`) karena konten CV personal dan API tulisnya ber-scope pemilik — membuka
  tulis Admin berarti perubahan SDL/API (lihat catatan tanya di TAN-212).
- **R6.4** selesai — nav menampilkan Provisi Entra & CV untuk Admin; entri IDP/Evaluasi
  dibiarkan as is (baseline TAN-178).
- **R6.5** sebagian — uji matriks per sel (Go + vitest) hijau; berkas e2e Playwright
  diperbarui untuk baris Admin, tetapi **belum dijalankan** di lingkungan ini (butuh
  aplikasi + DB ter-seed + browser).
- **Perkakas asisten internal** `ScopedExpiring`/`ScopedNeedingFollowUp` sengaja tetap
  `Chapter+Operation` (bukan kelola penuh): keduanya jalur baca ber-cakupan chapter
  milik asisten data, bukan permukaan RBAC yang diminta clarify 4.

### 14.2 `/speckit.tasks` dan nav R2.2 (2026-10-15, lanjutan TAN-212)

- **Nav R2.2 selesai** (`tania-dashboard` commit `4fc914f`): `employees` untuk
  Chapter (cakupan) & Talent (data diri), `assignments` untuk Operation (hanya baca) &
  Talent (miliknya), `entra`/`cv` untuk Admin. Invarian baru
  `src/components/Sidebar/nav.test.ts` menegakkan **nav ≡ matriks** per sel sehingga
  drift `nav.ts` vs `matrix.ts` (R6 §12) tidak bisa kembali diam-diam; entri
  IDP/Evaluasi dikecualikan karena tetap as is.
- **`tasks.md` backend diperbarui** (`/speckit.tasks`): gelombang **R6** (T070–T078)
  ditambahkan beserta status as-built, T030/T031/T033/T034 diselaraskan dengan
  amandemen clarify 4, dan traceability diberi baris R6. Sisa terbuka: T078 (jalankan
  e2e Playwright di pipeline), T035/T040 (pangkas query & hapus field dashboard
  IDP/eval — modul ditunda, di luar iterasi ini), T050–T052 (UAT/gerbang rilis),
  T061 (putusan O5/O6).
- **Penulisan CV**: keputusan pemilik produk 2026-10-15 "admin hanya bisa read cv"
  menutup pertanyaan §14.1 — tidak ada perubahan SDL/API tulis CV.

### 14.3 Visibilitas menu per peran (2026-10-15, implementasi lanjutan)

Permintaan pemilik produk: "sesuaikan visibilitas menu juga untuk masing-masing role".
Menu kini **cermin penuh matriks per peran** (`dashboard` commit berikutnya) — setiap
modul yang boleh *dibaca* sebuah peran punya entri, dan modul yang ditutup tidak punya:

| Entri | Admin | Operation | Chapter | Talent | Keputusan |
| --- | --- | --- | --- | --- | --- |
| Dashboard, Aktivitas saya, Workload | ✔ | ✔ | ✔ | ✔ | O5 tetap terbuka (baris WAD) |
| Data Karyawan | ✔ kelola | ✔ kelola | ✔ cakupan | ✔ data diri | R2.2 |
| Kontrak | ✔ kelola | ✔ kelola | — | — | matriks |
| Assignments | ✔ kelola | ✔ baca semua | ✔ kelola cakupan | ✔ miliknya | R6 + R2.2 |
| Provisi Entra | ✔ kelola | ✔ kelola | — | — | R6.4 |
| CV | ✔ baca semua | — | ✔ baca cakupan | ✔ kelola miliknya | 2026-10-15: Admin hanya baca |
| Master Data | ✔ kelola | ✔ baca | ✔ baca | ✔ baca | **O6 ditutup 2026-10-15** |
| Accounts, Audit | ✔ | — | — | — | matriks |
| IDP, Evaluations | — | — | — | — | **ditunda**: entri disembunyikan (`roles: []`) |

- **O6 ditutup** dengan mengikuti matriks (hak *lihat* untuk semua peran): nav Master Data
  tampil untuk semua, permukaan kelola (`Tambah`, `Ubah`, `Aktifkan/Nonaktifkan`) hanya
  Admin (`MANAGE_ROLES.masterData = ["ADMIN"]`); section-nya tidak lagi memblokir non-Admin.
  **Digantikan 2026-10-16 oleh §14.5** (clarify 5: Chapter & Talent tanpa akses Master Data).
- **IDP & Evaluation** tetap ditunda: entri menu dikosongkan (`roles: []`) — menyimpang dari
  baseline desain TAN-178, sesuai matriks (✘ semua peran). Baris/route `idp`/`evaluations`
  di `matrix.ts` **belum** diubah (T032), jadi invariant `nav.test.ts` mengecualikan kedua
  entri itu dan mencatatnya sebagai utang: reactivation = kembalikan peran di nav + buka
  gerbang server + tutup/buka route (runbook R5/T060).
- **Cakupan uji**: `nav.test.ts` menegakkan nav ≡ matriks per sel untuk seluruh entri
  aktif; `Sidebar.test.tsx` menguji entri ditunda tidak muncul untuk peran mana pun;
  `master-data.test.tsx` + 4 `page.test.tsx` menguji permukaan kelola hanya Admin dan
  tampilan hanya-baca untuk Chapter/Talent.
- **Sisa**: T032 (tutup route IDP/Evaluasi secara eksplisit — menunggu keputusan reaktivasi)
  dan T078 (jalankan e2e di pipeline).

### 14.4 Status `/speckit.implement` (lanjutan 2026-10-15)

| Gerbang | Hasil |
| --- | --- |
| `go vet ./...` (backend) | 0 temuan |
| `go test ./...` (backend) | 10 paket ok |
| `pnpm lint` (dashboard) | 0 temuan |
| `pnpm typecheck` | 0 error |
| `pnpm test` | **526/526** hijau |
| `make lint vet test` | `make`/`golangci-lint` tidak tersedia di lingkungan agent — dijalankan manual (`go vet`/`go test`); `make lint` dijalankan di pipeline |
| Generate idempoten | tidak dijalankan (butuh toolchain codegen) |
| Suite e2e (T078) | **belum** — butuh aplikasi + DB ter-seed + browser |

Sisa terbuka: **T032** (tutup route IDP/Evaluasi; menunggu keputusan reaktivasi), **T035/T040**
(dashboard lepas field IDP/eval — ikut modul ditunda), **T050/T051** (UAT & regresi lintas-modul
— butuh lingkungan hidup), **T052** sisa (generate idempoten + suite e2e), **T078** e2e di pipeline.
**O6 ditutup**; **O5 tetap terbuka** (baris matriks WAD).

### 14.5 Amandemen clarify 5 (2026-10-16) — Kontrak, Master Data, IDP & Evaluasi

Keputusan pemilik produk pada `/speckit.clarify` (TAN-212 lanjutan) mengubah **tiga** area
matriks dan **membatalkan** dua keputusan sebelumnya. Matriks di `spec.md` adalah
sumber kebenarannya; berikut delta teknis yang harus menyusul (belum dikerjakan — bagian ini
merekam apa yang berubah, bukan klaim selesai).

| Area | Sebelum (2026-10-15) | Sesudah (clarify 5) | Delta teknis |
| --- | --- | --- | --- |
| Kontrak | Chapter `—` | Chapter **baca** cakupan chapter (row terpisah) | BE: gate baca kontrak (`contract.go` `List`/`Get`/`Scoped*`) +Chapter; FE: entri nav "Kontrak" +CHAPTER (hanya baca), tabel kontrak tanpa aksi kelola |
| Master Data | semua peran baca (O6 "ditutup") | Admin `kelola`, Operation `lihat`, **Chapter & Talent `—`** | BE: gate master data `+Operation` baca, `−Chapter/−Talent`; FE: `MODULE_ROLES.masterData = ["OPERATION","ADMIN"]`, nav Master Data `[OPERATION, ADMIN]`, `MasterDataSection` hanya-baca untuk Operation; **keputusan O6 pada §14.3 dibatalkan** |
| IDP | semua peran ✘ (ditunda) | Admin `kelola` · Operation `lihat` · Chapter `lihat` cakupan · Talent `kelola miliknya` | BE: `deferredModules` `−IDP/−EVALUATION` **hanya setelah modul dibangun**; gate per operasi sesuai pemetaan; FE: entri nav IDP per peran (bukan `roles: []`) |
| Evaluasi performa | semua peran ✘ (ditunda) | sama dengan IDP | BE/FE: sama; periode & template evaluasi ditandai `†` (usulan: Admin `kelola`, Operation & Chapter `lihat`) — menunggu konfirmasi |

Implikasi urutan kerja:

- **Menutup akses lebih dulu, membuka kemudian**: Master Data & Kontrak adalah perubahan
  pada modul yang **sudah aktif** — bisa dikerjakan lebih dulu bersama penyesuaian nav.
- **Membuka IDP & Evaluasi** menyentuh modul yang **belum dibangun** (penundaan clarify 2/3).
  Mencabut penanda `deferredModules` tanpa modulnya siap hanya memindahkan penolakan dari
  `ErrModuleUnavailable` ke gate peran — jadi buka bersamaan dengan pekerjaan modulnya
  (aktivasi fitur + konsumsi data WAD), bukan sebagai perubahan RBAC murni.
- **Visibilitas menu** (T079/§14.3) ikut digantikan: entri IDP/Evaluasi kembali muncul sesuai
  pemetaan di atas, Master Data kembali `[OPERATION, ADMIN]`.
- Invarian `nav.test.ts` (`AS_IS_HREFS`) menjadi **tidak berlaku** untuk IDP/Evaluasi begitu
  baris matriksnya memuat peran — saat itu pengecualiannya dihapus dan invarian mencakup
  seluruh entri tanpa kecuali.
- **Tidak ada divergensi permanen**: seluruh keputusan di atas adalah data matriks; tidak ada
  perubahan arsitektur, skema, atau kontrak API yang diperlukan untuk merekamnya sekarang.

### 14.6 Amandemen clarify 6 (2026-10-16) — CV, Master Data, evaluasi, aktivasi ditunda

Menyempurnakan §14.5 (beberapa butir di §14.5 kini **digantikan**). Matriks `spec.md` tetap
sumber kebenaran.

| Area | §14.5 (clarify 5) | §14.6 (clarify 6) | Delta teknis |
| --- | --- | --- | --- |
| Profil CV | Operation `—` | Operation **lihat semua (hanya baca)** | FE `MODULE_ROLES.cv` +OPERATION; entri nav CV +OPERATION; halaman CV: Operation memakai penampil hanya-baca (`CvRosterViewer`); BE gate baca CV `+Operation` (tulis tetap Talent) |
| Master Data | Chapter & Talent `—` | Chapter **lihat cakupan**, Talent `—` (**O6** tetap tertutup untuk Talent) | FE `MODULE_ROLES.masterData = ["CHAPTER","OPERATION","ADMIN"]` dengan `MANAGE_ROLES.masterData = ["ADMIN"]`; nav Master Data +CHAPTER; BE: baca master data Chapter dibatasi cakupan (Role/chapter miliknya), Talent tetap ditolak |
| Evaluasi (performa, periode, template) | Chapter `lihat`, periode/template `†` usulan | **Admin kelola · Operation lihat · Chapter kelola cakupan · Talent kelola cakupan (miliknya)** | Direkam di matriks; penegakan menyusul aktivasi modul |
| IDP | Admin kelola · Operation lihat · Chapter lihat cakupan · Talent kelola miliknya | tidak berubah | — |
| Aktivasi IDP & evaluasi | opsi (a)/(b) belum diputuskan | **(a) rekam akses sekarang, aktifkan nanti** | `deferredModules` **tetap**; entri nav IDP/Evaluasi **tetap disembunyikan** sampai aktivasi (agar pengguna tidak menabrak halaman yang ditolak server); T084 menjadi pekerjaan aktivasi terjadwal |

Konsekuensi yang perlu diingat saat implementasi:

- **Menu mengikuti akses *aktif*, bukan akses *tercatat*.** Karena IDP & evaluasi masih
  ditutup server, entri menunya tetap `roles: []`. Saat aktivasi, satu perubahan: kembalikan
  peran di nav sesuai matriks + cabut `deferredModules` + hapus pengecualian di `nav.test.ts`.
- **Master Data Chapter = cakupan**, jadi gate bacanya bukan "boleh membaca master data"
  polos, melainkan "boleh membaca master data yang relevan bagi cakupannya" — perlu definisi
  teknis satu kali (mis. Chapter membaca daftar Role yang chapter-nya ia miliki, bukan daftar
  Unit/Project global) sebelum dikerjakan; kalau ternyata maksudnya akses penuh, matriksnya
  cukup dinaikkan ke `lihat`.
- **CV Operation hanya baca** — penulisan tetap Talent; tidak ada perubahan kontrak API.
- **Tidak ada divergensi permanen** pada butir yang langsung dapat dikerjakan (CV & Master
  Data): keduanya perubahan data matriks + gate yang sudah ada.

### 14.7 Visibilitas per peran — status as-built (2026-10-16, TAN-212)

Kode diselaraskan dengan matriks §14.5–§14.6 ("atur ulang visibilitas per peran"). Tiga
modul berpindah peran, satu modul tetap tertutup:

| Modul | Admin | Operation | Chapter | Talent | Bentuk peran baru |
| --- | --- | --- | --- | --- | --- |
| Kontrak kerja | kelola | kelola | **baca cakupan** | — | nav +CHAPTER; `GET /contracts` hanya-baca untuk Chapter (tanpa tambah/ubah/perpanjang/aksi siklus/riwayat); BE `List`/`Get` `+RoleChapter` dengan `ChapterScope` (di luar cakupan → NOT_FOUND) |
| Master Data | kelola | **baca** | **baca** | **—** | nav +CHAPTER/+OPERATION, Talent dihapus; `MasterDataSection` hanya-baca (`canManage` = ADMIN) dan gate modul di `master-data/layout.tsx` menutup deep-link Talent |
| Profil CV | **baca semua** | **baca semua** | baca cakupan | kelola miliknya | nav +OPERATION; Operation memakai penampil hanya-baca `CvRosterViewer`; BE gate baca CV `+RoleOperation` (tulis tetap Talent, FR-13) |
| IDP & Evaluasi | — | — | — | — | **tetap tertutup**: `roles: []`, `deferredModules` server tetap, `AS_IS_HREFS` di `nav.test.ts` tetap dengan alasan yang diperbarui (modul belum aktif, bukan "matriks ✘") |

Sisa yang **belum** dikerjakan, dengan alasan:

- ~~**Cakupan Master Data untuk Chapter belum ditegakkan di server**~~ (**selesai 2026-10-16,
  clarify 8 → §14.9**; keadaan yang dicatat di sini berlaku sampai keputusan itu): baca master data ketika itu
  bergantung pada `requireIdentity` (semua peran terautentikasi), karena query yang sama
  menopang filter/dropdown halaman lain — `employees` memakai `units`, `assignments` memakai
  `projects`/`jobRoles` — sehingga melarang Talent atau mempersempit Chapter harus lewat
  definisi cakupan yang eksplisit dulu (butir terbuka **O7**). Keputusan clarify 8 menutup itu:
  `chapters`/`jobRoles` kini ber-cakupan dan Talent ditolak, sedangkan `units`/`projects` tetap
  referensi level organisasi. Di UI, menu dan route-nya sudah mengikuti matriks sejak §14.7.
- **Aktivasi IDP & evaluasi** tetap terjadwal (T084); menunya sengaja kosong agar pengguna
  tidak menabrak halaman yang ditolak server.
- **Pemeriksaan e2e (Playwright)** belum dapat dijalankan di lingkungan agen (butuh app +
  DB ter-seed + browser) — baris RBAC di `e2e/rbac.spec.ts` disiapkan, verifikasi menyusul di
  pipeline (T078).

Gerbang mutu setelah perubahan: FE `pnpm test` 529/530 (satu uji smoke echarts gagal hanya
saat suite paralel, lulus saat dijalankan sendiri), `pnpm typecheck` 0, `pnpm lint` 0; BE
`go vet` 0 dan `go test ./...` 10 paket ok (`make`/`golangci-lint` tetap tidak tersedia —
T052).

### 14.8 Amandemen clarify 7 (2026-10-16) — cakupan Master Data, IDP seragam dengan evaluasi

Dua tafsiran yang masih terbuka pada clarify 5/6 dijawab pemilik produk; matriks `spec.md`
tetap sumber kebenaran.

| Butir | Sebelum (hasil clarify 5/6) | Clarify 7 | Delta teknis |
| --- | --- | --- | --- |
| Cakupan Master Data Chapter | `lihat cakupan` (tafsiran TAN-212, "kalau maksudnya penuh, naikkan ke `lihat`") | **`lihat cakupan` dikonfirmasi** — akses penuh tidak diberikan | Tidak ada perubahan label matriks; yang berubah hanya status tafsiran → terkonfirmasi. Penegakan cakupan sisi server tetap bergantung pada relasi chapter (lihat bawah) |
| IDP | Admin kelola · Operation lihat · Chapter **lihat cakupan** · Talent kelola miliknya | Admin kelola · Operation lihat · Chapter **kelola cakupan** · Talent kelola miliknya | Baris matriks IDP dinaikkan; IDP kini identik dengan modul evaluasi. Tidak ada perubahan kode: modul masih ditutup (`deferredModules`) |
| Aktivasi IDP & evaluasi | (a) rekam sekarang, aktifkan nanti | tidak berubah | `deferredModules` tetap; entri nav IDP/Evaluasi tetap `roles: []` |

**Batas teknis cakupan Master Data (dasar tugas T086).** Pada model data saat ini hanya
**Chapter** dan **Role** yang punya relasi chapter (`job_roles.chapter_id`); **Unit** dan
**Project** tidak merujuk chapter mana pun. Jadi "lihat cakupan" hanya dapat ditegakkan
tanpa perubahan skema untuk dua entitas pertama:

- `chapters` → Chapter hanya membaca barisnya sendiri;
- `jobRoles` → Chapter hanya membaca role yang `chapter_id`-nya miliknya (pola yang sama
  dengan `ContractFilter.ScopeChapterID`, R-11);
- `units`/`projects` → belum bisa dibatasi per chapter: keduanya dipakai sebagai
  filter/dropdown lintas halaman (`employees`→`units`, `assignments`→`projects`/`jobRoles`),
  dan pembatasannya menuntut keputusan produk atas relasi baru (mis. project per chapter)
  atau penerimaan bahwa keduanya tetap daftar referensi level organisasi. Selama itu belum
  diputuskan, **bacanya tetap terbuka** dan Talent belum ditolak di server — butir terbuka
  **O7** (UI sudah mengikuti matriks: Talent tanpa menu Master Data).

Tidak ada divergensi permanen: kedua keputusan clarify 7 hanya menyesuaikan baris matriks &
tafsiran; modul yang berubah statusnya (IDP) tetap tidak aktif sehingga tidak ada kode yang
harus menyesuaikan diri lebih dulu.

### 14.9 Cakupan Master Data ditegakkan (as-built, 2026-10-16, TAN-212)

Keputusan clarify 8 memilih opsi kedua: **Unit & Project tetap daftar referensi level
organisasi**, **Chapter & Role ber-cakupan**. Cakupan Master Data karena itu tidak lagi
menunggu relasi baru — bagian yang bisa ditegakkan dikerjakan sekarang.

| Entitas | Peran Admin/Operation | Peran Chapter | Peran Talent | Alasan |
| --- | --- | --- | --- | --- |
| `chapters` | seluruh daftar | **hanya barisnya sendiri** (dari `ChapterScope`) | ditolak (`FORBIDDEN`) | relasi chapter tersedia (user → employee → role → chapter) |
| `jobRoles` | seluruh daftar | **hanya role milik chapter-nya** (`job_roles.chapter_id`); role tanpa chapter tidak masuk cakupan siapa pun | ditolak (`FORBIDDEN`) | relasi chapter tersedia |
| `units` | seluruh daftar | seluruh daftar | seluruh daftar | referensi level organisasi; dipakai filter `employees` |
| `projects` | seluruh daftar | seluruh daftar | seluruh daftar | referensi level organisasi; dipakai filter `assignments` |

Implementasi:

- `internal/usecase/chapter.go` — `ChapterService.List` mengganti `requireIdentity` dengan
  `RequireRole(Chapter, Operation, Admin)`; untuk peran Chapter scope diambil dari
  `ChapterScope` (dibaca dari identitas, **bukan** dari klien — R-11) dan hanya baris itu yang
  dikembalikan; baris own yang nonaktif tetap disembunyikan kecuali `includeInactive`.
- `internal/usecase/jobrole.go` — `JobRoleService.List` sama, lalu menyaring hasil daftar
  berdasarkan `role.Chapter.ID == scope` (master data adalah himpunan referensi kecil, jadi
  penyaringan di lapisan usecase; kontrak repositori & SQL tidak berubah). Role tanpa
  chapter (`chapter_id` NULL) tidak termasuk cakupan chapter mana pun.
- Kedua service menerima `domain.EmployeeRepository` baru di konstruktornya (wiring
  `cmd/api/main.go`); penyelesai GraphQL tidak berubah karena gate berada di usecase (FR-16).
- Chapter tanpa kepemilikan chapter tetap mendapat `ErrScopeUndefined` — FORBIDDEN yang
  menjelaskan sebabnya (FR-20 002-tania-rbac), sama seperti modul berkakipan lain.

Verifikasi: `TestChapterListIsChapterScoped`, `TestChapterListInactiveOwnChapter`,
`TestJobRoleListIsChapterScoped`, `TestMasterDataListsRejectChapterWithoutScope`
(`masterdata_chapter_test.go`, memakai `chapterEmployee` sebagai fixture kepemilikan chapter),
ditambah empat baris baru pada `TestAuthorizationMatrix` (`listUnits`, `listProjects`,
`listChapters`, `listJobRoles`) sehingga matriks peran ikut menegakkan keputusan ini.

Sisa yang tetap terbuka setelah §14.9: UI Master Data Chapter tidak diubah (halaman sudah
hanya-baca untuk non-manage sejak §14.7, daftarnya kini otomatis lebih pendek karena server
yang menyaring); e2e RBAC (T078) belum dijalankan di lingkungan agen.

### 14.10 Sisa R2 dikerjakan (as-built, 2026-10-16, TAN-212) — T032, T035, T036

Keluaran `/speckit.implement` lanjutan. Gelombang R7 (§14.5–§14.9) sudah menutup akses di
server; yang tersisa dari R2 adalah dua utang yang terlihat di UI dan tidak menunggu
keputusan pemilik produk: rute modul yang ditunda masih bisa dibuka lewat URL langsung
(T032), dan baris verifikasi bahwa dashboard tidak lagi mem-query field IDP/eval (T035).

**Keputusan bentuk (T032).** Modul ditunda dinyatakan **di dalam baris matriks FE** itu sendiri —
`MODULE_ROLES.idp = []`, `MODULE_ROLES.evaluations = []` — bukan lewat daftar pengecualian
baru. Alasannya: server sudah menyatakan penundaan sebagai "tidak ada peran yang diizinkan"
(`internal/usecase/rbac.go` `deferredModules` menolak **setiap** peran, termasuk Admin), jadi
baris kosong adalah cermin satu-satunya yang setara. Efeknya tanpa kode tambahan:

| Permukaan | Sebelum | Sesudah |
| --- | --- | --- |
| `/idp/*`, `/evaluations/*` (`layout.tsx` → `isModuleOpen`) | tampil, server menolak tiap query | `notFound()` untuk semua peran |
| Tab "IDP Saya" di `/profile` (`canAccess(role, "idp")`) | tampil untuk Talent, kartu galat MODULE_UNAVAILABLE | tidak tampil untuk peran mana pun |
| Menu sidebar | sudah kosong (`roles: []`) | tetap kosong; alasan pengecualian uji diperbarui |
| Pemetaan yang direkam (Admin kelola · Operation lihat · Chapter `kelola cakupan` · Talent miliknya) | baris matriks | tetap di spec (sumber kebenaran) + entri nav, dipakai lagi saat aktivasi |

Pengecualian `AS_IS_HREFS` di `nav.test.ts` **tetap** — bukan karena modulnya masih tampil,
tetapi karena entri nav menyimpan pemetaan per peran untuk aktivasi sementara baris matriksnya
kini kosong. Aktivasi (T084) membuka keduanya bersamaan lalu menghapus daftar itu. → **Terjadi
persis pada §14.11 (klarifikasi 9): `AS_IS_HREFS` dihapus, invarian uji dilonggarkan agar entri
per peran boleh berbeda selama modulnya boleh dibuka.**

**T035 terverifikasi, tidak perlu perubahan.** `src/features/dashboard/dashboard.graphql`
tidak lagi memuat satu pun field IDP/eval (`idpStatusDistribution`, `actionProgress`,
`idpsNeedingReview`, `currentEvaluationPeriod`, `idpProgress`, `latestEvaluation`,
`upcomingActionDeadlines`); yang tersisa hanyalah dokumen di `src/generated/graphql` dan
halaman modulnya sendiri. `src/features/dashboard/dashboard.test.tsx` ("renders Talent widgets
without deferred IDP/Evaluation content (T035)") menjaga invariannya, jadi prasyarat T040
sudah terpenuhi dari sisi FE.

Perubahan berkas (frontend saja — server sudah menutup modulnya sejak §14.6, tidak ada
perubahan backend):

- `src/lib/auth/matrix.ts` — baris `idp`/`evaluations` → `[]` + catatan alasan.
- `src/lib/auth/deferred-routes.test.tsx` — uji TAN-178 "layout disajikan" **dibalik** menjadi
  "`notFound()` dipanggil"; ini as-built T032, bukan regresi.
- `src/lib/auth/matrix.test.ts` — `EXPECTED` dua modul → `false` semua peran; uji
  `isModuleOpen` menjadi "menutup IDP & Evaluation untuk semua peran selama ditunda".
- `src/features/profile/profile.test.tsx` — tab IDP tersembunyi untuk Talent **dan** peran
  lain; isi ringkasan IDP tetap dijaga dengan merender `IdpSection` langsung (agar cakupan
  ujinya tidak hilang selama modul ditutup).
- `src/components/Sidebar/nav.test.ts` — alasan `AS_IS_HREFS` diperbarui (utang aktivasi T084).
- `e2e/rbac.spec.ts` — daftar `NAV_VISIBLE`/`NAV_HIDDEN` diselaraskan dengan matriks clarify
  5–8 (Kontrak `+CHAPTER`, CV semua peran, Master Data CHAPTER/OPERATION/ADMIN, Accounts hanya
  Admin) dan `DEFERRED_ROUTES` diperluas ke `/idp/new`, `/evaluations/templates`,
  `/evaluations/my`; tetap dijalankan di pipeline (T078), bukan di lingkungan agen.

Verifikasi: `pnpm test` 531/531 hijau (run ulang; run pertama gagal 4 uji karena batas waktu
saat beban paralel — pola flaky yang sudah dikenal), `pnpm typecheck` 0, `pnpm eslint` 0.
T032, T035, T036 ditutup di `tasks.md`; ~~T084 (aktivasi) dan T040 (hapus field SDL — perubahan
destruktif) tetap menunggu keputusan pemilik produk~~ → **keduanya diputuskan pemilik produk
pada clarify 9 (§14.11): modul diaktifkan dan field SDL dipertahankan (T040 dibatalkan),
sehingga T032 digantikan dan T084 ditutup.**

### 14.11 Aktivasi IDP & evaluasi (as-built, 2026-10-16, TAN-212) — T084

**Dikonfirmasi pemilik produk lewat `/speckit.plan` (2026-10-16)**: keputusan aktivasi ini —
beserta tafsiran periode/template di bawah — berlaku sebagai keputusan, dan badan plan
(§1–§13) diselaraskan mengikutinya.

Pemilik produk mengaktifkan kedua modul dan memutuskan tiga hal sekaligus: (1) modul IDP &
evaluasi **aktif** — bukan lagi "rekam akses, aktifkan nanti" (klarifikasi 6d); (2) **field IDP
pada SDL tidak dihapus** — permintaan tegas, sehingga rencana penghapusan field (T040) batal;
(3) **entri menu IDP & Evaluations tetap tampil untuk semua peran**, yang berbeda hanya
aksesnya. Matriks `spec.md` tidak berubah (baris clarify 5–7 kini berlaku penuh) — yang
berubah adalah status aktivasi dan bagaimana UI menyajikannya.

**Server: gerbang modul dikosongkan, bukan dihapus.** `internal/usecase/rbac.go`
`deferredModules` menjadi himpunan kosong; `moduleGate` karena itu selalu mengembalikan `nil`.
Mekanisme penolakan (`ErrModuleUnavailable`, `internal/domain/errors.go`) **tetap ada** sebagai
titik penegakan yang dorman — sengaja dipertahankan supaya penundaan di masa depan cukup
mengisi satu baris, bukan membangun ulang gerbangnya.

| Modul | Peran | Sebelum (§14.10) | Sesudah (klarifikasi 9) |
| --- | --- | --- | --- |
| IDP — baca (`List`, `Get`) | Admin, Chapter | izin (gate modul menolak) | izin |
| IDP — baca (`List`, `Get`) | Operation | izin (gate modul menolak) | **izin tanpa cakupan** (`List` kini menyertakan Operation) |
| IDP — kelola (`Create`/`Update`/`Close`/`AddAction`/`AddReview`, aksi & status) | Chapter, Admin | izin | izin; Talent hanya boleh mengubah status aksi pada IDP miliknya |
| Evaluasi — baca (`ListEvaluations`, `Roster`) | Admin, Operation, Chapter | izin | izin (roster Operation hanya baca) |
| Evaluasi — tulis (`Upsert`, `Submit`) | Chapter (cakupan), Admin | izin | izin |
| Periode & Template — **baca** (`ListPeriods`, `CurrentPeriod`, `ListTemplates`) | Admin, Operation, Chapter | izin | izin |
| Periode & Template — **tulis** (`Create`/`Update`/`SetActive`) | Admin | izin | izin (tetap Admin) |

**Tafsiran periode & template — DIKONFIRMASI pemilik produk** (`/speckit.plan`, 2026-10-16).
Baris matriks menyebut Chapter `kelola cakupan` untuk periode/template, padahal **periode &
template evaluasi adalah konfigurasi global tanpa dimensi chapter** — tidak ada yang bisa
"dicakup". Karena itu hak Chapter di sini dibaca sebagai **baca**, bukan tulis:
`ListPeriods`/`ListTemplates`/`CurrentPeriod` dibuka untuk Admin/Operation/Chapter (Talent
ikut pada `CurrentPeriod`), sedangkan `Create`/`Update`/`SetActive` tetap `RequireRole(Admin)`
(FR-25/FR-31). Pemilik produk mengonfirmasi tafsiran ini pada 2026-10-16 bersama konfirmasi
plan (klarifikasi 9), jadi bukan lagi tafsiran yang menggantung — berlaku sebagai keputusan.
Bila kelak Chapter perlu mengubah konfigurasi global, perubahan cukup satu baris per operasi
tulis.

**Frontend: menu sama, tampilan berbeda.**

| Entri | Peran yang melihat | Perilaku |
| --- | --- | --- |
| `/idp` | semua | Talent → `MyIdpView` (rencana miliknya); Operation → roster hanya baca; Chapter/Admin → roster kelola (`+ Buat IDP`) |
| `/idp/[id]` | semua yang boleh membuka | form aksi/review/kartu tutup hanya untuk yang `canManage("idp")`; status aksi berupa chip untuk Operation, tetap bisa diubah Talent pada IDP miliknya |
| `/evaluations` (Roster) | Admin, Operation, Chapter | Operation `readOnly` (form penilaian dinonaktifkan + pesan FR-15) |
| `/evaluations/periods`, `/evaluations/templates` | Admin | tidak berubah |
| `/evaluations/my` | Talent | tidak berubah |

Keputusan bentuk IDP: alih-alih menambah href per peran atau memecah IDP jadi submenu, **satu
entri `/idp` menyajikan konten menurut peran** — `/idp/my` tetap ada sebagai rute langsung
(diekstrak ke `src/features/idp/MyIdpView.tsx` agar bisa dirender dua tempat).

**Perubahan kode:**

- Backend: `internal/usecase/rbac.go` (`deferredModules` kosong), `idp.go` (11 blok izin —
  Operation masuk pada baca; kelola tetap Chapter/Admin; status aksi untuk Talent miliknya),
  `evaluation.go` (`evalScope`/`ListEvaluations` + Operation; `Roster` Admin/Operation/Chapter),
  `evaluation_period.go`, `evaluation_template.go` (baca + Operation/Chapter, tulis tetap Admin).
- Backend uji: `rbac_test.go` — `TestDeferredModulesRejectEveryRole` digantikan
  `TestModulesAreActive` + `TestIdpAndEvaluationMatrix` (25 operasi × 4 peran, dibangun lewat
  konstruktor produksi sehingga gerbang modulnya ikut teruji); `evaluation_test.go`,
  `idp_test.go` disesuaikan pada 7 blok (Admin kini boleh upsert/kelola; Operation boleh baca).
- Frontend: `src/lib/auth/matrix.ts` (baris `idp`/`evaluations` → `ALL`, `MANAGE_ROLES.idp`/
  `evaluations` = Chapter+Admin), `src/components/Sidebar/nav.ts` (IDP & grup Evaluations `ALL`,
  Roster Chapter/Operation/Admin), halaman `/idp`, `/idp/[id]`, `/evaluations`,
  `/evaluations/[periodId]/[employeeId]`, `EvaluationsShell.tsx`, `MyIdpView.tsx` (baru).
- Frontend uji: `matrix.test.ts`, `nav.test.ts` (**invarian dilonggarkan**: bukan lagi
  "nav ≡ `canAccess`", tetapi (a) tidak ada tautan mati — entri tampil ⇒ modulnya boleh dibuka,
  dan (b) tiap peran yang boleh membuka modul melihat ≥1 entri modul itu; `AS_IS_HREFS`
  dihapus), `deferred-routes.test.tsx` → `module-routes.test.tsx` (layout menyajikan anak),
  `Sidebar.test.tsx`, `profile.test.tsx`, `idp.test.tsx`, `evaluations.test.tsx`.
- `e2e/rbac.spec.ts`: `DEFERRED_ROUTES` (7 rute 404) dihapus, diganti `ACTIVE_ROUTES`
  (`/idp`, `/evaluations` harus 200 untuk semua peran); IDP & Evaluations masuk `NAV_VISIBLE`
  semua peran; pemeriksaan hanya-baca ditambahkan pada test OPERATION yang sudah ada (jumlah
  login tetap 8, di bawah `LOGIN_RATE_MAX=10`).

**T040 dibatalkan.** Field IDP pada SDL (`idpStatusDistribution`, `actionProgress`,
`idpsNeedingReview`, `idpProgress`) **tetap** — modulnya hidup, jadi tidak ada alasan
menghapusnya; permintaan pemilik produk juga eksplisit. T032 (rute ditutup) **digantikan** oleh
aktivasi ini: rute kembali terbuka dan penjagaannya mengikuti matriks per operasi.

Verifikasi: FE `pnpm test` 539/539 hijau, `pnpm typecheck` 0, `pnpm lint` 0; BE `go vet ./...` 0,
`go test ./...` 10 paket ok. e2e (T078) tetap hanya bisa dijalankan di pipeline.

### 14.12 Eksekusi suite end-to-end & temuan (as-built, 2026-10-16, TAN-212) — T089/T090

Percobaan pertama menjalankan suite yang selama ini "hanya pipeline": lingkungan agent ternyata
memadai (postgres + redis via `docker compose`), sehingga **seluruh suite backend dijalankan
dengan driver nyata**:

```sh
TEST_DATABASE_URL=postgres://tania:tania@localhost:5432/tania?sslmode=disable \
TEST_REDIS_ADDR=localhost:6379 go test ./... -count=1 -race -p 1
```

Hasil: **10 paket ok**, termasuk `internal/transport/httpapi` (`TestGraphQLEndToEnd`, suite
matriks end-to-end di atas HTTP/GraphQL) dan `internal/repository/postgres`. Untuk itu tiga hal
harus dibereskan lebih dulu.

**1. Bug produk: `myIdp` gagal dengan `internal error` untuk Talent tanpa IDP (T089).**
`internal/repository/postgres/idp.go` — `idpScan` mengembalikan error driver mentah, sehingga
`FindByID`/`FindActiveByEmployee` melepas `pgx.ErrNoRows` alih-alih `domain.ErrNotFound`;
`IdpService.MyIdp` yang memeriksa `errors.Is(err, domain.ErrNotFound)` lalu meneruskan error mentah
ke GraphQL. Sebelum aktivasi jalur ini tidak pernah tersentuh (modul tertutup), jadi aktivasi
(§14.11) **membuka** keadaan kosong yang tidak pernah diuji. Perbaikan: `idpScan` memetakan error
lewat `mapError` (pola repo yang sama dengan `assignmentrow.go`/`contract.go`), sehingga Talent
tanpa IDP mendapat keadaan kosong yang benar. Uji yang mengunci: blok aktivasi di
`internal/transport/httpapi/e2e_test.go` (`Talent query { myIdp { id } }` → `null`).

**2. Harapan uji e2e yang sudah usang karena amandemen 002 (T090).** Tiga blok di
`e2e_test.go` masih menggambarkan matriks sebelum klarifikasi 6–9: (a) Assignment — Admin sekarang
**boleh membaca** semua assignment (§R6), Operation **ditolak** saat menulis, Talent hanya melihat
miliknya; (b) modul IDP/evaluasi — blok `MODULE_UNAVAILABLE` diganti blok aktivasi (baca
Admin/Operation/Chapter, permukaan Talent `myIdp`/`currentEvaluationPeriod`/
`myPerformanceEvaluations`, tulis template tetap Admin, `createIdp` Chapter untuk karyawan
*cakupannya*); (c) CV — Operation sekarang **boleh membaca** (klarifikasi 6). Ditambahkan pula blok
T081/T086: Kontrak oleh Chapter (bercakupan), Talent ditolak, `chapters`/`jobRoles` bercakupan,
`units`/`projects` terbaca semua peran.

**3. Tabrakan data uji yang sudah ada sebelumnya (T090).** `TestGraphQLEndToEnd` memakai NIK
`3273010101930005` **dua kali** (Rina Kartika dan Eko Prasetyo), dan email `rina@tania.test` dua
kali (Rina Kartika dan Rina Kusuma — karyawan pensiun). Keduanya unik di DB, jadi suite berhenti
dengan `CONFLICT` jauh sebelum blok RBAC. NIK karyawan pensiun digeser (`…930006`), kontrak Eko
diberi nomor induk sendiri (`TAN-0010`/`TAN-C-0010`, pembaruan `TAN-C-0011`), dan email kedua
menjadi `rina.kusuma@tania.test`.

**Gerbang rilis (§12 T052) setelah eksekusi.** `gofmt -l` bersih, `go vet ./...` 0,
`golangci-lint` (v2.14.0, dipasang lewat `go install`) **0 temuan pada kode milik RBAC** — sisa 21
temuan semuanya **prawujud di modul lain** (`internal/usecase/chat.go`, `internal/platform/entra`,
import unit/jobrole/contract, `security_test.go`, `middleware_test.go`, `assignment_test.go`,
`fakes_chat_test.go`); satu temuan yang memang berasal dari kode gelombang ini (`allRoles` yatim di
`rbac_test.go`) sudah dihapus. `go tool gqlgen generate` **idempoten** (tidak ada diff). FE:
`pnpm typecheck` 0, `pnpm lint` 0, `pnpm test` **539/539**. Mirrors SDL: `graph/schema.graphqls`
disalin ulang dari backend (perbedaannya hanya komentar per-peran clarify 8; tipe hasil generate
tidak berubah struktural, hanya doc-comment).

**Masih terbuka**: 21 temuan lint prawujud di atas (di luar lingkup RBAC — usulan: task pembersihan
terpisah), dan **e2e Playwright** (T041/T078) yang tetap butuh bring-up dua stack sesuai runbook
`e2e/README.md`.

### 14.13 Percobaan e2e browser (as-built, 2026-10-16, TAN-212) — stack jalan, browser tidak

T041/T078 selama ini dicatat "tidak bisa dijalankan di lingkungan agent". Iterasi ini membuktikan
bagian mana yang benar dan bagian mana yang ternyata bisa:

**Stack-nya terbukti jalan.** `docker compose up -d postgres redis` (stack backend), lalu API
dijalankan sebagai binary lokal (`go build -o … ./cmd/api`, `:8080`) dengan database yang
di-*drop/create* lebih dulu supaya migrasi + `0004_seed.sql` berjalan berurutan; aplikasi Next
via `pnpm dev` (`:3000`, `NEXT_PUBLIC_GRAPHQL_URL=http://localhost:8080/graphql`,
`CORS_ALLOWED_ORIGINS=http://localhost:3000`). Bukti: `/login` → 200, dan mutasi `login` GraphQL
mengembalikan `accessToken` untuk akun seed (`talent@tania.test`, sandi quickstart). Database
ter-seed bersih: 4 user (satu per peran), 4 karyawan, 3 unit, 4 job role, 3 project, 3 chapter.
Catatan operasional: `0004_seed.sql` **tidak** bisa diterapkan manual setelah semua migrasi
(`units.code` NOT NULL baru ada di `0011`) — seed hanya jalan di database fresh, sesuai runbook;
dan suite Go e2e mem-`TRUNCATE` seluruh tabel, jadi jalankan dari database fresh lagi.

**Browser Playwright tidak bisa jalan di sandbox ini.** `pnpm exec playwright install chromium`
berhasil mengunduh browser, tetapi prosesnya gagal diluncurkan:
`Error relocating … chrome-headless-shell: snd_ctl_card_info: symbol not found`, `exitCode=127`.
Sebabnya: sandbox agent adalah **Alpine Linux (musl)**, sementara build Chromium Playwright
memerlukan **glibc**; `playwright install-deps` butuh `apt`/root yang tidak tersedia (uid non-root
tanpa `apk`). Jadi 8 skenario `e2e/rbac.spec.ts` berstatus *failed-to-launch*, bukan gagal asersi.

**Konsekuensi**: T041/T078 tetap milik runner glibc (CI/pipeline atau image dengan deps browser).
Karena matriks RBAC sudah diverifikasi end-to-end **tanpa browser** (suite Go, §14.12), sisa
pekerjaan T041 benar-benar hanya lapisan DOM/nav. Alasan presisi ini dicatat di runbook
`e2e/README.md` supaya tidak diulang dari nol.
