# API Conventions — GraphQL

Menyertai `schema.graphql`. Kontrak ini adalah **satu-satunya** antarmuka data antara
`tania-dashboard` (React/Apollo) dan `tania-backend` (Go/gqlgen).

## 1. Endpoint & transport

| Item | Nilai |
| --- | --- |
| GraphQL endpoint | `POST /graphql` (HTTP) |
| GraphiQL / playground | hanya aktif di lingkungan non-produksi |
| Health | `GET /healthz` (liveness + versi), `GET /readyz` (readiness: PostgreSQL + Redis) |
| SSO (redirect flows, W8) | `GET /auth/entra/login`, `GET /auth/entra/callback`, `GET /auth/saml/login`, `POST /auth/saml/acs` |
| Logout | mutation GraphQL `logout` (bukan endpoint REST) |
| Content type | `application/json` |

Flow OIDC/SAML bersifat redirect HTTP (bukan GraphQL) dan **diimplementasikan pada W8**. Setelah
callback sukses, backend menerbitkan access token + refresh token dan mengarahkan browser kembali
ke aplikasi dashboard. Pada W0–W7 hanya login lokal yang aktif.

## 2. Autentikasi

- **Access token**: JWT **HS256**, header `Authorization: Bearer <token>`, TTL default 15 menit
  (`JWT_ACCESS_TTL`). Secret dari env `JWT_SECRET`.
- **Refresh token**: opaque, dipertukarkan lewat mutation `refreshSession` (rotasi setiap
  pemakaian + deteksi reuse/family revocation). TTL default 168 jam (`JWT_REFRESH_TTL`).
- **Revokasi**: access token yang dicabut (logout / akun dinonaktifkan) masuk denylist `jti` di
  Redis hingga kedaluwarsa.
- Error autentikasi: `UNAUTHENTICATED` — token tidak ada/kadaluarsa/invalid/dicabut.

## 3. Error model

Setiap kegagalan dikembalikan sebagai entri `errors[]` GraphQL dengan `extensions.code`.
Pengguna melihat pesan berbahasa Indonesia pada `message`; klien memetakan perilaku dari `code`.

```json
{
  "errors": [
    {
      "message": "invalid email: must not be empty",
      "path": ["createEmployee"],
      "extensions": {
        "code": "BAD_USER_INPUT",
        "field": "email"
      }
    }
  ],
  "data": { "createEmployee": null }
}
```

| `extensions.code` | HTTP semantik | Dipakai saat | Contoh |
| --- | --- | --- | --- |
| `UNAUTHENTICATED` | 401 | Token tidak ada/kadaluarsa/dicabut | Sesi habis |
| `FORBIDDEN` | 403 | Peran/cakupan chapter tidak mengizinkan (FR-16) | Operation memanggil `createIdp`; Chapter mengakses talent di luar cakupannya |
| `NOT_FOUND` | 404 | Entitas tidak ada **atau** di luar cakupan (anti-enumerasi) | `employee(id)` di luar cakupan Chapter |
| `BAD_USER_INPUT` | 400 | Input tidak valid | Field wajib kosong, enum tidak dikenal, tanggal tidak valid |
| `CONFLICT` | 409 | Pelanggaran keunikan/aturan bisnis | Email/employeeCode duplikat; periode evaluasi tumpang tindih; hapus Unit yang masih dipakai Project |
| `RATE_LIMITED` | 429 | Melebihi rate limit | Percobaan login berulang |
| `INTERNAL` | 500 | Kesalahan tak terduga | Bug / dependensi gagal |

> **Catatan penyelarasan (2026-10-01)**: kode di atas adalah yang benar-benar dipetakan oleh
> `graph/errors.go` hari ini (`BAD_USER_INPUT` untuk `domain.ValidationError`, `CONFLICT` untuk
> `domain.ErrConflict`). Kode `VALIDATION_FAILED` dan `PRECONDITION_FAILED` dari draf awal
> **tidak** dipakai. Bila modul master data penuh membutuhkan pembedaan penolakan aturan bisnis
> dari duplikasi, tambahkan sentinel `domain.ErrPrecondition` + pemetaan `PRECONDITION_FAILED`
> pada W1 (task `tasks.md` T046).

Aturan:
1. Kesalahan **tidak pernah** membocorkan detail internal (stack trace, SQL) ke klien; kegagalan
   tak terduga dicatat ke log dan dikembalikan sebagai `INTERNAL` dengan pesan umum.
2. `FORBIDDEN` vs `NOT_FOUND`: untuk data yang eksistensinya sensitif (profil talent di luar
   cakupan), backend memakai `NOT_FOUND` agar tidak membocorkan keberadaan data.
3. Validasi mengumpulkan seluruh pelanggaran sekaligus (`extensions.fields[]`) bila memungkinkan;
   implementasi saat ini mengembalikan satu `field` per error — perluasan ke `fields[]` adalah
   pekerjaan W1.

## 4. Pagination

- Daftar besar memakai pola cursor (`Connection`): argumen `first` (default 25, maksimum 100) dan
  `after` (cursor opaque). `PageInfo.hasNextPage`/`endCursor` untuk halaman berikutnya.
- `totalCount` disediakan; bila mahal pada dataset besar, nilainya boleh dihitung dari cache
  (lihat `plan.md` §8) — nilainya tetap konsisten dengan filter.
- Daftar kecil/bounded (master data, kriteria template) memakai list biasa tanpa pagination.
- **Status implementasi**: pagination cursor belum ada di W0 — ditambahkan bersama modul pertama
  yang memuat daftar besar (Employee, W2; task `tasks.md` T014/T056).

## 5. Penamaan & bentuk data

- Tipe dan field: `camelCase`; enum: `SCREAMING_SNAKE_CASE` (nilai enum SDL terpasang memakai
  huruf besar, mis. `ADMIN`/`CHAPTER`).
- Waktu: scalar `Time` (RFC 3339, UTC); payload bebas: scalar `JSON`. Kontrak desain memakai nama
  `DateTime`/`Date`/`UUID`; SDL terpasang (W0) memakai `Time`/`JSON` dan `ID`/`String`. Saat SDL
  diperluas ke kontrak penuh, scalar diselaraskan sekali dan disetujui (gunakan `Time` untuk
  waktu, `Date` untuk tanggal, `ID` untuk identifier) agar tidak ada dua nama untuk satu makna.
- ID: direpresentasikan sebagai `ID` (string UUID). `scalar UUID` khusus dari kontrak desain
  **tidak** dipakai di SDL terpasang.
- Semua mutasi mengembalikan entitas yang berubah (bukan hanya boolean), kecuali operasi
  penghapusan (`Boolean`).
- Field turunan diberi komentar pada skema (mis. `Employee.chapter`, `Employee.assignable`,
  `CvProfile.workExperience`) agar tidak disalahartikan sebagai kolom tersimpan.

## 6. Cakupan otorisasi (ringkas)

| Operasi | Admin | Operation | Chapter | Talent |
| --- | --- | --- | --- | --- |
| Master data (Unit/Chapter/JobRole/Project) | tulis | — | — | — |
| Data karyawan | — | tulis | — | — |
| Assignment | — | — | tulis (cakupan chapter) | baca miliknya |
| IDP | — | — | tulis (cakupan chapter) | baca miliknya + update status aksi |
| CV | — | — | baca (cakupan chapter) | tulis miliknya |
| Template & periode evaluasi | tulis | — | — | — |
| Evaluasi performa | — | — | tulis (cakupan chapter) | baca miliknya |
| Akun user | tulis | — | — | — |
| Audit | baca | — | — | — |
| Dashboard | cakupan peran | cakupan peran | cakupan peran | cakupan peran |

## 7. Perubahan kontrak (versioning)

- Skema bersifat **kontrak-first**: **`graph/schema.graphqls` adalah sumber kebenaran API**
  (konstitusi v1.1.0, Additional Constraints); `gqlgen.yml` + `make generate` menghasilkan
  `graph/generated.go` dan `graph/model/`, dan GraphQL codegen frontend di-generate dari SDL yang
  sama.
- `specs/001-employee-digital-talent-management/contracts/schema.graphql` adalah **kontrak
  desain** (target penuh, 69 operasi) yang diport bertahap ke SDL per fase; selisih antara
  keduanya adalah backlog, bukan drift ilegal.
- Perubahan **breaking** (menghapus field, mengubah nullability/menambah nilai enum yang
  memengaruhi klien) dilarang tanpa deprecation bertahap: tambah field baru → tandai lama
  `@deprecated` → migrasikan pemakai → baru hapus.
- CI menjalankan `make generate` dan gagal bila hasil generate mengubah working tree (SDL dan kode
  ter-generate tidak sinkron).
