# Implementation Plan: Manajemen Assignment Talent Massal (Bulk)

**Branch**: `feat/TAN-337-bulk-assignment` | **Date**: 2026-10-26 | **Spec**: `specs/007-bulk-talent-assignment/spec.md` (TAN-337, Draft)

**Input**: Feature specification dari `/specs/007-bulk-talent-assignment/spec.md`

**Perintah**: `/speckit.plan` — hasil untuk tiket TAN-337

**Pelaksana**: backend → **@007** (agent `e5aa7168-0f33-4f93-a179-7695a4809eef`),
frontend → **@AIF** (agent `a629f9a0-8134-491d-8043-6bdc774327bf`). Rincian di
[Pembagian Kerja](#pembagian-kerja--penugasan).

**Repo**: fitur ini melintasi dua repo — `codex/backend/tania-backend` (modul Assignment)
dan `codex/frontend/tania-dashboard` (modul UI assignments). Mengikuti keputusan "opsi C"
plan `001-us2-talent-assignment`: rumah spec dan plan adalah repo dashboard;
`spec.md` + `checklists/requirements.md` di-mirror byte-identik ke repo backend
(`specs/005-bulk-talent-assignment/`). Dokumen ini satu-satunya plan lintas repo.

---

## Summary

Tiga operasi massal pada assignment di atas aturan assignment tunggal yang berlaku:

1. **Bulk add** — banyak talent → satu project + satu periode (satu aksi).
2. **Bulk edit** — banyak assignment berjalan → satu perubahan (project dan/atau periode).
3. **Bulk delete** — banyak assignment **berjalan** dihapus dengan konfirmasi; data selesai
   (historis) tidak pernah dapat dihapus.

Pendekatan teknis: **kontrak-first, tanpa perubahan model data**. Tidak ada tabel baru dan
tidak ada migrasi — operasi massal mengoperasikan entitas `assignments` yang ada dengan
semantik per baris (per-row result: berhasil/gagal + alasan), bukan transaksi all-or-nothing,
agar satu baris bermasalah tidak menggulung balik puluhan baris yang sah. Kontrak GraphQL
didefinisikan di plan ini sebelum implementasi (lihat [Kontrak GraphQL](#kontrak-graphql--sdl-delta)),
sehingga @007 dan @AIF dapat bekerja paralel: @AIF membangun UI terhadap kontrak + mock,
integrasi menyusul setelah kontrak dilayani.

Aturan per baris **identik** dengan operasi tunggal yang sudah ada (kandidat assignable,
project aktif, validasi periode, larangan duplikat aktif per talent+project, audit per
assignment) — usecase massal memanggil ulang validator yang sama, bukan menduplikasinya.

---

## Technical Context

Stack dipin dari plan induk; **tidak ada dependensi baru** di fitur ini.

| Aspek | Keputusan |
| --- | --- |
| Bahasa backend | Go 1.26, clean architecture (transport → usecase → domain → repository), gqlgen schema-first |
| Database | PostgreSQL 16 (tabel `assignments` eksisting — **tanpa migrasi baru**) |
| Bahasa frontend | TypeScript 5, Next.js (App Router), React 19, TailwindCSS 4 |
| Lapisan data frontend | Apollo Client + GraphQL codegen (`src/generated/graphql/`) |
| Testing backend | `testing` + fake repository (unit usecase), testcontainers (integrasi) |
| Testing frontend | Vitest + React Testing Library + Apollo `MockedProvider` |
| Target performa | Batch ≤ 100 baris selesai < 10 detik; daftar responsif hingga ±5.000 karyawan |
| Constraints | Penolakan akses 100% di server; UI hanya menyembunyikan. Tanpa PII di URL/log. Label UI berbahasa Indonesia |

---

## Kondisi Repositori (audit 2026-10-26)

### Backend (`tania-backend`, `master` @ `a1f7b53`)

- SDL (`graph/schema.graphqls`): `Assignment`, `AssignmentStatus` (`ACTIVE`/`COMPLETED`),
  `AssignmentFilter`, `CreateAssignmentInput`, `UpdateAssignmentInput`, mutasi
  `createAssignment`/`updateAssignment`/`endAssignment`, query `assignments(filter)`,
  `Employee.assignments`, `assignableTalents`.
- Usecase (`internal/usecase/assignment.go`): `permAssignmentsManage` = **Chapter + Admin**
  (`internal/usecase/rbac.go:99`, keputusan TAN-212 clarify 4); `ChapterScope` untuk Chapter,
  Admin tidak di-scope; validasi kandidat (aktif + assignable), `periodEnd >= periodStart`,
  `ensureNoDuplicateActive` (satu aktif per talent+project); audit before/after sinkron dalam
  transaksi; update/end hanya pada status `ACTIVE`.
- **Relevan untuk bulk delete**: `personal_work_activities.assignment_id ... ON DELETE RESTRICT`
  (migrasi `0019`) — assignment yang masih dirujuk aktivitas kerja personal **tidak boleh**
  dihapus tanpa pesan yang jelas; FK akan menolak, jadi usecase memeriksa rujukan lebih dulu
  dan melaporkannya sebagai kegagalan baris (FR-05).
- Belum ada rate limiting pada mutasi (hanya `internal/platform/redisclient` sebagai bahan).

### Frontend (`tania-dashboard`, `master` @ `38a41db`)

- Halaman: `src/app/(app)/assignments/page.tsx` (daftar + filter Talent/Project/Status +
  `CreateAssignmentModal`), `src/app/(app)/assignments/new`, `/assignments/[id]`.
- Modul `src/features/assignments/`: `assignments.graphql`, `createAssignment.graphql`,
  `updateAssignment.graphql`, `endAssignment.graphql`, `assignableTalents.graphql`, hooks
  (`useAssignments`, `useAssignment`), `CreateAssignmentModal.tsx` (modal per TAN-312),
  `AssignmentStatusBadge.tsx`, test `assignments.test.tsx`.
- Pola UI yang mengikat: tabel dengan `RowActionsMenu` + `TableFilterBar`, modal CRUD,
  `mapAssignmentSubmitError` (`src/lib/errors`) untuk pesan server, guard peran
  (`canManage`/`useSessionRole`).

---

## Kontrak GraphQL (SDL delta)

**Sumber kebenaran kontrak** untuk kedua sisi. @007 menulis SDL ini ke
`graph/schema.graphqls` sebagai **commit pertama** gelombang K1 (contract-first);
@AIF menulis operasi `.graphql` dari SDL yang sama dan menjalankan `npm run generate`
terhadap SDL yang sudah dilayani setelah K1 merge — selama itu, tipe hasil `npm run generate`
di lingkungan @AIF mengikuti SDL master; operasi ditulis sesuai kontrak di bawah dan diverifikasi
penuh pada gelombang K3.

```graphql
# --- Bulk assignment (TAN-337) ----------------------------------------------

"""Kegagalan satu baris pada operasi assignment massal."""
type BulkAssignmentError {
  code: BulkAssignmentErrorCode!
  """Pesan siap tampil kepada pengguna (berbahasa Indonesia)."""
  message: String!
}

enum BulkAssignmentErrorCode {
  OUT_OF_SCOPE      # talent/assignment di luar cakupan chapter atau tidak ditemukan
  NOT_ASSIGNABLE    # karyawan nonaktif / tidak assignable
  PROJECT_INACTIVE  # project tidak aktif
  INVALID_PERIOD    # periodEnd < periodStart
  DUPLICATE_ACTIVE  # sudah ada assignment aktif untuk talent+project
  NOT_ACTIVE        # assignment tidak berstatus ACTIVE (bulk edit/delete)
  REFERENCED        # assignment masih dirujuk aktivitas kerja personal (bulk delete)
  BATCH_LIMIT       # jumlah baris melebihi batas 100
  INVALID           # input tidak valid lainnya
}

"""Hasil satu baris operasi assignment massal."""
type BulkAssignmentItemResult {
  """Posisi baris pada input (0-based)."""
  index: Int!
  """Talent yang dimaksud baris ini (bulk add)."""
  employeeId: ID
  """Assignment yang dimaksud baris ini (bulk edit/delete)."""
  assignmentId: ID
  """Assignment hasil — terisi bila baris berhasil (bulk add/edit)."""
  assignment: Assignment
  """Kegagalan baris — terisi bila baris gagal."""
  error: BulkAssignmentError
}

type BulkAssignmentResult {
  succeeded: [BulkAssignmentItemResult!]!
  failed: [BulkAssignmentItemResult!]!
}

input BulkCreateAssignmentsInput {
  projectId: ID!
  periodStart: Date!
  periodEnd: Date
  """Maksimum 100 talent per operasi (FR-07)."""
  employeeIds: [ID!]!
}

input BulkUpdateAssignmentsInput {
  """Hanya assignment berstatus ACTIVE yang dapat diubah."""
  ids: [ID!]!
  """Opsional — project baru untuk semua baris."""
  projectId: ID
  """Opsional — tanggal mulai baru untuk semua baris."""
  periodStart: Date
  """Opsional — tanggal selesai baru; tidak mengosongkan nilai yang sudah terisi (FR-11)."""
  periodEnd: Date
}

extend type Mutation {
  """Buat assignment untuk banyak talent sekaligus (satu project + periode). Chapter + Admin."""
  bulkCreateAssignments(input: BulkCreateAssignmentsInput!): BulkAssignmentResult!
  """Terapkan satu perubahan (project dan/atau periode) ke banyak assignment aktif. Chapter + Admin."""
  bulkUpdateAssignments(input: BulkUpdateAssignmentsInput!): BulkAssignmentResult!
  """Hapus banyak assignment aktif sekaligus (selesai tidak dapat dihapus). Chapter + Admin."""
  bulkDeleteAssignments(ids: [ID!]!): BulkAssignmentResult!
}
```

Keputusan kontrak:

- **Per-row result, bukan all-or-nothing** — selaras FR-02/US1-2: baris sah tetap tersimpan
  saat baris lain gagal; klien menampilkan ringkasan. Field top-level tidak pernah error
  untuk kegagalan per baris; `BATCH_LIMIT` dan input tidak valid tetap berupa GraphQL error
  (seluruh permintaan ditolak — FR-07).
- **Tidak ada pengosongan `periodEnd` via bulk edit** (FR-11) — menghindari ambiguitas
  "absent vs null" di gqlgen; pengakhiran tetap lewat `endAssignment`.
- **`bulkDeleteAssignments` menerima `ids` saja** — delete tidak mengubah data apa pun.

---

## Desain Backend (@007)

- **Usecase** (`internal/usecase/assignment.go`): tiga metode baru pada `AssignmentService` —
  `BulkCreate`, `BulkUpdate`, `BulkDelete`:
  - Validasi seluruh permintaan lebih dulu: otorisasi (`RequirePermission(permAssignmentsManage)`),
    batas batch 100 (FR-07), daftar tidak kosong, `periodEnd >= periodStart` bila diisi →
    `BATCH_LIMIT`/`INVALID` sebagai GraphQL error sebelum satu baris pun dieksekusi.
  - **Setiap baris = satu transaksi sendiri** (pola `recordChange` eksisting): create →
    reuse seluruh validasi `Create` (kandidat, project aktif, duplikat aktif, periode) + audit;
    update → reuse validasi `Update` (ACTIVE-only, duplikat aktif pada project baru) + audit;
    delete → `getInScope` + cek status ACTIVE + **pre-check rujukan
    `personal_work_activities`** (FR-05, pesan ramah alih-alih error FK mentah) + audit
    before-snapshot, lalu hard delete.
  - Baris diproses **dalam urutan input** (deterministik — baris duplikat dalam batch
    berperilaku dapat dijelaskan: baris kedua gagal `DUPLICATE_ACTIVE`).
  - Pemetaan error domain → `BulkAssignmentErrorCode`: `ErrNotFound`/luar cakupan →
    `OUT_OF_SCOPE`, kandidat → `NOT_ASSIGNABLE`, project → `PROJECT_INACTIVE`, periode →
    `INVALID_PERIOD`, duplikat → `DUPLICATE_ACTIVE`, status → `NOT_ACTIVE`, rujukan →
    `REFERENCED`, lainnya → `INVALID`; pesan berbahasa Indonesia.
- **Rate limiting** (guardrail endpoint sensitif): fixed-window per identitas pada tiga
  mutasi bulk memakai `internal/platform/redisclient` (fallback in-process bila redis
  nonaktif) — default **10 permintaan/menit/identitas**; terlampaui → GraphQL error dengan
  pesan jelas. Implementasi kecil di lapisan resolver, bukan usecase.
- **Tanpa migrasi, tanpa perubahan entitas.** `docs/` dan ERD ikut diperbarui bila dokumen
  menyebut daftar mutasi.

## Desain Frontend (@AIF)

- **Bulk add** — perluasan `CreateAssignmentModal` (atau modal baru `BulkCreateAssignmentModal`
  di modul yang sama): pemilihan talent **multi-pilih** (pencarian + chip terpilih, sumber
  tetap `assignableTalents`), satu project + satu periode; kirim `bulkCreateAssignments`;
  setelah submit tampil **ringkasan hasil** (X berhasil, Y gagal + alasan per talent,
  FR-02/FR-10) dan modal tetap terbuka bila ada kegagalan agar Chapter dapat menindaklanjuti;
  guard klien batas 100 talent (server tetap penegak akhir, FR-08).
- **Bulk edit & bulk delete** — pada halaman daftar assignment (`page.tsx`): kolom seleksi
  (checkbox) untuk Chapter/Admin (`canManage`), **bulk action bar** muncul saat ≥ 1 baris
  terpilih: `Ubah massal` (modal: project dan/atau periode; baris non-ACTIVE disaring klien
  dengan keternangan, sisanya tetap divalidasi server) dan `Hapus massal` (dialog konfirmasi
  dengan ringkasan jumlah — FR-06). Hasil kedua operasi memakai ringkasan per baris yang sama.
- **Lapisan data**: operasi `.graphql` baru di `src/features/assignments/` sesuai kontrak +
  hook `useBulkCreateAssignments`/`useBulkUpdateAssignments`/`useBulkDeleteAssignments`;
  `npm run generate` terhadap SDL terlayani; perluasan `mapAssignmentSubmitError` untuk
  `BulkAssignmentErrorCode`.
- **Batasan**: tidak ada perubahan pada riwayat per talent, daftar per project, detail, dan
  alur akhiri yang sudah ada.

---

## Constitution Check

*GATE: harus lulus sebelum fase eksekusi; dievaluasi ulang setelah desain rinci.*

| Prinsip (konstitusi v1.1.1 dashboard / v1.1.0 backend) | Pemeriksaan | Status |
| --- | --- | --- |
| III. Security by design — RBAC + cakupan chapter ditegakkan server-side | Ketiga mutasi massal memakai `permAssignmentsManage` + `ChapterScope` yang sama dengan operasi tunggal; diuji matriks peran di K1 | **Lulus** |
| II. Data minimization — tanpa PII di URL/log | Hasil massal berisi id + pesan; tidak ada PII baru di URL/log | **Lulus** |
| V. Smallest change — tanpa fitur spekulatif | Tanpa migrasi/tabel baru; tiga mutasi yang diminta; rate limit adalah guardrail kecil pada endpoint sensitif baru, bukan fitur; impor CSV ditolak masuk scope (Out of Scope spec) | **Lulus** |
| VI. Quality by machines — lint/typecheck/test | `make lint/vet/test` (backend) + `npm run lint`/`typecheck`/`vitest` (frontend) wajib hijau | **Lulus** |
| VII. Testing non-negotiable | Matriks uji peran × operasi × kegagalan baris (backend); RTL untuk multi-pilih, bulk bar, ringkasan hasil (frontend) | **Lulus** |
| VIII. Boundaries — UI → hooks/features → generated | Semua operasi massal di `src/features/assignments/`; komponen tidak memanggil klien langsung | **Lulus** |
| IX. Fail visibly — tanpa swallowed error | Kegagalan per baris wajib tampil dengan alasan; konfirmasi hapus wajib (FR-06) | **Lulus** |

**Complexity Tracking**: tidak ada pelanggaran yang perlu dijustifikasi.

---

## Project Structure

### Documentation (fitur ini)

```text
tania-dashboard/specs/007-bulk-talent-assignment/   # rumah spec + plan (dokumen ini)
├── spec.md
├── plan.md
└── checklists/requirements.md

tania-backend/specs/005-bulk-talent-assignment/     # mirror byte-identik spec + checklist
├── spec.md
└── checklists/requirements.md
```

### Source Code (delta yang diubah plan ini)

```text
tania-backend/
├── graph/schema.graphqls                    # + kontrak bulk (commit pertama K1)
├── graph/model/ / graph/resolver/           # tipe & resolver hasil gqlgen
├── internal/usecase/assignment.go           # + BulkCreate/BulkUpdate/BulkDelete + test
├── internal/usecase/ratelimit.go            # + limiter fixed-window (redis fallback in-proc) + test
└── internal/repository/...                  # + hitungan rujukan aktivitas untuk pre-check delete

tania-dashboard/
├── src/features/assignments/
│   ├── bulkCreateAssignments.graphql        # operasi baru (codegen)
│   ├── bulkUpdateAssignments.graphql
│   ├── bulkDeleteAssignments.graphql
│   ├── useBulkAssignments.ts                # hook mutasi massal
│   ├── CreateAssignmentModal.tsx            # → multi-pilih talent + ringkasan hasil
│   ├── BulkActionBar.tsx                    # seleksi baris + ubah/hapus massal + konfirmasi
│   └── assignments.test.tsx                 # perluasan test
├── src/app/(app)/assignments/page.tsx       # kolom seleksi + bulk action bar
└── src/generated/graphql/                   # hasil `npm run generate` (jangan diedit manual)
```

**Structure Decision**: seluruh UI massal hidup di modul `assignments` yang ada — pola modal
(TAN-312) dan tabel eksisting dipakai ulang; tidak ada rute baru.

---

## Security (rekap)

Reuse penuh desain induk, plus guardrail khas operasi massal: otorisasi & cakupan tetap
sepenuhnya server-side (FR-08); batas batch 100 (FR-07); rate limit per identitas pada
endpoint massal; audit per assignment (FR-09) sehingga aksi massal Admin/Chapter tetap dapat
diperiksa per baris; UI tidak pernah menjadi penegak otorisasi. Penghapusan massal berdampak
turunan (CV, dashboard) — dijaga oleh larangan hapus data selesai (FR-04) dan pre-check
rujukan (FR-05).

---

## Testing

| Level | Cakupan | Alat |
| --- | --- | --- |
| Backend — unit usecase | Matriks peran (Admin/Operation/Chapter/Talent) × 3 operasi; per-baris gagal: luar cakupan, non-assignable, project nonaktif, periode terbalik, duplikat aktif, non-ACTIVE, dirujuk aktivitas; batas 100; duplikat talent dalam batch; audit per baris; urutan deterministik | `go test ./internal/usecase/...` (fake repo) |
| Backend — rate limit | Fixed-window redis + fallback; terlampaui → pesan jelas | unit test + integration (testcontainers bila perlu) |
| Frontend — unit/komponen | Multi-pilih talent + ringkasan hasil (sukses/parsial/gagal semua); seleksi baris + bulk bar muncul hanya untuk Chapter/Admin; konfirmasi hapus menampilkan jumlah; pesan error per baris tampil | Vitest + RTL + `MockedProvider` |
| Kontrak | Operasi `.graphql` cocok dengan SDL ter-generate | codegen + CI `npm run generate` bersih |
| E2E | Perluasan jalur assignment eksisting: bulk add → bulk edit → bulk delete → riwayat konsisten | Playwright (`e2e/`) — gelombang K3 |

---

## Roadmap (gelombang)

| Gelombang | Pelaksana | Pekerjaan | Menutup |
| --- | --- | --- | --- |
| **K1 — Kontrak + backend** | **@007** | Commit pertama: SDL kontrak ke `graph/schema.graphqls` → gqlgen → domain/usecase (BulkCreate/Update/Delete, per-row tx, pre-check rujukan) → resolver + rate limit → matriks test penuh → push ke branch fitur | FR-01…FR-11 sisi server; kontrak siap dikonsumsi |
| **K2 — Frontend** | **@AIF** | Operasi `.graphql` + codegen + hook; modal multi-pilih + ringkasan hasil; seleksi baris + bulk action bar + konfirmasi hapus; pemetaan error; test RTL (mock sesuai kontrak plan ini) | FR-01…FR-07, FR-10 sisi UI |
| **K3 — Integrasi & verifikasi** | @007 + @AIF (dikordinatori tech lead) | codegen terhadap SDL terlayani; E2E jalur massal; sinkronisasi mirror docs; checklist acceptance spec manual | SC-001…SC-005 |

K1 dan K2 **berjalan paralel** (contract-first); K3 menunggu K1 merge. `tasks.md` (Phase 2)
disusun oleh masing-masing pelaksana di reposnya masing-masing bila diperlukan — gelombang di
atas sudah menjadi work order sub-issue.

---

## Pembagian Kerja & Penugasan

| Slice | Assignee | Sub-issue |
| --- | --- | --- |
| Backend (SDL, usecase, resolver, rate limit, test) | **@007** (`e5aa7168-0f33-4f93-a179-7695a4809eef`) | sub-issue backend TAN-337 (dibuat tech lead) |
| Frontend (UI massal, operasi GraphQL, test) | **@AIF** (`a629f9a0-8134-491d-8043-6bdc774327bf`) | sub-issue frontend TAN-337 (dibuat tech lead) |

Setiap sub-issue memuat: ruang lingkup gelombangnya, kontrak SDL (bagian di atas), branch
kerja, definisi selesai, dan perintah checkout `--ref` branch fitur.

## Branch Naming

Konvensi repo (`AGENTS.md` dashboard): `<type>/<short-kebab>`, opsional tiket — dipakai
**dengan tiket** agar MR mudah dilacak:

- **Kedua repo**: `feat/TAN-337-bulk-assignment` — nama sama di backend dan frontend karena
  fitur bersama dan penamaan branch berlaku per repo.
- Spec + plan (dokumen ini) sudah dikomit tech lead pada branch tersebut di kedua repo.
- Pelaksana melanjutkan di branch yang sama: `multica repo checkout <url> --ref feat/TAN-337-bulk-assignment`;
  MR ditujukan ke `master`; judul commit mengikuti kebiasaan repo (`TAN-337: ...`).
- Dilarang bekerja di `master` atau branch `agent/*` untuk perubahan fitur ini.

---

## Open Items

| # | Item | Dampak | Rencana |
| --- | --- | --- | --- |
| O1 | Guardrail hapus: hanya assignment **berjalan** yang dapat dihapus (data selesai = historis permanen) — keputusan tech lead berdasarkan permintaan TAN-337 yang membuka kembali keputusan TAN-133 | Semantik FR-04 | Konfirmasi pemilik produk; bila hapus data selesai juga diminta, spec direvisi sebelum K2/K3 menutup |
| O2 | Threshold rate limit (default 10/menit/identitas) | Kenyamanan vs penyalahgunaan | Disetel saat K1; tidak mengubah kontrak |
| O3 | Label UI aksi hapus ("Hapus") vs pengakhiran ("Akhiri") | Kejelasan bahasa Indonesia | Diputuskan @AIF saat K2 mengikuti copy modul eksisting |
| O4 | Status `Assignment.jobRole` sudah dihapus (K7/0016) — tidak relevan lagi; kontrak bulk tidak memuat peran | — | Tidak ada tindakan |

## Risks

| # | Risiko | Dampak | Tindakan |
| --- | --- | --- | --- |
| RF1 | Pengguna mengira operasi massal all-or-nothing | Kekecewaan saat gagal parsial | Ringkasan hasil per baris wajib (FR-02); copy menjelaskan "yang berhasil tetap tersimpan" |
| RF2 | FK RESTRICT membuat delete mentah-mentah gagal | Pesan error tidak dapat dipahami | Pre-check rujukan `personal_work_activities` di usecase (FR-05) |
| RF3 | Drift kontrak saat SDL K1 berubah setelah K2 mulai | Codegen frontend meleset | Kontrak dibekukan di plan ini; perubahan kontrak harus direvisi di plan + kabar ke K2 sebelum merge |
| RF4 | Batch besar membebani server | Respons lambat | Cap 100 + rate limit; urutan baris deterministik; audit per baris tetap sinkron dalam transaksinya masing-masing |
| RF5 | Admin mengeksekusi hapus massal global (tanpa cakupan chapter) | Berdampak luas | Memang disengaja (TAN-212 clarify 4); dijinjikan audit per baris + konfirmasi FR-06 |
