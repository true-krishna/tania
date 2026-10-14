# Implementation Plan: Tambah Master Data (Create) — Job Role, Initiative, Unit

**Branch**: `004-master-data-create` | **Date**: 2026-10-14 | **Spec**: `specs/004-master-data-create/spec.md` (TAN-187, Final)

**Input**: Feature specification from `/specs/004-master-data-create/spec.md`

**Perintah**: `/speckit.plan` — hasil untuk tiket TAN-187

**Repo**: **tania-dashboard** (rumah spec; perubahan kode di sini) + verifikasi kontrak **tania-backend** (operasi create & otorisasi sudah ada — tidak ada perubahan kode backend).

---

## Summary

Menambahkan operasi **Create** untuk Unit, Job Role, dan Initiative (Master Data Project) dengan otorisasi **hanya Admin**. **Temuan audit: operasi Create sudah terimplementasi** — halaman master data memakai satu komponen bersama `MasterDataSection` yang sudah menyediakan tombol tambah + form, dan `tania-backend` sudah menyediakan `createUnit`/`createJobRole`/`createProject` yang dibatasi `RequireRole(Admin)`. Karena itu pekerjaan nyata plan ini menyusut menjadi **menutup dua gap terhadap spec**: (G1) form Job Role salah mewajibkan pemilihan Chapter padahal chapter bersifat opsional (FR-22 induk; placeholder form sendiri berbunyi "boleh kosong"), dan (G2) test create baru menutup Unit — Job Role & Initiative belum diuji. Selebihnya adalah verifikasi (kontrak server Admin-only, guard UI, jejak audit) dan UAT.

## Technical Context

Stack dipin dari konstitusi & plan induk; **tidak ada dependensi baru**.

| Aspek | Keputusan |
| --- | --- |
| Bahasa frontend | TypeScript 5, Next.js 16.3.4 (App Router), React 19, TailwindCSS 4 |
| Lapisan data frontend | Apollo Client + GraphQL codegen (`src/generated/graphql/`) — mutasi create sudah ter-generate; **tidak ada codegen baru** |
| UI system | TANIA Pulse (`MasterDataSection`, `BoardTable`, `PageHeader`, `Input`, `Select`, `Button`, `RowActionsMenu`, `Toast`) |
| Backend | Go clean architecture + PostgreSQL 16 + GraphQL (gqlgen); `internal/usecase/{masterdata,jobrole,project}.go` — operasi create sudah ada & Admin-only |
| Testing frontend | Vitest + React Testing Library + Apollo `MockedProvider` |
| Testing backend | Go unit/contract tests (`internal/usecase/masterdata_test.go`, `authz_test.go`, `internal/transport/httpapi/e2e_test.go`) |
| Constraints | Otorisasi ditegakkan server-side (Security III); label UI berbahasa Indonesia; tanpa PII di URL/log |
| Scale/Scope | 1 komponen bersama (`MasterDataSection`) + 3 halaman (unit/job-roles/projects) + test; 1 perbaikan validasi; tanpa perubahan skema/API |

---

## Kondisi Repositori (audit 2026-10-14)

### Frontend (`tania-dashboard`, `origin/master` @ `b446fe2`)

- **`src/features/master-data/MasterDataSection.tsx`** — satu permukaan bersama: tombol tambah di `PageHeader` (`addLabel`), form tambah/edit (nama wajib; `select` opsional secara deklarasi), aksi Ubah/Aktifkan-Nonaktifkan lewat `RowActionsMenu`. `handleSubmit` menjalankan `onCreate` bila belum mengedit, memakai state `busy` untuk menonaktifkan tombol Simpan (cegah submit ganda).
  - **Gap G1**: `nextSelectError = select && !selectValue ? "… wajib dipilih." : undefined` — begitu sebuah halaman mengirim `select`, pilihan itu **selalu wajib**. Job Role mengirim `select` (Chapter) sehingga **tidak bisa dibuat tanpa chapter**, padahal chapter opsional (FR-22 induk) dan placeholder-nya sendiri "pilih chapter (boleh kosong)". Project mengirim `select` (Unit) dan memang **wajib** (FR-006/FR-19).
- **Tiga halaman** memakai komponen yang sama dan sudah mengirim `onCreate`:
  - `/master-data/units` → `unitMutations.create({ name })`.
  - `/master-data/job-roles` → `jobRoleMutations.create({ name, selectValue })` dengan `select` Chapter; `onUpdate` memakai `changeChapter(id, selectValue || null)`.
  - `/master-data/projects` → `projectMutations.create({ name, selectValue })` dengan `select` Unit (wajib).
- **`src/app/(app)/master-data/layout.tsx`** — guard UI: `role !== "ADMIN" → null` (halaman master data hanya tampil untuk Admin).
- **`src/components/Sidebar/nav.ts`** — submenu Master Data (`units`, `chapters`, `job-roles`, `projects`) semuanya `roles: ["ADMIN"]`. Label submenu memakai **"Project"** (bukan "Initiative") — pemetaan Initiative = Project sudah dikonfirmasi (TAN-180); penggantian label berada di luar scope spec.
- **Test**: `src/features/master-data/master-data.test.tsx` — create **Unit** (sukses + nama kosong), rename Unit, nonaktifkan Unit, pesan penolakan server (T054), dan perluasan pencarian (TAN-180). **Belum ada** test create Job Role / Project, belum ada test chapter opsional.

### Backend (`tania-backend`)

- **`graph/schema.graphqls`** — `createUnit(name: String!): Unit!`, `createJobRole(name: String!, chapterId: ID): JobRole!`, `createProject(name: String!, unitId: ID!): Project!` (ketiganya sudah ada).
- **`internal/usecase/{masterdata,jobrole,project}.go`** — setiap `Create` mengikuti bentuk baku: `RequireRole(identity, domain.RoleAdmin)` → `normalizeName` (nama wajib, dinormalisasi) → cek unik (`ErrConflict`) → validasi referensi (chapter harus aktif & ada bila diisi; unit harus ada) → persist + **jejak audit dalam satu transaksi** (FR-17).
- **`internal/usecase/authz_test.go`** — matriks otorisasi menetapkan `createUnit`/`createJobRole`/`createProject` hanya untuk `RoleAdmin`.
- **`internal/transport/httpapi/e2e_test.go`** — create oleh Admin sukses; `createUnit` oleh Operation → `FORBIDDEN`; create oleh Chapter → `FORBIDDEN`. `docs/qa-test-guide.md` mencatat hal yang sama.

**Kesimpulan audit**: kebutuhan spec 004 (Create Unit/Job Role/Initiative, Admin-only, validasi, audit) **sudah terpenuhi di kedua repo**, kecuali **G1** (Job Role tanpa chapter tak bisa dibuat dari UI) dan **G2** (test create Job Role/Initiative belum ada).

---

## Keputusan Desain

| # | Keputusan | Alasan |
| --- | --- | --- |
| D1 | **Tidak membuat komponen/form baru** — Create memakai `MasterDataSection` existing | Tech I (smallest change); pola create/update/deactivate sudah menyatu di satu komponen; tidak ada duplikasi |
| D2 | Menjadikan kewajiban `select` **eksplisit per halaman** lewat prop (mis. `selectRequired`), bukan "ada `select` = wajib" | Menutup G1: Job Role chapter opsional, Project Unit wajib — satu komponen melayani keduanya tanpa cabang per halaman di dalam komponen |
| D3 | Validasi nama & referensi tetap **otoritatif di server**; UI hanya cek cepat (nama kosong, referensi wajib) | Security III (enforcement server-side); pesan validasi server tetap disurfacekan lewat toast (pola T054) |
| D4 | Test create **per halaman** (Job Role, Initiative/Project) ditambahkan ke `master-data.test.tsx` | Tech III (testing non-negotiable); menutup G2 dan acceptance scenario US2/US3 |
| D5 | Label submenu "Project" → "Initiative" **tidak** diubah di plan ini | Di luar scope spec 004 (perluasan field/penamaan); pemetaan Initiative = Project sudah disepakati — kandidat follow-up terpisah |
| D6 | Tanpa perubahan skema/API/codegen | Mutasi create & otorisasinya sudah ada; tidak ada kontrak baru |

---

## Pemetaan Spec → Implementasi

| Spec | Status | Bukti / Rencana |
| --- | --- | --- |
| US1 (Admin tambah Unit) | **Sudah ada** | `/master-data/units` → `useUnitMutations().create`; `createUnit` server Admin-only; test create Unit sudah ada |
| US2 (Admin tambah Job Role) | **Sudah ada, G1 diperbaiki** | Form create Job Role ada; perbaiki validasi agar chapter boleh kosong (D2); tambah test create dengan & tanpa chapter (D4) |
| US3 (Admin tambah Initiative) | **Sudah ada** | `/master-data/projects` → `useProjectMutations().create`; Unit wajib (FR-006); tambah test create + test blokir tanpa Unit (D4) |
| US4 (Hanya Admin) | **Terpenuhi** | `RequireRole(Admin)` di ketiga usecase (authz_test) + e2e FORBIDDEN untuk Operation/Chapter; guard UI `layout.tsx` |
| FR-001–FR-003 | **Sudah ada** | Tombol tambah + form di ketiga halaman; entitas tersimpan aktif dan muncul lewat `refetchQueries` |
| FR-004 (nama wajib) | **Terpenuhi** | Cek klien (nama kosong) + `normalizeName` server |
| FR-005 (nama unik) | **Terpenuhi** | `FindByName` → `ErrConflict` server; pesan disurfacekan lewat toast |
| FR-006 (Initiative wajib Unit) | **Terpenuhi** | `createProject(unitId)` wajib; UI memvalidasi pilihan Unit |
| FR-007 (umpan balik sukses/gagal) | **Terpenuhi** | `detectError` + `pushToast` di tiap halaman |
| FR-008 (cegah submit ganda) | **Terpenuhi** | State `busy` menonaktifkan tombol Simpan |
| FR-009 (entitas terpakai modul lain) | **Terpenuhi** | `refetchQueries` memperbarui daftar; picker (Unit/Chapter) membaca query yang sama |
| FR-010–FR-013 (otorisasi Admin) | **Terpenuhi** | Matriks RBAC berlaku; guard UI + `RequireRole(Admin)` server; tanpa amandemen matriks |
| FR-014 (tanpa hapus; penonaktifan ditolak bila direferensikan) | **Terpenuhi** | Tidak ada mutasi delete; test T054 menutup penolakan penonaktifan |
| FR-015 (tanpa field baru) | **Terpenuhi** | Tidak ada perubahan model/form field |
| FR-016 (jejak audit) | **Terpenuhi** | `recordChange` dalam transaksi di ketiga usecase (FR-17 induk) |
| SC-001–SC-005 | **Diuji di K2** | Checklist acceptance scenario + verifikasi otorisasi server |

**Kesimpulan**: hanya **G1** (kode) dan **G2** (test) yang perlu dikerjakan; sisanya verifikasi. Tidak ada gap backend, tidak ada kontrak/API baru.

---

## Constitution Check

*GATE: lulus sebelum eksekusi; diperiksa ulang setelah desain rinci.*

| Prinsip | Pemeriksaan | Status |
| --- | --- | --- |
| **Security III** — RBAC least privilege, server-side | Create tetap `RequireRole(Admin)` di server; UI bukan penegak otorisasi; tanpa permukaan baru | **Lulus** |
| **Security II** — tanpa PII di URL/log | Tidak ada PII pada form/URL; nilai form adalah state lokal | **Lulus** |
| **Security (audit)** — audit trails core-data | Create tetap mencatat jejak audit dalam transaksi (FR-16/FR-17) | **Lulus** |
| **Design I** — tokens.css kanon | Perbaikan hanya di logika validasi; tanpa nilai/style baru | **Lulus** |
| **Design VI** — accessibility floor | Pesan validasi tetap teks (bukan hanya warna); label form tetap terhubung | **Lulus** |
| **Tech I** — smallest change | Tanpa komponen/form baru; satu prop + satu perbaikan validasi + test | **Lulus** |
| **Tech II/III** — quality by machines / testing | Perubahan perilaku (chapter opsional) disertai test; lint + typecheck + vitest wajib hijau | **Lulus** |
| **Tech VII** — architecture boundaries | Perubahan di lapisan feature (`MasterDataSection`) & test; tanpa panggilan klien GraphQL baru | **Lulus** |

**Complexity Tracking**: tidak ada pelanggaran yang perlu dijustifikasi.

---

## Project Structure

### Documentation (fitur ini)

```text
specs/004-master-data-create/     # di tania-dashboard (rumah spec)
├── spec.md                       # sudah ada (TAN-187, Final)
├── plan.md                       # dokumen ini
├── research.md                   # Phase 0
├── data-model.md                 # Phase 1
├── quickstart.md                 # Phase 1
└── contracts/
    └── master-data-create.md     # kontrak mutasi create + otorisasi
# tasks.md (Phase 2) dibuat pada /speckit.tasks — bukan keluaran perintah ini
```

### Source Code (delta yang diubah plan ini)

```text
tania-dashboard/
├── src/features/master-data/
│   ├── MasterDataSection.tsx     # + prop kewajiban select (selectRequired) → chapter Job Role opsional
│   └── master-data.test.tsx      # + test create Job Role (dengan/tanpa chapter) & Initiative (dengan Unit / blokir tanpa Unit)
└── src/app/(app)/master-data/
    ├── job-roles/page.tsx        # select Chapter ditandai opsional
    └── projects/page.tsx         # select Unit ditandai wajib (selectRequired)

tania-backend/                    # TIDAK diubah — hanya diverifikasi (authz + create existing)
```

**Structure Decision**: seluruh perilaku Create sudah hidup di satu komponen bersama `MasterDataSection` + hook mutasi per entitas; plan hanya menyesuaikan satu aturan validasi di komponen dan menambah test. Tidak ada komponen/hook baru, tidak ada perubahan backend.

---

## Data & API

- **Tanpa perubahan skema/API**: `createUnit`/`createJobRole`/`createProject` sudah ada pada SDL dan sudah dipakai halaman; tidak ada tipe/mutasi baru; codegen tidak dijalankan ulang.
- Validasi server yang sudah berlaku: nama wajib & dinormalisasi; nama unik (`ErrConflict`); `chapterId` opsional & harus chapter aktif; `unitId` wajib & harus ada; seluruh create mencatat jejak audit dalam satu transaksi.

## Security (rekap slice)

Tidak ada permukaan baru: operasi tulis master data sudah dibatasi Admin di server (`RequireRole`), UI hanya menyembunyikan halaman untuk non-Admin (bukan batas keamanan), dan tidak ada PII pada form/URL. Perubahan plan tidak menyentuh otorisasi.

---

## Testing

| Level | Cakupan | Alat |
| --- | --- | --- |
| Komponen (K1) | `MasterDataSection`: Job Role dapat dibuat **tanpa** chapter (G1) dan **dengan** chapter; Project diblokir bila Unit belum dipilih; nama kosong ditolak; pesan error server disurfacekan | Vitest + RTL + `MockedProvider` |
| Per-halaman (K1) | Skenario penerimaan US2 (Job Role) & US3 (Initiative) minimal — create sukses + toast; blokir referensi wajib | Vitest + RTL |
| Regression | Test CRUD Unit eksisting (T052/T054) & pencarian (TAN-180) tetap hijau; `e2e/rbac.spec.ts` tidak tersentuh | `npm run lint && npm run typecheck && npx vitest run` |
| Backend (verifikasi, tanpa kode baru) | `createUnit`/`createJobRole`/`createProject` Admin-only & validasi — jalankan test usecase/authz/e2e yang sudah ada | `go test ./...` (tania-backend) |

Kriteria lulus K2 (UAT): acceptance scenario US1–US4 spec dilalui manual sekali sebagai Admin (termasuk membuat Job Role tanpa chapter dan Initiative tanpa Unit → ditolak), plus verifikasi `FORBIDDEN` untuk Operation.

---

## Roadmap (gelombang eksekusi)

| Gelombang | Pekerjaan | Menutup |
| --- | --- | --- |
| **K1 — Perbaikan & test** | G1: prop kewajiban `select` di `MasterDataSection` + tandai Unit wajib / Chapter opsional; G2: test create Job Role (dengan/tanpa chapter) & Initiative (dengan Unit / blokir tanpa Unit) + regression | US2–US3, FR-002/FR-003/FR-006 |
| **K2 — Verifikasi & UAT** | Lint/typecheck/vitest hijau; `go test` backend untuk authz create; checklist acceptance scenario US1–US4; verifikasi FORBIDDEN Operation | SC-001–SC-005, Review & Acceptance Checklist spec |

Estimasi: K1 ±0,5–1 hari; K2 ±0,5 hari. Rincian task menyusul pada `/speckit.tasks`.

---

## Open Items

Tidak ada butir terbuka — peran pengelola master data (**Admin**) dan pemetaan "Initiative = Project" sudah dikonfirmasi pemilik produk (TAN-187 clarify 2026-10-14; TAN-180 2026-10-13). Kandidat follow-up (di luar scope): penggantian label submenu "Project" → "Initiative" (D5).

---

## Risks

| # | Risiko | Dampak | Tindakan |
| --- | --- | --- | --- |
| R1 | Mengubah kewajiban `select` ikut melonggarkan Project (Unit jadi opsional) | Melanggar FR-006 | Kewajiban dibuat eksplisit per halaman (`selectRequired`); Project tetap wajib — ditutup test blokir tanpa Unit |
| R2 | Ada halaman lain yang mengandalkan "ada select = wajib" | Regresi form lain | `select`/`selectRequired` hanya dipakai Unit/Job Role/Project; regression test CRUD existing dijalankan |
| R3 | Divergensi label "Project" vs "Initiative" membingungkan penguji UAT | UAT | Pemetaan dicatat di spec & plan; penggantian label dikeluarkan sebagai follow-up terpisah (D5) |
