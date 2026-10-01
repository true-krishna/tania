# Implementation Plan: Aplikasi Employee (Digital Talent) Management — Frontend

**Branch**: `001-employee-digital-talent-management` | **Date**: 2026-10-01 | **Spec**: `specs/001-employee-digital-talent-management/spec.md`

**Input**: Feature specification dari `/specs/001-employee-digital-talent-management/spec.md`

**Repo**: `codex/frontend/tania-dashboard` — dokumen ini **khusus frontend**. Plan backend
(arsitektur, data model, API) ada di `codex/backend/tania-backend`
(`specs/001-employee-digital-talent-management/plan.md`).

> **Pembagian artefak (diputuskan 2026-10-01, "opsi C")**: repo ini memiliki `plan.md` (dokumen
> ini) + `research.md` + `data-model.md` + `quickstart.md` + `contracts/`. **Urutan pengerjaan
> task tetap di `tania-backend/specs/001-employee-digital-talent-management/tasks.md`**, di mana
> 21 task UI (T008–T010, T052–T054, T061–T062, T069–T070, T079–T080, T094–T095, T103–T104,
> T109–T110, T115–T116, T127) sudah hidup berdampingan dengan task backend per fase user story.
> Dokumen ini merinci **bagaimana** UI dibangun; `tasks.md` backend tetap menjadi satu-satunya
> daftar urutan eksekusi. Pindah ke model "frontend punya `tasks.md` sendiri" adalah keputusan
> terpisah yang belum diambil.

---

## Summary

Frontend Tania adalah aplikasi Next.js (App Router) untuk empat peran akses tetap — **Admin,
Operation, Chapter, Talent** — yang mengonsumsi GraphQL API `tania-backend`. Permukaan yang
harus dibangun: master data & akun (Admin), data karyawan (Operation), assignment (Chapter),
IDP (Chapter & Talent), CV (Talent, Chapter read-only), evaluasi performa (Admin template &
periode; Chapter penilaian; Talent read-only), dashboard per peran, dan penampil audit (Admin).
Seluruh label UI berbahasa Indonesia.

Pendekatan teknis: pertahankan stack terpasang (Next.js 16 App Router + React 19 + TypeScript +
TailwindCSS 4 + Vitest 5), tambahkan **Apollo Client + GraphQL codegen** sebagai lapisan data
(berdampingan dengan klien REST legacy `src/lib/api.ts` selama migrasi), bangun rute ber-guard
per peran, dan migrasikan slice legacy `/talents` ke GraphQL lalu pensiunkan klien REST-nya.

Kondisi awal repo (audit 2026-10-01): hanya ada `src/app/{layout,page}.tsx`,
`src/app/talents/**`, dan `src/lib/{api,api.test,talents}.ts`. **Tidak ada** komponen bersama,
modul fitur, lapisan Apollo, guard, atau codegen — semuanya dibangun dari nol.

---

## Technical Context

**Language/Version**: TypeScript 5, React 19.2.8, Node.js ≥ 20 (diuji 24)

**Primary Dependencies (terpasang)**: Next.js 16.3.4 (App Router), `react`/`react-dom` 19.2.8,
TailwindCSS 4 (`@tailwindcss/postcss`), Vitest 5, eslint 9 (`eslint-config-next`)

**Primary Dependencies (pinned, belum terpasang)**: **Apollo Client** (lapisan data GraphQL),
**React Testing Library** (test komponen), **GraphQL codegen** → `src/generated/graphql/`.
Paket integrasi Apollo untuk App Router/RSC dipilih pada task pertama; kandidat:
`@apollo/client` murni dengan provider client-side, atau ditambah
`@apollo/client-integration-nextjs` bila rendering ber-auth di server dikehendaki (lihat
**Open Item O1**).

**Storage**: tidak ada. Frontend tidak menyimpan data; satu-satunya penyimpanan klien adalah
token sesi di memori dan cache normalisasi Apollo (in-memory).

**Testing**: Vitest + React Testing Library + Apollo `MockedProvider`; test guard peran;
E2E Playwright **wajib** untuk jalur kritis (konstitusi §VII), dikerjakan pada F8 (T129).
Perluasan `vitest.config.ts` wajib: `environment: "jsdom"`
dan `include` mencakup `src/**/*.test.tsx` (kini hanya `.test.ts` dengan environment `node`).

**Target Platform**: browser modern desktop-first, responsif; UI berbahasa Indonesia

**Project Type**: web application (frontend satu repo; backend repo terpisah)

**Performance Goals**: daftar utama (karyawan, IDP) dan dashboard tetap responsif pada
**±5.000 karyawan** (NFR spec); daftar besar memakai pagination cursor backend (bukan memuat
seluruh dataset), code splitting per rute, cache normalisasi Apollo untuk mengurangi permintaan
berulang

**Constraints**: SC-002 — 100% penolakan akses lintas peran **di server**; UI hanya
menyembunyikan, tidak menegakkan. Tanpa PII di URL, log, atau analytics (konstitusi §II).
Indonesian copy. Aksesibilitas dasar (label form, fokus, kontras Tailwind).

**Scale/Scope**: 4 peran, ±9 grup rute, ±10 modul fitur, 69 operasi GraphQL pada kontrak desain
(8 operasi sudah dilayani backend per 2026-10-01 — lihat §"Ketergantungan pada backend").

---

## Constitution Check

*GATE: harus lulus sebelum Phase 0; dievaluasi ulang setelah Phase 1.*

| Prinsip (konstitusi v1.1.1) | Pemeriksaan | Status |
| --- | --- | --- |
| **III. Security by design** — RBAC ditegakkan server-side; tanpa PII di log/URL | UI tidak pernah menjadi penegak otorisasi (semua gates di backend, FR-16); token tidak ditulis ke URL; error server ditampilkan tanpa membocorkan detail internal | **Lulus** (rincian §Security) |
| **II. Data minimization** — field diklasifikasi; tanpa PII di log/trace/URL | Frontend hanya mengirim field yang dibutuhkan operasi GraphQL masing-masing layar; tidak ada PII pada query string selain kata kunci pencarian yang sudah jadi bagian kontrak API | **Lulus** |
| **V. Smallest change** — tanpa fitur spekulatif | Hanya layar/operasi yang ada di `spec.md`; tidak menambah state manager, i18n runtime, atau design system baru | **Lulus** |
| **VI. Quality by machines** — lint/typecheck/test di CI, nol warning | `npm run lint` + `npm run typecheck` + `npm test` (sudah ada) dipertahankan; ditambah target codegen bersih | **Lulus** |
| **VII. Testing non-negotiable** — unit, contract, e2e | Unit (Vitest), kontrak (test query/mutation terhadap SDL + `MockedProvider`), guard test per peran, **E2E jalur kritis wajib** (Playwright, T129) | **Lulus** (rincian §Testing) |
| **VIII. Boundaries & dependency hygiene** — UI → API/service → data; deps minimal | Akses GraphQL hanya lewat `src/lib/apollo/` + hook per fitur di `src/features/*`; komponen tidak memanggil klien langsung; setiap dependensi baru dijustifikasi di MR | **Lulus** |
| **IX. Fail visibly** — error eksplisit, tanpa swallowed error | Setiap operasi menangani state loading/error/empty secara eksplisit; `UNAUTHENTICATED` → logout terkendali; tidak ada catch kosong | **Lulus** |
| **Additional Constraints — frontend stack pinned 1.1.0** | Apollo Client, RTL, codegen `src/generated/graphql/` **wajib**; saat ini belum terpasang | **Gap terencana** (bukan pelanggaran): ketiganya menjadi prasyarat task frontend pertama |
| **Additional Constraints — reproducibility** | `npm install && npm run typecheck && npm test` berjalan di clone bersih | **Lulus** (diverifikasi 2026-10-01: typecheck bersih, 6/6 test lulus) |

**Complexity Tracking**: tidak ada pelanggaran yang perlu dijustifikasi.

---

## Ketergantungan pada Backend

Frontend tidak dapat membangun layar untuk operasi yang belum dilayani backend. Kondisi
2026-10-01: SDL yang dilayani (`tania-backend/graph/schema.graphqls`) baru memuat **auth + Unit +
audit**; kontrak desain penuh (`contracts/schema.graphql`, 69 operasi) adalah target yang
diport backend per fase (`tania-backend/plan.md` §9 W0–W9).

Konsekuensi yang mengikat plan ini:

1. **Codegen menargetkan SDL yang dilayani**, bukan kontrak desain penuh — kalau tidak, kode
   akan memanggil operasi yang belum ada dan gagal saat runtime. Kontrak desain dipakai sebagai
   acuan bentuk tipe, bukan sumber generate.
2. Urutan gelombang UI **mengikuti gelombang backend** (W1 master data → W2 karyawan → W3
   assignment → W4 IDP → W5 CV → W6 evaluasi → W7 dashboard/audit → W8 SSO/hardening). Task UI
   di `tasks.md` backend sudah disusun dengan urutan itu.
3. Setiap penambahan operasi backend harus disertai `make generate` di backend dan `npm run
   generate` di sini; CI kedua repo gagal bila hasil generate tidak sinkron.

---

## Project Structure

### Documentation (fitur ini)

```text
specs/001-employee-digital-talent-management/
├── spec.md              # ditulis di repo ini, di-mirror byte-identik ke repo backend
├── plan.md              # dokumen ini
├── research.md          # keputusan teknologi frontend
├── data-model.md        # model data sisi klien (view model + cache)
├── quickstart.md        # cara menjalankan & mengembangkan
└── contracts/
    ├── schema.graphql       # mirror kontrak desain (byte-identik dengan repo backend)
    ├── api-conventions.md   # mirror konvensi API (byte-identik)
    └── operations.md        # operasi GraphQL per layar (khusus frontend)
```

> `tasks.md` **tidak** dibuat di sini — urutan task di `tania-backend/.../tasks.md` (opsi C).

### Source Code (repo ini)

**Aktual** (`6c99fa8`):

```text
src/
├── app/{layout.tsx,page.tsx,globals.css,favicon.ico}
├── app/talents/{page.tsx,add-user-form.tsx,[id]/page.tsx}
└── lib/{api.ts,api.test.ts,talents.ts}
```

**Target**:

```text
src/
├── app/
│   ├── (auth)/login/page.tsx
│   └── (app)/
│       ├── layout.tsx                 # shell: nav, guard peran, boundary sesi
│       ├── dashboard/page.tsx
│       ├── master-data/{units,chapters,job-roles,projects}/page.tsx
│       ├── accounts/page.tsx
│       ├── employees/{page.tsx,[id]/page.tsx}
│       ├── assignments/{page.tsx,form...}
│       ├── idp/{page.tsx,[id]/page.tsx,my/page.tsx}
│       ├── cv/page.tsx
│       ├── evaluations/{templates,periods,roster,my}/page.tsx
│       └── audit/page.tsx
├── components/                        # UI reusable (tabel, pagination, dialog, form field, empty/error state)
├── features/<modul>/                  # hooks + komponen + query/mutation per modul (§5.2 plan backend)
├── lib/
│   ├── apollo/{client.ts,links.ts,cache.ts,provider.tsx}
│   ├── auth/{session.ts,guard.ts}
│   ├── errors.ts                      # peta extensions.code → pesan & perilaku UI
│   ├── api.ts / talents.ts            # legacy REST — dipensiunkan setelah port /talents
│   └── format.ts                      # tanggal/angka, locale id-ID
└── generated/graphql/                 # hasil codegen (jangan diedit manual)
```

**Structure Decision**: satu aplikasi Next.js di root repo. Route group `(auth)` menampung
halaman publik; `(app)` menampung seluruh halaman ber-sesi dengan satu shell + guard. Setiap
modul fitur menaruh hook/komponen/operasinya di `src/features/<modul>/`, bukan di `lib/`.
Legacy `/talents/page.tsx` dipertahankan sampai port GraphQL selesai, lalu dihapus bersama
`src/lib/api.ts` dan `src/lib/talents.ts`.

---

## Data Layer (Apollo Client)

- **Client**: satu instance di `src/lib/apollo/client.ts`, disediakan lewat provider di
  `(app)/layout.tsx`; `src/lib/apollo/links.ts` menyusun chain: `errorLink` → `authLink` →
  `httpLink` (`NEXT_PUBLIC_GRAPHQL_URL`).
- **Auth link**: menyisipkan `Authorization: Bearer <accessToken>` dari `src/lib/auth/session.ts`.
- **Refresh**: `refreshSession` dipanggil sekali saat `UNAUTHENTICATED`; permintaan lain yang
  menunggu diantrikan dan diulang setelah token baru terbit; kegagalan refresh → sesi dibersihkan
  dan diarahkan ke `/login`. Tidak ada retry tanpa batas.
- **Cache**: `InMemoryCache` normalisasi dengan `keyFields: ["id"]` untuk seluruh tipe ber-`id`;
  agregat dashboard memakai `fetchPolicy: "cache-and-network"` (turunan, FR-30); setelah mutasi,
  entitas terkait di-`refetch` secara eksplisit — bukan invalidasi global.
- **Codegen**: `@graphql-codegen/cli` dengan preset typed document nodes; operasi ditulis di
  `src/features/<modul>/*.graphql` dan hasilnya masuk `src/generated/graphql/` (tidak diedit
  manual). Skrip `npm run generate` ditambahkan ke `package.json`.
- **Error mapping**: `extensions.code` → perilaku UI di `src/lib/errors.ts`
  (`UNAUTHENTICATED` → logout; `FORBIDDEN` → halaman "akses ditolak"; `NOT_FOUND` → empty/404;
  `BAD_USER_INPUT` → error per field; `CONFLICT`/`RATE_LIMITED`/`INTERNAL` → pesan aksi).
  Pesan dari server sudah berbahasa Indonesia.

---

## Security (frontend)

- **Token** (lihat **Open Item O1**): access token dan refresh token disimpan **di memori**
  (`src/lib/auth/session.ts`), tidak di `localStorage` (XSS) dan tidak di URL. Konsekuensi yang
  diterima: sesi hilang saat full page reload → pengguna login ulang. Data ber-sesi diambil
  secara **client-side**; server component tidak memegang token pengguna.
- **OTA**: memindahkan refresh token ke cookie `HttpOnly; Secure; SameSite=Lax` menghilangkan
  kelemahan reload, tetapi **memerlukan perubahan backend** (backend saat ini mengembalikan
  refresh token di payload dan tidak menetapkan cookie). Ini dicatat sebagai usulan amandemen
  backend, bukan diputuskan di sini.
- **Tidak ada PII di URL/log/analytics**: kata kunci pencarian hanya dikirim sebagai variabel
  GraphQL; tidak ada nama/email karyawan pada path atau query string.
- **UI bukan penegak otorisasi**: guard peran hanya menyembunyikan navigasi/aksi; setiap respons
  `FORBIDDEN`/`NOT_FOUND` dari server ditampilkan apa adanya. SC-002 diuji di backend.

---

## Testing

| Level | Cakupan | Alat |
| --- | --- | --- |
| Unit | Formatter, mapper `extensions.code`, helper guard peran, reducer form | Vitest |
| Komponen | Render tabel/form/empty/error state dengan `MockedProvider` | Vitest + RTL |
| Kontrak | Operasi GraphQL yang dikirim cocok dengan SDL ter-generate; tipe hasil codegen dipakai apa adanya | Vitest + snapshot operasi |
| Guard peran | Render rute untuk tiap peran: menu/aksi tersembunyi, `FORBIDDEN` ditampilkan benar | Vitest + RTL |
| E2E | Alur kritis lintas stack pada `docker-compose`: login 4 peran → tambah karyawan → assignment → evaluasi → IDP → status aksi → dashboard | **Playwright** — **wajib** (konstitusi §VII), bukan opsional; suite di `e2e/`, dijalankan oleh task T129/T130 di `tania-backend/.../tasks.md` |

Perubahan `vitest.config.ts` (jsdom + `.test.tsx`) dan pemasangan RTL adalah prasyarat: saat ini
hanya test logika `src/lib/api.test.ts` (6 test) yang terjaring.

---

## Roadmap Frontend (mengikuti gelombang backend)

| Gelombang | Pekerjaan UI | Task (di `tasks.md` backend) |
| --- | --- | --- |
| **F0 — Foundation** | Pasang Apollo + `graphql` + codegen + RTL; perluas `vitest.config.ts`; `src/lib/apollo/*`; sesi + guard; shell `(app)` + login lokal | T008, T009, T010 |
| **F1 — Master Data & Akun** | Halaman Unit/Chapter/Job Role/Project + Akun User (Admin) | T052, T053, T054 |
| **F2 — Data Karyawan** | Daftar + pencarian/filter + form + nonaktifkan (Operation) | T061, T062 |
| **F3 — Assignment** | Daftar per talent/project + form (Chapter) | T069, T070 |
| **F4 — IDP** | Daftar + filter status + detail + aksi + review log (Chapter); tampilan Talent | T079, T080, T109, T110 |
| **F5 — CV** | Form terstruktur (Talent) + tampilan read-only (Chapter) | T103, T104 |
| **F6 — Evaluasi** | Template & periode (Admin) + form/roster (Chapter) + read-only (Talent) | T094, T095 |
| **F7 — Dashboard & Audit** | Widget per peran (US8) + penampil audit (Admin) | T115, T116 |
| **F8 — SSO & Hardening** | Callback SSO (backend W8), error state, audit aksesibilitas & performa, **harness E2E Playwright (`e2e/`)** | T129 |
| **F9 — UAT & Migrasi** | Port `/talents` ke GraphQL lalu hapus klien REST legacy; **E2E + regression sebagai gerbang rilis** | T127, T130 |

Setiap gelombang UI bergantung pada gelombang backend dengan nomor yang sama.

---

## Open Items

| # | Item | Dampak | Rencana |
| --- | --- | --- | --- |
| O1 | Penyimpanan token & rendering ber-auth di server | Sesi hilang saat reload; SSR ber-auth tidak mungkin tanpa cookie | MVP: token di memori + render client-side. Usulkan ke backend: refresh token via cookie `HttpOnly` (amandemen backend) agar SSR ber-auth & sesi tahan reload |
| O2 | Paket integrasi Apollo untuk App Router (`@apollo/client` murni vs `@apollo/client-integration-nextjs`) | Mempengaruhi struktur provider & RSC | Diputuskan pada T008 dengan uji coba kecil; hasilnya dicatat di `research.md` |
| O3 | Kepemilikan daftar task (opsi C dipilih: tetap di backend) | Kontributor frontend membaca repo backend | Ditinjau ulang bila ada aliran kerja/tim frontend terpisah |
| O4 | Nasib fitur *Talent Profile* legacy | Rute `/talents` mati terhadap backend saat ini | Port ke GraphQL pada F9, lalu hapus `src/lib/{api,talents}.ts` |

---

## Risks

| # | Risiko | Dampak | Tindakan |
| --- | --- | --- | --- |
| RF1 | Frontend dibangun lebih cepat dari operasi backend yang tersedia | Kode memanggil operasi yang belum ada | Fase UI mengikuti gelombang backend; codegen dari SDL yang dilayani; tidak ada mock produksi |
| RF2 | Drift kontrak antar repo | Tipe/operasi tidak sinkron | `contracts/` di-mirror byte-identik; `npm run generate` + `make generate` di CI |
| RF3 | Token di memori memaksa login ulang saat reload | Gesekan UX | Diterima untuk MVP; O1 sebagai jalur menuju cookie HttpOnly |
| RF4 | `vitest.config.ts` sempit (`node`, `.test.ts`) | Test komponen tidak jalan | Diperluas pada T009 sebelum modul UI pertama |
| RF5 | Skala ±5.000 karyawan pada tabel | Render lambat | Pagination cursor backend, virtualisasi hanya bila terbukti perlu (Plan V: jangan spekulatif), profil render diukur |
