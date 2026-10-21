# Phase 1 — Data Model: Masuk Single Sign-On (SSO) Microsoft Entra ID

**Feature**: `006-entra-sso-login` (TAN-267 · plan TAN-269) · **Date**: 2026-10-20

**Tidak ada tabel baru.** Fitur ini memakai tiga kolom yang **sudah ada tetapi belum terpakai** di `users` (disiapkan migrasi `0002_core_model.sql`) dan menambah **satu kolom** pada `refresh_tokens` (diminta Key Entities spec: sesi mencatat metode masuk). Entitas bisnis (karyawan, kontrak, assignment, IDP, evaluasi, CV, master data, provisi Entra) **tidak diubah** — konsisten dengan batas spec: SSO mengganti cara membuktikan identitas, bukan model otorisasi atau data kepegawaian.

## Akun Tania (`users`) — keterkaitan ke identitas korporat

| Field | Tipe (Go / SQL) | Status | Aturan |
| --- | --- | --- | --- |
| `id` | string / `uuid PK` | ada | Tidak berubah |
| `email` | string / `citxt` + unik `lower(email)` | ada | **Kunci pemetaan langkah (3)** FR-004 (dibandingkan `lower(email)`, bukan `=` peka huruf) |
| `entra_object_id` | `*string` (Go) / `text` | **ada, belum dipakai** | Keterkaitan ke **nol atau satu** identitas korporat (Key Entities). Diisi **sekali** saat login SSO pertama yang berhasil (lewat jalur mana pun); menjadi **kunci pemetaan langkah (1)** pada login berikutnya (stabil terhadap perubahan email/UPN) |
| `auth_provider` | `string` / `text NOT NULL DEFAULT 'local'` | **ada, belum dipakai** | `local` (bawaan, akun dengan kata sandi) atau `entra` setelah keterkaitan terbentuk. Bukan sumber keputusan otorisasi — hanya penanda asal autentikasi untuk Admin/audit |
| `status`/`active` | `boolean` / `bool` | ada | Akun tidak aktif **menolak** SSO (FR-011) — lewat `user.Active()` yang sama dengan jalur email |
| `role` | string / `text` | ada | **Satu-satunya** sumber hak akses (FR-006/D9); tidak pernah diisi dari klaim Microsoft |
| `saml_name_id` | `text` | ada, tak dipakai | **Tidak** dipakai fitur ini (jalur SAML di luar cakupan); dibiarkan apa adanya |

**Index baru** (satu-satunya perubahan bentuk pada `users`):

```sql
-- 0017_entra_sso_login.sql
CREATE UNIQUE INDEX users_entra_object_id_key
    ON users (entra_object_id)
    WHERE entra_object_id IS NOT NULL;
```

Alasan: satu identitas korporat tidak boleh memetakan ke dua akun Tania (konsisten `object_id UNIQUE` pada `entra_provisions`, migrasi `0008`). Parsial karena mayoritas akun tetap `NULL` (belum pernah masuk SSO).

## Urutan pemetaan identitas korporat → akun Tania (FR-004)

Berurutan; berhenti pada kecocokan pertama. Tidak ada kecocokan pada ketiganya → **tolak**, tanpa membuat akun (NC-02).

| # | Kunci | Sumber data | Menutup kasus |
| --- | --- | --- | --- |
| 1 | `users.entra_object_id = oid` | kolom di atas (diisi saat login SSO pertama berhasil) | login berulang; tetap stabil walau email/UPN korporat berubah |
| 2 | `entra_provisions.object_id = oid` → `employee_id` → `employees.user_id` → `users` | tabel provisi existing (migrasi `0008`); dibaca lewat `UserRepository.FindByEmployeeID` | akun korporat hasil provisi **CREATE**, yang UPN-nya turunan nama sehingga tidak identik dengan email akun Tania |
| 3 | `lower(users.email) = lower(klaim email/UPN)` | kolom `email` di atas | akun korporat yang **sudah ada sebelum Tania** dan belum punya baris provisi |

Bila (1) menemukan `oid` **berbeda** dari klaim → tolak (keterkaitan tidak berpindah otomatis). Bila (2) atau (3) cocok dan `users.entra_object_id` masih `NULL` → isi sekali (*first-login link*) + `auth_provider='entra'`. Tabel `entra_provisions` **tidak berubah bentuk** oleh fitur ini (dibaca saja).

## Identitas korporat (Microsoft Entra ID) — **tidak dipersistensi**

| Atribut klaim | Dipakai untuk | Disimpan? |
| --- | --- | --- |
| `oid` | Kunci keterkaitan & pemetaan utama | **Ya** (→ `users.entra_object_id`) |
| `tid` | Verifikasi single-tenant (NC-01, FR-005) | **Tidak** — dibandingkan dengan `ENTRA_TENANT_ID` saat validasi |
| `preferred_username` / `email` / `upn` | Kunci pemetaan langkah (3) (FR-004) | **Tidak** — dibandingkan dengan `users.email`; tidak disalin (minimisasi, Security II) |
| `name` | Tidak dipakai (nama tampilan sudah ada di `users.full_name`/`employees`) | **Tidak** |
| ID token mentah / access token Entra | Hanya untuk validasi dalam satu permintaan | **Tidak** — tidak pernah masuk DB, log, atau browser |
| `groups` / `roles` (klaim Microsoft) | **Tidak dibaca sama sekali** (FR-006) | **Tidak** |

Alasan tidak mempersistensi email/nama klaim: data itu sudah dimiliki Tania untuk pegawai yang sama (`users.full_name`, `users.email`, `employees.*`); menyalinnya berarti menambah salinan data pribadi tanpa tujuan (Prinsip II). Yang benar-benar baru hanyalah **keterkaitan** (`oid`).

## Sesi pengguna (`refresh_tokens`) — metode masuk

| Field | Tipe (Go / SQL) | Status | Aturan |
| --- | --- | --- | --- |
| `id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at` | existing | ada | Tidak berubah — TTL, rotasi, deteksi reuse, pencabutan identik untuk kedua jalur (FR-008) |
| `auth_method` | `string` / `text NOT NULL DEFAULT 'local'` | **baru** | `local` atau `entra_sso`. Diisi saat `issueSession`; **diwarisi** dari token yang dirotasi saat `Refresh` (bukan di-reset ke `local`) — kalau tidak, SC-005 salah hitung setelah rotasi pertama |

```sql
ALTER TABLE refresh_tokens
    ADD COLUMN auth_method text NOT NULL DEFAULT 'local'
        CHECK (auth_method IN ('local', 'entra_sso'));
```

Catatan: access token (JWT HS256) **tidak** berubah bentuk — menambah klaim metode ke JWT berarti mengubah kontrak token untuk semua konsumen tanpa kebutuhan fungsional. Metode hidup di baris sesi (refresh chain) yang memang menjadi catatan sesi.

## Transisi status keterkaitan

| Status awal | Kejadian | Hasil | Efek data |
| --- | --- | --- | --- |
| **Tak terhubung** (`entra_object_id IS NULL`) | Login SSO berhasil, cocok lewat langkah (2) `entra_provisions.object_id` **atau** langkah (3) `lower(email)`, akun **aktif** | **Sesi terbentuk** | `users.entra_object_id = oid`, `users.auth_provider = 'entra'`, `last_login_at = now()`, baris `refresh_tokens` (`auth_method='entra_sso'`), audit `LOGIN` `method=entra_sso` |
| **Tak terhubung** | Login SSO berhasil, email **tidak** cocok / akun **tidak aktif** | **Ditolak** | Tidak ada tulisan; audit `LOGIN` `method=entra_sso`, `outcome=rejected`, `reason=no_account`/`inactive_account` |
| **Terhubung** (`entra_object_id = oid`) | Login SSO berhasil, akun aktif | **Sesi terbentuk** | `last_login_at` diperbarui; tidak ada perubahan keterkaitan. **Email boleh berubah** — keterkaitan tetap (edge case spec) |
| **Terhubung** (`entra_object_id = oid_lain`) | Login SSO, email cocok ke akun ini | **Ditolak** | Tidak ada tulisan; audit `reason=identity_mismatch`. Keterkaitan **tidak berpindah otomatis**; penyelesaian = tindakan Admin (di luar cakupan) |
| **Terhubung** | Akun Tania dinonaktifkan (resign/pensiun, FR-46 spesifikasi 001) | **Ditolak** | Audit `reason=inactive_account`; sesi aktif dicabut lewat mekanisme akun existing |
| **Apa pun** | Akun Entra dihapus/dinonaktifkan di tenant | Login Microsoft gagal **sebelum** mencapai aplikasi | Tidak ada tulisan (efek FR-46 existing) |
| **Apa pun** | Token tidak valid / `tid`/`aud`/`nonce` salah / kedaluwarsa | **Ditolak** | Tidak ada tulisan; audit `reason=invalid_token` (tanpa detail kriptografis di pesan pengguna) |

**Aturan invarian**: (1) satu `oid` → paling banyak satu akun (indeks unik); (2) keterkaitan tidak pernah **dipindahkan** oleh login — hanya dibuat sekali; (3) akun tidak pernah **dibuat** oleh jalur SSO (NC-02); (4) peran/hak akses tidak pernah ditulis oleh jalur SSO.

## Klasifikasi & kepatuhan data pribadi (konstitusi Prinsip I–IV — deklarasi wajib)

| Butir | Deklarasi |
| --- | --- |
| Klasifikasi | `users.email`, `users.full_name` = **data pribadi umum** (sudah ada, bukan baru). `users.entra_object_id` = **penanda teknis** identitas korporat (bukan data pribadi berdiri sendiri; pseudonim teknis tenant). `refresh_tokens.auth_method` = metadata teknis sesi. **Tidak ada** kategori data pribadi spesifik/sensitif baru |
| Lawful basis (Prinsip I) | **Kepentingan sah — autentikasi pegawai** pada tenant korporat organisasi yang sama. Tujuan: membuktikan identitas pemohon untuk membuka sesi Tania. Tidak dipakai untuk profil, pelatihan model, analitik, atau tujuan lain |
| Minimisasi (Prinsip II) | Klaim identitas di luar `oid` **tidak** disimpan; token/klaim tidak masuk log; URL hanya membawa `code`/`state`/`nonce` (nilai buram berumur pendek, bukan PII); pesan kesalahan tidak membedakan keberadaan akun |
| Pemrosesan oleh pihak ketiga (Prinsip I/III) | Microsoft (tenant korporat Telkom) memproses autentikasi; tidak ada provider pihak ketiga di luar tenant. `CLIENT_SECRET` hanya di server (env/secret store) |
| Retensi (Prinsip IV) | Keterkaitan `entra_object_id` hidup selama akun; terhapus bersama akun mengikuti perilaku akun existing. Baris `refresh_tokens` mengikuti retensi/rotasi sesi existing. Audit `LOGIN` mengikuti retensi audit existing |
| Log (Prinsip II/IX) | Log modul SSO hanya: ID permintaan, `tid`, `oid` (terpotong/hash), kode error, durasi. **Tanpa** email, nama, token, atau klaim |
| Hak subjek data (Prinsip IV) | Tidak ada data pribadi baru yang perlu dilayani hak akses/penghapusan di luar akun itu sendiri; keterkaitan terhapus bersama akun |
| DAMP | Risiko **rendah–sedang** (single-tenant, tanpa penyimpanan klaim, tanpa PII baru). Checklist keamanan/DAMP dijalankan pada gerbang rilis — Open Item 4 `plan.md` |

## Relasi & antarmuka

```text
Microsoft Entra (tenant Telkom)
        │ ID token (validasi: tanda tangan, iss, aud, tid, exp, nonce)
        ▼
EntraLoginService (usecase) ──► UserRepository.FindByEntraObjectID              (langkah 1)
        │                        ├─ tak ada → entra_provisions(oid) → FindByEmployeeID   (langkah 2)
        │                        ├─ tak ada → FindByEmail(lower(email))               (langkah 3)
        │                        └─► UserRepository.LinkEntra(userID, oid)  (sekali)
        ├──► AuthService.issueSession(user, "entra_sso")  (reuse: JWT + refresh rotasi)
        │                        └─► RefreshTokenRepository.Create(… auth_method …)
        └──► AuditRecorder.Record(action=LOGIN, method=entra_sso, outcome, reason)
```

- **Masuk**: `tania-dashboard` `/login` → `@login/callback` → mutation `loginWithEntra` → sesi Tania (bentuk `AuthPayload` existing).
- **Keluar / kedaluwarsa / pencabutan**: tidak berubah — `logout`, refresh rotasi, `revokeUserSessions`, denylist access token (FR-008).
- **Tidak ada** query/mutation baru untuk membaca keterkaitan; Admin melihat penanda lewat modul Accounts/audit existing (bila kelak perlu kolom eksplisit di UI, itu perubahan UI terpisah — bukan kebutuhan spec ini).
