# Tasks: Pencarian Daftar Master Data (Job Role, Project, Unit)

**Input**: Design documents dari `/specs/003-master-data-search/`

**Prerequisites**: `plan.md` (required — keputusan D1–D6, gelombang K1–K2), `spec.md` (required — US1–US3, FR-001–FR-008)

**Tests**: Test RTL eksplisit diminta plan (konstitusi §III) — setiap task implementasi menyertakan task test-nya; assertion regresi (CRUD T052/T054) dan guard Chapter ikut ditambahkan.

**Organization**: Task dikelompokkan per gelombang plan (`plan.md` §Roadmap). Seluruh task frontend, dijalankan dari root `tania-dashboard`. Tanpa perubahan `tania-backend` (plan §Kondisi Repositori).

## Format: `[ID] [P?] [Gelombang] Description`

- **[P]**: dapat paralel (berkas berbeda, tanpa dependensi)
- **[US1/US2/US3]**: acceptance scenario spesifikasi yang dibuktikan task tersebut

## Path Conventions

- Komponen bersama: `src/features/master-data/MasterDataSection.tsx`
- Halaman: `src/app/(app)/master-data/{job-roles,projects,units,chapters}/page.tsx`
- Test: `src/features/master-data/master-data.test.tsx`
- Pola rujukan: `src/features/workload/TalentList.tsx` (pencarian existing — D3)

---

## Phase K1 — Implementasi pencarian & test (stage 1) — plan.md §Roadmap K1

**Purpose**: Satu titik perilaku pencarian di komponen bersama, opt-in pada tiga halaman, dengan test per perilaku FR.

- [X] T001 Tambahkan perilaku pencarian pada `src/features/master-data/MasterDataSection.tsx`
      (keputusan D1, D2, D5): prop opt-in; satu input `type="search"` + `IconSearch` di area
      daftar (polanya `TalentList` — D3); state kata kunci lokal; saringan **sebelum**
      `useTablePagination` — substring case-insensitive pada `name` (FR-001, FR-002);
      berlaku atas seluruh baris termuat termasuk non-aktif dengan badge tetap dirender
      (FR-004); saat kata kunci aktif dan nol hasil → pesan "tidak ada hasil yang cocok"
      **berbeda** dari `emptyMessage` (FR-006); kata kunci kosong/spasi → daftar tanpa
      saringan (FR-007); state pencarian terpisah dari state form — form tambah/edit yang
      terbuka tidak terpengaruh (FR-008); teks bantu/`aria-label` diturunkan dari
      `nameLabel` (D5). **Done**: semua perilaku FR-001–FR-008 tereksekusi di komponen;
      `npm run typecheck` bersih.
- [X] T002 Opt-in pencarian pada tiga halaman — `[US1]`
      `src/app/(app)/master-data/job-roles/page.tsx`, `[US2]`
      `src/app/(app)/master-data/projects/page.tsx`, `[US3]`
      `src/app/(app)/master-data/units/page.tsx` (prop dari T001). `chapters/page.tsx`
      **tidak diubah**. **Done**: ketiga halaman menampilkan kolom pencarian; Chapter
      tidak.
- [X] T003 [P] Test perilaku FR pada `src/features/master-data/master-data.test.tsx`
      (konstitusi §II/§III): filter live case-insensitive & substring; no-match ≠ empty
      state; kosongkan/spasi → daftar pulih; baris non-aktif ikut tersaring dengan badge;
      paginasi menghitung hasil tersaring dan tidak menyisakan halaman kosong saat hasil
      menyusut (FR-005 — clamp `safePage`); form terbuka tak berubah saat mencari;
      assertion `chapters` tidak menampilkan kolom pencarian (R3). **Done**: seluruh kasus
      hijau bersama test CRUD eksisting (T052/T054).
- [X] T004 [P] Test per halaman pada berkas test yang sama — `[US1]` filter pada data
      job role (dengan kolom chapter), `[US2]` filter pada project (kolom Unit), `[US3]`
      filter pada unit (kolom jumlah Proyek) — memakai data mock dan label masing-masing;
      minimal satu skenario end-to-end filter per halaman (ketik → hanya baris cocok;
      kosongkan → pulih). **Done**: US1–US3 masing-masing punya bukti test.

**Checkpoint**: `npm run lint && npm run typecheck && npx vitest run` hijau; perilaku
FR-001–FR-008 terpenuhi pada ketiga halaman; Chapter tetap tanpa pencarian.

---

## Phase K2 — Verifikasi & UAT (stage 2) — plan.md §Roadmap K2

**Purpose**: Gerbang penerimaan fitur.

- [ ] T005 Gerbang mesin (konstitusi §II): `npm run lint` + `npm run typecheck` +
      `npx vitest run` hijau; regression CRUD T052/T054 tetap hijau;
      `e2e/rbac.spec.ts` tidak tersentuh (tanpa perubahan gating nav). **Done**: semua
      gate hijau pada CI.
- [ ] T006 UAT manual — checklist acceptance scenario spesifikasi: US1 (4 skenario),
      US2 (3), US3 (3) dilalui sebagai Admin; sanity visual konsistensi pola `TalentList`
      (D3) dan aksesibilitas (`aria-label` per halaman, fokus terlihat — Design VI);
      konfirmasi SC-001–SC-003 (entitas ditemukan dengan ≤10 karakter pada daftar 100+
      baris; nol baris tak relevan; hasil terasa seketika). **Done**: checklist
      acceptance scenario penuh; temuan (bila ada) dilaporkan pada TAN-180.

---

## Dependencies & Execution Order

1. **T001** dulu — perilaku inti di komponen bersama.
2. **T002** setelah T001 (halaman opt-in butuh propnya); **T003** setelah T001;
   **T004** setelah T002 (halaman harus sudah opt-in).
3. **T005** setelah T001–T004; **T006** terakhir — gerbang penerimaan.
4. T003 dan T004 saling bebas (`[P]`) — berkas test sama, bisa satu commit logis.

## Notes

- Pencarian hanya-baca — tanpa perubahan skema, API, codegen, RBAC, dan dependensi
  (plan §Data & API); tidak ada operasi SDL baru.
- Perilaku paginasi tidak diubah — clamp `safePage` `useTablePagination` eksisting
  dipertahankan (D2); jangan menambahkan reset halaman manual.
- Kata kunci tetap state React lokal — jangan dipindah ke parameter URL (D6, Security II).
- Commit per task atau kelompok logis; jalankan test sebelum commit.
