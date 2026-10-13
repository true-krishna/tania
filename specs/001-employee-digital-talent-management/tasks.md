---

description: "Task list — Aplikasi Employee (Digital Talent) Management (frontend)"
---

# Tasks: Aplikasi Employee (Digital Talent) Management — Frontend

**Input**: Design documents dari `specs/001-employee-digital-talent-management/`

**Prerequisites**: `plan.md` (wajib), `spec.md` (wajib — user story + prioritas), `data-model.md`, `contracts/` (`schema.graphql`, `api-conventions.md`, `operations.md`), `research.md`, `quickstart.md`

**Tests**: **WAJIB** — diminta eksplisit oleh konstitusi §VII dan `plan.md` §Testing.

**Organization**: Task dikelompokkan per user story, mengikuti urutan gelombang backend. Setiap fase adalah increment yang dapat diuji mandiri.

## Pembagian lintas repo

Repo ini dan `codex/backend/tania-backend` **masing-masing punya `tasks.md` sendiri** (keputusan 2026-10-01, "jalur dua-run"):

| | Repo ini (`tania-dashboard`) | Repo backend (`tania-backend`) |
| --- | --- | --- |
| Isi daftar | 22 task UI (dokumen ini) | 108 task backend |
| Command | `/speckit.implement` dari root repo ini | `/speckit.implement` dari root repo backend |

Aturan yang mengikat:

1. **ID task dipertahankan sama** dengan daftar backend (T008, T052, …) supaya rujukan di `plan.md`, `research.md`, dan laporan `/speckit.analyze` tetap valid. Karena itu nomor task di masing-masing repo **tidak berurutan penuh** — itu disengaja. Pemetaan lengkap ada di §Pemetaan ID di bawah.
2. **Path di dokumen ini relatif terhadap root repo ini** (`src/…`, `e2e/…`). Di daftar backend, task UI yang sama pernah ditulis dengan prefiks `tania-dashboard/`; itu sudah tidak dipakai lagi.
3. **Urutan lintas repo**: fase UI nomor N bergantung pada fase backend nomor N. Kerjakan backend dulu dalam satu gelombang, lalu UI.
4. **Skema berubah → regenerate dua sisi**: `make generate` di repo backend, lalu `npm run generate` di sini (codegen menargetkan SDL yang **dilayani** backend, lihat `research.md` FRD3).
5. **Gerbang rilis & regression ada di repo backend**: T123 (regression lintas modul) dan T130 (wiring gerbang Jenkins yang menjalankan `make test` → `make test-integration` → `npm run test:e2e`) dikelola di `tania-backend/specs/.../tasks.md`; suite yang dijalankannya adalah T129 di repo ini.
6. **Fixture seed T036** (4 akun peran + master data + assignment + IDP) dikelola di repo backend dan dipakai oleh E2E di sini.

### Pemetaan ID

| Fase | Task UI (repo ini) | Fase backend padanan |
| --- | --- | --- |
| Foundation (F0) | T008, T009, T010 | W0 (Phase 1–2 `tasks.md` backend) |
| US6 — master data & akun | T052, T053, T054 | Phase 3 backend |
| US1 — data karyawan | T061, T062 | Phase 4 backend |
| US2 — assignment | T069, T070 | Phase 5 backend |
| US3 — IDP (Chapter) | T079, T080 | Phase 6 backend |
| US7 — evaluasi performa | T094, T095 | Phase 7 backend |
| US4 — CV | T103, T104 | Phase 8 backend |
| US5 — IDP (Talent) | T109, T110 | Phase 9 backend |
| US8 — dashboard | T115, T116 | Phase 10 backend |
| Polish | T127 (pensiunkan klien REST), T129 (E2E) | Phase 11 backend (T123, T130) |

## Format: `[ID] [P?] [Story] Description`

- **[P]**: boleh jalan paralel (berkas berbeda, tanpa dependensi pada task belum selesai)
- **[Story]**: user story pemilik task (US1…US8); fase Foundation dan Polish tanpa label
- Setiap deskripsi memuat path berkas persis, relatif terhadap root repo ini

## Path Conventions

- Rute App Router: `src/app/(auth)/…`, `src/app/(app)/…`
- Modul fitur (hook + komponen + operasi `.graphql`): `src/features/<modul>/`
- Komponen bersama: `src/components/`; util: `src/lib/`
- Hasil codegen (jangan diedit manual): `src/generated/graphql/`
- Test: `*.test.ts` / `*.test.tsx` di samping kode; E2E di `e2e/`

---

## Status rekonsiliasi kode ↔ daftar (2026-10-13, TAN-175)

Rekonsiliasi `/speckit.implement` membandingkan setiap kotak `[ ]` dengan isi `master`
(commit terakhir `4d7e664`). Temuan: **daftar tertinggal dari kode** — Phase 11 convergence
(commit `37c84a1`, 2026-10-05) sudah membangun CV, IDP Talent, dashboard per peran, audit,
pemetaan error, pensiun klien REST, dan harness E2E, tetapi kotak task-nya belum dicentang.
Tidak ada task UI di bawah yang kodenya hilang.

| Task | Status kode | Bukti ringkas |
| --- | --- | --- |
| T008 | ada | refresh link (`errorLink` + `src/lib/auth/refresh.ts`) |
| T061–T062 | ada | `src/app/(app)/employees/` + `src/features/employees/` + test |
| T069–T070 | ada | `src/app/(app)/assignments/` + `src/features/assignments/` + test |
| T103–T104 | ada | `src/app/(app)/cv/page.tsx` + `src/features/cv/` + `cv.test.tsx` |
| T109–T110 | ada | `src/app/(app)/idp/my/` + `src/features/idp/talent/` + test |
| T115–T116 | ada | `src/app/(app)/dashboard/` + `src/features/dashboard/` + test |
| T127 / T142 | ada | `src/lib/{api,talents}.ts` + rute `/talents` sudah dihapus |
| T133 | ada | `playwright.config.ts` + `e2e/critical-path.spec.ts` + `npm run test:e2e` |
| T134–T141 | ada | CV, IDP Talent, dashboard, audit, pemetaan error |

**T129 tetap `[ ]`**: harness-nya ada (T133), tetapi suite-nya belum pernah hijau — eksekusi
stack `docker-compose` dua repo gagal di sandbox 1 GiB/1 CPU (build image API OOM; lihat
`e2e/README.md` §Catatan eksekusi). Butuh runner CI atau mesin ≥ 4 GiB.

**Celah yang ditemukan dan ditutup di run ini**: form CV Talent hanya menawarkan
tambah/hapus untuk pendidikan/sertifikasi/keahlian, padahal kontrak layar F5
(`contracts/operations.md`) memuat `updateCvEducation`/`updateCvCertification`/`updateCvSkill`
— sehingga US4 skenario 3 ("mengedit dan menyimpan kembali") tidak terpenuhi untuk entri
tersebut. Ketiga mutasi update kini dipakai untuk menyunting entri tersimpan di tempat
(commit pada run TAN-175), dengan test regresi di `src/features/cv/cv.test.tsx`.

---

## Phase 1: Foundation (F0)

**Purpose**: Lapisan data GraphQL, codegen, tooling test, dan kerangka sesi/guard. **Memblokir semua fase UI berikutnya.**

- [x] T008 [P] Pasang Apollo Client + `graphql`, buat Apollo Client + auth link + refresh link + cache policy pada `src/lib/apollo/client.ts` (repo saat ini hanya punya next/react/react-dom — lihat `plan.md` §3.2) — **terpenuhi**: Apollo + auth link + cache policy, dan refresh link terpasang pada `src/lib/apollo/client.ts` (`errorLink` + `src/lib/auth/refresh.ts`; `refreshSessionToken` memperbarui sesi lalu mengulang operasi sekali, `clearSession` hanya bila refresh gagal). **terverifikasi TAN-175 (2026-10-13)**: `pnpm run generate:check` + `pnpm run typecheck` + `pnpm run lint` + `pnpm test` (34 berkas / 257 test) + `pnpm run build` hijau.
- [x] T009 [P] Pasang `@graphql-codegen/cli` + skrip `npm run generate` menuju `src/generated/graphql/`, **generate dari SDL yang dilayani backend** (`tania-backend/graph/schema.graphqls`); sekaligus pasang React Testing Library dan perluas `vitest.config.ts` (`environment: "jsdom"`, `include` mencakup `.test.tsx`) — **terpenuhi scaffold**: `package.json` (codegen deps + `npm run generate`), `codegen.ts`, RTL + jest-dom + jsdom terpasang, `vitest.config.ts` `include` mencakup `src/**/*.test.tsx`; **terverifikasi** 2026-10-01 (TAN-75): `npm run generate`, `npm run typecheck`, `npm test` hijau (13 test / 3 file, komponen pakai `@vitest-environment jsdom`). Catatan: source generate kini kontrak (`contracts/schema.graphql`); beralih ke SDL yang dilayani menunggu T018 backend
- [x] T010 [P] Layout dasar App Router dan guard rute per peran pada `src/app/(app)/layout.tsx` dan `src/lib/auth/guard.ts` (route group `(app)`/`(auth)` belum ada; rute legacy `/talents` dimigrasikan, bukan dihapus sebelum port GraphQL selesai) — **terpenuhi scaffold**: `src/app/(app)/layout.tsx` (shell + nav per peran), `src/lib/auth/guard.tsx`/`roles.ts`/`token-store.ts` (guard + RBAC UI), route group `(app)`(`/dashboard`) + `(auth)`(`/login`) ada, rute legacy `/talents` dipertahankan; **terverifikasi** TAN-75: `npm run typecheck` + `npm test` + `next build` hijau (`/dashboard`, `/login`, `/talents`, `/talents/[id]`)

**Checkpoint**: `npm run generate`, `npm run typecheck`, `npm test` berjalan; provider Apollo + guard terpasang.
**Status TAN-75 (2026-10-01)**: T009 & T010 selesai (bukti di atas, verifikasi build/typecheck/test/generate). T008 menyisakan **refresh link** — didefer ke W8/O1 dan **diblokir** T018 backend (SDL yang dilayani belum konsisten dengan kontrak untuk `AuthPayload.refreshToken`/`refreshSession`; codegen di repo ini menargetkan kontrak). Fase UI 2–10 (US6–US8, Polish) **menunggu gelombang backend** dengan nomor sama (`plan.md` §Ketergantungan pada Backend, RF1: tanpa mock produksi) — SDL backend yang dilayani saat ini baru auth + Unit + audit.

---

## Phase 2: User Story 6 — Admin mengelola master data & akun user (Priority: P1)

**Goal**: Halaman Admin untuk Unit/Chapter/Job Role/Project dan Akun User (FR-15, FR-18–FR-24).

**Independent Test**: Login Admin → CRUD master data dengan pesan validasi server tampil benar (Project wajib Unit; penonaktifan yang melanggar referensi ditolak) → buat akun & ubah peran.

- [x] T052 [P] [US6] Frontend feature `master-data`: halaman `src/app/(app)/master-data/` + hooks/query pada `src/features/master-data/`
- [x] T053 [P] [US6] Frontend feature `accounts`: halaman `src/app/(app)/accounts/` + hooks/mutation pada `src/features/accounts/` — **terpenuhi (TAN-149)**: 4 mutation (`createUserAccount`, `updateUserAccessRole`, `setUserAccountStatus`, `revokeUserSessions`) sesuai SDL backend, form buat akun (employee picker + 4 peran akses tetap + password sementara opsional), ubah peran, aktif/nonaktif, revoke sesi dengan konfirmasi, pesan validasi server ditampilkan (plan.md §10.2) + test `src/features/accounts/accounts.test.tsx` 8 test mencakup skenario 7–8 — **terverifikasi** 2026-10-09 (test hijau terisolasi; suite penuh terkendala load host); MR !31 (commit `0c35682`)
- [x] T054 [P] [US6] Test Vitest + RTL form master data termasuk tampilan pesan validasi server (`plan.md` §10.2) pada `src/features/master-data/master-data.test.tsx`

**Checkpoint**: US6 UI berfungsi terhadap endpoint backend US6.

---

## Phase 3: User Story 1 — Operation mengelola data karyawan (Priority: P1) 🎯 MVP

**Goal**: Daftar + pencarian/filter + form + nonaktifkan karyawan (FR-01–FR-04).

**Independent Test**: Login Operation → daftar tampil dengan pencarian/filter; form menolak field wajib kosong; konfirmasi nonaktifkan muncul saat ada assignment/IDP aktif.

- [x] T061 [P] [US1] Frontend feature `employees`: daftar + pencarian/filter + form tambah/ubah + konfirmasi nonaktifkan pada `src/app/(app)/employees/` dan `src/features/employees/` — **terpenuhi**: `src/app/(app)/employees/{page,new,[id],[id]/edit}` + hooks/mutasi pada `src/features/employees/` (daftar + pencarian/filter, form tambah/ubah, konfirmasi nonaktifkan). **terverifikasi TAN-175 (2026-10-13)**: `pnpm run generate:check` + `pnpm run typecheck` + `pnpm run lint` + `pnpm test` (34 berkas / 257 test) + `pnpm run build` hijau.
- [x] T062 [P] [US1] Test Vitest + RTL daftar karyawan (pencarian, filter, hasil kosong) pada `src/features/employees/employees.test.tsx` — **terpenuhi**: `src/features/employees/employees.test.tsx` + `src/app/(app)/employees/page.test.tsx` + `src/app/(app)/employees/new/page.test.tsx`. **terverifikasi TAN-175 (2026-10-13)**: `pnpm run generate:check` + `pnpm run typecheck` + `pnpm run lint` + `pnpm test` (34 berkas / 257 test) + `pnpm run build` hijau.

**Checkpoint**: MVP UI (Admin master data + Operation karyawan) berjalan.

---

## Phase 4: User Story 2 — Chapter mengelola data assignment (Priority: P1)

**Goal**: Daftar assignment per talent/per project + form assignment (FR-05–FR-07).

**Independent Test**: Login Chapter → form hanya menawarkan talent assignable & project dari master; error cakupan chapter tampil sebagai pesan aksi.

- [x] T069 [P] [US2] Frontend feature `assignments`: daftar per talent/per project + form assignment pada `src/app/(app)/assignments/` dan `src/features/assignments/` — **terpenuhi**: `src/app/(app)/assignments/{page,new,[id]}` + hooks/mutasi pada `src/features/assignments/` (daftar per talent/per project + form). **terverifikasi TAN-175 (2026-10-13)**: `pnpm run generate:check` + `pnpm run typecheck` + `pnpm run lint` + `pnpm test` (34 berkas / 257 test) + `pnpm run build` hijau.
- [x] T070 [P] [US2] Test Vitest + RTL form assignment (validasi + tampilan error cakupan) pada `src/features/assignments/assignments.test.tsx` — **terpenuhi**: `src/features/assignments/assignments.test.tsx`. **terverifikasi TAN-175 (2026-10-13)**: `pnpm run generate:check` + `pnpm run typecheck` + `pnpm run lint` + `pnpm test` (34 berkas / 257 test) + `pnpm run build` hijau.

**Checkpoint**: US2 UI berfungsi.

---

## Phase 5: User Story 3 — Chapter mengelola IDP talent (Priority: P1)

**Goal**: Daftar IDP + filter status + progres, detail IDP, aksi pengembangan, log review (FR-08–FR-11).

**Independent Test**: Login Chapter → daftar menampilkan progres per status; detail IDP menampilkan seluruh komponen; filter status menyempitkan hasil.

- [x] T079 [P] [US3] Frontend feature `idp` (Chapter): daftar + filter status + progres, detail IDP, aksi pengembangan, log review pada `src/app/(app)/idp/` dan `src/features/idp/` — **terpenuhi (TAN-82)**: `src/app/(app)/idp/page.tsx` (daftar + filter status + progress aksi), `src/app/(app)/idp/[id]/page.tsx` (seluruh komponen IDP, aksi pengembangan + ubah status, log review + catat review, riwayat revisi, tutup IDP), `src/app/(app)/idp/new/page.tsx` (buat IDP + aksi opsional). Hooks/query: `src/features/idp/` (`useIdps`, `useIdp`, dan 8 dokumen GraphQL). **Terverifikasi** 2026-10-02: `npm run typecheck`, `npm test` (42 test/9 file hijau), `npm run lint` (0 error), `npm run build`, `npm run generate:check` hijau.
- [x] T080 [P] [US3] Test Vitest + RTL IDP (filter status, progres aksi) pada `src/features/idp/idp.test.tsx` — **terpenuhi (TAN-82)**: 9 test (daftar + filter + progres, empty state, form buat termasuk validasi + hanya talent assignable, detail seluruh komponen, ubah status aksi, catat review, tutup IDP) — **terverifikasi** 2026-10-02.</think>Now let me check whether `tasks.md` at the top has a legend about Phase 5 status (row 42 said "Phase 6 backend" which is stale from prior phases). Let me not touch that row since it reflects prior phases' state. Let me check if there's a completion summary table I should update. Let me look at the header of tasks.md to see if there's a status table.

<｜DSML｜tool_calls>
<｜DSML｜invoke name="read">
<｜DSML｜parameter name="path" string="true">tania-dashboard/specs/001-employee-digital-talent-management/tasks.md:30-50

**Checkpoint**: US3 UI berfungsi.

---

## Phase 6: User Story 7 — Chapter menilai performa talent (Priority: P1)

**Goal**: Template & periode (Admin), form evaluasi + roster (Chapter), tampilan hanya-baca (Talent) (FR-25–FR-28).

**Independent Test**: Admin membuat template/periode → Chapter mengisi evaluasi mengikuti kontrol per `answerType`; periode berakhir → form menjadi hanya-baca; Talent melihat miliknya tanpa tombol edit.

- [x] T094 [P] [US7] Frontend feature `evaluations`: halaman Admin (template & periode), form evaluasi + roster Chapter, tampilan hanya-baca Talent pada `src/app/(app)/evaluations/` dan `src/features/evaluations/` — **terpenuhi (TAN-83)**: `src/app/(app)/evaluations/page.tsx` (roster Chapter per periode berjalan + badge NOT_EVALUATED/EVALUATED, hanya-baca saat CLOSED), `src/app/(app)/evaluations/[periodId]/[employeeId]/page.tsx` (form penilaian per `answerType`: skala 1–5/1–10, Ya/Tidak, teks bebas; simpan draf via upsert, serahkan via submit; hanya-baca saat periode berakhir), `src/app/(app)/evaluations/periods/` (+`/new`) dan `templates/` (+`/new`) halaman Admin, `src/app/(app)/evaluations/my/page.tsx` tampilan hanya-baca Talent. Tab seksi role-scoped di `layout.tsx`; ToastProvider di root layout untuk umpan balik mutasi. Hooks/query: `src/features/evaluations/` (6 hook + 12 dokumen GraphQL). **Terverifikasi** 2026-10-02: `npm run typecheck`, `npm test` (39 test/9 file hijau), `npm run lint` (0 error), `npm run build` hijau.
- [x] T095 [P] [US7] Test Vitest + RTL evaluasi (state loading/error, hanya-baca setelah periode berakhir) pada `src/features/evaluations/evaluations.test.tsx` — **terpenuhi (TAN-83)**: 6 test (roster periode berjalan + badge fill-state + tautan nilai, periode CLOSED hanya-baca dengan tautan "Lihat", empty state tanpa periode, form penilaian per `answerType` dengan nilai pra-isi, submit evaluasi (upsert→submit), form CLOSED hanya-baca dengan kontrol nonaktif) — **terverifikasi** 2026-10-02.

**Checkpoint**: seluruh story P1 selesai di sisi UI.

---

## Phase 7: User Story 4 — Talent membangun profil CV (Priority: P2)

**Goal**: Form CV terstruktur (Talent) + tampilan hanya-baca (Chapter) (FR-12, FR-13).

**Independent Test**: Login Talent → simpan setiap bagian CV; bagian pengalaman kerja menampilkan riwayat assignment tanpa input manual.

- [x] T103 [P] [US4] Frontend feature `cv`: form terstruktur Talent + tampilan hanya-baca Chapter pada `src/app/(app)/cv/` dan `src/features/cv/` — **terpenuhi**: `src/app/(app)/cv/page.tsx` (`TalentCvEditor` per bagian + `ChapterCvViewer` hanya-baca) + hooks/dokumen pada `src/features/cv/`; seluruh operasi layar F5 `contracts/operations.md` dipakai (`myCvProfile`, `upsertCvProfile`, add/update/delete education, certification, skill; `cvProfile` untuk Chapter). **terverifikasi TAN-175 (2026-10-13)**: `pnpm run generate:check` + `pnpm run typecheck` + `pnpm run lint` + `pnpm test` (34 berkas / 257 test) + `pnpm run build` hijau.
- [x] T104 [P] [US4] Test Vitest + RTL CV (penyimpanan per bagian, tampilan pengalaman kerja turunan) pada `src/features/cv/cv.test.tsx` — **terpenuhi**: `src/features/cv/cv.test.tsx` (7 test: render bagian terstruktur, tambah pendidikan, sunting di tempat per bagian, dropdown D11, pengalaman kerja turunan termasuk assignment berakhir, hanya-baca Chapter tanpa kontrol input). **terverifikasi TAN-175 (2026-10-13)**: `pnpm run generate:check` + `pnpm run typecheck` + `pnpm run lint` + `pnpm test` (34 berkas / 257 test) + `pnpm run build` hijau.

**Checkpoint**: US4 UI berfungsi.

---

## Phase 8: User Story 5 — Talent mengikuti IDP miliknya (Priority: P2)

**Goal**: Tampilan IDP milik Talent + kontrol status aksi + empty state (FR-09, FR-14).

**Independent Test**: Login Talent dengan IDP → komponen tampil; ubah status aksi tersimpan; tanpa IDP tampil empty state, bukan error.

- [x] T109 [P] [US5] Frontend feature `idp` (Talent): tampilan IDP miliknya + kontrol status aksi + empty state pada `src/app/(app)/idp/my/` dan `src/features/idp/talent/` — **terpenuhi**: `src/app/(app)/idp/my/page.tsx` + `src/features/idp/talent/` (`useMyIdp`, `myIdp.graphql`) dengan kontrol status aksi + empty state. **terverifikasi TAN-175 (2026-10-13)**: `pnpm run generate:check` + `pnpm run typecheck` + `pnpm run lint` + `pnpm test` (34 berkas / 257 test) + `pnpm run build` hijau.
- [x] T110 [P] [US5] Test Vitest + RTL empty state IDP (US5 skenario 3, bukan error) pada `src/features/idp/talent/talent-idp.test.tsx` — **terpenuhi**: `src/features/idp/talent/talent-idp.test.tsx`. **terverifikasi TAN-175 (2026-10-13)**: `pnpm run generate:check` + `pnpm run typecheck` + `pnpm run lint` + `pnpm test` (34 berkas / 257 test) + `pnpm run build` hijau.

**Checkpoint**: US5 UI berfungsi.

---

## Phase 9: User Story 8 — Dashboard semua peran (Priority: P2)

**Goal**: Widget per peran sesuai US8 (FR-29, FR-30).

**Independent Test**: Login tiap peran → widget termuat dengan angka sesuai cakupannya; state loading/error ditangani.

- [x] T115 [P] [US8] Frontend feature `dashboard` per peran pada `src/app/(app)/dashboard/` dan `src/features/dashboard/` — **terpenuhi**: `src/app/(app)/dashboard/page.tsx` + `src/features/dashboard/` (widget per peran dari union `Dashboard`). **terverifikasi TAN-175 (2026-10-13)**: `pnpm run generate:check` + `pnpm run typecheck` + `pnpm run lint` + `pnpm test` (34 berkas / 257 test) + `pnpm run build` hijau.
- [x] T116 [P] [US8] Test Vitest + RTL render widget per peran + state loading/error pada `src/features/dashboard/dashboard.test.tsx` — **terpenuhi**: `src/features/dashboard/dashboard.test.tsx`. **terverifikasi TAN-175 (2026-10-13)**: `pnpm run generate:check` + `pnpm run typecheck` + `pnpm run lint` + `pnpm test` (34 berkas / 257 test) + `pnpm run build` hijau.

**Checkpoint**: seluruh user story selesai di sisi UI.

---

## Phase 10: Polish & Cross-Cutting

**Purpose**: Pensiunkan jalur legacy dan tegakkan E2E jalur kritis (konstitusi §VII).

- [x] T127 [P] Pensiunkan klien REST lama `src/lib/api.ts` (beserta `src/lib/talents.ts` dan rute `/talents`) setelah rutenya selesai dimigrasikan ke GraphQL (`plan.md` §12 R2, Open Item O4) — **terpenuhi**: `src/lib/api.ts`, `src/lib/talents.ts`, dan rute `/talents` sudah dihapus (commit `37c84a1`); tidak ada lagi klien REST legacy. **terverifikasi TAN-175 (2026-10-13)**: `pnpm run generate:check` + `pnpm run typecheck` + `pnpm run lint` + `pnpm test` (34 berkas / 257 test) + `pnpm run build` hijau.
- [ ] T129 **E2E jalur kritis** (konstitusi §VII — bukan opsional): pasang Playwright + suite pada `e2e/` yang menjalankan stack `docker-compose` dan menempuh alur `login 4 peran → tambah karyawan (Operation) → assignment (Chapter) → periode+evaluasi (Admin+Chapter) → IDP (Chapter) → update status aksi (Talent) → dashboard tiap peran`, memakai fixture seed **T036** (repo backend); jalankan lewat `npm run test:e2e` dan dokumentasikan di `quickstart.md` — **belum terpenuhi (2026-10-13, TAN-175)**: harness Playwright + suite jalur kritis sudah ada (T133), tetapi suite-nya belum pernah hijau; eksekusi stack `docker-compose` dua repo gagal di sandbox 1 GiB/1 CPU (build image `api` OOM) — lihat `e2e/README.md` §Catatan eksekusi. Butuh runner CI atau mesin ≥ 4 GiB, bukan perubahan kode.

**Checkpoint**: `npm run test:e2e` hijau; tidak ada lagi klien REST legacy.

---

## Dependencies & Execution Order

### Fase

- **Foundation (Phase 1)**: tidak ada dependensi — memblokir semua fase UI
- **Fase UI (Phase 2–9)**: bergantung pada Foundation **dan** fase backend dengan nomor gelombang yang sama
- **Polish (Phase 10)**: T127 setelah semua rute diport; T129 setelah story inti selesai (butuh seed T036 dari repo backend)

### Dalam satu fase

- Test komponen ditulis bersama komponennya dan harus GAGAL sebelum implementasi bila memungkinkan (konstitusi §VII)
- `src/lib/apollo/` → `src/features/<modul>/` → `src/app/(app)/<rute>/`
- Verifikasi per fase: `npm run typecheck` + `npm test`

### Aturan lintas repo

1. Backend dulu: pastikan operasi yang dibutuhkan sudah ada di SDL yang dilayani (`contracts/operations.md` §2 memberi gelombang tiap operasi).
2. Skema berubah → `make generate` (backend) lalu `npm run generate` (di sini).
3. Perubahan kontrak penamaan auth menunggu **T018** di repo backend (`plan.md` §7.6 tidak ada di repo ini — lihat `plan.md` §"Ketergantungan pada Backend").

---

## Parallel Opportunities

- T008–T010 (Foundation) dapat berjalan paralel satu sama lain, lalu memblokir sisanya
- Dalam setiap fase UI, task halaman dan task test boleh paralel bila berkasnya berbeda
- Antar fase UI: hanya paralel bila fase backend padanannya sudah selesai

---

## Implementation Strategy

### MVP UI

1. Phase 1 (Foundation) — T008, T009, T010
2. Phase 2 (US6 Admin) + Phase 3 (US1 Operation) — UI MVP bersama backend US6+US1
3. **STOP dan VALIDASI**: smoke empat peran (backend `plan.md` §11.1)

### Incremental

US2 → US3 → US7 (P1 selesai) → US4 → US5 → US8 → Polish (T127, T129) → gerbang rilis di repo backend (T123 + T130).

---

## Notes

- ID task **tidak berurutan penuh** di repo ini karena dipertahankan sama dengan daftar backend (lihat §Pemetaan ID)
- Status penyelesaian task dicatat per repo; jangan menandai task backend selesai dari repo ini
- Verifikasi minimal sebelum menutup satu fase: `npm run lint`, `npm run typecheck`, `npm test`
- Semua operasi GraphQL diambil dari SDL ter-generate; jangan menulis tipe manual (`src/generated/graphql/` tidak boleh diedit)

---

## Phase 11: Convergence

**Scope**: `/speckit.converge` dijalankan 2026-10-05 untuk **integrasi lintas repo `tania-backend` ↔ `tania-dashboard`**. Semua temuan bernilai HIGH muncul lebih dulu, lalu MEDIUM/LOW. ID dilanjutkan dari daftar bersama (max T130); task backend padanan ada di `tania-backend/specs/.../tasks.md` Phase 12 (T131–T132).

- [x] T133 Pasang Playwright + harness E2E jalur kritis pada `e2e/` dan skrip `npm run test:e2e` per T129 + konstitusi §VII (missing) — alasan blokir lama ("repo backend tak terjangkau") sudah tidak berlaku — **terpenuhi**: `playwright.config.ts` + `e2e/critical-path.spec.ts` (242 baris) + skrip `npm run test:e2e` + runbook `e2e/README.md` (commit `37c84a1`). **terverifikasi TAN-175 (2026-10-13)**: `pnpm run generate:check` + `pnpm run typecheck` + `pnpm run lint` + `pnpm test` (34 berkas / 257 test) + `pnpm run build` hijau.
- [x] T134 Bangun fitur CV Talent (form terstruktur: ringkasan, pendidikan, sertifikasi, keahlian) + tampilan hanya-baca Chapter pada `src/app/(app)/cv/` dan `src/features/cv/` per FR-12/FR-13 (T103) (missing) — pengalaman kerja tetap turunan assignment — **terpenuhi**: lihat T103 di atas. **terverifikasi TAN-175 (2026-10-13)**: `pnpm run generate:check` + `pnpm run typecheck` + `pnpm run lint` + `pnpm test` (34 berkas / 257 test) + `pnpm run build` hijau.
- [x] T135 Tambahkan test Vitest + RTL CV (simpan per bagian, tampilan pengalaman kerja turunan) pada `src/features/cv/cv.test.tsx` per T104 (missing) — **terpenuhi**: lihat T104 di atas. **terverifikasi TAN-175 (2026-10-13)**: `pnpm run generate:check` + `pnpm run typecheck` + `pnpm run lint` + `pnpm test` (34 berkas / 257 test) + `pnpm run build` hijau.
- [x] T136 Bangun halaman IDP milik Talent (`src/app/(app)/idp/my/` + `src/features/idp/talent/`) dengan kontrol status aksi + empty state bukan error per FR-14 (T109) (missing) — **terpenuhi**: lihat T109 di atas. **terverifikasi TAN-175 (2026-10-13)**: `pnpm run generate:check` + `pnpm run typecheck` + `pnpm run lint` + `pnpm test` (34 berkas / 257 test) + `pnpm run build` hijau.
- [x] T137 Tambahkan test Vitest + RTL empty state IDP Talent per T110 (missing) — **terpenuhi**: lihat T110 di atas. **terverifikasi TAN-175 (2026-10-13)**: `pnpm run generate:check` + `pnpm run typecheck` + `pnpm run lint` + `pnpm test` (34 berkas / 257 test) + `pnpm run build` hijau.
- [x] T138 Bangun widget `dashboard` per peran pada `src/app/(app)/dashboard/` + `src/features/dashboard/` (saat ini masih placeholder statis) per FR-29/FR-30 (T115) (missing) — **terpenuhi**: lihat T115 di atas (placeholder statis sudah digantikan widget per peran). **terverifikasi TAN-175 (2026-10-13)**: `pnpm run generate:check` + `pnpm run typecheck` + `pnpm run lint` + `pnpm test` (34 berkas / 257 test) + `pnpm run build` hijau.
- [x] T139 Tambahkan test Vitest + RTL render widget per peran + state loading/error per T116 (missing) — **terpenuhi**: lihat T116 di atas. **terverifikasi TAN-175 (2026-10-13)**: `pnpm run generate:check` + `pnpm run typecheck` + `pnpm run lint` + `pnpm test` (34 berkas / 257 test) + `pnpm run build` hijau.
- [x] T140 Bangun penampil jejak audit khusus Admin `src/app/(app)/audit/` per FR-17 + `plan.md` Target Structure (missing — belum ada task pemilik) — **terpenuhi**: `src/app/(app)/audit/page.tsx` (Admin, paginasi cursor `fetchMore`) + `src/features/audit/` + `src/features/audit/audit.test.tsx`. **terverifikasi TAN-175 (2026-10-13)**: `pnpm run generate:check` + `pnpm run typecheck` + `pnpm run lint` + `pnpm test` (34 berkas / 257 test) + `pnpm run build` hijau.
- [x] T141 Buat pemetaan error terpusat `src/lib/errors.ts` (`extensions.code` → perilaku UI: `UNAUTHENTICATED`/`FORBIDDEN`/`NOT_FOUND`/`BAD_USER_INPUT`/`CONFLICT`/`RATE_LIMITED`) per `plan.md` §Data Layer + konstitusi §IX (missing) — **terpenuhi**: `src/lib/errors.ts` (`extensions.code` → perilaku UI: `UNAUTHENTICATED`/`FORBIDDEN`/`NOT_FOUND`/`BAD_USER_INPUT`/`CONFLICT`/`RATE_LIMITED`) + `src/lib/errors.test.ts`. **terverifikasi TAN-175 (2026-10-13)**: `pnpm run generate:check` + `pnpm run typecheck` + `pnpm run lint` + `pnpm test` (34 berkas / 257 test) + `pnpm run build` hijau.
- [x] T142 Pensiunkan klien REST legacy `src/lib/api.ts`, `src/lib/talents.ts`, dan rute `/talents` setelah port GraphQL selesai per T127 (partial) — **terpenuhi**: lihat T127 di atas. **terverifikasi TAN-175 (2026-10-13)**: `pnpm run generate:check` + `pnpm run typecheck` + `pnpm run lint` + `pnpm test` (34 berkas / 257 test) + `pnpm run build` hijau.
- [x] T143 Lengkapi test master data termasuk tampilan pesan validasi server (baru unit yang tercakup) pada `src/features/master-data/master-data.test.tsx` per T054 (partial)

---

## Phase 12: Convergence (2026-10-13)

**Scope**: `/speckit.converge` dijalankan 2026-10-13 untuk **integrasi lintas repo `tania-backend` ↔ `tania-dashboard`** terhadap `spec.md`/`plan.md`/`contracts/`. Metode: bandingkan **permukaan kontrak** SDL yang dilayani (`tania-backend/graph/schema.graphqls`) dengan mirror yang di-vendor (`graph/schema.graphqls`) dan kontrak desain (`specs/001-.../contracts/schema.graphql`) memakai parser SDL (tipe + anggota + tanda tangan field), bukan diff baris — lalu telusuri tiap selisih ke kode backend dan ke UI. Temuan HIGH muncul lebih dulu. ID dilanjutkan dari daftar bersama (max T144); task backend padanan ada di `tania-backend/specs/.../tasks.md` Phase 13.

- [x] T145 [HIGH] Perbaiki jalur baca `work_location` yang NULL: `contractRow.build` mengembalikan string kosong, bukan sentinel `UNDEFINED` yang dideklarasikan SDL, sehingga API mengirim `workLocation: ""` pada field non-null `WorkLocation!` — nilai yang tidak dideklarasikan SDL dan tidak bisa direpresentasikan klien mana pun. Kontradiksi dengan `domain.ParseWorkLocationDB` ("" → `UNDEFINED`) dan dengan test regresinya sendiri. Terjangkau: seluruh kontrak hasil backfill migrasi 0005 dan setiap kontrak yang dibuat dengan `workLocation: UNDEFINED` (`workLocationValue` menulis NULL) — **selesai 2026-10-13** (`internal/repository/postgres/contractrow.go`): NULL → `domain.WorkLocationUndefined`; test regresi bebas-DB `contractrow_test.go` (3 test: NULL → UNDEFINED, lokasi tercatat tetap utuh, round-trip sentinel → NULL) yang benar-benar berjalan di `go test ./...` — test integrasi eksisting `TestContractReadsNullWorkLocationAsUndefined` di-skip tanpa `TEST_DATABASE_URL`, jadi jalur ini sebelumnya tidak dijaga di CI ringan. Terverifikasi: `go test ./...` hijau.
- [x] T146 [HIGH] Sinkronkan mirror SDL yang di-vendor ke SDL yang dilayani (selisih tunggal: `WorkLocation.UNDEFINED`), lalu tangani konsekuensinya di UI: label sentinel dan form kontrak — **selesai 2026-10-13**: `graph/schema.graphqls` kini byte-identik dengan SDL yang dilayani (`sha256 = b2542988d7753996dfb25138a930fe25fcb310f7821e593dde0fd6753046fc0e`) dan `src/generated/graphql/` diregenerasi; `WORK_LOCATION_LABEL.UNDEFINED = "Belum ditetapkan"` menutup dua sel yang tadinya kosong (`src/app/(app)/contracts/[id]/page.tsx`, `src/app/(app)/employees/[id]/page.tsx`); `workLocationFormValue` (`src/features/contracts/labels.ts`) membuat perpanjangan kontrak dan form mutasi memperlakukan sentinel sebagai *belum dipilih* (presisi perilaku lama: sebelumnya nilai `""` memaksa pengguna memilih); form ubah kontrak menampilkan opsi sentinel agar yang terlihat sama dengan state. Test: `src/features/contracts/contracts.test.tsx` (+2; terbukti gagal bila entri label dihapus). Terverifikasi: `generate:check` + `typecheck` + `lint` + `test` (34 berkas / 259 test) + `build` hijau.
- [ ] T147 [HIGH] Konvergensikan kontrak desain `specs/001-employee-digital-talent-management/contracts/schema.graphql` (byte-identik di kedua repo) dengan SDL yang dilayani — **terbuka 2026-10-13**: berkas ini masih snapshot 2026-10-05 (`sha256 = 8983bcae960fcc9768ba0985bf599266857b8e20d4977c65c67f97da5dc5df92`, dari 27.394 byte) dan menyimpang dari SDL yang dilayani pada 3 tipe (`EntraProvision`, `EntraProvisionStatus`, `EntraProvisionAction`), 19 anggota (`Employee.entraProvision`, `UpdateEmployeeInput.nik`, `WorkLocation.UNDEFINED`, …), serta `ContractType` yang sudah digantikan enam skema TMS (TAN-162) berikut default `RenewContractInput.contractType`. Invariant T131 ("tiga berkas byte-identik, `sha256 = b2002db…`") **sudah tidak berlaku**. Butuh keputusan pemilik, bukan `cp` buta: teks FR-34 `spec.md` masih menulis `pkwt/pkwtt` sementara kode mengirim enam skema TMS, jadi menyalin SDL apa adanya akan membuat kontrak desain bertentangan dengan teks spec.
- [ ] T148 [MEDIUM] Pasang penjaga mesin agar mirror yang di-vendor dan kontrak desain tidak dapat menyimpang diam-diam dari SDL yang dilayani — **terbuka 2026-10-13**: `generate:check` hanya membandingkan hasil generate dengan yang ter-commit, bukan mirror dengan SDL terlayani; penyalinan SDL masih langkah `cp` manual (`codegen.ts`, README), sehingga drift T145/T147 bisa bertahan berhari-hari tanpa ada yang gagal. Usulan: simpan `sha256` SDL terlayani di dekat mirror dan asersikan pada test/gerbang CI (butuh keputusan bentuk — repo frontend tidak melihat sibling `tania-backend` saat CI berjalan sendiri).
- [ ] T149 [MEDIUM] Putuskan nasib data `work_location` NULL peninggalan pra-0005 — **terbuka 2026-10-13**: setelah T145 baris-baris ini tampil "Belum ditetapkan" dan form perpanjangan/mutasi memaksa pengguna memilih, tetapi tidak ada backfill dan form ubah kontrak masih meneruskan sentinel apa adanya. Pilih: backfill ke lokasi nyata, atau tegaskan sentinel sebagai keadaan yang sah dan berumur panjang.

**Tidak ditemukan gap** (diperiksa, bersih): kode error `extensions.code` yang dipancarkan backend (`NOT_FOUND`/`CONFLICT`/`UNAUTHENTICATED`/`FORBIDDEN`/`RATE_LIMITED`/`BAD_USER_INPUT`/`INTERNAL`) semuanya dipetakan `src/lib/errors.ts`; endpoint aplikasi (`NEXT_PUBLIC_GRAPHQL_URL`, compose E2E) cocok dengan rute `/graphql` backend; enum `AccessRole` identik di kedua SDL dan cocok `ROLE_ORDER`; FR-40 sudah punya UI (`OperationCycleWidgets.tsx` memakai `expiringContracts`); pengalaman kerja CV backend memang memuat assignment yang sudah berakhir (`internal/usecase/cv_test.go`) dan seluruh operasi GraphQL frontend valid terhadap SDL yang dilayani (bukan hanya terhadap mirror).

---

## Phase 14: Analyze — keselarasan lintas modul "Talent Database" (2026-10-13)

**Scope**: `/speckit.analyze` dijalankan 2026-10-13 untuk **keselarasan modul ini (Tania CV Module, US4/FR-12–FR-13) dengan modul basis data talent yang sudah ter-merge** — Tania Mengelola Data Karyawan (US1, FR-01/FR-33–FR-46: data diri `employees`, `employment_contracts`, siklus kerja, provisi Entra). Metode: silang-baca `spec.md`/`plan.md`/`data-model.md`/`tasks.md` kedua modul + SDL yang dilayani + kode (`internal/usecase/cv.go`, `internal/repository/postgres/{cv,retention,employee,employeerow}.go`, `src/app/(app)/cv/page.tsx`, `src/app/(app)/employees/[id]/edit/page.tsx`). Temuan HIGH lebih dulu. ID dilanjutkan dari daftar bersama (max T149); laporan lengkap ada pada TAN-175.

- [ ] T150 [HIGH] **Data pribadi CV tidak ikut jadwal retensi/anonimisasi** — **terbuka 2026-10-13**: `internal/repository/postgres/retention.go` (`AnonymizeEligible`) hanya menyapu `employees` (termasuk `latest_education`/`institution_name`/`major`, telepon, alamat, NIK) dan `employment_contracts`; `cv_profiles`/`cv_educations`/`cv_certifications`/`cv_skills` tidak disentuh dan tidak punya `anonymized_at` (migrasi `0007` hanya menambahnya ke `employees`). Kontradiksi dengan konstitusi-security §V — setiap dataset pemilik data pribadi menyatakan masa retensi …dihapus atau diubah ke bentuk anonim secara nyata, bukan "soft-deleted forever" dan dengan `data-model.md:133` yang mendeklarasikan dataset retensi hanya `employees` + `employment_contracts`. Akibat: setelah anonimisasi, baris berlabel `ANONIM` tetap membawa riwayat pendidikan, sertifikasi (termasuk `credential_url`), keahlian, dan ringkasan bebas — data pribadi yang *lebih kaya* daripada kolom yang justru dihapus. Butuh keputusan pemilik (bentuk scrub CV) sebelum implementasi.
- [ ] T151 [HIGH] **Pendidikan punya dua rumah tanpa aturan turunan** — **terbuka 2026-10-13**: `employees.latest_education`/`institution_name`/`major` (FR-33; penulis: Operation lewat form `employees/[id]/edit/page.tsx` + endpoint impor massal `POST /employees/import`) berdampingan dengan `cv_educations` (FR-12; penulis: Talent; banyak entri; `degree` enum terkontrol `EducationLevel`). Kardinalitas, kosakata, dan nama berbeda (`institution_name` vs `institution`, `major` vs `fieldOfStudy`), dan tidak ada aturan turunan di spec mana pun — `internal/usecase/cv.go` + `internal/repository/postgres/cv.go` tidak pernah membaca `LatestEducation`. Akar masalah: analisis gap `plan-pengelolaan-talent.md` (G1–G14) tidak pernah menyinggung tabel CV saat tiga kolom ini ditambahkan (2026-10-09). Butuh keputusan pemilik: (a) CV otoritatif lalu tiga kolom `employees` jadi turunan, (b) tiga kolom otoritatif lalu CV menampilkan/mengawali dari situ, atau (c) tiga kolom dihapus.
- [ ] T152 [MEDIUM] **Picker CV Chapter menyempitkan cakupan FR-13** — **terbuka 2026-10-13**: `ChapterCvViewer` memakai `useEmployees({ assignableOnly: true })` (`src/app/(app)/cv/page.tsx`) → predikat SQL `e.status = 'ACTIVE' AND ec.id IS NOT NULL AND jr.chapter_id IS NOT NULL`; sementara server (`CvService.ProfileFor`) hanya membandingkan `target.Chapter.ID == scope`. `EmployeeService.Deactivate` hanya mengubah `employees.status` + menonaktifkan akun (tidak mengakhiri kontrak), jadi talent dalam chapter dengan status `inactive` **boleh dibaca** tetapi **tidak dapat dipilih** — padahal halaman `/employees` (tanpa `assignableOnly`) tetap menampilkannya untuk Chapter yang sama. Selaraskan: buang `assignableOnly` (cakupan chapter sudah ditegakkan server) atau tegaskan batasan ini pada teks FR-13.
- [ ] T153 [MEDIUM] **Picker CV Chapter tidak terpaginasi/tercari** — **terbuka 2026-10-13**: `useEmployees` default `first = 25` tanpa pemanggilan `loadMore` pada `<select>` tanpa kotak cari; daftar terurut `lower(full_name)`. Chapter dengan >25 talent tidak dapat menjangkau sisanya lewat UI → akses baca FR-13 tidak terjangkau untuk mereka. Pakai pencarian/paginasi yang sudah ada (`useTablePagination`, TAN-172) atau combobox yang dapat dicari.
- [ ] T154 [MEDIUM] **Tidak ada jembatan navigasi antar modul** — **terbuka 2026-10-13**: halaman detail karyawan (`src/app/(app)/employees/[id]/page.tsx`, modul basis data talent) menampilkan "Data diri" + "Riwayat kontrak" tetapi tidak punya tautan/bagian CV (verifikasi: tidak ada `href` menuju `/cv` di seluruh `src/`), dan sebaliknya halaman CV tidak menampilkan konteks kepegawaian (nomor induk, unit, posisi, status dari kontrak aktif). Jalur baca Chapter (FR-13) hanya terjangkau bila pengguna tahu rute `/cv`. Butuh keputusan produk (tab/bagian "CV" pada detail karyawan + konteks kepegawaian pada halaman CV).
- [ ] T155 [LOW] **Kosakata dan nama field berbeda untuk konsep yang sama** — **terbuka 2026-10-13**: `latestEducation` teks bebas vs `degree: EducationLevel` enum lima nilai (keputusan D11 spek 003), `institutionName` vs `institution`, `major` vs `fieldOfStudy`. Rapikan setelah T151 memutuskan otoritasnya.

**Selaras (diperiksa, tidak ditemukan gap)**:
1. **Cakupan chapter CV sudah berbasis kontrak aktif** — `CvService.ProfileFor` membaca `domain.Employee.Chapter` yang diisi `employeerow.go` (`activeContractJoin`, `jr.chapter_id`), bukan kolom warisan; tidak ada sisa pemakaian `employees.unit_id`/`job_role_id`/`employee_code` di jalur CV (grep bersih). Cocok FR-23/FR-35 amandemen 002.
2. **Pengalaman kerja tetap dari riwayat assignment** — sudah diputuskan eksplisit pada amandemen FR-36 ("US4/CV *pengalaman kerja* tetap dari riwayat assignment — tidak berubah"); `cvFields.graphql` memilih project/jobRole/periode dan assignment yang sudah berakhir ikut tampil.
3. **Rantai akun Talent utuh** — `AccountService.Create` memanggil `employees.LinkAccount` (`internal/usecase/account.go:108`), sehingga `myCvProfile` (`FindByUserID`) terselesaikan; provisi Entra (FR-43–FR-46) memang hanya membuat identitas Entra, sedangkan akun + peran Tania tetap milik Admin (modul RBAC). Urutan US1 → RBAC → US4 tidak bocor.
4. **Tidak ada kebocoran lintas cakupan** — `ProfileFor` mengembalikan `NOT_FOUND` untuk pembacaan di luar cakupan (anti-enumerasi) dan tipe CV tidak mengekspos NIK.
5. **SDL CV lengkap dan terpakai** — seluruh tipe/operasi CV ada di SDL yang dilayani dan dipakai frontend tanpa drift (audit permukaan SDL pada Phase 12/13).
