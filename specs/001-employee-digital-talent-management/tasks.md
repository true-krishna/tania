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

## Phase 1: Foundation (F0)

**Purpose**: Lapisan data GraphQL, codegen, tooling test, dan kerangka sesi/guard. **Memblokir semua fase UI berikutnya.**

- [ ] T008 [P] Pasang Apollo Client + `graphql`, buat Apollo Client + auth link + refresh link + cache policy pada `src/lib/apollo/client.ts` (repo saat ini hanya punya next/react/react-dom — lihat `plan.md` §3.2) — **sebagian terpenuhi**: Apollo + auth link + cache policy terpasang (`src/lib/apollo/client.ts`, `provider.tsx`); **refresh link tertunda** (didefer desain ke W8/O1) dan menunggu **T018 di repo backend** — kontrak `AuthPayload` hasil codegen belum memuat `refreshToken`/`refreshSession` (divergensi auth, lihat `plan.md` §4 aturan 3)
- [x] T009 [P] Pasang `@graphql-codegen/cli` + skrip `npm run generate` menuju `src/generated/graphql/`, **generate dari SDL yang dilayani backend** (`tania-backend/graph/schema.graphqls`); sekaligus pasang React Testing Library dan perluas `vitest.config.ts` (`environment: "jsdom"`, `include` mencakup `.test.tsx`) — **terpenuhi scaffold**: `package.json` (codegen deps + `npm run generate`), `codegen.ts`, RTL + jest-dom + jsdom terpasang, `vitest.config.ts` `include` mencakup `src/**/*.test.tsx`; **terverifikasi** 2026-10-01 (TAN-75): `npm run generate`, `npm run typecheck`, `npm test` hijau (13 test / 3 file, komponen pakai `@vitest-environment jsdom`). Catatan: source generate kini kontrak (`contracts/schema.graphql`); beralih ke SDL yang dilayani menunggu T018 backend
- [x] T010 [P] Layout dasar App Router dan guard rute per peran pada `src/app/(app)/layout.tsx` dan `src/lib/auth/guard.ts` (route group `(app)`/`(auth)` belum ada; rute legacy `/talents` dimigrasikan, bukan dihapus sebelum port GraphQL selesai) — **terpenuhi scaffold**: `src/app/(app)/layout.tsx` (shell + nav per peran), `src/lib/auth/guard.tsx`/`roles.ts`/`token-store.ts` (guard + RBAC UI), route group `(app)`(`/dashboard`) + `(auth)`(`/login`) ada, rute legacy `/talents` dipertahankan; **terverifikasi** TAN-75: `npm run typecheck` + `npm test` + `next build` hijau (`/dashboard`, `/login`, `/talents`, `/talents/[id]`)

**Checkpoint**: `npm run generate`, `npm run typecheck`, `npm test` berjalan; provider Apollo + guard terpasang.
**Status TAN-75 (2026-10-01)**: T009 & T010 selesai (bukti di atas, verifikasi build/typecheck/test/generate). T008 menyisakan **refresh link** — didefer ke W8/O1 dan **diblokir** T018 backend (SDL yang dilayani belum konsisten dengan kontrak untuk `AuthPayload.refreshToken`/`refreshSession`; codegen di repo ini menargetkan kontrak). Fase UI 2–10 (US6–US8, Polish) **menunggu gelombang backend** dengan nomor sama (`plan.md` §Ketergantungan pada Backend, RF1: tanpa mock produksi) — SDL backend yang dilayani saat ini baru auth + Unit + audit.

---

## Phase 2: User Story 6 — Admin mengelola master data & akun user (Priority: P1)

**Goal**: Halaman Admin untuk Unit/Chapter/Job Role/Project dan Akun User (FR-15, FR-18–FR-24).

**Independent Test**: Login Admin → CRUD master data dengan pesan validasi server tampil benar (Project wajib Unit; penonaktifan yang melanggar referensi ditolak) → buat akun & ubah peran.

- [ ] T052 [P] [US6] Frontend feature `master-data`: halaman `src/app/(app)/master-data/` + hooks/query pada `src/features/master-data/`
- [ ] T053 [P] [US6] Frontend feature `accounts`: halaman `src/app/(app)/accounts/` + hooks/mutation pada `src/features/accounts/`
- [ ] T054 [P] [US6] Test Vitest + RTL form master data termasuk tampilan pesan validasi server (`plan.md` §10.2) pada `src/features/master-data/master-data.test.tsx`

**Checkpoint**: US6 UI berfungsi terhadap endpoint backend US6.

---

## Phase 3: User Story 1 — Operation mengelola data karyawan (Priority: P1) 🎯 MVP

**Goal**: Daftar + pencarian/filter + form + nonaktifkan karyawan (FR-01–FR-04).

**Independent Test**: Login Operation → daftar tampil dengan pencarian/filter; form menolak field wajib kosong; konfirmasi nonaktifkan muncul saat ada assignment/IDP aktif.

- [ ] T061 [P] [US1] Frontend feature `employees`: daftar + pencarian/filter + form tambah/ubah + konfirmasi nonaktifkan pada `src/app/(app)/employees/` dan `src/features/employees/`
- [ ] T062 [P] [US1] Test Vitest + RTL daftar karyawan (pencarian, filter, hasil kosong) pada `src/features/employees/employees.test.tsx`

**Checkpoint**: MVP UI (Admin master data + Operation karyawan) berjalan.

---

## Phase 4: User Story 2 — Chapter mengelola data assignment (Priority: P1)

**Goal**: Daftar assignment per talent/per project + form assignment (FR-05–FR-07).

**Independent Test**: Login Chapter → form hanya menawarkan talent assignable & project dari master; error cakupan chapter tampil sebagai pesan aksi.

- [ ] T069 [P] [US2] Frontend feature `assignments`: daftar per talent/per project + form assignment pada `src/app/(app)/assignments/` dan `src/features/assignments/`
- [ ] T070 [P] [US2] Test Vitest + RTL form assignment (validasi + tampilan error cakupan) pada `src/features/assignments/assignments.test.tsx`

**Checkpoint**: US2 UI berfungsi.

---

## Phase 5: User Story 3 — Chapter mengelola IDP talent (Priority: P1)

**Goal**: Daftar IDP + filter status + progres, detail IDP, aksi pengembangan, log review (FR-08–FR-11).

**Independent Test**: Login Chapter → daftar menampilkan progres per status; detail IDP menampilkan seluruh komponen; filter status menyempitkan hasil.

- [ ] T079 [P] [US3] Frontend feature `idp` (Chapter): daftar + filter status + progres, detail IDP, aksi pengembangan, log review pada `src/app/(app)/idp/` dan `src/features/idp/`
- [ ] T080 [P] [US3] Test Vitest + RTL IDP (filter status, progres aksi) pada `src/features/idp/idp.test.tsx`

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

- [ ] T103 [P] [US4] Frontend feature `cv`: form terstruktur Talent + tampilan hanya-baca Chapter pada `src/app/(app)/cv/` dan `src/features/cv/`
- [ ] T104 [P] [US4] Test Vitest + RTL CV (penyimpanan per bagian, tampilan pengalaman kerja turunan) pada `src/features/cv/cv.test.tsx`

**Checkpoint**: US4 UI berfungsi.

---

## Phase 8: User Story 5 — Talent mengikuti IDP miliknya (Priority: P2)

**Goal**: Tampilan IDP milik Talent + kontrol status aksi + empty state (FR-09, FR-14).

**Independent Test**: Login Talent dengan IDP → komponen tampil; ubah status aksi tersimpan; tanpa IDP tampil empty state, bukan error.

- [ ] T109 [P] [US5] Frontend feature `idp` (Talent): tampilan IDP miliknya + kontrol status aksi + empty state pada `src/app/(app)/idp/my/` dan `src/features/idp/talent/`
- [ ] T110 [P] [US5] Test Vitest + RTL empty state IDP (US5 skenario 3, bukan error) pada `src/features/idp/talent/talent-idp.test.tsx`

**Checkpoint**: US5 UI berfungsi.

---

## Phase 9: User Story 8 — Dashboard semua peran (Priority: P2)

**Goal**: Widget per peran sesuai US8 (FR-29, FR-30).

**Independent Test**: Login tiap peran → widget termuat dengan angka sesuai cakupannya; state loading/error ditangani.

- [ ] T115 [P] [US8] Frontend feature `dashboard` per peran pada `src/app/(app)/dashboard/` dan `src/features/dashboard/`
- [ ] T116 [P] [US8] Test Vitest + RTL render widget per peran + state loading/error pada `src/features/dashboard/dashboard.test.tsx`

**Checkpoint**: seluruh user story selesai di sisi UI.

---

## Phase 10: Polish & Cross-Cutting

**Purpose**: Pensiunkan jalur legacy dan tegakkan E2E jalur kritis (konstitusi §VII).

- [ ] T127 [P] Pensiunkan klien REST lama `src/lib/api.ts` (beserta `src/lib/talents.ts` dan rute `/talents`) setelah rutenya selesai dimigrasikan ke GraphQL (`plan.md` §12 R2, Open Item O4)
- [ ] T129 **E2E jalur kritis** (konstitusi §VII — bukan opsional): pasang Playwright + suite pada `e2e/` yang menjalankan stack `docker-compose` dan menempuh alur `login 4 peran → tambah karyawan (Operation) → assignment (Chapter) → periode+evaluasi (Admin+Chapter) → IDP (Chapter) → update status aksi (Talent) → dashboard tiap peran`, memakai fixture seed **T036** (repo backend); jalankan lewat `npm run test:e2e` dan dokumentasikan di `quickstart.md`

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
