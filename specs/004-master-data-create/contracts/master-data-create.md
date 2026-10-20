# Contract — Create Master Data (Unit, Job Role, Initiative)

**Feature**: `004-master-data-create` (TAN-187) · **Date**: 2026-10-14

Kontrak ini **sudah ada** pada `tania-backend/graph/schema.graphqls` dan dipakai `tania-dashboard`; plan ini tidak mengubahnya. Dokumen mencatat kontrak + otorisasi yang harus tetap berlaku.

**Amandemen 2026-10-15 (TAN-213)**: sejak plan ini ditulis, SDL yang dilayani berubah **di luar plan ini** — `Unit.code` masuk bersama fitur *bulk import data* backend (`4d94c3c`, 2026-10-14) dan diadopsi frontend pada `8ac6e22` (MR !83, TAN-208). Bagian mutasi & field di bawah mencatat bentuk yang **dilayani kini**, bukan bentuk saat audit 2026-10-14 (`createUnit(name: String!)` tanpa `code` sudah tidak berlaku).

## GraphQL mutations (existing)

```graphql
type Mutation {
  createUnit(code: String!, name: String!): Unit!
  updateUnit(id: ID!, code: String!, name: String!): Unit!
  createJobRole(name: String!, chapterId: ID): JobRole!
  createProject(name: String!, unitId: ID!): Project!
}
```

| Mutation | Argumen wajib | Argumen opsional | Hasil |
| --- | --- | --- | --- |
| `createUnit` | `code`, `name` | — | `Unit` baru, `isActive: true` |
| `updateUnit` | `id`, `code`, `name` | — | `Unit` terbarui (kode & nama dapat diubah) |
| `createJobRole` | `name` | `chapterId` (chapter pemilik; boleh kosong) | `JobRole` baru, `isActive: true` |
| `createProject` | `name`, `unitId` | — | `Project` baru, `isActive: true` |

## Field kontrak Unit (amandemen 2026-10-15)

- **`Unit.code: String!`** — kode unik satuan kerja; pembeda utama antar unit. Wajib, ≤ 50 karakter, di-trim; keunikan case-insensitive (`FindByCode` → `ErrConflict` bila dipakai unit lain). Unit tidak dapat dibuat maupun diubah tanpa `code`.
- **`Unit.name: String!`** — label tampilan; wajib, ≤ 120 karakter; **tidak unik** untuk Unit. Keunikan nama tetap berlaku untuk JobRole (nama) dan Project (nama per Unit).
- Tidak ada mutasi hapus (`deleteUnit` tidak ada pada SDL) — FR-21 induk: master data hanya dinonaktifkan; penonaktifan ditolak (`PRECONDITION_FAILED`) selama Unit masih direferensikan Project.

## Otorisasi

- **Hanya `ADMIN`.** Setiap mutation memanggil `RequireRole(identity, RoleAdmin)`; peran lain menerima error otorisasi (mis. `FORBIDDEN`) di sisi server.
- Tanpa sesi → ditolak. Deny-by-default untuk operasi yang belum tercantum pada matriks.
- UI (guard `layout.tsx`, nav `roles: ["ADMIN"]`) hanya kenyamanan — bukan batas keamanan.
- Matriks Peran & Modul `002-tania-rbac` (baris **Master data**: Admin kelola; Operation/Chapter/Talent lihat) tetap berlaku; **tanpa amandemen**.

## Kontrak error

| Kondisi | Perilaku server | Perilaku UI |
| --- | --- | --- |
| Nama kosong/spasi | Error validasi | Dicegah di klien (pesan "… wajib diisi.") + pesan server disurfacekan |
| Kode Unit duplikat (case-insensitive, per amandemen 2026-10-15) | `ErrConflict` | Toast error berisi pesan server |
| Kode Unit kosong/lebih dari 50 karakter | Error validasi | Dicegah di klien ("Kode Unit wajib diisi."); pesan server disurfacekan |
| Nama duplikat (JobRole; Project per Unit — Unit tidak unik per nama) | `ErrConflict` | Toast error berisi pesan server |
| `createProject` tanpa/`unitId` tidak ada | Error validasi | Form memblokir bila Unit belum dipilih; error server disurfacekan |
| `createJobRole` `chapterId` tidak valid/non-aktif | Error validasi | Toast error berisi pesan server |
| Peran bukan Admin | Error otorisasi (`FORBIDDEN`) | Halaman tidak dirender untuk non-Admin; akses langsung tetap ditolak server |
| Sukses | `Unit`/`JobRole`/`Project` baru | Toast sukses + daftar di-`refetch` (entitas langsung tampil) |

## Kontrak UI (form Create)

- Tombol tambah (label per halaman) memunculkan form create di `MasterDataSection`.
- Field: **Nama** (wajib) + **Kode Unit** (wajib, placeholder "cth: DBT") pada halaman Unit + satu `select` referensi **bila** halaman memerlukannya.
- Mengedit Unit mengisi ulang **Kode Unit** dari data yang dilayani (`units { code }`); tabel menampilkan Nama/Proyek/Status/Aksi — kode tidak punya kolom tabel terpisah.
- **Kewajiban referensi bersifat per halaman** (perbaikan G1):
  - Unit (Project) → **wajib** (`selectRequired`).
  - Chapter (Job Role) → **opsional**; boleh dikosongkan.
- Submit dinonaktifkan selama request berjalan (cegah submit ganda).
- Umpan balik sukses/gagal berupa toast; bila gagal, tidak ada data yang berubah dan input dipertahankan.

## Referensi

- SDL & resolver: `tania-backend/graph/schema.graphqls`, `graph/schema.resolvers.go`.
- Usecase & otorisasi: `internal/usecase/{masterdata,jobrole,project}.go`, `internal/usecase/authz_test.go`.
- E2E: `internal/transport/httpapi/e2e_test.go` (Admin sukses; Operation/Chapter `FORBIDDEN`).
