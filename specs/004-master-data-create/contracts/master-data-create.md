# Contract — Create Master Data (Unit, Job Role, Initiative)

**Feature**: `004-master-data-create` (TAN-187) · **Date**: 2026-10-14

Kontrak ini **sudah ada** pada `tania-backend/graph/schema.graphqls` dan dipakai `tania-dashboard`; plan ini tidak mengubahnya. Dokumen mencatat kontrak + otorisasi yang harus tetap berlaku.

## GraphQL mutations (existing)

```graphql
type Mutation {
  createUnit(name: String!): Unit!
  createJobRole(name: String!, chapterId: ID): JobRole!
  createProject(name: String!, unitId: ID!): Project!
}
```

| Mutation | Argumen wajib | Argumen opsional | Hasil |
| --- | --- | --- | --- |
| `createUnit` | `name` | — | `Unit` baru, `isActive: true` |
| `createJobRole` | `name` | `chapterId` (chapter pemilik; boleh kosong) | `JobRole` baru, `isActive: true` |
| `createProject` | `name`, `unitId` | — | `Project` baru, `isActive: true` |

## Otorisasi

- **Hanya `ADMIN`.** Setiap mutation memanggil `RequireRole(identity, RoleAdmin)`; peran lain menerima error otorisasi (mis. `FORBIDDEN`) di sisi server.
- Tanpa sesi → ditolak. Deny-by-default untuk operasi yang belum tercantum pada matriks.
- UI (guard `layout.tsx`, nav `roles: ["ADMIN"]`) hanya kenyamanan — bukan batas keamanan.
- Matriks Peran & Modul `002-tania-rbac` (baris **Master data**: Admin kelola; Operation/Chapter/Talent lihat) tetap berlaku; **tanpa amandemen**.

## Kontrak error

| Kondisi | Perilaku server | Perilaku UI |
| --- | --- | --- |
| Nama kosong/spasi | Error validasi | Dicegah di klien (pesan "… wajib diisi.") + pesan server disurfacekan |
| Nama duplikat (per entitas; Project per Unit) | `ErrConflict` | Toast error berisi pesan server |
| `createProject` tanpa/`unitId` tidak ada | Error validasi | Form memblokir bila Unit belum dipilih; error server disurfacekan |
| `createJobRole` `chapterId` tidak valid/non-aktif | Error validasi | Toast error berisi pesan server |
| Peran bukan Admin | Error otorisasi (`FORBIDDEN`) | Halaman tidak dirender untuk non-Admin; akses langsung tetap ditolak server |
| Sukses | `Unit`/`JobRole`/`Project` baru | Toast sukses + daftar di-`refetch` (entitas langsung tampil) |

## Kontrak UI (form Create)

- Tombol tambah (label per halaman) memunculkan form create di `MasterDataSection`.
- Field: **Nama** (wajib) + satu `select` referensi **bila** halaman memerlukannya.
- **Kewajiban referensi bersifat per halaman** (perbaikan G1):
  - Unit (Project) → **wajib** (`selectRequired`).
  - Chapter (Job Role) → **opsional**; boleh dikosongkan.
- Submit dinonaktifkan selama request berjalan (cegah submit ganda).
- Umpan balik sukses/gagal berupa toast; bila gagal, tidak ada data yang berubah dan input dipertahankan.

## Referensi

- SDL & resolver: `tania-backend/graph/schema.graphqls`, `graph/schema.resolvers.go`.
- Usecase & otorisasi: `internal/usecase/{masterdata,jobrole,project}.go`, `internal/usecase/authz_test.go`.
- E2E: `internal/transport/httpapi/e2e_test.go` (Admin sukses; Operation/Chapter `FORBIDDEN`).
