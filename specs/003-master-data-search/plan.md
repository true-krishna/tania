# Implementation Plan: Pencarian Daftar Master Data (Job Role, Project, Unit)

**Branch**: `003-master-data-search` | **Date**: 2026-10-13 | **Spec**: `specs/003-master-data-search/spec.md` (TAN-180, Draft — pemetaan "Initiative" = Project dikonfirmasi pemilik produk 2026-10-13)

**Input**: Feature specification dari `/specs/003-master-data-search/spec.md`

**Perintah**: `/speckit.plan` — hasil untuk tiket TAN-180

**Repo**: fitur ini satu-sisi frontend — seluruh perubahan di `codex/frontend/tania-dashboard`; **tanpa perubahan kontrak API dan tanpa perubahan kode `tania-backend`**.

---

## Summary

Tiga halaman master data (Job Role, Project, Unit) mendapat satu kolom pencarian yang menyaring baris daftar berdasarkan nama secara langsung (live) di sisi klien. Pendekatan: **satu titik, bukan tiga** — keempat halaman master data memakai komponen bersama `MasterDataSection`; pencarian ditambahkan di sana sebagai perilaku **opt-in per halaman** (tiga halaman ikut; daftar Chapter tetap tanpa pencarian, sesuai Out of Scope spec), mengikuti pola pencarian yang sudah ada pada daftar talent workload (`TalentList`). Saringan diterapkan pada daftar yang sudah dimuat penuh, sebelum paginasi — clamp halaman `useTablePagination` yang sudah ada memenuhi FR-005 tanpa kode paginasi baru. Tidak ada perubahan skema, API, RBAC, maupun dependensi.

## Technical Context

Stack dipin dari konstitusi & plan induk; **tidak ada dependensi baru** di fitur ini.

| Aspek | Keputusan |
| --- | --- |
| Bahasa frontend | TypeScript 5, Next.js 16.3.4 (App Router), React 19, TailwindCSS 4 |
| Lapisan data frontend | Apollo Client + GraphQL codegen (`src/generated/graphql/`) — **tidak tersentuh** oleh fitur ini |
| UI system | TANIA Pulse (kelas komponen, token `--tp-*`, `BoardTable`, `Input`, `IconSearch`) |
| Testing frontend | Vitest + React Testing Library + Apollo `MockedProvider` |
| Target performa | Filter memori atas daftar yang sudah dimuat; hasil terasa seketika (SC-003: ≤ 1 detik) |
| Constraints | Pencarian hanya-baca (FR-008); label UI berbahasa Indonesia; tidak ada PII di URL/log |
| Scale/Scope | 1 modul frontend (`master-data`), 1 komponen bersama + 3 halaman opt-in + test |

---

## Kondisi Repositori (audit 2026-10-13)

### Frontend (`tania-dashboard`, `master`)

- **`src/features/master-data/MasterDataSection.tsx`** — satu permukaan edit bersama untuk seluruh halaman master data (daftar + form tambah/edit + aktif/non-aktif; FR-15/FR-20/FR-24 induk, tanpa operasi hapus FR-21). Memuat `useTablePagination(items)` di dalamnya; `pageRows` dirender ke `BoardTable` dengan kolom nama, kolom ekstra, Status (`StatusBadge`), dan Aksi. `EmptyState(emptyMessage)` hanya tampil saat `items` kosong.
- **Empat halaman memakainya**: `/master-data/job-roles`, `/master-data/projects`, `/master-data/units`, `/master-data/chapters` — masing-masing mengirim `caption`, `nameLabel`, `extraColumn`, dan handler CRUD.
- **Hooks** (`useMasterData.ts`) mengambil daftar penuh termasuk baris non-aktif (`includeInactive: true`) — pencarian sisi klien memfilter baris yang *sudah tersaji*, sesuai FR-003/FR-004.
- **Paginasi** (`src/components/Pagination/useTablePagination.ts`) — `safePage = Math.min(page, totalPages)` sudah meng-clamp halaman ke rentang valid; opsi ukuran halaman 10/25/50.
- **Pola pencarian existing**: `src/features/workload/TalentList.tsx` — `type="search"` + `IconSearch` (pill input), filter `toLowerCase().includes()` saat diketik, pesan "Tidak ada talent yang cocok dengan pencarian." Tidak ada debounce.
- **Belum ada pencarian pada master data** — `MasterDataSection` tidak menerima maupun merender input pencarian hari ini.
- **Test**: `src/features/master-data/master-data.test.tsx` (CRUD Admin T052/T054: buat unit, ubah nama, nonaktifkan, tolak penonaktifan, validasi nama kosong); e2e `e2e/rbac.spec.ts` (gating nav per peran — tidak tersentuh fitur ini).

### Backend (`tania-backend`)

- SDL (`graph/schema.graphqls`) menyajikan `Unit`, `JobRole`, `Project` (id, name, isActive, relasi) lewat query daftar yang sudah dipakai halaman — **tidak ada perubahan backend**: tidak ada operasi pencarian baru yang dibutuhkan karena daftar sudah dimuat penuh oleh halaman.

---

## Keputusan Desain

| # | Keputusan | Alasan |
| --- | --- | --- |
| D1 | Filter **sisi klien** di dalam `MasterDataSection`, **opt-in per halaman** lewat satu prop | Keempat halaman memakai komponen yang sama — input & logika ditulis sekali; prop memisahkan Chapter (tetap tanpa pencarian, Out of Scope spec) dari tiga halaman target |
| D2 | Saringan diterapkan **sebelum** `useTablePagination` (items tersaring masuk hook) | FR-005 terpenuhi oleh clamp `safePage` yang sudah ada — Admin tidak berakhir di halaman kosong saat hasil menyusut, tanpa kode reset halaman baru |
| D3 | Pola interaksi & tampilan mengikuti `TalentList` (IconSearch, `type="search"`, substring case-insensitive, pill input) | Konsistensi pengalaman; SC-003 terpenuhi — filter memori atas daftar yang sudah dimuat, tanpa pemuatan ulang |
| D4 | Tanpa debounce | Filter berjalan di memori atas daftar yang telah termuat; paritas dengan pola existing; tanpa kompleksitas tambahan |
| D5 | Teks bantu pencarian diturunkan dari `nameLabel` per halaman | Konsisten dengan label form yang sudah dikirim per halaman; tanpa kamus string baru |
| D6 | Kata kunci disimpan sebagai state React lokal (bukan parameter URL) | Paritas TalentList; prinsip tanpa PII di URL (Security II) tetap terjaga |

---

## Pemetaan Spec → Implementasi

| Spec | Status | Bukti / Rencana |
| --- | --- | --- |
| US1 (Job Role), US2 (Project), US3 (Unit) | **Baru — K1** | Satu implementasi di `MasterDataSection` (D1), tiga halaman opt-in; acceptance scenario per halaman diuji di K1/K2 |
| FR-001 (kolom pencarian, live) | **Baru — K1** | Input `type="search"` di area daftar `MasterDataSection`; filter diterapkan seketika saat mengetik |
| FR-002 (substring, case-insensitive) | **Baru — K1** | Pencocokan `name.toLowerCase().includes(query.trim().toLowerCase())` — pola `TalentList` |
| FR-003 (tanpa akses baru) | **Terpenuhi by design** | Filter hanya atas `items` yang sudah diterima halaman; tidak ada query/operator baru; matriks RBAC tidak tersentuh |
| FR-004 (aktif + non-aktif) | **Terpenuhi** | `useMasterData` memuat `includeInactive: true`; saringan atas seluruh baris, badge status tetap dirender |
| FR-005 (paginasi atas hasil, tanpa halaman kosong) | **Baru — K1** | Items tersaring masuk `useTablePagination`; clamp `safePage` eksisting menjamin halaman yang tampil selalu berisi (test khusus) |
| FR-006 (pesan no-match ≠ empty state) | **Baru — K1** | Saat kata kunci aktif dan nol hasil → pesan "tidak ada hasil yang cocok"; `emptyMessage` hanya untuk daftar yang benar-benar kosong |
| FR-007 (kosongkan → daftar penuh) | **Baru — K1** | Kata kunci kosong/spasi → items tanpa saringan |
| FR-008 (hanya-baca) | **Baru — K1** | State pencarian terpisah dari state form (`name`, `selectValue`); test memastikan form terbuka tak berubah saat mencari |
| SC-001–SC-003 | **Diuji di K2** | Filter memori atas daftar termuat; skenario penerimaan dilalui manual sebagai checklist |

**Kesimpulan**: seluruh pekerjaan di satu komponen bersama + opt-in tiga halaman + test. Tidak ada gap backend, tidak ada perubahan kontrak, tidak ada artefak codegen baru.

---

## Constitution Check

*GATE: lulus sebelum eksekusi; diperiksa ulang setelah desain rinci.*

| Prinsip | Pemeriksaan | Status |
| --- | --- | --- |
| **Security IV** — enforcement server-side | Tidak ada permukaan baru: pencarian menyaring baris yang sudah tersaji; RBAC & operasi master data tidak berubah | **Lulus** |
| **Security II** — tanpa PII di URL/log | Kata kunci pencarian adalah state lokal komponen, tidak masuk URL/log/telemetri | **Lulus** |
| **Design I** — tokens.css kanon | Styling input memakai token/kelas existing (pola `TalentList`); tanpa nilai hex baru | **Lulus** |
| **Design VI** — accessibility floor | `type="search"`, `aria-label` per halaman (turunan `nameLabel`), fokus mengikuti token brand; pesan no-match berupa teks, bukan hanya warna | **Lulus** |
| **Design VII** — ikon | `IconSearch` dari set outline Pulse yang sudah dipakai aplikasi | **Lulus** |
| **Tech I** — smallest change | Satu komponen + satu prop + tiga halaman opt-in + test; tanpa komponen bersama baru, tanpa dependensi, tanpa perubahan backend | **Lulus** |
| **Tech II/III** — quality by machines / testing non-negotiable | Setiap perilaku FR-001–FR-008 punya test; lint + typecheck + vitest wajib hijau | **Lulus** |
| **Tech VII** — architecture boundaries | Filter hidup di lapisan feature (`MasterDataSection`); tidak ada pemanggilan klien GraphQL baru | **Lulus** |

**Complexity Tracking**: tidak ada pelanggaran yang perlu dijustifikasi.

---

## Project Structure

### Documentation (fitur ini)

```text
specs/003-master-data-search/     # di tania-dashboard (rumah spec)
├── spec.md                       # sudah ada (TAN-180)
└── plan.md                       # dokumen ini
```

> `tasks.md` (Phase 2) dibuat pada `/speckit.tasks` — bukan keluaran perintah ini. Tidak ada
> `research.md`/`data-model.md`/`contracts/` terpisah: audit muat dalam dokumen ini dan fitur
> tidak menyentuh skema data maupun API (mengikuti praktik plan slice `001-us2-talent-assignment`).

### Source Code (delta yang diubah plan ini)

```text
tania-dashboard/
├── src/features/master-data/
│   ├── MasterDataSection.tsx     # + prop opt-in pencarian, input pencarian, filter sebelum paginasi
│   └── master-data.test.tsx      # perluasan test perilaku pencarian (FR-001–FR-008) + regression
└── src/app/(app)/master-data/
    ├── job-roles/page.tsx        # opt-in pencarian (US1)
    ├── projects/page.tsx         # opt-in pencarian (US2)
    └── units/page.tsx            # opt-in pencarian (US3)

src/app/(app)/master-data/chapters/page.tsx   # TIDAK berubah — tanpa pencarian (Out of Scope)
```

**Structure Decision**: seluruh perilaku pencarian hidup di `MasterDataSection` (input, state kata kunci, saringan) karena itu satu-satunya titik render daftar; halaman hanya opt-in lewat prop. Tanpa komponen baru, tanpa hook baru.

---

## Data & API

- **Tanpa perubahan skema/API**: `units`/`jobRoles`/`projects` sudah mengirim seluruh baris (aktif + non-aktif) yang ditampilkan hari ini; pencarian hanya menyarikan tampilan. Tidak ada operasi/mutasi/tipe baru pada SDL; codegen tidak dijalankan ulang.
- Badge status, jumlah Proyek (Unit), dan Unit pemilik (Project) pada baris hasil tetap dirender dari data yang sama — kolom tidak berubah.

## Security (rekap slice)

Tidak ada permukaan baru: pencarian menyarikan baris yang sudah tersaji bagi pengguna (FR-003), tidak ada endpoint baru, tidak ada PII di URL (kata kunci = state lokal), dan UI tetap bukan penegak otorisasi — daftar yang tersaji beserta haknya sudah ditentukan server.

---

## Testing

| Level | Cakupan | Alat |
| --- | --- | --- |
| Unit/komponen (K1) | Perilaku FR-001–FR-008 di `MasterDataSection`: filter live case-insensitive & substring; no-match membedakan pesan dari empty state; kosongkan kata kunci memulihkan daftar; paginasi menghitung hasil tersaring (clamp — tidak ada halaman kosong); baris non-aktif ikut tersaring dengan badge; form tambah/edit tak terganggu saat mencari; kata kunci spasi = kosong; chapters **tidak** memiliki kolom pencarian | Vitest + RTL (perluasan `master-data.test.tsx`) |
| Per-halaman (K1) | Skenario penerimaan minimal per halaman: job-roles (US1), projects (US2), units (US3) — filter memakai data & `nameLabel` masing-masing | Vitest + RTL + `MockedProvider` |
| Regression | Test CRUD eksisting (T052/T054) tetap hijau; `e2e/rbac.spec.ts` tidak tersentuh | `npm run lint && npm run typecheck && npx vitest run` |

Kriteria lulus K2 (UAT): seluruh acceptance scenario spec (US1 4 skenario, US2 3, US3 3) dilalui manual sekali sebagai checklist + sanity visual konsistensi pola `TalentList`.

---

## Roadmap (gelombang eksekusi)

| Gelombang | Pekerjaan | Menutup |
| --- | --- | --- |
| **K1 — Implementasi & test** | Filter + input pencarian di `MasterDataSection` (opt-in via prop); tiga halaman ikutserta; perluasan test per perilaku FR-001–FR-008 + assertion chapters tanpa pencarian | US1–US3, FR-001–FR-008 |
| **K2 — Verifikasi & UAT** | Lint/typecheck/vitest hijau; checklist acceptance scenario spec manual; sanity konsistensi visual & aksesibilitas | SC-001–SC-003, Review & Acceptance Checklist spec |

Estimasi: K1 ±0,5–1 hari kerja; K2 ±0,5 hari — satu fitur kecil, satu komponen. Rincian task menyusul pada `/speckit.tasks`.

---

## Open Items

Tidak ada butir terbuka — keputusan "Initiative = Master Data Project" dikonfirmasi pemilik produk (TAN-180, 2026-10-13) dan tercatat pada Revisi spesifikasi.

---

## Risks

| # | Risiko | Dampak | Tindakan |
| --- | --- | --- | --- |
| R1 | Daftar master data tumbuh jauh melebihi ratusan baris sehingga filter memori terasa lambat | SC-003 | Skala saat ini puluhan–ratusan baris per daftar (spec, Assumptions); penyaringan sisi server hanya dievaluasi bila skala berubah — tanpa kerja spekulatif (Tech I) |
| R2 | Perilaku paginasi berubah tanpa disengaja saat items tersaring | UX Admin | Test khusus FR-005 (clamp) + regression test CRUD/paginasi eksisting |
| R3 | Daftar Chapter ikut mendapat pencarian tanpa sengaja | Melanggar Out of Scope spec | Prop bersifat opt-in; assertion test bahwa chapters tidak menampilkan kolom pencarian |
