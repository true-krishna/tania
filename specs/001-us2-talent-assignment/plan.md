# Implementation Plan: Manajemen Assignment Talent

**Branch**: `feat/talent-assignment-specs` | **Date**: 2026-10-08 | **Spec**: `specs/001-us2-talent-assignment/spec.md` (TAN-97, Draft)

**Input**: Feature specification dari `/specs/001-us2-talent-assignment/spec.md`

**Perintah**: `/speckit.plan` — hasil untuk tiket TAN-133

**Revisi**: 2026-10-08 — O2 ditutup mengacu keputusan CV Profile (TAN-91, FR-10 yang disetujui
stakeholder): riwayat assignment milik Talent tampil sebagai bucket otomatis section Experiences
pada Profil CV — tidak ada tampilan khusus terpisah.

**Repo**: fitur ini melintasi dua repo — `codex/backend/tania-backend` (modul Assignment)
dan `codex/frontend/tania-dashboard` (modul UI assignments). Plan induk
(`specs/001-employee-digital-talent-management/plan.md` di masing-masing repo) tetap menjadi
sumber arsitektur; dokumen ini adalah **plan slice** yang memetakan spec dedikasi ke
implementasi eksisting dan menutup gap-nya.

---

## Summary

Fitur assignment talent — US2 spesifikasi induk yang diangkat menjadi spec mandiri: Chapter
membuat assignment (talent dari kandidat assignable, project dari Master Data Project, periode),
mengubah dan mengakhiri assignment berjalan, melihat riwayat per talent dan per project; Talent
melihat riwayat miliknya hanya-baca (P2).

Pendekatan teknis: **konvergensi, bukan greenfield**. Audit 2026-10-08 menunjukkan modul
assignment sudah terimplementasi di kedua repo pada `master` (hasil W3 fitur induk): backend
menyajikan seluruh operasi yang dibutuhkan spec (`createAssignment`, `updateAssignment`,
`endAssignment`, `assignments(filter)`, `Employee.assignments`, `assignableTalents`) dengan
otorisasi cakupan chapter di sisi server, dan frontend sudah memiliki daftar (filter talent/
project/status), form buat, serta detail + aksi akhiri. Plan ini karena itu:

1. Memverifikasi kesesuaian implementasi eksisting terhadap FR-01–FR-10 spec dedikasi
   (test matrix, tanpa perubahan kode bila lolos).
2. Menutup gap frontend yang teridentifikasi: **form ubah assignment** (backend siap, UI belum
   ada), **pengisian tanggal selesai saat mengakhiri** (kini terisi otomatis hari ini), dan
   pemaparan pesan validasi server (tanggal selesai < tanggal mulai).
3. **Tanpa perubahan kontrak API** — SDL yang dilayani sudah memuat semua operasi fitur ini;
   tidak ada operasi atau tipe baru.

---

## Technical Context

Stack dipin dari plan induk (konstitusi); **tidak ada dependensi baru** di fitur ini.

| Aspek | Keputusan |
| --- | --- |
| Bahasa backend | Go 1.26, clean architecture (transport → usecase → domain → repository), gqlgen schema-first |
| Database | PostgreSQL 16 (tabel `assignments` — plan induk `data-model.md` §3.4) |
| Bahasa frontend | TypeScript 5, Next.js 16.3.4 (App Router), React 19, TailwindCSS 4 |
| Lapisan data frontend | Apollo Client + GraphQL codegen (`src/generated/graphql/`) |
| Testing backend | `testing` + fake repository (unit usecase), testcontainers (integrasi) |
| Testing frontend | Vitest + React Testing Library + Apollo `MockedProvider` |
| Target performa | Daftar tetap responsif hingga ±5.000 karyawan (pagination cursor) |
| Constraints | SC-002: penolakan akses 100% di server; UI hanya menyembunyikan. Tanpa PII di URL/log. Label UI berbahasa Indonesia |
| Scale/Scope | 1 modul backend (M5, sudah ada) + 1 modul frontend (`assignments`, sudah ada); gap terbatas 2 layar + test |

---

## Kondisi Repositori (audit 2026-10-08)

### Backend (`tania-backend`, `master`)

- SDL (`graph/schema.graphqls`) memuat: `Assignment`, `AssignmentStatus`
  (`ACTIVE`/`COMPLETED`), `AssignmentFilter` (employeeId/projectId/status),
  `CreateAssignmentInput`, `UpdateAssignmentInput` (projectId/jobRoleId/periodStart/periodEnd —
  **tanpa** employeeId: talent tidak berpindah, selaras spec), mutasi `createAssignment`,
  `updateAssignment`, `endAssignment(id, periodEnd)`, query `assignments(filter)` dan
  `Employee.assignments`, plus `assignableTalents` (kandidat FR-03) dan `CvProfile.workExperience`
  (turunan assignment, FR-12).
- Usecase (`internal/usecase/assignment.go`) sudah menegakkan di server: `RequireRole(Chapter)`
  untuk CUD; `ChapterScope` pada semua baca/tulis; baca di luar cakupan → `ErrNotFound`;
  create hanya untuk karyawan aktif + assignable dalam chapter-nya (FR-03/FR-04); update dan
  end hanya pada status `ACTIVE` (pengakhiran kedua ditolak — edge case spec); validasi
  `periodEnd >= periodStart` pada update dan end (FR-09); audit before/after ditulis sinkron
  dalam transaksi (FR-10); `ensureNoDuplicateActive` — satu assignment aktif per talent+project
  (lintas project tetap diperbolehkan, selaras Asumsi spec tentang tumpang tindih periode).
- Test usecase eksisting: `internal/usecase/assignment_test.go` + fakes.

### Frontend (`tania-dashboard`, `master`)

- Halaman: `src/app/(app)/assignments/page.tsx` (daftar + filter Talent/Project/Status —
  melayani sudut pandang per talent **dan** per project), `/assignments/new` (form buat,
  kandidat dari `assignableTalents`), `/assignments/[id]` (detail + aksi akhiri).
- Modul: `src/features/assignments/` (query `assignments`, `assignableTalents`,
  `createAssignment`, `endAssignment` + hooks + test `assignments.test.tsx`: daftar, empty
  state, kandidat assignable-only, error field wajib, sukses buat, akhiri aktif).
- Riwayat talent (Talent sendiri) sudah tampil hanya-baca pada halaman CV
  (`src/app/(app)/cv/page.tsx`) sebagai "pengalaman kerja" dari `myCvProfile.workExperience`.
- Riwayat commit terkait: `e1465c4` (mockup US2), `e698c31` (integrasi GraphQL nyata).

---

## Pemetaan Spec → Implementasi (Gap Analysis)

| Spec | Status | Bukti / Gap |
| --- | --- | --- |
| US1 membuat assignment (FR-01–FR-04) | **Terpenuhi** | Form `/assignments/new` + `createAssignment`; kandidat `assignableTalents`; project dari Master Data Project; penolakan lintas chapter di server |
| US1-4 / FR-09 validasi tanggal di UI | **Gap G5** | Server menolak `periodEnd < periodStart`; form belum menampilkan pesan server itu dengan jelas (test hanya menutup error field wajib) |
| US2-2 mengubah detail (FR-05) | **Gap G1** | Backend `updateAssignment` siap; **belum ada form ubah** di UI — detail hanya menampilkan data + aksi akhiri |
| US2-3 mengakhiri dengan mengisi tanggal (FR-06, FR-09) | **Gap G2** | Aksi akhiri ada, tetapi tanggal selesai **tidak bisa diisi Chapter** — UI memakai `periodEnd ?? hari ini` otomatis; juga memakai `toISOString().slice(0,10)` (UTC) → **Gap G6** risiko geser tanggal pada timezone non-UTC |
| US2-4 penolakan tanggal selesai < mulai | **Gap G5** (satu paket) | Pesan server (`ErrPrecondition`/`Invalid`) perlu dipetakan ke tampilan error |
| US3 riwayat per talent (FR-07) | **Terpenuhi** | `Employee.assignments` + filter Talent pada daftar; histori termasuk yang diakhiri; baca lintas chapter → `ErrNotFound` |
| US4 daftar per project (FR-07) | **Terpenuhi** | Filter Project pada daftar assignment menampilkan talent dalam cakupan chapter beserta periodenya; kosong → empty state |
| US5 riwayat milik Talent (FR-08) | **Terpenuhi via Profil CV** (O2 ditutup mengacu TAN-91) | Section Experiences Profil CV menampilkan bucket otomatis dari riwayat assignment — hanya-baca, selalu terkini, termasuk yang sudah diakhiri (FR-10 spec CV Profile `002-cv-profile-spec.md`, disetujui stakeholder); tidak ada tampilan khusus terpisah; skenario empty state perlu diverifikasi |
| FR-10 jejak audit | **Terpenuhi** | `recordChange` before/after dalam transaksi; baca audit Admin-only (modul audit induk) |
| SC-001…SC-005 | **Diuji pada K1/K6** | SC-002 via test matrix otorisasi; SC-004 dijamin semantik update/end tanpa delete (tidak ada operasi hapus di kontrak) |

**Kesimpulan**: seluruh gap berada di sisi frontend (G1, G2, G5, G6) plus dua keputusan
produk kecil (G3/O2, O4). Tidak ada perubahan backend yang direncanakan.

---

## Constitution Check

*GATE: harus lulus sebelum fase eksekusi; dievaluasi ulang setelah desain rinci.*

| Prinsip (konstitusi v1.1.1 dashboard / v1.1.0 backend) | Pemeriksaan | Status |
| --- | --- | --- |
| III. Security by design — RBAC + cakupan chapter ditegakkan server-side | Sudah ditegakkan usecase (`RequireRole`, `ChapterScope`, `ErrNotFound` lintas cakupan); UI hanya menyembunyikan; SC-002 diuji di backend | **Lulus** |
| II. Data minimization — tanpa PII di URL/log | Detail assignment diakses via `id` di path (bukan PII); filter dikirim sebagai variabel GraphQL | **Lulus** |
| V. Smallest change — tanpa fitur spekulatif | Hanya gap yang menutup acceptance scenario spec; kontrak GraphQL berubah **hanya** karena keputusan produk 2026-10-19 (peran dihapus dari assignment, migrasi `0016`) — bukan penambahan spekulatif; tanpa dependensi baru; polish opsional ditolak | **Lulus** |
| VI. Quality by machines — lint/typecheck/test | `npm run lint` + `typecheck` + `vitest` (frontend), `make lint/vet/test` (backend) wajib hijau | **Lulus** |
| VII. Testing non-negotiable | Perluasan test RTL untuk setiap gap (G1, G2, G5); test matrix otorisasi backend sudah ada dan diverifikasi ulang; E2E jalur assignment tetap di harness induk (T129/T130) | **Lulus** |
| VIII. Boundaries — UI → hooks/features → generated | Form baru tetap di `src/features/assignments/` + operasi `.graphql` di modul yang sama; komponen tidak memanggil klien langsung | **Lulus** |
| IX. Fail visibly — tanpa swallowed error | Pesan penolakan server (validasi tanggal, CONFLICT duplikat aktif) ditampilkan eksplisit | **Lulus** |

**Complexity Tracking**: tidak ada pelanggaran yang perlu dijustifikasi.

---

## Project Structure

### Documentation (fitur ini)

```text
specs/001-us2-talent-assignment/          # di tania-dashboard (rumah spec, TAN-97)
├── spec.md                               # sudah ada
├── checklists/requirements.md            # sudah ada
└── plan.md                               # dokumen ini
```

> Mengikuti keputusan "opsi C" plan induk: artefak spesifikasi ditulis di repo dashboard;
> `spec.md` + `checklists/requirements.md` di-mirror byte-identik ke repo backend (keputusan
> O1, 2026-10-08). `tasks.md` (Phase 2) ada di repo ini (task lokal T001–T009, gelombang K2–K6);
> gelombang verifikasi backend K1 tereksekusi sebagai **T144** di `tasks.md` repo backend.
> Backlog eksekusi dibuat sebagai sub-issue TAN-133 (2026-10-08).

### Source Code (delta yang diubah plan ini)

```text
tania-dashboard/
├── src/app/(app)/assignments/[id]/page.tsx   # + form ubah (project, periode)
│                                              # + input tanggal selesai pada aksi akhiri
├── src/features/assignments/
│   ├── updateAssignment.graphql              # operasi baru (codegen), mutasi sudah ada di SDL
│   ├── useAssignment.ts                      # + mutation hook ubah/akhiri
│   └── assignments.test.tsx                  # perluasan test untuk G1, G2, G5
└── src/generated/graphql/                    # hasil `npm run generate` (jangan diedit manual)

tania-backend/
└── (tanpa perubahan kode — K1 hanya verifikasi test matrix; perubahan hanya bila verifikasi menemukan cacat)
```

**Structure Decision**: tidak ada file/struktur baru di luar modul `assignments` yang sudah ada.
Form ubah hidup di rute detail (konsisten dengan pola modul lain), bukan rute terpisah, karena
field yang bisa diubah sedikit (project, periode).

---

## Data & API

- **Perubahan skema terjadi sekali, lewat keputusan produk 2026-10-19**: peran dihapus dari assignment (`Assignment.jobRole`, `jobRoleId` pada input, kolom `job_role_id` → migrasi forward-only `0016_drop_assignment_job_role.sql`) pada gelombang K7. Di luar itu, tidak ada perubahan skema. `UpdateAssignmentInput` sesuai semantik spec: project dan periode bisa diubah; talent **tidak** bisa diganti (buat assignment baru bila salah
  talent — selaras "riwayat tidak pernah dihapus").
- Status: nilai server `ACTIVE`/`COMPLETED`; label Indonesia ("berjalan"/"selesai") dipetakan di
  UI — konsistensi label diperiksa saat menyentuh halaman detail (Open Item O4).
- Duplikat aktif: server menolak assignment aktif kedua untuk pasangan talent+project
  (`CONFLICT`) — bukan pelanggaran Asumsi spec (tumpang tindih lintas project tetap sah);
  pesan error dipetakan jelas di form.
- Pengalaman kerja CV dan angka dashboard (`activeAssignments`) otomatis mengikuti mutasi
  assignment — SC-003 tanpa sinkronisasi manual.
- **Relasi ke spec CV Profile (TAN-91, `002-cv-profile-spec.md`)**: spesifikasi itu menggantikan
  bagian CV pada spec 001 dan menetapkan (FR-10, disetujui stakeholder) bahwa section Experiences
  memakai model dua bucket — entri otomatis dari riwayat assignment (hanya-baca, selalu terkini,
  termasuk yang diakhiri) + entri CV/manual. Keputusan ini yang menutup O2 plan ini: tidak ada
  tampilan riwayat khusus terpisah untuk Talent. Fitur ini tetap pemilik data riwayat assignment;
  CV Profile hanya mengonsumsinya sebagai turunan (entri assignment tidak disalin ke tabel CV).

---

## Security (rekap slice)

Reuse penuh desain induk — tidak ada permukaan baru: semua mutasi Chapter-only, semua baca
dibatasi cakupan chapter (`ChapterScope`), baca lintas cakupan mengembalikan `ErrNotFound`
(bukan `FORBIDDEN`, menghindari kebocoran keberadaan data), Talent terbatas pada riwayat
miliknya (`CanAccessEmployee` / `myCvProfile`), audit sinkron before/after pada setiap mutasi.
Frontend tidak pernah menjadi penegak otorisasi.

---

## Testing

| Level | Cakupan | Alat |
| --- | --- | --- |
| Backend — verifikasi (K1) | Test matrix FR-01–FR-10 terhadap usecase eksisting: otorisasi 4 peran × (buat/ubah/akhiri/baca), validasi tanggal, pengakhiran kedua ditolak, duplikat aktif ditolak, audit tercatat | `go test ./internal/usecase/...` (fake) — tanpa perubahan kode bila lolos |
| Frontend — unit/komponen (K2–K4) | Form ubah: simpan perubahan (mutasi terkirim, cache/refetch); aksi akhiri dengan tanggal diisi + validasi tanggal < mulai; tampilan pesan error server (validasi & CONFLICT); kandidat tetap assignable-only | Vitest + RTL + `MockedProvider` |
| Kontrak | Operasi `updateAssignment` baru cocok dengan SDL ter-generate | codegen + CI `npm run generate` bersih |
| E2E | Jalur assignment (buat → ubah → akhiri → riwayat) sudah bagian harness induk | Playwright (`e2e/`, T129; gerbang T130) — bukan keluaran plan ini |

Kriteria lulus K6 (UAT): seluruh acceptance scenario spec (US1–US5) dilalui manual sekali
sebagai checklist, ditambah regression lintas modul: assignment diakhiri → muncul di pengalaman
kerja CV dan angka dashboard berubah konsisten.

---

## Roadmap (gelombang konvergensi)

Urutan eksekusi; rincian task ada di `tasks.md` (Phase 2) dan backlog Multica sebagai sub-issue
TAN-133 (dibuat 2026-10-08, status backlog):

| Gelombang | Pekerjaan | Menutup |
| --- | --- | --- |
| **K1 — Verifikasi backend** | Jalankan & lengkapi test matrix FR-01–FR-10 terhadap implementasi eksisting; catat temuan | Verifikasi seluruh FR sisi server; perubahan kode hanya bila ada cacat |
| **K2 — Form ubah assignment** | Form ubah project/periode pada detail assignment (mutasi `updateAssignment` via codegen) + test | G1 (US2-2, FR-05) |
| **K3 — Pengakhiran dengan tanggal** | Input tanggal selesai pada aksi akhiri (tanpa default otomatis; hindari `toISOString` UTC → G6) + tampilan pesan penolakan validasi | G2, G6 (US2-3, FR-06, FR-09) |
| **K4 — Pemetaan error form** | Error server per field/pesan aksi untuk buat & ubah (tanggal, CONFLICT duplikat aktif, FORBIDDEN cakupan) + test | G5 (US1-4, US2-4) |
| **K5 — Verifikasi US5 & label** | Verifikasi bucket otomatis section Experiences pada Profil CV menampilkan riwayat assignment Talent (termasuk empty state) sesuai FR-10 spec CV Profile (TAN-91); rapikan label status | O2, O4 (US5, FR-08) |
| **K6 — UAT & regression** | Checklist acceptance scenario spec + regression lintas modul (assignment → CV → dashboard); dieksekusi terpisah sebagai K6-FE (TAN-138) dan K6-BE (TAN-242) | SC-001…SC-005 |
| **K7 — Hapus peran dari assignment** (stage 5, 19–20 Okt 2026) | Keputusan produk 2026-10-19: peran bukan bagian assignment. Migrasi `0016`, SDL + gqlgen, domain/usecase/repository, tool chat, UI + codegen, ERD, cermin kontrak | Melaksanakan revisi spec 2026-10-19 (bukan gap teknis) |

K2–K4 dapat berjalan paralel setelah K1. Backend tidak menjadi prasyarat frontend karena
seluruh operasi sudah dilayani.

---

## Open Items

| # | Item | Dampak | Rencana |
| --- | --- | --- | --- |
| O1 | **Selesai 2026-10-08** — keputusan pemilik produk: perlu | Sinkronisasi dokumentasi antar repo | `spec.md` + `checklists/requirements.md` di-mirror byte-identik ke `tania-backend/specs/001-us2-talent-assignment/` (commit backend dicatat pada TAN-133); gelombang verifikasi backend K1 dicatat sebagai task T133 di `tasks.md` repo backend. Plan ini tetap satu dokumen di repo dashboard (rumah spec) |
| O2 | **Selesai 2026-10-08** — keputusan pemilik produk mengacu TAN-91 (CV Profile, FR-10 disetujui stakeholder) | UI Talent | Riwayat assignment milik Talent tampil melalui Profil CV: bucket otomatis pada section Experiences (hanya-baca, selalu terkini, termasuk yang diakhiri); **tidak ada** tampilan khusus `/assignments/my`. Sumber data tetap riwayat `Assignment` (diturunkan, tidak disalin). K5 cukup memverifikasi empty state & konsistensi label |
| O3 | **Selesai 2026-10-08** — Out of Scope dikonfirmasi pemilik produk | Penutupan checklist spec | Butir terakhir Review & Acceptance Checklist `spec.md` dicentang + entri Revisi ditambahkan (konfirmasi via TAN-133); spec tetap berstatus Draft sampai persetujuan spesifikasi penuh |
| O4 | Label status "Aktif/Selesai" vs "berjalan/selesai" | Konsistensi copy bahasa Indonesia | Diselaraskan saat menyentuh halaman terkait (K5); nilai server tidak berubah |

---

## Risks

| # | Risiko | Dampak | Tindakan |
| --- | --- | --- | --- |
| RF1 | Persepsi "fitur sudah selesai" padahal acceptance scenario US2 belum tertutup UI | Riwayat tidak dapat dikoreksi oleh Chapter | Plan ini menjadikan G1/G2 gelombang eksplisit (K2/K3) dengan test |
| RF2 | Drift kontrak saat menambah operasi `updateAssignment` di sisi klien | Codegen gagal / tipe meleset | Operasi ditulis dari SDL yang dilayani; `npm run generate` wajib bersih di CI |
| RF3 | Tanggal otomatis UTC (`toISOString`) menghasilkan tanggal selesai yang bergeser | Data historis salah hari | Dihapus bersama G2 (K3) — tanggal selalu diisi Chapter |
| RF4 | E2E jalur assignment bergantung harness induk (T129) yang belum tuntas | Gerbang rilis slice menunggu | Bukan keluaran plan ini; dilaporkan pada K6 |

---

## Hasil & batasan pasca-UAT (2026-10-20)

Gelombang K6 selesai di kedua sisi. Skenario US1–US5 punya hasil eksplisit; SC-001 **5,8 detik** (budget < 2 menit) dan SC-005 **801 baris: 1,8–4,8 detik** (22 detik saat beban mesin puncak). Tiga batasan dicatat di sini supaya tidak lagi menempel sebagai klaim yang lebih besar dari bukti:

1. **Detail assignment pada volume (SC-005/US2)** — `useAssignment` mengambil `assignments(first: 100)` lalu memilih node di klien, karena SDL tidak menyediakan `assignment(id)` dan `AssignmentFilter` tidak punya `id`. Pada 802 assignment, detail assignment lama tidak dapat dibuka. **Keputusan pemilik produk: tanpa perubahan kontrak** — batasan ini dicatat, bukan diperbaiki sekarang; janji SC-005 dibaca pada skala yang benar-benar diuji (±800 baris, 605 talent), bukan ±5.000. Menambah `assignment(id)` tetap opsi terbuka bila nanti dibutuhkan.
2. **Label status (O4)** — chip status pada dashboard Talent masih memakai peta sendiri (`ACTIVE: "Aktif"`), sedangkan daftar/detail/profil/CV memakai "Berjalan"/"Selesai". Sisa satu permukaan; dicatat sebagai utang copy, bukan cacat fungsional.
3. **Pengalaman Kerja CV untuk talent tanpa baris CV** — `CvService.MyProfile` mengembalikan `nil` bila `cv_profiles` belum ada, sehingga riwayat assignment tidak tampil (terkonfirmasi dari sisi server maupun UI). Integrasi CV berada di luar cakupan slice ini (fitur CV `002-cv-profile-spec`); dicatat sebagai temuan lintas fitur, perbaikannya keputusan produk fitur CV.

Catatan gerbang: `golangci-lint` di repo backend masih memuat 26 temuan **eksisting di `master`** (0 dari berkas UAT baru); CI GitLab repo itu sedang dinonaktifkan, jadi utang ini tidak terlihat oleh gate otomatis. Dilaporkan, tidak diperbaiki di gelombang ini.
