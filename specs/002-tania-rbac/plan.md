# Implementation Plan — RBAC Tania (Kontrol Akses Berbasis Peran)

**Feature Branch**: `002-tania-rbac` | **Date**: 2026-10-11 (revisi 2026-10-15) | **Spec**:
`specs/002-tania-rbac/spec.md` + `specs/001-employee-digital-talent-management/spec.md`
(clarify 12, amandemen 2026-10-10; **clarify 4 — Admin kelola penuh**, amandemen 2026-10-15)

**Input**: Spesifikasi RBAC dari `/speckit.specify` + `/speckit.clarify` (TAN-144),
diperintahkan lewat `/speckit.plan` (TAN-156); diperbarui lewat `/speckit.plan` lanjutan
(TAN-212) untuk amandemen **clarify 4** (Admin = kelola penuh) — lihat §14.

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
2. **Penundaan ≠ penghapusan**: modul IDP & Evaluation **ditunda** — kode yang sudah
   terimplementasi di backend **tidak dihapus**, cukup "ditutup pintunya" (deny semua
   peran, termasuk Admin) dan menu/route-nya disembunyikan (selaras deny-by-default,
   FR-03/FR-15). Template & periode evaluasi (baris bertanda *) ikut ditunda.
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
- Menutup modul IDP & Evaluation (query + mutation, semua peran) dengan pesan FORBIDDEN
  yang jelas ("modul ditunda"), bukan menghapus kode.
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
| G3 | **IDP & Evaluation masih bisa diakses** (Chapter/Talent/Admin sesuai peran lama) — matriks menunda modul: deny semua peran, termasuk template & periode (*) | `internal/usecase/idp.go`, `evaluation.go` | Gerbang modul: deny dengan FORBIDDEN + pesan "modul ditunda" (R1.2) |
| G4 | **Widget dashboard IDP/eval** masih ada di `ChapterDashboard`/`TalentDashboard` | `graph/schema.graphqls:580-594` | Hapus field yang ditunda — dua fase, selaras FE (R2/R3) |
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
  `employees`/`contracts` + Admin (kelola penuh); entri `idp` & `evaluations` **as is**;
  `master-data: ["ADMIN"]` — **keputusan terbuka O6** (matriks memberi hak *lihat*
  Operation/Chapter/Talent: buka nav baca read-only, atau pangkas hak lihat di matriks;
  manajemen tetap Admin). Klaim "sudah sesuai" sebelumnya dicabut (N2).
- `src/lib/auth/roles.ts` + `guard.tsx` — gating route memakai hierarki `atLeast()`
  (TALENT<CHAPTER<OPERATION<ADMIN) yang **menyimpang dari matriks** (menganggap Admin
  dapat semuanya; nyatanya Admin kehilangan baca Assignment). Perlu set peran eksplisit
  per modul (G5/R2.1).
- Route `/idp`, `/evaluations/*` ada — dijaga nonaktif untuk semua peran (kode fitur
  tetap, tidak dihapus — keputusan bentuk #2).
- Query dashboard (`DashboardQuery`) masih meminta field IDP/eval — dipangkas.
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
    F -->|"Gerbang modul ditunda<br/>(IDP/Evaluation, semua peran)"| X2
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

### 4.3 Gerbang modul ditunda & jalur reaktivasi

```mermaid
flowchart LR
    title="Defer = gerbang, bukan penghapusan"
    M["Matriks (SoT)<br/>baris IDP/Evaluation = ✘ semua peran (*)"] --> G["Gerbang modul<br/>usecase: ErrModuleUnavailable → FORBIDDEN"]
    G --> B["Backend: kode & SDL modul tetap"]
    G --> F["FE: nav/route dijaga (baseline desain TAN-178 — as is)"]
    M -.reaktivasi.-> R["Ubah baris matriks (amandemen spec)<br/>→ buka gerbang + kembalikan nav"]
```

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
| IDP | ✘ ditunda | **R1.2** gerbang deny semua peran (G3); kode tetap |
| Evaluation (+template/periode*) | ✘ ditunda | **R1.2** idem |
| Dashboard | ⚠ widget IDP/eval | **R3.1** hapus field ditunda dari union (dua fase) |
| Audit | ✔ Admin-only | Perluas test cakupan; permukaan tetap Admin-only (pin konstitusi v1.2.0) |

### 5.2 Frontend — delta per modul

| Modul | Delta |
| --- | --- |
| Sumber gating | **R2.1** `src/lib/auth/matrix.ts` — set peran eksplisit per modul (cermin matriks); `nav.ts` & `guard.tsx` memakainya; hierarki `atLeast()` dipensiunkan dari gating modul |
| Sidebar/nav | **R2.2** `assignments → ["CHAPTER","OPERATION","TALENT"]` **+ Admin**; `entra` + Admin, `cv` + Admin (clarify 4); entri `idp`/`evaluations` **as is** (baseline desain TAN-178) |
| Route terjaga | **R2.3** `/idp`, `/evaluations/*` — status **as is** (baseline desain TAN-178 membukanya di FE; backend tetap menolak — §14) |
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
├─ internal/usecase/idp.go, evaluation.go     # R1.2: gerbang modul ditunda
├─ internal/usecase/rbac.go                   # BARU (satu file): gate modul + helper matriks
├─ internal/domain/errors.go                  # sentinel ErrModuleUnavailable (+ pemetaan FORBIDDEN di resolver)
├─ internal/usecase/account.go                # R1.4: guard Admin-terakhir
├─ internal/usecase/*_test.go                 # test matriks per sel (§10)
└─ graph/schema.graphqls                      # R3.1: hapus field dashboard yang ditunda

tania-dashboard/
├─ src/lib/auth/matrix.ts                     # BARU: set peran per modul (cermin matriks)
├─ src/components/Sidebar/nav.ts              # R2.2/R6.4
├─ src/lib/auth/guard.tsx (atau setara)       # R2.1: pakai matrix.ts
├─ src/app/(protected)/idp/**, evaluations/** # R2.3: dijaga nonaktif (kode tetap)
├─ src/features/assignments/**                # R2.4
└─ src/features/dashboard/**                  # R2.5 (+ codegen Apollo)
```

## 7. Security Design

### 7.1 Matriks sebagai SoT & deny-by-default (FR-03/14/15)
Semua keputusan akses merujuk matriks di `spec.md`. Penegakan di **server** (usecase
layer), UI hanya lapisan kenyamanan. Penolakan akses modul → FORBIDDEN dengan pesan
jelas; tidak ada jalur default-izinkan.

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
| **R3 — Kontrak & integrasi** | R3.1 hapus field dashboard ditunda — **dua fase**: FE berhenti mem-query dulu, lalu hapus field SDL + contract test · `make generate` / `npm run generate` idempoten | R1, R2 |
| **R4 — UAT & regresi** | Skrip UAT per peran (matriks 12×4; termasuk pengukuran SC-003 buat akun < 2 menit) · regresi lintas-modul §11.3 · gerbang CI penuh | R3 |
| **R5 — Penutupan** | Runbook reaktivasi modul (ubah matriks → buka gerbang → kembalikan nav) + retro | R4 |
| **R6 — Admin kelola penuh** (clarify 4, 2026-10-15) | R6.1 `matrix.ts` +Admin (`assignments`/`entra`/`cv` + `MANAGE_ROLES`) · R6.2 backend +Admin di gate Assignment, Kontrak, Entra · R6.3 backend +Admin di gate CV & kelola Data karyawan · R6.4 nav: Provisi Entra & CV untuk Admin · R6.5 test matriks per sel + RTL nav + e2e 4 peran | R1, R2 |

Pemetaan user story 002 → gelombang: US1 (R1, R3) · US2 (R1.4, test akun existing) ·
US3 (R1.1/R1.2, R3) · US4 (scope existing, R3 e2e) · US5 (R1.3) · US6 (audit existing,
R1 verifikasi cakupan). Keputusan clarify 12: R1.3 (kebaruan), R1.1+R2.2 (baca
Assignment), R1.2 (defer), R2.5 (dashboard). Amandemen **clarify 4** (Admin kelola
penuh) → **R6**. Keputusan pemetaan submenu TAN-144
(2026-10-12): R1.5 (G7), nav Employees utk Chapter/Talent (N1), R2.4 +Talent (R7
selesai); O5 (baris matriks WAD) & O6 (hak lihat Master Data non-Admin) tetap
keputusan terbuka (tercatat di plan 001).

**Dependensi lintas-workstream**: pengelolaan-talent (TAN-140/TAN-145) memindahkan
sumber `ChapterScope` ke kontrak aktif & menambah provisi Entra — di luar plan ini;
koordinasinya hanya: (a) antarmuka `ChapterScope` tidak berubah, (b) FR-41 (riwayat
per record utk Operation) tetap di workstream itu.

## 10. Test Strategy

- **Backend — test matriks**: tabel per modul × peran × operasi (OK / FORBIDDEN /
  NOT_FOUND) di lapisan usecase (fake) — satu tabel eksplisit mencerminkan 12×4.
  Termasuk: baca Assignment (Operation ✔ semua / Chapter cakupan / Talent miliknya /
  **Admin ✔**), mutasi Assignment (Chapter & **Admin** ✔, lainnya ✘), Kontrak/Entra/CV/
  Data karyawan **Admin ✔ kelola penuh** (R6), modul ditunda (semua peran ✘, termasuk
  Admin), akun & audit (Admin-only), master data (baca semua, kelola Admin).
- **Backend — khusus**: kebaruan per request (ubah peran/status → operasi berikutnya
  memakai nilai baru; akun nonaktif tertolak); guard Admin-terakhir (SetStatus dan
  UpdateRole; kasus multi-Admin); deteksi reuse refresh (existing, dipertahankan);
  rate limit; anti-enumerasi (NOT_FOUND vs FORBIDDEN); cakupan & kebersihan payload
  audit; kaskade deaktivasi; reaktivasi tidak otomatis.
- **Backend — kontrak & integrasi**: contract test SDL (termasuk penghapusan field
  dashboard), suite integrasi Postgres/Redis yang ada.
- **Frontend — RTL**: render nav per peran (tanpa IDP/Evaluations; Assignment utk
  Operation+Chapter), guard route per matriks, halaman Assignment read-only,
  dashboard tanpa widget IDP/eval.
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
| R4 | Penghapusan field dashboard = perubahan kontrak destruktif | Contract test | Dua fase (§9 R3.1): FE berhenti query → hapus field + test |
| R5 | Interplay pengelolaan-talent (kontrak aktif sebagai sumber cakupan; FR-09 Entra) | Perubahan antarmuka | Antarmuka `ChapterScope` tidak berubah; **gerbang penerimaan**: US4-4 (kontrak aktif berpindah) dieksekusi setelah workstream ter-merge — iterasi ini FR-18 diterima sampai antarmuka helper + isolasi data (US4-1/2/3/5); catatan status ditambahkan ke FR-18 spec (amandemen 2026-10-12) |
| R6 | Hierarki `atLeast()` FE menyimpang dari matriks; `nav.ts` tak lagi memakai `MODULE_ROLES` (TAN-178) | Gating UI tak konsisten dgn `matrix.ts`/server | R2.1 set peran eksplisit per modul + **R6.1/R6.4** sinkronkan `nav.ts` dengan matriks Admin-kelola-penuh |
| R7 | Talent "lihat miliknya" (Assignment) — permukaan UI | Ekspektasi fitur | **Selesai 2026-10-12** (pemetaan submenu TAN-144 + keputusan F3 plan 001): Talent membaca miliknya di halaman Assignment (server `ForEmployee` sudah mendukung); nav Admin dihapus sesuai matriks |
| R8 | Angka rate limit | Ambang kepatuhan | **Terkunci** (klarifikasi TAN-144): 10 kegagalan / 15 menit / sumber — `LOGIN_RATE_MAX=10`, `LOGIN_RATE_WINDOW=15m` (default existing, env-tunable) |
| R9 | Clarify 4 (Admin kelola penuh) membalik clarify 1 & keputusan 2026-10-12; modul IDP/Evaluation tetap ditunda **as is** | Perubahan otorisasi permanen; menu IDP/Evaluation masih tampil di FE padahal server menolak | Diputuskan pemilik produk (2026-10-15, TAN-212); spec + plan diamandemen; sel FE/BE diselaraskan via **R6**; gap IDP/Evaluation dicatat sebagai utang yang disengaja (§14) |

### Constitution Check

Konstitusi **v1.2.0** (`.specify/memory/constitution.md`, Last Amended 2026-10-10)
mengikat. Pemeriksaan:

| Prinsip (konstitusi v1.2.0) | Pemeriksaan | Status |
| --- | --- | --- |
| I. Lawful basis & purpose limitation | Tidak ada pemrosesan data pribadi baru; semua gate bekerja pada data yang sudah diproses | **Lulus** |
| II. Data minimization & klasifikasi | Tidak ada field baru; snapshot audit tanpa rahasia; tanpa PII di URL/log | **Lulus** |
| III. Security by design | RBAC ditegakkan server (usecase layer); matriks SoT; audit Admin-only dengan riwayat per record utk Operation tetap diizinkan pin v1.2.0 | **Lulus** |
| IV. Data subject rights & retention | Tidak berubah oleh plan ini (retensi diatur workstream pengelolaan-talent) | **Lulus** |
| V. Smallest change | Defer = gerbang (kode tetap); tanpa dependensi baru; tanpa cache spekulatif; delta hanya penegakan | **Lulus** |
| VI. Quality by machines | Gerbang CI tak berubah: `make lint vet test` / `npm run lint typecheck test`; generate idempoten | **Lulus** |
| VII. Testing non-negotiable | Test matriks per sel + kebaruan + Admin-terakhir + kontrak + RTL + e2e (§10) | **Lulus** |
| VIII. Boundaries & dependency hygiene | Layering transport → usecase → domain ← repository dipertahankan; gate di usecase, bukan resolver | **Lulus** |
| IX. Fail visibly, log safely | Penolakan modul = FORBIDDEN dengan pesan jelas; anti-enumerasi utk data; tanpa rahasia di log/audit | **Lulus** |

**Complexity Tracking**: tidak ada pelanggaran yang perlu dijustifikasi.

---

## 13. Milestone Artefak

- `specs/002-tania-rbac/plan.md` — di-mirror byte-identik ke kedua repo (pola TAN-141);
  **revisi 2026-10-15** menambahkan gelombang **R6 — Admin kelola penuh** (clarify 4,
  TAN-212).
- Berikutnya: `/speckit.tasks` (project **Tania RBAC**) — urutan task mengikuti §9,
  task UI tetap tercatat di `tasks.md` backend (keputusan "opsi C" plan Foundation).
- Runbook reaktivasi modul ditunda (R5) — bagian dari penutupan.

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
| R6.3 | BE: +`RoleAdmin` pada CV (`ProfileFor`/`Upsert`) & operasi kelola Data karyawan (`Create`/`Update`) | `internal/usecase/cv.go`, `employee.go` | tabel matriks per sel |
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
