# Tasks: Tambah Master Data (Create) — Job Role, Initiative, Unit

**Input**: Design documents dari `/specs/004-master-data-create/`

**Prerequisites**: `plan.md` (required — D1–D6, roadmap K1–K2, audit), `spec.md` (required — US1–US4, FR-001–FR-016), `research.md` (R-1–R-6), `data-model.md` (validasi V1–V6), `contracts/master-data-create.md`

**Tests**: Ya — perubahan perilaku (G1: chapter opsional) wajib disertai test (konstitusi §III). Test create Job Role/Initiative ditambahkan; test create Unit & pencarian existing menjadi regression.

**Organization**: Task dikelompokkan per gelombang plan (`plan.md` §Roadmap). Seluruh perubahan kode di **tania-dashboard**; `tania-backend` hanya diverifikasi (tidak diubah — plan §Kondisi Repositori).

## Format: `[ID] [P?] [US?] Description`

- **[P]**: dapat paralel (berkas berbeda, tanpa dependensi)
- **[US1..US4]**: user story / acceptance scenario spesifikasi yang dibuktikan task tersebut

## Path Conventions

- Komponen bersama: `src/features/master-data/MasterDataSection.tsx`
- Halaman: `src/app/(app)/master-data/{units,job-roles,projects}/page.tsx`
- Test: `src/features/master-data/master-data.test.tsx`
- Backend (verifikasi saja): `tania-backend/internal/usecase/{masterdata,jobrole,project}.go`, `internal/transport/httpapi/e2e_test.go`

---

## Phase K1 — Perbaikan validasi & test (stage 1) — plan.md §Roadmap K1

**Purpose**: Menutup G1 (form Job Role salah mewajibkan chapter) dan G2 (test create Job Role/Initiative belum ada). Create Unit & Project sudah ada — tidak dibangun ulang (D1).

- [ ] T001 [US2] Jadikan kewajiban pemilihan referensi **eksplisit per halaman** pada
      `src/features/master-data/MasterDataSection.tsx` (keputusan D2): tambah prop penanda
      referensi wajib (mis. `selectRequired`, default `false`); ubah `handleSubmit` agar
      `select` **hanya** divalidasi wajib bila penanda aktif — sekarang `select` apa pun
      otomatis wajib, sehingga Job Role tak bisa dibuat tanpa chapter. Pertahankan
      konsekuensi kontrak: nama wajib (V1/FR-004), pesan validasi berbahasa Indonesia,
      tombol Simpan nonaktif saat `busy` (FR-008), state pencarian tak terganggu.
      **Done**: Job Role dapat disimpan tanpa chapter; memilih chapter = opsional (FR-22);
      `npm run typecheck` bersih; tanpa gaya/komponen baru (Design I, Tech I).
- [ ] T002 Tandai kewajiban referensi pada halaman (prop dari T001) — `[US2]`
      `src/app/(app)/master-data/job-roles/page.tsx` → Chapter **opsional** (placeholder
      "boleh kosong" jadi benar); `[US3]` `src/app/(app)/master-data/projects/page.tsx` →
      Unit **wajib** (FR-006, tidak dilonggarkan). `units/page.tsx` tidak berubah (tanpa
      `select`). **Done**: Project tetap memblokir submit tanpa Unit; Job Role tidak lagi.
- [ ] T003 [P] [US2] Test create Job Role pada `src/features/master-data/master-data.test.tsx`
      (konstitusi §III): (a) create sukses **tanpa** chapter → toast sukses & baris
      "Tanpa chapter" (bukti G1/FR-002, acceptance US2 sk. 2); (b) create **dengan**
      chapter terpilih → toast sukses; (c) nama kosong → pesan "… wajib diisi." dan tidak
      ada data baru. **Done**: ketiga kasus hijau; `JobRolesDocument`/`CreateJobRoleDocument`
      di-`MockedProvider`.
- [ ] T004 [P] [US3] Test create Initiative/Project pada berkas test yang sama:
      (a) create sukses dengan Unit terpilih → toast sukses & baris Unit tampil
      (acceptance US3 sk. 1); (b) submit tanpa Unit → ditolak "Unit wajib dipilih." dan
      tidak ada data baru (FR-006/US3 sk. 2); (c) pesan error server (mis. duplikat →
      `ErrConflict`) disurfacekan lewat toast (FR-005/FR-007). **Done**: ketiga kasus hijau.
- [ ] T005 [P] Regression test pada berkas test yang sama: create Unit existing,
      rename, nonaktifkan, dan penolakan penonaktifan (T052/T054) tetap hijau; perluasan
      pencarian TAN-180 (FR-001–FR-008) tetap hijau. **Done**: tidak ada regresi.

**Checkpoint**: `npm run lint && npm run typecheck && npx vitest run` hijau; G1 & G2 tertutup;
Project tetap wajib Unit; Chapter Job Role opsional.

---

## Phase K2 — Verifikasi & UAT (stage 2) — plan.md §Roadmap K2

**Purpose**: Gerbang penerimaan fitur (SC-001–SC-005).

- [ ] T006 Gerbang mesin frontend (konstitusi §II): `npm run lint` + `npm run typecheck` +
      `npx vitest run` hijau; `e2e/rbac.spec.ts` tidak tersentuh (tanpa perubahan gating
      nav). **Done**: seluruh gate hijau.
- [ ] T007 Verifikasi backend (tanpa perubahan kode — plan §Kondisi Repositori): jalankan
      `make test` pada `tania-backend` (unit + contract). Konfirmasi: `createUnit`,
      `createJobRole`, `createProject` hanya `RoleAdmin` (`internal/usecase/authz_test.go`);
      Operation/Chapter → `FORBIDDEN` (`internal/transport/httpapi/e2e_test.go`); jejak
      audit tercatat (FR-016). **Done**: seluruh test backend hijau; otorisasi Admin-only
      terbukti.
- [ ] T008 UAT manual (`quickstart.md`): acceptance scenario US1–US4 sebagai Admin —
      tambah Unit; tambah Job Role **tanpa** chapter (G1) dan dengan chapter; tambah
      Initiative dengan Unit; blokir Initiative tanpa Unit; nama kosong; nama duplikat;
      Unit baru tersedia pada form Initiative (FR-009). Verifikasi otorisasi: login
      Operation → menu Master Data tidak tampil & request create langsung ditolak
      (FR-010/FR-011). Verifikasi jejak audit (FR-016). Konfirmasi SC-001–SC-005.
      **Done**: checklist acceptance scenario penuh; temuan (bila ada) dilaporkan pada
      TAN-187.

---

## Dependencies & Execution Order

1. **T001** dulu — aturan validasi di komponen bersama.
2. **T002** setelah T001 (halaman memakai prop baru).
3. **T003, T004, T005** setelah T001–T002; ketiganya `[P]` (berkas test sama — satu commit
   logis diperbolehkan).
4. **T006, T007** setelah T001–T005; **T008** terakhir — gerbang penerimaan.
5. T006 (frontend) dan T007 (backend) saling bebas.

## MVP scope

Perubahan minimal yang sudah membuat spec terpenuhi: **T001 + T002** (G1) — Job Role dapat
dibuat tanpa chapter. Test (T003–T005) & verifikasi (T006–T008) menyusul sebagai gerbang mutu.

## Notes

- **Jangan melonggarkan Project**: hanya Chapter Job Role yang opsional (FR-006 tetap).
- Validasi tetap otoritatif di server (V1–V3, V5, V6 sudah ditegakkan) — perubahan klien
  hanya cek cepat (D3, Security III).
- Tanpa perubahan skema/API/codegen/RBAC/dependensi (plan §Data & API); `tania-backend`
  tidak diubah.
- Label submenu "Project" → "Initiative" **tidak** diubah (D5) — follow-up terpisah.
- Commit per task atau kelompok logis; jalankan test sebelum commit.
