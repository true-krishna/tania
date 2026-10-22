# Implementation Plan: Masuk Single Sign-On (SSO) Microsoft Entra ID

**Branch**: `006-entra-sso-login` | **Date**: 2026-10-20 | **Spec**: `specs/006-entra-sso-login/spec.md` (TAN-267, Clarified; **direvisi 2026-10-20** — FR-004 dua jalur pemetaan, SC-005, Assumptions, Edge Cases; lihat baris `**Revisi**` pada spec)

**Input**: Feature specification from `/specs/006-entra-sso-login/spec.md`

**Perintah**: `/speckit.plan` — hasil untuk tiket **TAN-269** atas spec **TAN-267**

**Repo**: **tania-dashboard** (rumah spec & halaman login) + **tania-backend** (pertukaran kode, validasi bukti autentikasi, pemetaan akun, penetapan sesi, jejak audit) — kedua repo diubah sesuai kebutuhan spec; **stack existing tidak berubah**.

**Cermin artefak**: repo **tania-backend** memakai `specs/004-entra-sso-login/` untuk fitur yang sama (lihat `README.md` backend — spec dicermin; plan & turunannya disalin dengan rujukan direktori 004).

---

## Summary

Menambahkan **masuk SSO dengan akun korporat Microsoft Entra ID** sebagai **opsi utama** di halaman login, **tanpa menghapus** jalur email + kata sandi (FR-002). Pendekatan teknis: alur **OAuth 2.0 Authorization Code + PKCE** dengan **backend sebagai confidential client** — browser hanya membawa `code`, `state`, `nonce`, dan PKCE verifier; `CLIENT_SECRET` tidak pernah meninggalkan server. Pertukaran kode, validasi **ID token** (tanda tangan RS256 lewat JWKS tenant, `iss`, `aud`, `tid`, `exp`, `nonce`), pemetaan **identitas korporat → akun Tania** (keterkaitan hasil Provisi Entra lebih dulu, lalu work email), penolakan identitas di luar tenant/linkage (NC-01/NC-02), dan penetapan sesi Tania seluruhnya terjadi **di `tania-backend`** dan **memakai ulang `AuthService.issueSession`** sehingga masa berlaku, rotasi refresh, pencabutan, dan penonaktifan **identik** dengan jalur email + kata sandi (FR-008). Tidak ada tabel sesi baru, tidak ada dependensi Go/Node baru, tidak ada amandemen matriks RBAC `002-tania-rbac` (hak akses tetap dari peran akun Tania — FR-006), dan tidak ada perubahan pada alur provisi Entra yang sudah ada (FR-43–FR-46 spesifikasi 001).

Dua penyesuaian skema minimal dipakai, keduanya sudah **disiapkan tetapi belum terpakai** oleh gelombang sebelumnya:

1. `users.entra_object_id` + `users.auth_provider` (kolom sudah ada sejak migrasi `0002_core_model.sql`, **belum pernah dibaca/ditulis** kode) diaktifkan sebagai **keterkaitan akun → identitas korporat** (Key Entities spec); ditambah indeks unik parsial agar satu identitas Entra tidak pernah terpetakan ke dua akun.
2. `refresh_tokens.auth_method` (kolom baru) — Key Entities spec menyatakan **sesi kini mencatat metode masuk**; dipakai untuk SC-005 (proporsi masuk via SSO) dan penelusuran sesi.

**Satu temuan spec diselesaikan dengan revisi spec** (disetujui pemilik produk, 2026-10-20, TAN-269): akun yang diprovisi lewat kemampuan Entra existing (`FR-45`) memakai **UPN turunan nama** (`nama@digitaltelkom.id`), sehingga **work email identitas korporatnya tidak identik** dengan email akun Tania — padahal FR-004 semula mencocokkan work email saja. Pemilik produk menyetujui **FR-004 jalur (a)**: pemetaan memakai **keterkaitan hasil Provisi Entra** lebih dulu, lalu work email sebagai jalur kedua. Revisi spec (termasuk SC-005, Assumptions, Edge Cases) tercatat pada baris `**Revisi**` di `spec.md`; keputusan teknisnya ada di **D5**, dan sisa pekerjaan di sisi provisi (memastikan sinkronisasi akun lama mencatat `object_id`) dicatat pada **Open Item 6** sebagai milik fitur Provisi Entra.

## Technical Context

Stack dipin dari konstitusi v1.2.0 (Additional Constraints); **tidak ada penambahan** komponen stack — hanya modul baru di dalam repo existing.

| Aspek | Keputusan |
| --- | --- |
| Backend | Go 1.26 clean architecture (`transport → usecase → domain → repository`) + PostgreSQL 16 (pgx, migrasi forward-only) + GraphQL gqlgen + Redis + JWT — **tania-backend**, tanpa perubahan stack |
| Alur autentikasi | **OAuth 2.0 Authorization Code + PKCE**, confidential client (`CLIENT_SECRET` server-side). Browser hanya menyimpan `state`, `nonce`, PKCE verifier (sessionStorage); tidak ada token Entra yang menetap di browser |
| Validasi bukti autentikasi | **ID token** Microsoft: verifikasi tanda tangan RS256 via **JWKS tenant** (`login.microsoftonline.com/{tenant}/discovery/v2.0/keys`) + klaim `iss`, `aud`, `tid == ENTRA_TENANT_ID`, `exp`/`iat` (dengan toleransi skew), `nonce`. Memakai `github.com/golang-jwt/jwt/v5` yang **sudah** menjadi dependensi (dipakai access token HS256) + `crypto/rsa`/`math/big` untuk memetakan JWK → kunci publik — **nol dependensi Go baru** |
| Pemetaan identitas | **Dua jalur berurutan (FR-004)**: **(a)** `entra_provisions.object_id` (identitas yang sudah diberikan kepada karyawan itu) → `employee_id` → akun Tania; **(b)** `lower(users.email) = lower(work email claim)`; tanpa kecocokan → **tolak, tanpa membuat akun** (NC-02); satu akun ↔ nol atau satu identitas korporat |
| Penetapan sesi | **Reuse** `AuthService.issueSession` (access JWT HS256 existing + refresh token rotasi existing) dengan parameter baru `authMethod`; TTL/rotasi/pencabutan/penonaktifan identik jalur email |
| Frontend | TypeScript 5, Next.js (App Router), React 19, TailwindCSS 4, Apollo Client 3 + codegen (`src/generated/graphql/`) — **tania-dashboard**, tanpa perubahan stack; **nol `pnpm install` baru** (PKCE memakai **Web Crypto** `crypto.getRandomValues` + `crypto.subtle.digest`) |
| UI system | TANIA Pulse (`src/components`, token `--tp-*`); halaman login mengikuti TANIA Pulse + arah desain TAN-191 yang sudah tercatat (brand-red sebagai aksi primer halaman ini) |
| Testing | Backend: Go unit/contract (`usecase` + fake exchange/verifier, `authz_test`, `security_test`, `e2e_test`, `regression_test`); Frontend: Vitest + RTL (`MockedProvider`) + Playwright e2e |
| Constraints | Rahasia hanya dari env/secret store dan tidak pernah di-commit/di-log/ke issue (FR-010, Security III); tanpa PII pada log & URL; otorisasi tetap server-side (FR-006, Security III); jalur email + kata sandi **zero-regression** (FR-002/SC-003) |
| Scale/Scope | 2 penyesuaian skema (1 kolom baru + 1 indeks unik parsial; 3 kolom existing diaktifkan); 1 modul backend baru (usecase SSO + klien OIDC); 1 query + 1 mutation GraphQL; 2 rute UI (`/login` auto-redirect + `/login/callback`) |

## Constitution Check

*GATE: lulus sebelum eksekusi; diperiksa ulang setelah desain rinci (bagian bawah).* Rujukan pilar: `.specify/memory/constitution-{security,technical,design}.md`.

| Prinsip | Pemeriksaan | Status |
| --- | --- | --- |
| **Security I** — lawful basis & purpose limitation | Dasar pemrosesan klaim identitas korporat (work email, object id tenant, nama tampilan) dideklarasikan di `data-model.md`: **kepentingan sah — autentikasi pegawai** pada tenant korporat yang sama; klaim hanya dipakai untuk memetakan & mengautentikasi, tidak untuk tujuan lain | **Lulus** |
| **Security II** — minimisasi & klasifikasi | Hanya `entra_object_id` (+ penanda metode sesi) yang **disimpan**; work email/nama dari klaim Entra **tidak dipersistensi** (sudah ada di `users`/`employees` bila memang milik pegawai); tidak ada PII pada log (log hanya ID teknis, `tid`, `oid` ter-hash/terpotong, kode error) dan **tidak ada PII pada URL** (klaim tidak pernah masuk query string) | **Lulus** |
| **Security III** — security by design | `CLIENT_SECRET` hanya di server (env/secret store); validasi tanda tangan ID token RS256 + `tid`/`iss`/`aud`/`nonce` sebelum sesi terbentuk (FR-003/FR-005); PKCE mencegah pertukaran kode lintas klien; rate limit reuse Redis (FR-012); jejak audit semua upaya (FR-007) | **Lulus** (DAMP/checklist keamanan → Open Item 4) |
| **Security IV** — hak subjek & retensi | Tidak ada data pribadi baru yang disimpan: keterkaitan `entra_object_id` terhapus bersama akun (FK/`ON DELETE` perilaku akun existing); sesi & audit mengikuti retensi existing; tidak ada profil baru | **Lulus** |
| **Technical I** — smallest change | Nol proyek/layanan/dependensi baru; nol tabel baru; nol perubahan alur provisi; memakai kolom `users` yang **sudah disiapkan** untuk keperluan ini; satu kolom sesi untuk memenuhi Key Entities spec | **Lulus** |
| **Technical II/III** — quality by machines & testing | Perubahan perilaku disertai test unit/contract/e2e; gerbang `make vet`, `make lint`, `make test`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm generate:check` wajib hijau | **Lulus** |
| **Technical V** — dependency hygiene | Backend: nol dependensi Go baru (`golang-jwt/v5` sudah ada; JWKS parsing memakai stdlib); Frontend: nol dependensi npm baru (PKCE via Web Crypto; tanpa SDK MSAL) | **Lulus** |
| **Technical VII** — boundaries | Lapisan: halaman login/callback (UI) → mutation/query GraphQL → `EntraLoginService` (usecase) → klien OIDC (`platform/entra`) → `UserRepository`/`RefreshTokenRepository` → audit. UI **bukan** batas keamanan; keputusan diterima/ditolak hanya di usecase | **Lulus** |
| **Technical VIII/IX** — konfigurasi & fail visibly | Konfigurasi hanya dari env (`ENTRA_*`); di `APP_ENV=production` kredensial tidak lengkap **menghentikan proses** (SSO adalah jalur masuk utama); di luar production SSO nonaktif dengan peringatan terstruktur (konsisten pola `EntraConfig.Enabled()` untuk fitur aditif). Kegagalan OIDC dipermudah per-permintaan dengan pesan jujur (FR-009) — tidak menggantungkan proses | **Lulus** (deviasi terbatas & didokumentasikan: lihat D7) |
| **Design I/II/VI** — tokens kanon, satu aksi primer, aksesibilitas | Halaman login tetap memakai token `--tp-*`; tombol "Continue with Microsoft" memakai peran aksi primer halaman ini (brand-red, arah desain TAN-191 yang sudah tercatat); tautan "Login by Email" sebagai sekunder yang jelas; state memuat/menunggu/gagal ber-ARIA + teks Bahasa Indonesia (Design §VI) | **Lulus** |
| **API contract** — satu sumber kebenaran | Skema yang dilayani `tania-backend/graph/schema.graphqls` ditambah `EntraSsoStart`/`LoginWithEntra`; kontrak desain fitur di `contracts/sso-entra.md`; `graph/schema.graphqls` frontend disalin ulang lalu codegen diregenerasi (prosedur README) | **Lulus** |

**Complexity Tracking**: tidak ada pelanggaran yang perlu dijustifikasi. Satu deviasi kecil & terdokumentasi: **D7** (perilaku startup SSO berbeda antara production dan non-production) — deviasi sengaja dari bacaan ketat Prinsip IX yang mengutamakan ketersediaan pengembangan lokal, tanpa mengorbankan kegagalan keras di production.

## Project Structure

### Documentation (fitur ini)

```text
specs/006-entra-sso-login/          # di tania-dashboard (rumah spec)
├── spec.md                         # sudah ada (TAN-267, Clarified)
├── plan.md                         # dokumen ini
├── research.md                     # Phase 0
├── data-model.md                   # Phase 1
├── quickstart.md                   # Phase 1
├── checklists/requirements.md      # sudah ada (gerbang kualitas spec)
└── contracts/
    └── sso-entra.md                # kontrak GraphQL SSO + aturan pemetaan/audit
# tasks.md (Phase 2) dibuat pada /speckit.tasks — bukan keluaran perintah ini
```

### Source Code (delta yang dibuat plan ini)

```text
tania-backend/
├── graph/
│   ├── schema.graphqls                 # + EntraSsoStart, LoginWithEntra, EntraLoginInput
│   ├── schema.resolvers.go             # + resolver entraSsoStart & loginWithEntra (regenerasi gqlgen)
│   └── mapping.go                      # + helper payload (bila perlu)
├── internal/
│   ├── domain/
│   │   ├── entra.go                    # + EntraIDTokenVerifier, EntraCodeExchanger, EntraIDToken (kontrak tipis), EntraProvisionRepository.FindByObjectID
│   │   ├── user.go                     # + User.EntraObjectID, User.AuthProvider
│   │   └── refreshtoken.go             # + RefreshToken.AuthMethod
│   ├── usecase/
│   │   ├── entra_login.go              # EntraLoginService: tukar kode → validasi → petakan → sesi → audit
│   │   ├── entra_login_test.go         # matriks keputusan (link oid/email, tid, aud, nonce, inactive, no-match)
│   │   ├── auth.go                     # issueSession(+authMethod); Login mencatat method="local"
│   │   └── authz_test.go               # baris: SSO tidak menambah hak akses (FR-006)
│   ├── platform/entra/
│   │   ├── oidc.go                     # authorize/token URL, tukar kode, verifikasi ID token (JWKS+RS256)
│   │   ├── jwks.go                     # ambil & cache JWKS, refresh saat kid tak dikenal
│   │   ├── oidc_test.go / jwks_test.go # httptest server: metadata, JWKS, token, tanda tangan invalid
│   │   └── fake_oidc.go                # (atau reuse platform/entra/fake.go) fake untuk usecase test
│   ├── repository/postgres/user.go     # userSelect + Create/Update: entra_object_id, auth_provider; LinkEntra
│   ├── repository/postgres/refreshtoken.go # auth_method pada Create/FindByHash
│   ├── repository/postgres/entra.go    # + EntraProvisionRepository.FindByObjectID (cari terbalik object_id → employee_id; T004b — temuan analyze C1)
│   ├── config/config.go                # + EntraConfig.RedirectURI; validasi production
│   └── platform/migrations/sql/0017_entra_sso_login.sql
├── cmd/api/main.go                     # wiring EntraLoginService + klien OIDC
└── internal/transport/httpapi/security_test.go  # tidak ada kebocoran klaim/rahasia pada error & log

tania-dashboard/
├── graph/schema.graphqls               # salinan SDL backend = sumber codegen (disalin ulang setelah skema masuk)
├── src/features/auth/
│   ├── entraStart.graphql              # query entraSsoStart(codeChallenge,state,nonce)
│   ├── loginWithEntra.graphql          # mutation loginWithEntra(input)
│   ├── entra-pkce.ts                   # PKCE (Web Crypto), state/nonce, simpan sementara per-percobaan
│   └── entra-pkce.test.ts
├── src/app/(auth)/login/
│   ├── LoginForm.tsx                   # tombol "Continue with Microsoft" + tautan "Login by Email" yang membuka form (tanpa auto-redirect)
│   ├── LoginForm.test.tsx              # tombol vs form email vs error
│   └── callback/
│       ├── page.tsx                    # rute /login/callback (sudah publik via route-gate)
│       └── callback.test.tsx           # tukar kode, state mismatch, pembatalan, pesan gagal
└── src/lib/auth/config.ts              # + flag fallback SSO (sessionStorage) — bukan rahasia
└── src/lib/constants/storage.ts        # + penanda "belum tertaut" 7 hari (`tania:sso:unlinked`, localStorage; D8 (ii)/T023 — **tidak lagi diperlukan sejak D8′, 2026-10-22**)
```

**Structure Decision**: modul SSO mengikuti pola modul backend existing (`EntraService` + `platform/entra`: kontrak tipis di `domain`, implementasi jaringan di `platform`, logika keputusan di `usecase`, resolver tipis di `graph`). UI adalah perluasan fitur auth yang **sudah ada** (`src/features/auth` + `src/app/(auth)/login`) — bukan fitur/direktori baru. Tidak ada direktori proyek baru di kedua repo.

**Catatan peninjauan (temuan analyze I3, 2026-10-21)**: `graph/mapping.go` hanya disentuh **bila** helper payload memang diperlukan (T012 memasukkannya tanpa syarat — cukup dipastikan tidak ada berkas yang terlewat); fake OIDC untuk uji **memakai ulang** `internal/platform/entra/fake.go` yang sudah ada — `fake_oidc.go` baru dibuat hanya bila fake lama tidak cukup, keputusan diambil saat implementasi (U1/T004b).

## Keputusan Desain

| # | Keputusan | Alasan |
| --- | --- | --- |
| D1 | **Authorization Code + PKCE, confidential client**; browser tidak pernah memegang token Entra | Alur yang direkomendasikan Microsoft untuk aplikasi web dengan backend. `CLIENT_SECRET` tetap di server (FR-010, Security III); PKCE mengikat `code` ke klien yang memulainya sehingga kode curian tidak dapat ditukar pihak lain. Alternatif ditolak: *implicit/hybrid* (token di URL, tidak ada PKCE, deprecated) dan *client-side only + `/me`* (memindahkan keputusan otorisasi ke browser, melanggar Technical VII) |
| D2 | **Pertukaran kode & penetapan sesi di `tania-backend`**, dipanggil lewat mutation GraphQL baru `loginWithEntra` — bukan endpoint HTTP terpisah, bukan backend-hosted redirect | Seluruh autentikasi Tania hari ini adalah mutation GraphQL (`login`, `refreshSession`, `logout`) dengan token di body respons; halaman callback milik frontend (App Router) sudah publik lewat `route-gate`. Menambah endpoint HTTP `Set-Cookie` berarti model sesi **kedua** (cookie + Bearer), permukaan transport baru, dan CORS/CSRF baru — melanggar Technical I/VII. Alternatif: *backend callback mengeset cookie* (ditolak — model sesi kedua); *Server Action Next.js* (ditolak — jalur server-to-server baru di luar kontrak GraphQL, tidak ada di repo) |
| D3 | **Frontend memulai alur**, backend menyediakan URL otorisasi lewat query publik `entraSsoStart(codeChallenge, state, nonce)` | Backend menjadi **satu-satunya sumber** `authority`, `clientId`, `scope`, `redirect_uri` — frontend tidak menyimpan salinan konfigurasi tenant dan tidak perlu tahu `tenantId`. `state`/`nonce`/`verifier` dibuat di browser (Web Crypto) dan hanya disimpan sementara di `sessionStorage`; query mengembalikan `enabled=false` saat SSO belum dikonfigurasi sehingga halaman login langsung menampilkan form. Alternatif: env `NEXT_PUBLIC_ENTRA_*` (ditolak — konfigurasi terduplikasi di dua repo & dua lingkungan, mudah drift) |
| D4 | **Validasi ID token penuh** (RS256 + JWKS, `iss`, `aud`, `tid`, `exp`, `nonce`, toleransi skew ≤5 menit); JWKS di-cache dengan refresh sekali saat `kid` tak dikenal | FR-003 + FR-005: sesi tidak boleh terbentuk dari bukti tidak valid/kedaluwarsa/dipakai ulang. JWKS adalah kunci publik — aman di-cache; refresh-on-unknown-`kid` menangani rotasi kunci Microsoft tanpa restart. Memakai `golang-jwt/jwt/v5` (sudah ada) + `crypto/rsa`+`math/big` untuk JWK→kunci publik: **nol dependensi baru** (Technical V) |
| D5 | **Pemetaan tiga langkah berurutan (FR-004)** — **FR-004 jalur (a)** = langkah (1)+(2) di bawah, **jalur (b)** = langkah (3): (1) `users.entra_object_id = oid` (keterkaitan mapan — jalur tercepat & stabil); (2) `entra_provisions.object_id = oid` → `employee_id` → `employees.user_id` → akun Tania (**jalur baru dari revisi spec**, menutup akun hasil provisi CREATE yang UPN-nya turunan nama); (3) `lower(users.email) = lower(claim email)` — untuk akun korporat yang **sudah ada sebelum Tania** dan belum punya baris provisi. Satu akun ↔ nol/satu identitas; akun tidak pernah dibuat otomatis | NC-02 + revisi FR-004 (2026-10-20). Langkah (1) yang membuat **edge case spec** ("identitas mengubah email/UPN setelah terhubung") aman: setelah keterkaitan mapan, login berikutnya memakai `oid` yang stabil, bukan alamat yang bisa berubah. Langkah (2) memakai kembali rantai yang **sudah ada** di repo (`UserRepository.FindByEmployeeID`) dan tidak membaca data baru dari Graph. Bila keterkaitan sudah terisi ke `oid` **berbeda** → **tolak** (keterkaitan tidak berpindah sendiri; penanganan lanjutan = kebijakan Admin, di luar cakupan). Bila cocok lewat (2)/(3) dan keterkaitan belum terisi → isi sekali (*first-login link*) |
| D5b | **Akun korporat yang sudah ada sebelum Tania**: baris provisi hasil **sinkronisasi** hanya menolong bila mencatat `object_id`; bila tidak, akun itu tetap dapat masuk lewat D5 langkah (3) selama email akun Tania = alamat masuk korporatnya | Konfirmasi pemilik produk (2026-10-20): sebagian akun korporat memang sudah ada sebelum Tania. Mencatat `object_id` saat sinkronisasi membuat langkah (2) menutup mereka juga — dan itu **pekerjaan Provisi Entra**, bukan fitur ini (Open Item 6). Catatan teknis: `entra_provisions.action` saat ini hanya menerima `INVITE`/`CREATE` (CHECK migrasi `0008`), jadi sinkronisasi yang ingin menandai barisnya mungkin perlu nilai ketiga — di luar cakupan spec ini |
| D6 | **Reuse `AuthService.issueSession`** dengan parameter `authMethod`; `Refresh` mewarisi metode dari token yang dirotasi | FR-008 "masa berlaku, pembaruan, pencabutan, penonaktifan setara" dipenuhi **by construction**: TTL akses/refresh, rotasi, deteksi reuse, denylist, dan penonaktifan akun (`user.Active()`) memakai kode yang sama persis. `Refresh` harus **mewarisi** metode — kalau tidak, sesi yang lahir dari SSO akan tercatat sebagai `local` setelah rotasi pertama dan SC-005 salah hitung |
| D7 | **Konfigurasi**: `ENTRA_REDIRECT_URI` ditambahkan ke `EntraConfig` (bergabung dengan `ENTRA_TENANT_ID`/`CLIENT_ID`/`CLIENT_SECRET` yang sudah ada). `APP_ENV=production` + konfigurasi tidak lengkap → **proses gagal start**; di luar production → SSO nonaktif + peringatan terstruktur | Prinsip IX ("failures at startup … stop the process"); SSO adalah **jalur masuk utama** pada spec ini, jadi kredensial hilang di production bukan kondisi yang boleh diam. Deviasi terbatas: di lokal `make run` tanpa kredensial Entra tetap harus bisa jalan (pengembangan halaman login & jalur fallback) — mengikuti presedan `Enabled()` `EntraConfig`/`AIConfig` yang sudah diratifikasi untuk fitur aditif. **Catatan (temuan analyze I4)**: gerbang SSO memakai predikat **terpisah** `SSOEnabled()` (redirect URI + kredensial SSO), bukan memperluas `Enabled()` — `Enabled()` dipakai wiring provisi Entra di `cmd/api/main.go`, sehingga memperluasnya akan mematikan provisi di lingkungan tanpa redirect URI. Perbedaan kosakata ini disengaja, bukan divergensi |
| **D8′** (revisi pemilik produk **2026-10-22**) | **Tombol selalu tampil, tanpa auto-redirect** (FR-001/FR-002) — menggantikan opsi A | `/login` **tidak** mengalihkan otomatis saat dibuka. Halaman menampilkan tombol **"Continue with Microsoft"** sebagai aksi utama (di atas) dan tautan **"Login by Email"** di bawahnya; form email + kata sandi **baru tampil setelah tautan ditekan**, di halaman yang sama. `entraSsoStart` tetap dipanggil untuk mengetahui `enabled` + menyiapkan PKCE (`code_verifier`/`state`/`nonce`), tetapi navigasi ke Microsoft hanya terjadi pada **klik tombol** (`window.location.assign`), bukan saat mount; `enabled=false` → hanya form email yang tampil. Karena tidak ada pengalihan otomatis, **lingkaran pengalihan tidak mungkin terjadi** — penanda `sessionStorage` (`tania:sso:fallback`) dan ingatan `localStorage` "belum tertaut" 7 hari **tidak lagi diperlukan** dan dibuang dari rencana |
| D8 (digantikan 2026-10-22) | **Auto-redirect sekali, dengan pintu fallback yang tidak pernah terputar-putar** (FR-001/FR-002) — **opsi A**, disetujui pemilik produk 2026-10-20 | `/login` memanggil `entraSsoStart`; bila `enabled` **dan** mode normal **dan** tidak ada penanda fallback → `window.location.replace(authorizeUrl)`. Penanda `sessionStorage` (`tania:sso:fallback=1`) diset ketika: pengguna menekan tautan "Masuk dengan email & kata sandi", atau kembali ke `/login` dengan `?sso=error|cancelled`. Selama penanda ada, auto-redirect **tidak** dijalankan → mustahil ada lingkaran pengalihan. Penanda dibersihkan setelah login berhasil. **Dua tambahan opsi A**: (i) tautan "Masuk dengan email & kata sandi" **selalu terlihat** di halaman login (bukan hanya setelah gagal), sehingga akun Tania tanpa akun korporat — yang pasti gagal di auto-redirect — punya jalan keluar yang jelas; (ii) hasil "belum tertaut" diingat **7 hari** di `localStorage` (`tania:sso:unlinked=1`), sehingga kunjungan berikutnya langsung menampilkan form email tanpa memutar ulang kegagalan. Penanda (i)/(ii) murni **petunjuk tampilan** di browser — tidak pernah otoritatif; keputusan menerima/menolak tetap di server, dan penandanya dibersihkan setelah login berhasil di kedua jalur |
| D9 | **Tidak ada amandemen matriks RBAC**; klaim grup/peran Microsoft tidak pernah dibaca | FR-006. Peran/hak akses hanya dibaca dari `users.role`/`roles` di server (existing) dan per-request middleware me-refresh `identity.Role` dari akun (existing). Klaim `groups`/`roles` tidak dipetakan sama sekali — kalau kelak dibutuhkan, itu fitur RBAC baru (`002-tania-rbac`), bukan perubahan di jalur auth ini |
| D10 | **Audit sekali per upaya, dengan penanda metode** (FR-007/SC-004): SSO memakai `AuditLogin` + payload `{"method":"entra_sso","outcome":…,"reason":…}` (sejajar `rejectLogin` existing yang sudah menulis `outcome`/`reason`); jalur email mengisi `{"method":"local"}` pada entry sukses | SC-004 menuntut **100% upaya** (berhasil/gagal/ditolak) memuat metode masuk, dan SC-005 (≥80% SSO dalam 1 bulan) hanya dapat diukur bila kedua metode menulis penandanya. Menambahkan satu field `method` pada entry sukses jalur lokal adalah perubahan **satu baris** yang menyelaraskan "setara" (FR-007) dan menjadi **sumber pengukuran SC-005** dari `audit_logs` — bukan fitur baru. Payload audit **tidak** memuat klaim/token/rahasia (Security II) |
| D11 | **Penolakan generik & anti-enumerasi** (FR-009, edge case "tidak boleh membocorkan keberadaan akun"): satu pesan Bahasa Indonesia untuk semua kegagalan pemetaan (`"Akun korporat ini tidak terhubung ke akun Tania. Hubungi Admin."`); alasan teknis hanya ke audit | Pesan yang membedakan "email tidak ada" vs "akun nonaktif" membocorkan keberadaan akun. Pesan pembeda hanya untuk kegagalan **yang tidak sensitif**: layanan Microsoft tidak tersedia (`"Layanan Microsoft sedang tidak tersedia. Coba lagi atau masuk dengan email & kata sandi."`) — tindak lanjut yang benar-benar berbeda bagi pengguna |
| D12 | **Rate limit memakai `RateLimiter` Redis existing** dengan kunci `sso-login:<clientKey>` dan **nilai batas/window yang sama** dengan `login:` (`AuthConfig.LoginLimit`/`LoginWindow`) | FR-012 "setara dengan jalur email + kata sandi" — memakai angka config yang sama, jadi kenaikan batas salah satu jalur otomatis setara. Nol infrastruktur baru (pola `RateLimiter.Allow` yang sudah dipakai `login`). Batas ini menutup percobaan yang **mencapai backend** (pertukaran kode/pemetaan); percobaan yang berhenti di halaman Microsoft tidak melewati kita — dicatat terus terang di `contracts/sso-entra.md` |

**Satu sumber nilai & istilah**: `contracts/sso-entra.md` adalah rujukan tunggal untuk nama query/mutation/input, kode kesalahan, penanda audit, dan kunci rate limit; `data-model.md` adalah rujukan tunggal untuk kolom/klasifikasi data; nilainya tidak ditulis ulang berbeda di dokumen lain.

## Pemetaan Spec → Implementasi

| Spec | Rencana | Bukti / Mekanisme |
| --- | --- | --- |
| US1 — masuk dengan akun korporat (P1) | `/login` tombol "Continue with Microsoft" (D8′) → klik memanggil alur Microsoft → `/login/callback` → mutation `loginWithEntra` (D1/D2) | Sesi Tania terbentuk dari `issueSession` existing; SC-001 ≤3 interaksi & <30 s |
| US2 — email + kata sandi tetap ada (P1) | Pintu fallback selalu terjangkau (`LoginForm` + penanda `sessionStorage`); jalur `Login` existing tidak diubah selain penanda audit (D10) | FR-002/SC-003; test komponen + e2e regresi jalur lokal |
| US3 — identitas terhubung ke akun yang tepat (P2) | Pemetaan D5 (keterkaitan provisi → email; tolak nonaktif/tanpa kecocokan) + `requireIdentity`/`user.Active()` existing | Test matriks keputusan; AC3/AC4 ditolak tanpa akun baru (FR-004/FR-011) |
| US4 — jejak audit & perlakuan sesi setara (P3) | D6 (reuse `issueSession`) + D10 (audit ber-penanda metode, di kedua jalur) | SC-004 100% upaya ber-entry; `refresh_tokens.auth_method` untuk penelusuran sesi |
| FR-001 | D8′ — tombol Microsoft selalu tampil, tanpa redirect otomatis; form email di balik tautan "Login by Email" | Test komponen (tombol tampil vs form via tautan) |
| FR-002 | D8 + jalur `Login` existing utuh | Regresi e2e jalur lokal |
| FR-003 | D4 — validasi ID token penuh sebelum sesi | Test `platform/entra` (httptest) + usecase |
| FR-004 | D5 — keterkaitan hasil provisi lalu work email; tanpa auto-create | Test matriks; pesan generik D11 |
| FR-005 | D4 — `tid == ENTRA_TENANT_ID` + `iss`/`aud` tenant tunggal (NC-01) | Test klaim tenant lain/personal ditolak |
| FR-006 | D9 — peran hanya dari akun Tania | `authz_test.go` + resolusi peran per-request existing |
| FR-007 | D10 — audit berhasil/gagal/ditolak + penanda metode | Test payload audit (kedua jalur) |
| FR-008 | D6 — `issueSession`/`Refresh`/`Logout` existing | Test kesetaraan sesi (TTL, rotasi, reuse) |
| FR-009 | D11 — pesan Bahasa Indonesia, tidak membocorkan; kegagalan Microsoft dibedakan | Test pesan; `security_test.go` |
| FR-010 | D7 — rahasia hanya env; nol rahasia di browser/log/URL | Review + test log/error tidak memuat klaim/secret |
| FR-011 | Flow: `user.Active()` gating existing (jalur sama) | Test akun nonaktif ditolak |
| FR-012 | D12 — rate limit Redis nilai setara jalur lokal | Test `RateLimiter` fake |
| SC-001–SC-005 | Laten dari alur singkat (≤3 interaksi); SC-005 diukur dari penanda audit D10 | `quickstart.md` berisi skenario validasi & cara mengukur SC-005 |

## Data & API (ringkas)

- **Skema baru (satu sumber kebenaran: `graph/schema.graphqls`)**: tipe `EntraSsoStart` (`enabled`, `authorizationUrl`), input `EntraLoginInput` (`code`, `codeVerifier`, `nonce`), query publik `entraSsoStart(codeChallenge, state, nonce)`, mutation publik `loginWithEntra(input)` → `AuthPayload` (tipe existing). Detail lengkap + kode kesalahan + aturan audit: [`contracts/sso-entra.md`](./contracts/sso-entra.md); kolom & klasifikasi data: [`data-model.md`](./data-model.md).
- **Skema existing yang dipakai (tanpa perubahan bentuk)**: `AuthPayload`, `LocalLoginInput`, mutation `login`/`refreshSession`/`logout`; `User`; `AuditLog` (action `LOGIN`).
- **Tanpa perubahan** pada entitas bisnis, matriks RBAC, alur provisi Entra, atau endpoint existing lainnya.

## Security (rekap slice)

Validasi dilakukan **sebelum** sesi apa pun terbentuk (FR-003): tanda tangan ID token RS256 terhadap JWKS tenant, `iss` = `https://login.microsoftonline.com/{tid}/v2.0`, `aud` = `CLIENT_ID`, `tid` = `ENTRA_TENANT_ID` (single-tenant, NC-01), `exp`/`iat` dengan toleransi skew, dan `nonce` sama dengan yang dikirim di permintaan otorisasi (PKCE + state mengikat permintaan ke klien). `CLIENT_SECRET` hanya hidup di server dari env/secret store — tidak pernah ke browser, log, dokumen, issue, atau komentar (FR-010). `entraSsoStart` **tidak** mengembalikan rahasia apa pun (hanya `clientId`/authority/scope/`redirectUri` yang memang publik di URL otorisasi). Rate limit reuse Redis (D12). Audit mencatat setiap upaya dengan penanda metode dan **tanpa** klaim/token (D10). Otorisasi tidak berubah: peran dibaca dari akun Tania di server (D9); klaim Microsoft diabaikan. Log modul SSO hanya memuat ID teknis & kode error.

## Testing

| Level | Cakupan | Alat |
| --- | --- | --- |
| Unit backend — keputusan | Matriks `EntraLoginService`: ter-link via `oid` ✓; ter-link via `entra_provisions.object_id` (UPN ≠ email akun) ✓; first-link via email (mengisi `entra_object_id`) ✓; `oid` berbeda untuk email yang sama ✗; email tak cocok ✗ (tanpa akun baru); akun nonaktif ✗; `tid` salah ✗; `aud` salah ✗; `nonce` beda ✗; token kedaluwarsa ✗; tanda tangan invalid ✗; rate limit ✗ | Go test + fake `EntraCodeExchanger`/`EntraIDTokenVerifier`/`UserRepository` |
| Unit backend — OIDC | Tukar kode: parameter & bentuk permintaan benar; JWKS: parse JWK RSA→kunci, cache, refresh saat `kid` tak dikenal; tanda tangan valid/invalid; `httptest` | `internal/platform/entra/oidc_test.go`, `jwks_test.go` |
| Contract/authz | SSO tidak menambah hak akses: sesi SSO atas akun Chapter tetap ditolak pada endpoint Admin (`authz_test.go`); peran dibaca dari akun, bukan klaim | Go test harness existing |
| Security | `security_test.go`: pesan kegagalan tidak membedakan keberadaan akun; log/error tidak memuat `code`/token/klaim; `authorizationUrl` tidak memuat rahasia; akun nonaktif ditolak | harness existing |
| E2E backend | Alur penuh `loginWithEntra` via HTTP dengan fake verifier + fake exchanger: sesi akses+refresh terbit, `auth_method='entra_sso'` tersimpan, audit `LOGIN` ter-`method`, refresh mewarisi `entra_sso` | `internal/transport/httpapi/e2e_test.go` |
| Komponen frontend | `/login`: `enabled=true` → tombol "Continue with Microsoft" tampil dan **tidak** ada navigasi saat mount; klik tombol → `window.location.assign` ke URL otorisasi; `enabled=false` → form email tampil tanpa tombol; tautan "Login by Email" → form email + kata sandi tampil di halaman yang sama; kembali dengan `?sso=error|cancelled` → pesan; PKCE: verifier/challenge/state/nonce benar & tersimpan; `/login/callback`: state mismatch → pesan & tidak memanggil mutation, error dari mutation → pesan Bahasa Indonesia, sukses → `setSession` + `router.replace(DASHBOARD)` | Vitest + RTL + `MockedProvider` |
| E2E frontend | Regresi jalur lokal tetap masuk (SC-003); `/login` tanpa SSO aktif tetap menampilkan form; `/login/callback` tanpa parameter menampilkan pesan yang jelas (bukan halaman kosong) | Playwright (`critical-path.spec.ts`) |
| UAT manual (U1) | Login sungguhan ke tenant Telkom oleh pemilik produk: akun terhubung ✓, akun tanpa akun Tania ✗, akun personal ✗, akun nonaktif ✗, pembatalan ✗ + fallback email ✓ | `quickstart.md` §B (tidak mungkin dijalankan di CI — butuh kredensial & tenant) |

## Roadmap (gelombang eksekusi)

| Gelombang | Pekerjaan | Menutup |
| --- | --- | --- |
| **U0 — Prasyarat (pemilik produk, ±0,5 jam)** | Daftarkan **redirect URI** aplikasi Entra (`{origin}/login/callback`) + cakupan `openid profile email`; pasang `ENTRA_REDIRECT_URI` di lingkungan | Open Item 2 |
| **U1 — Fondasi backend** | Migrasi `0017`; `domain` (kontrak verifier/exchanger + field User/RefreshToken); klien OIDC + JWKS; `EntraLoginService` (D4/D5/D11/D12); `issueSession(+authMethod)`; resolver + skema + regenerasi; config & gerbang production; test unit/contract/security/e2e | FR-003–FR-012, US3, US4 |
| **U2 — Frontend** | Salin ulang `graph/schema.graphqls` dari backend → codegen; PKCE & pemanggilan `entraSsoStart`/`loginWithEntra`; `/login` tombol Microsoft + tautan "Login by Email" (D8′); `/login/callback`; Vitest/RTL + e2e regresi | FR-001/002/009, US1, US2 |
| **U3 — UAT & pengukuran** | UAT tenant Telkom (§B quickstart); probe keamanan (tenant lain, akun nonaktif, pembatalan, token invalid); pengukuran SC-001 & cara hitung SC-005 dari audit | SC-001–SC-005 |

Estimasi: U1 ±2–2,5 hari; U2 ±1,5–2 hari; U3 ±0,5–1 hari. Rincian task menyusul pada `/speckit.tasks`.

## Open Items

1. **Selesai (2026-10-20) — temuan spec dijawab dengan revisi spec, bukan penundaan.** FR-004 semula memetakan **work email** ke email akun Tania dan Assumptions menyatakan "semua akun Tania aktif memiliki alamat email yang sama dengan work email akun korporatnya". Kenyataannya kemampuan provisi existing (FR-45 spesifikasi 001) **membuat** akun tenant dengan **UPN turunan nama** (`rina.kusuma@digitaltelkom.id`, bersuffix angka bila sudah terpakai) untuk email non-`telkom.co.id`, dan hanya **mengundang** (guest) email `telkom.co.id` (UPN = email asli). Akibatnya akun hasil provisi CREATE tidak akan pernah cocok lewat email. Pemilik produk menyetujui opsi **(b)** — memetakan lewat `entra_provisions.object_id` saat baris provisi ada — dan **FR-004 telah direvisi** menjadi dua jalur berurutan; SC-005, Assumptions, dan satu butir Edge Cases ikut diselaraskan pada `spec.md` (lihat baris `**Revisi**` 2026-10-20). Implementasinya: **D5** langkah (1)–(3). Sisa risiko yang tidak tertutup revisi ini ada pada provisi, bukan pada login → **Open Item 6**.
2. **Prasyarat eksternal**: pendaftaran aplikasi Entra (URI pengalihan `.../login/callback`, cakupan `openid profile email`, izin `User.Read` bila kelak dipakai), dan **pemasangan `ENTRA_REDIRECT_URI`** di tiap lingkungan oleh pemilik produk. `CLIENT_ID`/`CLIENT_SECRET`/`TENANT_ID` sudah disiapkan; nilainya tidak pernah ditulis di dokumen ini.
3. **Cakupan provisi vs autentikasi**: spec menegaskan SSO **tidak mengubah** alur provisi (FR-43–FR-46). Konsekuensi yang perlu diketahui pemilik produk: **menonaktifkan** akun Entra saat terminasi (FR-46 existing) kini juga efektif memblokir login SSO orang tersebut — perilaku yang diinginkan (FR-011), tetapi patut dicatat sebagai perubahan efektif pada onboarding/offboarding.
4. **Checklist keamanan/DAMP pra-rilis**: jalur autentikasi baru dengan klaim identitas korporat dinilai risiko **rendah–sedang** (single-tenant, tanpa penyimpanan klaim, tanpa PII baru); checklist dijalankan konkret pada gerbang rilis (Security III/IV) — belum dikerjakan di fase plan.
5. **Mekanisme "wajib SSO" / penonaktifan kata sandi** (mis. menyembunyikan form email setelah migrasi selesai) **di luar cakupan** spec ini — dicatat sebagai kandidat fase lanjutan; plan ini mempertahankan form email sebagai fallback penuh (FR-002).
6. **Keputusan & pekerjaan yang secara sadar BUKAN milik fitur ini (ranah Provisi Entra)** — dicatat agar tidak menggantung:
   - Sifat **opsional** pemberian akses korporat (sekarang otomatis mengikuti alur provisi FR-43–FR-46): perubahan kebijakan itu menyentuh FR-43 dan **belum punya issue**; usulan rumah: TAN-273.
   - Langkah operasional akun hasil `create` (kata sandi sementara dibuang + `forceChangePasswordNextSignIn: true`): akses pertama akun semacam itu belum tertangani — TAN-273.
   - Pencatatan `object_id` saat **sinkronisasi** akun korporat yang sudah ada sebelum Tania (+ kemungkinan nilai `action` ketiga pada CHECK migrasi `0008`) — **D5b**; belum punya issue, kandidat: TAN-271.
   - Aktor audit yang benar pada entri provisi (`domain.Identity`) dan paginasi daftar Provisi Entra — sudah punya issue: TAN-271 & TAN-272.

## Risks

| # | Risiko | Dampak | Tindakan |
| --- | --- | --- | --- |
| R1 | Akun korporat yang UPN-nya tidak identik dengan email akun Tania (hasil provisi CREATE) — **diputuskan & ditutup oleh revisi FR-004** | Sebelumnya: pengguna tidak dapat masuk via SSO, berdampak langsung SC-005 | Dimatikan oleh **D5** langkah (2) lewat `entra_provisions.object_id`. Sisa: baris provisi yang **tidak** mencatat `object_id` (mis. hasil sinkronisasi akun lama) → tertutup D5 langkah (3) bila emailnya sama, atau menunggu pencatatan `object_id` di sisi Provisi Entra (**Open Item 6**) |
| R2 | Rotasi kunci penandatangan Microsoft / JWKS tak terjangkau | Login SSO gagal seluruhnya | Cache JWKS + refresh sekali saat `kid` tak dikenal + timeout eksplisit; kegagalan → pesan jujur (FR-009) + fallback email tetap jalan (FR-002) |
| R3 | Kesalahan pemetaan membuka akun yang salah | Eskalasi hak akses (kritis) | `oid`-dulu (D5), `aud`/`tid`/`nonce`/tanda tangan wajib (D4), tolak `oid` berbeda; test matriks lengkap; `authz_test` membuktikan hak akses tetap dari akun |
| R4 | Klaim Microsoft (mis. `groups`) dianggap sumber hak akses | Pelanggaran FR-006 | Klaim grup/peran **tidak dibaca**; peran hanya dari akun Tania (D9) — diuji |
| R5 | Lingkaran pengalihan `/login` ↔ Microsoft | Pengguna tidak bisa masuk sama sekali | Penanda fallback `sessionStorage` (D8) + `?sso=error|cancelled`; diuji di komponen & ditulis di quickstart |
| R6 | Rahasia bocor lewat log/error/URL/browser | Pelanggaran Security III | Hanya server yang memegang `CLIENT_SECRET` (D1/D2); `security_test` memeriksa pesan & log; browser hanya membawa `code`/`state`/`nonce` (bukan PII) |
| R7 | Regresi jalur email + kata sandi | SC-003 gagal — blocker peluncuran | Perubahan jalur lokal hanya penanda audit satu field (D10); test regresi unit + e2e; `issueSession` diubah signature-nya dengan default method `local` di semua call-site yang diuji |
| R8 | Salinan `graph/schema.graphqls` frontend tertinggal dari backend → codegen melewatkan tipe SSO / diff tak terkait | U2 gagal `generate:check` | U2 diawali salin ulang SDL (prosedur README) + review diff generated; drift lama dicatat sebagai perubahan terpisah (pola R8 dokumen 005) |
| R9 | Sesi hasil SSO tercatat sebagai `local` setelah rotasi refresh → SC-005 salah hitung | Pengukuran keliru | `Refresh` mewarisi `auth_method` dari token yang dirotasi (D6) — diuji eksplisit di e2e |
| R10 | SSO dinonaktifkan di production karena konfigurasi tidak lengkap | Jalur masuk hilang | D7: production dengan konfigurasi tidak lengkap **gagal start** (terdeteksi saat deploy, bukan saat pengguna gagal masuk) |
