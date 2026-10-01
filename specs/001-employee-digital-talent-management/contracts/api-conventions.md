# API Conventions — GraphQL

Menyertai `schema.graphql`. Kontrak ini adalah **satu-satunya** antarmuka data antara
`tania-dashboard` (React/Apollo) dan `tania-backend` (Go/gqlgen).

## 1. Endpoint & transport

| Item | Nilai |
| --- | --- |
| GraphQL endpoint | `POST /graphql` (HTTP) |
| GraphiQL / playground | hanya aktif di lingkungan non-produksi |
| Health | `GET /healthz` (liveness), `GET /readyz` (readiness: DB + Redis) |
| SSO (redirect flows) | `GET /auth/entra/login`, `GET /auth/entra/callback`, `GET /auth/saml/login`, `POST /auth/saml/acs`, `POST /auth/logout` |
| Content type | `application/json` |

Flow OIDC/SAML bersifat redirect HTTP (bukan GraphQL). Setelah callback sukses, backend
menerbitkan access token + refresh cookie dan mengarahkan browser kembali ke aplikasi
dashboard.

## 2. Autentikasi

- **Access token**: JWT, header `Authorization: Bearer <token>`, TTL 15 menit.
- **Refresh token**: cookie `HttpOnly; Secure; SameSite=Lax`, dipakai oleh mutation
  `refreshToken` (rotasi setiap pemakaian + deteksi reuse).
- Error autentikasi: `UNAUTHENTICATED` (401-equivalent) — token tidak ada/kadaluarsa/invalid.

## 3. Error model

Setiap kegagalan dikembalikan sebagai entri `errors[]` GraphQL dengan `extensions.code`.
Pengguna melihat pesan berbahasa Indonesia pada `message`; klien memetakan perilaku dari `code`.

```json
{
  "errors": [
    {
      "message": "Email sudah digunakan.",
      "path": ["createEmployee"],
      "extensions": {
        "code": "CONFLICT",
        "field": "email"
      }
    }
  ],
  "data": { "createEmployee": null }
}
```

| `extensions.code` | HTTP semantik | Dipakai saat | Contoh |
| --- | --- | --- | --- |
| `UNAUTHENTICATED` | 401 | Token tidak ada/kadaluarsa | Sesi habis |
| `FORBIDDEN` | 403 | Peran/cakupan chapter tidak mengizinkan (FR-16) | Operation memanggil `createIdp`; Chapter mengakses talent di luar cakupannya |
| `NOT_FOUND` | 404 | Entitas tidak ada **atau** di luar cakupan (anti-enumerasi) | `employee(id)` di luar cakupan Chapter → `NOT_FOUND` |
| `VALIDATION_FAILED` | 400 | Input tidak valid | Field wajib kosong, enum tidak dikenal, tanggal tidak valid |
| `CONFLICT` | 409 | Pelanggaran keunikan/aturan | Email/employeeCode duplikat; periode evaluasi tumpang tindih |
| `PRECONDITION_FAILED` | 422 | Aturan bisnis mencegah operasi | Hapus Unit yang masih dipakai Project; set peran Chapter pada posisi tanpa chapter |
| `RATE_LIMITED` | 429 | Melebihi rate limit | Percobaan login berulang |
| `INTERNAL` | 500 | Kesalahan tak terduga | Bug / dependensi gagal |

Aturan:
1. Kesalahan **tidak pernah** membocorkan detail internal (stack trace, SQL) ke klien.
2. `FORBIDDEN` vs `NOT_FOUND`: untuk data yang eksistensinya sensitif (profil talent di luar
   cakupan), backend memakai `NOT_FOUND` agar tidak membocorkan keberadaan data.
3. Validasi mengumpulkan seluruh pelanggaran sekaligus (`extensions.fields[]`) bila memungkinkan.

## 4. Pagination

- Daftar besar memakai pola cursor (`Connection`): argumen `first` (default 25, maksimum 100) dan
  `after` (cursor opaque). `PageInfo.hasNextPage`/`endCursor` untuk halaman berikutnya.
- `totalCount` disediakan; bila mahal pada dataset besar, nilainya boleh dihitung dari cache
  (lihat `plan.md` §8) — nilainya tetap konsisten dengan filter.
- Daftar kecil/bounded (master data, kriteria template) memakai list biasa tanpa pagination.

## 5. Penamaan & bentuk data

- Tipe dan field: `camelCase`; enum: `SCREAMING_SNAKE_CASE`; waktu: `DateTime` (RFC 3339, UTC);
  tanggal: `Date` (`YYYY-MM-DD`).
- ID: `UUID` sebagai `scalar UUID` (diwakili string).
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

- Skema bersifat **kontrak-first**: `contracts/schema.graphql` adalah sumber kebenaran; gqlgen
  dan GraphQL codegen frontend di-generate dari sini.
- Perubahan **breaking** (menghapus field, mengubah nullability/menambah nilai enum yang
  memengaruhi klien) dilarang tanpa deprecation bertahap: tambah field baru → tandai lama
  `@deprecated` → migrasikan pemakai → baru hapus.
- CI memvalidasi bahwa skema yang di-generate cocok dengan berkas kontrak (gagal jika tidak).
