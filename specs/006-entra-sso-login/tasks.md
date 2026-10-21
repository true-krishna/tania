# Tasks: Masuk Single Sign-On (SSO) Microsoft Entra ID

**Input**: Design documents dari `/specs/006-entra-sso-login/`

**Prerequisites**: `plan.md` (wajib — D1–D12 + **D5b**, Open Item 1–6, Risks R1–R10, roadmap **U0–U3**, struktur sumber) · `spec.md` (wajib — US1–US4, FR-001–FR-012, SC-001–SC-005; **revisi 2026-10-20**: FR-004 dua jalur pemetaan, SC-005 penyebut dibatasi ke pengguna yang sudah punya akun korporat, Assumptions & Edge Cases, 4 skenario penerimaan) · `research.md` (R-1–R-12) · `data-model.md` (indeks unik parsial `users.entra_object_id` + kolom `refresh_tokens.auth_method`; klasifikasi & lawful basis data pribadi) · `contracts/sso-entra.md` (§1 skema GraphQL · §2 parameter OIDC · §3 aturan pemetaan · §4 kode kesalahan · §5 rate limit · §6 jejak audit · §7 konfigurasi · §8 alur · §9 batas yang tidak boleh dilanggar) · `quickstart.md` (§A/§A2 lokal · §B UAT U1–U10 · §C gerbang mutu & cara mengukur SC-001…SC-005)

**Kontrak yang sudah final dan TIDAK dibuka di fase ini**: `spec.md` (milik TAN-267) · seluruh keputusan plan D1–D12 + D5b · skema GraphQL `contracts/sso-entra.md` §1 (`EntraSsoStart`, `EntraLoginInput`, `entraSsoStart`, `loginWithEntra`) · kode kesalahan §4 · penanda audit §6 · kunci/nilai rate limit §5 · nama variabel konfigurasi §7 · stack existing (nol dependensi Go/npm baru). `spec.md` **tidak** diubah dan artefak plan (`plan.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/`) **tidak** disentuh di fase ini — bila ditemukan ketidaksesuaian antar-artefak, **laporkan**, jangan putuskan sendiri.

**Repositori**: `tania-backend` (pertukaran kode, validasi ID token, pemetaan akun, penetapan sesi, jejak audit) + `tania-dashboard` (rumah spec, halaman `/login` & `/login/callback`). **Branch kerja**: `agent/cobra/ef1a3eb3f6ce` — tempat revisi spec & seluruh artefak plan berada; kerjakan di atas branch itu, **jangan sentuh `master`**.

**Tests**: Ya — konstitusi Technical II/III menuntut gerbang mesin; test menjadi **task tersendiri** (T014–T019 backend, T026–T028 frontend), bukan diselipkan ke task implementasi. Karena test ini menguji paket nyata (usecase Go, klien OIDC, transport, komponen React), urutannya: task implementasi → task test yang menguji paket itu → harus lulus sebelum checkpoint gelombang dinyatakan tertutup.

**Organization**: Task dikelompokkan mengikuti gelombang roadmap plan — **U0** (prasyarat pemilik produk) → **U1** (fondasi backend) → **U2** (frontend) → **U3** (UAT & pengukuran). Penomoran `T001…T033` berurutan lintas gelombang, ditambah **`T004b`** (sisipan hasil `/speckit.analyze` 2026-10-21 — nomor bersisip agar seluruh rujukan task yang sudah ada tidak bergeser).

## Format: `[ID] [P?] [US?] Description`

- **[P]**: dapat dikerjakan paralel — berkas berbeda, tanpa dependensi pada task lain yang belum selesai
- **[US1..US4]**: user story / acceptance scenario spesifikasi yang dibuktikan task tersebut
- Setiap task menyebut: **berkas yang disentuh** → **perubahan yang dimaksud** → **cara verifikasi**

## Path Conventions

- **tania-backend**: `graph/` (SDL `schema.graphqls` + resolver + `generated.go` + `model/`) · `internal/domain/` · `internal/usecase/` · `internal/platform/entra/` (klien OIDC) · `internal/repository/postgres/` · `internal/config/config.go` · `internal/platform/migrations/sql/` · `internal/transport/httpapi/` · `cmd/api/main.go` · `.env.example`
- **tania-dashboard**: `graph/schema.graphqls` (salinan SDL backend) · `src/features/auth/` · `src/app/(auth)/login/` · `src/app/(auth)/login/callback/` · `src/lib/auth/` · `src/lib/constants/` · `src/generated/graphql/` · `e2e/`
- Uji: backend `internal/usecase/entra_login_test.go`, `internal/usecase/auth_test.go`, `internal/usecase/authz_test.go`, `internal/platform/entra/{oidc,jwks}_test.go`, `internal/transport/httpapi/{security,e2e}_test.go`; frontend `src/app/(auth)/login/LoginForm.test.tsx`, `src/app/(auth)/login/callback/callback.test.tsx`, `src/features/auth/entra-pkce.test.ts`, `e2e/critical-path.spec.ts`

---

## Peta gelombang

| Gelombang | Tujuan | Task | Menutup |
| --- | --- | --- | --- |
| **U0** — Prasyarat pemilik produk | Daftarkan **redirect URI** aplikasi Entra + pasang `ENTRA_REDIRECT_URI` di tiap lingkungan, sehingga `entraSsoStart.enabled = true` | T001 | plan Open Item 2 · prasyarat US1/SC-001 |
| **U1** — Fondasi backend | Migrasi `0017` · domain & repo (keterkaitan `oid`, `auth_method`, repo provisi `FindByObjectID`) · klien OIDC + JWKS · `EntraLoginService` (D4/D5/D5b/D11/D12) · `issueSession(+authMethod)` (D6) · SDL + gqlgen + resolver · config & gerbang production (D7) · wiring · test unit/contract/security/e2e | T002–T019 | US3, US4, FR-003–FR-012 |
| **U2** — Frontend | Salin ulang SDL → codegen → PKCE (Web Crypto) → `/login` auto-redirect + pintu fallback (D8) → `/login/callback` → Vitest/RTL + Playwright | T020–T028 | US1, US2, FR-001/002/009 |
| **U3** — UAT & pengukuran | Gerbang mesin · UAT tenant Telkom U1–U10 · probe keamanan · pengukuran SC-001–SC-005 · DAMP pra-rilis | T029–T033 | SC-001–SC-005 |

---

## Phase U0 — Prasyarat pemilik produk — plan.md §Roadmap U0 · quickstart.md §B · Open Item 2

**Purpose**: Membuat tenant benar-benar siap menerima alur masuk sebelum satu baris kode integrasi ditulis. Tanpa langkah ini `entraSsoStart` tetap `enabled=false` dan tidak ada task U1/U2 yang bisa dibuktikan end-to-end.

> **⏸ MENUNGGU PEMILIK PRODUK.** Kredensial hidup **hanya** di konsol Entra dan env/secret store lingkungan. Jangan meminta, menyalin, atau menempelkan nilainya di komentar, commit, dokumen, atau log (FR-010). Tidak ada task lain yang terhalang: T002–T028 dapat dikerjakan dan diuji dengan fake exchanger/verifier deterministik; hanya T030 (UAT tenant) dan T031 (probe keamanan terhadap tenant nyata) yang benar-benar menunggu.

- [ ] T001 [US1] ⏸ **Daftarkan redirect URI & pasang `ENTRA_REDIRECT_URI` (U0)** — tanpa perubahan berkas kode.
      → Konsol Microsoft Entra (aplikasi yang sudah terdaftar) + env/secret store **tiap** lingkungan (lokal, staging, produksi).
      Daftarkan `{origin}/login/callback` sebagai **Redirect URI tipe Web** pada aplikasi Entra, aktifkan aliran ID token untuk cakupan `openid profile email`, lalu pasang `ENTRA_REDIRECT_URI = {origin}/login/callback` dengan nilai **persis sama** di tiap lingkungan (perbedaan satu karakter membuat `redirect_uri` ditolak Microsoft). `ENTRA_TENANT_ID`/`ENTRA_CLIENT_ID`/`ENTRA_CLIENT_SECRET` sudah disiapkan pemilik dan tidak berubah.
      **Verifikasi**: `query { entraSsoStart(codeChallenge: "<uji>", state: "<uji>", nonce: "<uji>") { enabled authorizationUrl } }` mengembalikan `enabled: true`, dan `authorizationUrl` memuat `redirect_uri` yang sama persis dengan yang terdaftar + `code_challenge_method=S256`; tanpa `ENTRA_*` lengkap → `enabled: false` (bukan error). **Jangan** menuliskan nilai kredensial di mana pun.
      **Menutup**: plan Open Item 2 · prasyarat US1 AC1 · dasar SC-001.

**Checkpoint U0**: aplikasi Entra menerima redirect URI `…/login/callback` dan `entraSsoStart.enabled = true` pada lingkungan uji. U1/U2 boleh berjalan tanpa ini (fake deterministik), tetapi U3 menunggu.

---

## Phase U1 — Fondasi backend (tania-backend) — plan.md §Roadmap U1

**Purpose**: Seluruh pertukaran kode, validasi bukti autentikasi, pemetaan identitas korporat → akun Tania, penetapan sesi, dan jejak audit hidup di backend; setelah gelombang ini `loginWithEntra` menghasilkan sesi Tania dengan `auth_method='entra_sso'` tanpa menyentuh jalur email + kata sandi.

**Prinsip yang mengikat seluruh gelombang**: **nol dependensi Go baru** (`golang-jwt/jwt/v5` sudah ada; JWKS memakai `crypto/rsa`/`math/big`) · **nol tabel baru** (hanya satu kolom + satu indeks unik parsial) · `CLIENT_SECRET` tidak pernah keluar dari proses backend · otorisasi tidak berubah (D9).

### Persistensi & domain

- [ ] T002 [US1] **Migrasi 0017 — keterkaitan identitas & metode sesi** (task migrasi terpisah, tidak digabung ke task domain/repo)
      → `internal/platform/migrations/sql/0017_entra_sso_login.sql` (baru)
      (a) `CREATE UNIQUE INDEX users_entra_object_id_key ON users (entra_object_id) WHERE entra_object_id IS NOT NULL;` — satu identitas korporat tidak boleh memetakan ke dua akun Tania (parsial karena mayoritas akun `NULL`); (b) `ALTER TABLE refresh_tokens ADD COLUMN auth_method text NOT NULL DEFAULT 'local' CHECK (auth_method IN ('local','entra_sso'));` — dasar SC-005. `users.entra_object_id`/`users.auth_provider` sudah ada sejak `0002_core_model.sql` dan **tidak** dibuat ulang. Forward-only, pola `0008_entra_provisions.sql`/`0013_chat_conversations.sql`; tanpa menyentuh tabel/kolom existing lain.
      **Verifikasi**: `go build ./...` (embed `migrations.FS` tetap valid) + review SQL terhadap `data-model.md` §Akun Tania (index baru) dan §Sesi pengguna (kolom baru). Uji terapan **hanya** di DB terisolasi dengan `TEST_DATABASE_URL` milik sendiri; **jangan** `make up`/migrasi ke DB bersama.
      **Menutup**: data-model §Index baru + §Sesi · D5 (invarian satu `oid` → satu akun) · FR-008 · Security IV.

- [ ] T003 [P] [US1] **Domain — kontrak OIDC & field keterkaitan**
      → `internal/domain/entra.go` (tambah) · `internal/domain/user.go` · `internal/domain/refreshtoken.go`
      Tambah kontrak **tipis** agar usecase dapat diuji tanpa jaringan: `EntraIDToken` (pengenal `ObjectID`, `TenantID`, alamat email/UPN, `Nonce`), `EntraCodeExchanger` (`Exchange(ctx, code, codeVerifier) (EntraIDToken, error)`), `EntraIDTokenVerifier` (`Verify(ctx, rawIDToken, nonce) (EntraIDToken, error)`), plus sentinel `ErrEntraNotConfigured`/`ErrEntraUnavailable` (pola `ErrChatNotConfigured`). Tambah `User.EntraObjectID *string` + `User.AuthProvider string` dan `RefreshToken.AuthMethod string`. Nilai penanda (`local`, `entra`, `entra_sso`) didefinisikan **satu tempat** sebagai konstanta. Tabel `entra_provisions` **tidak** berubah bentuk (dibaca saja).
      **Verifikasi**: `go build ./... && go vet ./...`; `grep` menunjukkan literal `"entra_sso"`/`"entra"` hanya muncul di berkas domain (satu sumber nilai).
      **Menutup**: data-model §Akun Tania + §Sesi + §Relasi & antarmuka · Technical VII · D5/D6.

- [ ] T004 [US1] **Repository user — keterkaitan `oid` & pemetaan email**
      → `internal/repository/postgres/user.go`
      `userSelect` + `scanUser` menyertakan `u.entra_object_id` dan `u.auth_provider` sehingga pembacaan akun membawa keterkaitannya; tambah `FindByEntraObjectID(ctx, oid)` (tanpa kecocokan → `ErrNotFound`, pola `errors.go`) untuk jalur (1); tambah `LinkEntra(ctx, userID, oid)` yang mengisi `entra_object_id` **hanya bila masih `NULL`** + `auth_provider='entra'` — *first-login link*, **tidak pernah** memindahkan keterkaitan yang sudah ada (D5); pastikan pencocokan `FindByEmail` memakai `lower(email)` sesuai `data-model.md` §Urutan pemetaan jalur (3).
      **Verifikasi**: `go build ./...` + `go test ./internal/repository/postgres/...` (kompilasi + test harness existing); perilaku terapan (link sekali, tidak berpindah, `oid` unik) dibuktikan T019 pada DB terisolasi.
      **Menutup**: FR-004 jalur (1)&(3) · D5 · data-model §Urutan pemetaan · R3.

- [ ] T004b [US1] **Repository provisi Entra — pencarian terbalik menurut `object_id`**
      → `internal/domain/entra.go` (tambah satu metode pada `EntraProvisionRepository`) · `internal/repository/postgres/entra.go`
      Tambah `FindByObjectID(ctx, oid string) (domain.EntraProvision, error)`:
      `SELECT employee_id::text, status, action, upn, object_id, last_error, created_at, updated_at FROM entra_provisions WHERE object_id = $1`,
      dipindai dengan `derefString`/`nullString` dan mengembalikan `domain.ErrNotFound` seperti `FindByEmployeeID` yang sudah ada. `Upsert`/`FindByEmployeeID` **tidak** berubah; **tanpa perubahan skema** (`object_id text UNIQUE` sudah ada sejak `0008`).
      Mengapa task tersendiri: D5 langkah (2) menuntut rantai `object_id` → `employee_id` → akun, dan metode ini **belum ada** di repo (`EntraProvisionRepository` hanya punya `Upsert` + `FindByEmployeeID`) — tanpa ini FR-004 jalur (a) tidak dapat dibangun dan kohort akun hasil provisi **CREATE** (UPN turunan nama, R1) tidak bisa masuk sama sekali.
      **Verifikasi**: `go build ./... && go vet ./...`; `go test ./internal/repository/postgres/...` (kompilasi + harness existing); perilaku "`oid` ada / tidak ada / `oid` milik karyawan lain" dibuktikan T014 (fake) dan T019 (DB terisolasi).
      **Menutup**: FR-004 jalur (a) langkah (2) · D5/D5b · R1 · data-model §Urutan pemetaan.

- [ ] T005 [US1] **Repository refresh token — `auth_method`**
      → `internal/repository/postgres/refresh_token.go`
      `Create` menulis kolom `auth_method`; `FindByHash` mengembalikannya (kolom + `scan`). TTL, rotasi, deteksi reuse, dan `RevokeAllForUser` **tidak** berubah — D6 bertumpu pada kode yang sama persis.
      **Verifikasi**: `go build ./...` + `go test ./internal/repository/postgres/...`; pewarisan metode pada rotasi dibuktikan T015 & T019.
      **Menutup**: FR-008 · D6 · SC-005 (dasar pengukuran) · R9.

### Klien OIDC (D1/D3/D4 — nol dependensi baru)

- [ ] T006 [P] [US1] **Klien OIDC — URL otorisasi & pertukaran kode**
      → `internal/platform/entra/oidc.go` (baru) · `internal/platform/entra/graph.go` (hanya menambah `RedirectURI` pada `Config` — alur Graph provisioning existing **tidak** diubah)
      `authority = https://login.microsoftonline.com/{ENTRA_TENANT_ID}`; bangun URL `GET {authority}/oauth2/v2.0/authorize` dengan `response_type=code`, `client_id`, `redirect_uri`, `response_mode=query`, `scope=openid profile email`, `state`, `nonce`, `code_challenge`, `code_challenge_method=S256` (tanpa `prompt`, sesuai `contracts/sso-entra.md` §2). Pertukaran: `POST {authority}/oauth2/v2.0/token` dengan `grant_type=authorization_code`, `code`, `redirect_uri`, `client_id`, `client_secret`, `code_verifier`, `scope` — `client_secret` **hanya** di permintaan server ini. Pelaksana `domain.EntraCodeExchanger`. Hanya stdlib (`net/http`, `net/url`, `encoding/json`).
      **Verifikasi**: `go build ./...`; bentuk parameter permintaan dibuktikan `oidc_test.go` (T016) dengan `httptest`; `grep` memastikan `ClientSecret` tidak pernah dirangkai ke `authorizationUrl` yang dikembalikan ke klien.
      **Menutup**: FR-003/FR-010 · D1/D3 · contracts §2 · R-1/R-3 · Technical V.

- [ ] T007 [P] [US1] **Validasi ID token — JWKS + RS256 (D4)**
      → `internal/platform/entra/jwks.go` (baru)
      Ambil JWKS tenant (`GET {authority}/discovery/v2.0/keys`), cache di memori, **refresh sekali** saat `kid` tidak dikenal (rotasi kunci Microsoft tanpa restart); verifikasi tanda tangan **RS256** ke kunci publik yang dipetakan dari JWK (`crypto/rsa` + `math/big`), lalu klaim `iss` (= `{authority}/v2.0`), `aud == ENTRA_CLIENT_ID`, `tid == ENTRA_TENANT_ID` (single-tenant, NC-01), `exp`/`iat` dengan toleransi skew ≤5 menit, dan `nonce` sama dengan yang dikirim klien. Timeout eksplisit pada setiap permintaan JWKS. Pelaksana `domain.EntraIDTokenVerifier`.
      **Verifikasi**: `go build ./...`; `jwks_test.go` (T016) — JWK RSA → kunci publik, cache terpakai, refresh saat `kid` tak dikenal, tanda tangan valid/invalid, token kedaluwarsa, timeout/5xx.
      **Menutup**: FR-003/FR-005 · D4 · contracts §4 · R2/R3 · Technical V.

### Konfigurasi & gerbang production (D7)

- [ ] T008 [P] [US1] **Konfigurasi — `ENTRA_REDIRECT_URI` + gerbang production**
      → `internal/config/config.go` · `.env.example`
      Tambah `EntraConfig.RedirectURI` dari `ENTRA_REDIRECT_URI` dan **predikat baru** `EntraConfig.SSOEnabled()` yang menuntut **empat** nilai lengkap (TenantID, ClientID, ClientSecret, RedirectURI). `EntraConfig.Enabled()` yang lama **tidak diubah** (tetap tiga nilai) — ia dipakai wiring **provisi Entra** di `cmd/api/main.go:111`; memperluasnya akan mematikan provisi di lingkungan yang belum memasang `ENTRA_REDIRECT_URI` (regresi di luar lingkup fitur ini, Technical I/III). Di `validate()`: `APP_ENV=production` + `SSOEnabled()==false` → proses gagal start (SSO adalah jalur masuk utama — R10); di luar production → SSO nonaktif dengan peringatan terstruktur, **jangan** gagalkan startup (deviasi terbatas & terdokumentasi: D7). Tambahkan kunci `ENTRA_REDIRECT_URI` (tanpa nilai) ke `.env.example` dengan catatan "hanya dari env/secret store; jangan pernah di-commit atau di-log".
      **Verifikasi**: `go build ./...` + `go test ./internal/config/...` (`config_test.go` hijau); uji manual: tanpa `ENTRA_*` proses tetap start di development; `APP_ENV=production` tanpa `ENTRA_REDIRECT_URI` → gagal start dengan pesan yang menyebut variabel, bukan nilainya; `grep` memastikan tidak ada nilai rahasia di `.env.example`.
      **Menutup**: FR-010 · D7 · plan Open Item 2 · Technical VIII/IX · R10.

### Sesi & usecase (D5/D5b/D6/D10/D11/D12)

- [ ] T009 [US1] **`AuthService` — `issueSession(+authMethod)` & pewarisan metode**
      → `internal/usecase/auth.go`
      Ubah `issueSession(ctx, user)` → `issueSession(ctx, user, authMethod string)` dan tulis `RefreshToken.AuthMethod` (T005); seluruh call-site jalur lokal meneruskan `"local"`; `Login` juga menambahkan `"method":"local"` pada payload audit sukses (satu field — FR-007 "setara" dan sumber ukur SC-005, D10). `Refresh` meneruskan `stored.AuthMethod` dari `FindByHash` ke sesi baru — **bukan** di-reset ke `local` (bila salah, SC-005 salah hitung setelah rotasi pertama, R9). TTL, rotasi, deteksi reuse, denylist, dan penonaktifan **tidak** berubah.
      Tambahan wajib (temuan analyze **C2**): jalur lokal **penolakan** juga menulis `"method":"local"` — `rejectLogin` saat ini hanya menulis `{"outcome","reason"}` (`internal/usecase/auth.go:135-150`), sehingga query SC-004 mustahil bernilai 0 dan klaim `contracts/sso-entra.md` §6 ("setiap upaya memuat penanda metode") tidak benar. Ubah payload menjadi `{"method":"local","outcome":"rejected","reason":…}` — satu baris, tanpa mengubah perilaku penolakan.
      **Verifikasi**: `go build ./... && go vet ./...`; `go test ./internal/usecase/... -run 'Auth|Session|Refresh'` hijau (T015); perluas uji `rejectLogin` yang ada agar payload memuat `method=local` untuk ketiga alasan (`inactive account`, `wrong credentials`, `unknown account`); grep memastikan tidak ada call-site `issueSession` yang tertinggal tanpa argumen metode.
      **Menutup**: FR-002/FR-007/FR-008 · D6/D10 · R7/R9 · SC-003/SC-004/SC-005.

- [ ] T010 [US1] [US3] [US4] **`EntraLoginService` — keputusan, pemetaan, audit, rate limit**
      → `internal/usecase/entra_login.go` (baru)
      Dua permukaan: (a) `Start(...)` yang membangun `enabled` + `authorizationUrl` (D3 — backend satu-satunya sumber `authority`/`client_id`/`scope`/`redirect_uri`; tanpa rahasia); (b) `Login(ctx, code, codeVerifier, nonce, clientKey)` dengan urutan keputusan: **rate limit** `sso-login:`+`clientKey` memakai `AuthConfig.LoginLimit`/`LoginWindow` yang **sama** dengan jalur email (D12) → `Exchange` kode (D1) → `Verify` ID token (D4) → **pemetaan berurutan** (1) `FindByEntraObjectID` (2) `FindByObjectID(oid)` → `FindByEmployeeID` → akun (D5b: menutup UPN turunan nama hasil provisi CREATE) (3) `lower(users.email) = lower(klaim email/UPN)` → akun (menutup akun korporat yang sudah ada sebelum Tania) — tanpa kecocokan: **tolak, tanpa membuat akun** (NC-02); `oid` berbeda pada langkah (1) → tolak (keterkaitan tidak berpindah) → akun tidak aktif (`user.Active()`) → tolak (FR-011) → `LinkEntra` sekali bila masih `NULL` → `AuthService.issueSession(user, "entra_sso")` (D6) → audit `LOGIN` `{"method":"entra_sso","outcome":…,"reason":…}` untuk **setiap** upaya (D10). Semua kegagalan pemetaan memakai **satu** pesan generik Bahasa Indonesia `"Akun korporat ini tidak terhubung ke akun Tania. Hubungi Admin."` (D11/anti-enumerasi); hanya kegagalan "layanan Microsoft tidak tersedia" yang memakai pesan pembeda. Klaim `groups`/`roles` **tidak dibaca** (D9); payload audit tidak memuat klaim/token/rahasia.
      **Verifikasi**: `go build ./... && go vet ./...`; matriks keputusan & invarian audit dibuktikan T014; kontrak pesan & kebocoran dibuktikan T018.
      **Menutup**: FR-003/FR-004/FR-005/FR-009/FR-011/FR-012 · US3/US4 · D1/D3/D4/D5/D5b/D9/D10/D11/D12 · R1/R3/R4/R6 · SC-002.

### Permukaan GraphQL (D2/D3)

- [ ] T011 [US1] **SDL — tipe & operasi SSO**
      → `graph/schema.graphqls`
      Tambah `type EntraSsoStart { enabled: Boolean!, authorizationUrl: String }`, `input EntraLoginInput { code: String!, codeVerifier: String!, nonce: String! }`, `Query.entraSsoStart(codeChallenge: String!, state: String!, nonce: String!): EntraSsoStart!`, `Mutation.loginWithEntra(input: EntraLoginInput!): AuthPayload!` — persis `contracts/sso-entra.md` §1 (dokumentasi SDL ikut disalin). `AuthPayload`/`LocalLoginInput`/`login`/`refreshSession`/`logout` **tidak** berubah; **tanpa** `tenantId`/`clientId`/`clientSecret`/`redirectUri`/`scope` pada input maupun output (D2/§1).
      **Verifikasi**: `make generate` selesai bersih; diff SDL ditinjau baris-per-baris terhadap `contracts/sso-entra.md` §1 (nama, tipe, nullability identik); `grep` memastikan tidak ada nama rahasia di SDL.
      **Menutup**: FR-001/FR-003 · kontrak API (konstitusi) · D2/D3 · contracts §1 · R-8.

- [ ] T012 [US1] **Regenerasi gqlgen + resolver tipis + pemetaan error**
      → `graph/generated.go` · `graph/schema.resolvers.go` · `graph/model/` (generated) · `graph/errors.go` · `graph/mapping.go`
      Jalankan regenerasi gqlgen (`make generate`); tambah resolver tipis: `entraSsoStart` (publik — saat SSO nonaktif mengembalikan `enabled=false`, **bukan** error) dan `loginWithEntra` (publik) yang hanya meneruskan ke `EntraLoginService`; petakan galat lewat `presentError` existing: `ENTRA_NOT_CONFIGURED` (SSO nonaktif) dan `ENTRA_UNAVAILABLE` (Microsoft tidak terjangkau/5xx/timeout); `RATE_LIMITED`, `UNAUTHENTICATED`, `BAD_USER_INPUT` memakai pemetaan yang sudah ada. Respons tetap `AuthPayload` existing (D2 — tanpa endpoint HTTP/cookie kedua).
      **Verifikasi**: `make generate` + `go build ./...`; `go test ./graph/...` (`schema_contract_test.go` hijau); kontrak kode kesalahan dibuktikan T018.
      **Menutup**: FR-001/FR-003/FR-009 · D2 · Technical VII · contracts §1/§4.

- [ ] T013 [US1] **Wiring `cmd/api/main.go`**
      → `cmd/api/main.go`
      Bangun klien OIDC (`platform/entra`) bila `cfg.Entra.SSOEnabled()` (bukan `Enabled()` — lihat T008) — pola wiring `entra.NewGraphClient` existing — dan rangkai `EntraLoginService` (users, provisi, `authService`, limiter, audit, config) ke resolver. Tanpa kredensial: klien `nil` dan permukaan SSO melaporkan "belum dikonfigurasi"/`enabled=false` (gerbang production sudah dijaga `config.validate`, T008). Wiring provisi Entra existing (`cmd/api/main.go:111`) **tidak** diubah.
      **Verifikasi**: `go build ./...`; `make run` di development tanpa `ENTRA_*` tetap start dengan peringatan SSO nonaktif + `curl -s localhost:8080/healthz` sehat; `query { entraSsoStart(...) { enabled } }` → `false`.
      **Menutup**: FR-010 · D7 · Technical VII/VIII · R10.

### Test backend (task tersendiri — konstitusi §II/§III)

- [ ] T014 [P] [US1] [US3] [US4] **Unit — matriks keputusan `EntraLoginService`**
      → `internal/usecase/entra_login_test.go` (baru)
      Memakai fake `EntraCodeExchanger`/`EntraIDTokenVerifier`/`UserRepository`/`EntraProvisionRepository`/`RateLimiter` (pola `fakes_test.go` existing). Kasus **terima**: ter-link via `users.entra_object_id` ✓; ter-link via `entra_provisions.object_id` dengan UPN ≠ email akun Tania ✓ (dasar U9); *first-link* via kesamaan email ✓ (isi `entra_object_id` + `auth_provider`, dasar U10); `oid` berbeda untuk email yang sama ✗; email tak cocok ✗ (**tanpa** baris akun baru — NC-02); akun nonaktif ✗ (FR-011); `tid` salah/akun personal ✗; `aud` salah ✗; `nonce` beda ✗; token kedaluwarsa ✗; tanda tangan invalid ✗; batas rate limit terlampaui ✗; **replay** — `code`/`nonce` yang sama dipakai **kedua kali** → exchanger mengembalikan galat ✗, tidak ada sesi, tidak ada tulisan ke `users`/`refresh_tokens`, audit `reason=code_exchange_failed` (temuan analyze **C4**; menutup FR-003 + Edge Case "bukti dipakai ulang" secara otomatis, yang sebelumnya hanya probe manual di T031). Setiap jalur **tolak**: `audit_logs` `outcome=rejected` + `reason` yang tepat, dan tidak ada tulisan ke `users`/`refresh_tokens`.
      **Verifikasi**: `go test ./internal/usecase/... -run Entra -count=1` hijau.
      **Menutup**: US3 AC1–AC4 · FR-003/FR-004/FR-005/FR-011/FR-012 · D5/D5b/D11/D12 · R3/R6 · SC-002.

- [ ] T015 [P] [US1] [US4] **Unit — paritas sesi & penanda metode sesi/audit**
      → `internal/usecase/auth_test.go` (tambah)
      Jalur lokal: `issueSession` menulis `auth_method='local'` dan audit sukses memuat `"method":"local"` (D10). Paritas FR-008 (D6): TTL akses/refresh, rotasi, deteksi reuse, dan penolakan akun nonaktif **sama** untuk kedua jalur. **R9 eksplisit**: `Refresh` atas token ber-`auth_method='entra_sso'` menerbitkan baris baru yang **tetap** `entra_sso` (bukan `local`).
      **Verifikasi**: `go test ./internal/usecase/... -run 'Auth|Session|Refresh|Login' -count=1` hijau.
      **Menutup**: US4 · FR-002/FR-007/FR-008 · D6/D10 · R7/R9 · SC-003/SC-004/SC-005.

- [ ] T016 [P] [US1] **Unit — klien OIDC & JWKS**
      → `internal/platform/entra/oidc_test.go` (baru) · `internal/platform/entra/jwks_test.go` (baru)
      `httptest` server: (a) URL otorisasi memuat seluruh parameter §2 dengan `code_challenge_method=S256` dan **tanpa** `prompt`; (b) permintaan token memuat `client_secret` hanya di body server-to-server; (c) JWK RSA → kunci publik; (d) JWKS di-cache (permintaan kedua tidak menyentuh jaringan); (e) `kid` tak dikenal → satu refresh lalu cocok; (f) tanda tangan valid/invalid, token kedaluwarsa/`iss`/`aud`/`tid`/`nonce` salah → ditolak; (g) 5xx/timeout → galat yang dipetakan ke `ENTRA_UNAVAILABLE`.
      **Verifikasi**: `go test ./internal/platform/entra/... -count=1` hijau.
      **Menutup**: FR-003/FR-005/FR-009/FR-010 · D4 · contracts §2/§4 · R2/R3 · Technical V.

- [ ] T017 [P] [US3] **Contract/authz — SSO tidak menambah hak akses**
      → `internal/usecase/authz_test.go` (tambah)
      Sesi hasil SSO atas akun Chapter tetap ditolak pada permukaan Admin (`FORBIDDEN`), dan peran sesi dibaca dari akun Tania — bukan dari klaim Microsoft; klaim `groups`/`roles` tidak pernah dipetakan (D9). Satu baris regresi: jalur email tetap menghasilkan hak akses yang sama seperti sebelumnya.
      **Verifikasi**: `go test ./internal/usecase/... -run Authz -count=1` hijau.
      **Menutup**: US3 AC1 · FR-006 · D9 · R4 · SC-002 (sebagian).

- [ ] T018 [P] [US4] **Security — pesan generik & jejak bebas rahasia**
      → `internal/transport/httpapi/security_test.go` (tambah)
      (a) Pesan seluruh kegagalan pemetaan identitas **identik** (tidak dapat dibedakan antara "tidak punya akun", "akun nonaktif", "identitas milik akun lain", "token tidak valid"); (b) respons `entraSsoStart`/`loginWithEntra` dan pesan galat tidak memuat `client_secret`, token, atau klaim; (c) log modul SSO tidak memuat email/nama/token (hanya ID teknis & kode error); (d) akun nonaktif ditolak; (e) upaya berhasil/gagal/ditolak semuanya menghasilkan entri audit ber-`method`.
      **Verifikasi**: `go test ./internal/transport/httpapi/... -run Security -count=1` hijau.
      **Menutup**: US4 · FR-007/FR-009/FR-010/FR-011 · D10/D11 · Security II/III · R6 · SC-002/SC-004.

- [ ] T019 [US4] **E2E backend — alur penuh `loginWithEntra` (butuh DB/Redis terisolasi)**
      → `internal/transport/httpapi/e2e_test.go` (tambah)
      Via HTTP dengan fake verifier + fake exchanger: `loginWithEntra` menerbitkan sesi akses + refresh; baris `refresh_tokens.auth_method='entra_sso'` tersimpan; `users.entra_object_id` + `auth_provider='entra'` terisi **sekali**; entri `audit_logs` `action='LOGIN'` memuat `method=entra_sso`; `refreshSession` atas token itu menghasilkan baris baru yang tetap `entra_sso` (R9); jalur `login` lokal tetap hijau dan menulis `auth_method='local'`. Ter-`Skip` eksplisit bila `TEST_DATABASE_URL`/`TEST_REDIS_ADDR` tidak diset — dilaporkan jujur sebagai belum diverifikasi, bukan diklaim lulus.
      **Verifikasi**: `make test-integration` hijau pada DB/Redis terisolasi (jangan menyentuh DB bersama).
      **Menutup**: US1/US4 · FR-003/FR-004/FR-007/FR-008 · D5/D6/D10 · SC-004/SC-005.

**Checkpoint U1**: `make vet` + `make lint` + `make test` hijau; `loginWithEntra` menerbitkan sesi dengan `auth_method='entra_sso'` dan seluruh tolakan berjejak audit tanpa membocorkan keberadaan akun; jalur email + kata sandi tidak berubah selain penanda `method`.

---

## Phase U2 — Frontend (tania-dashboard) — plan.md §Roadmap U2 · R-8

**Purpose**: Halaman login menjadikan SSO opsi utama (auto-redirect sekali) tanpa pernah mengunci pengguna di luar jalur email, dan rute callback menukar kode menjadi sesi Tania. Tanpa dependensi npm baru — PKCE memakai Web Crypto.

**Dependensi gelombang**: U2 **hanya** bergantung pada **T011** (SDL SSO sudah masuk backend) untuk penyalinan SDL, dan pada kontrak final `contracts/sso-entra.md` §1/§4/§8 untuk seluruh UI. U2 **tidak** menunggu T010/T012/T013 selesai: codegen + komponen dapat dikerjakan paralel dengan sisa U1; yang belum dapat dibuktikan di U2 adalah pertukaran kode sungguhan (itu milik U3/T030).

- [ ] T020 [US1] **⚠️ Task pertama U2 — salin ulang `graph/schema.graphqls` dari backend**
      → `tania-dashboard/graph/schema.graphqls` (menggantikan salinan lama) · `src/generated/graphql/`
      `cp ../tania-backend/graph/schema.graphqls graph/schema.graphqls` lalu `pnpm run codegen` (prosedur README §GraphQL codegen). **Wajib dijalankan sebelum codegen apa pun** — tanpa ini codegen tidak melihat `EntraSsoStart`/`EntraLoginInput`/`entraSsoStart`/`loginWithEntra` sama sekali (R8). Sumber kebenaran tetap SDL yang **dilayani** backend; `contracts/sso-entra.md` bukan sumber generate. Bila ada drift lain yang ikut terbawa salinan ulang, catat sebagai perubahan terpisah yang disengaja di commit/PR — jangan disembunyikan dan jangan dicampur dengan diff fitur SSO.
      **Verifikasi**: `pnpm run generate:check` hijau + `pnpm run schema:drift` OK; `diff -q` salinan terhadap sumber backend bersih; diff generated hanya memuat tipe/operasi SSO (+ drift yang sudah dicatat).
      **Menutup**: R8 · konstitusi API 1.1.1 · prasyarat US1.

- [ ] T021 [US1] **Dokumen GraphQL fitur SSO**
      → `src/features/auth/entraStart.graphql` (baru) · `src/features/auth/loginWithEntra.graphql` (baru)
      Operasi bertipe: `EntraSsoStart($codeChallenge: String!, $state: String!, $nonce: String!)` dan `LoginWithEntra($input: EntraLoginInput!)` dengan seleksi `AuthPayload` (pola `login.graphql` existing). Jalankan `pnpm run codegen` agar dokumen bertipe.
      **Verifikasi**: `pnpm run typecheck` + `pnpm run generate:check` hijau.
      **Menutup**: US1 · D2/D3 · contracts §1.

- [ ] T022 [US1] **PKCE & state/nonce (Web Crypto — tanpa MSAL)**
      → `src/features/auth/entra-pkce.ts` (baru)
      `crypto.getRandomValues` untuk `code_verifier` (43–128 karakter base64url), `state`, dan `nonce`; `crypto.subtle.digest("SHA-256")` + base64url untuk `code_challenge` (S256); simpan verifier/state/nonce sementara per-percobaan di `sessionStorage` dan hapus setelah dipakai (sekali pakai). Tanpa dependensi npm baru (`@msal-browser` **ditolak**).
      **Verifikasi**: `pnpm run typecheck`; unit `entra-pkce.test.ts` (T026) — panjang/alfabet verifier, challenge = SHA-256 base64url, nilai tersimpan & terhapus.
      **Menutup**: FR-001/FR-003 · D1/D3 · contracts §2 · R-11 · Technical V.

- [ ] T023 [US1] [US2] **Penanda browser (opsi A) — fallback & "belum tertaut" 7 hari**
      → `src/lib/auth/config.ts` · `src/lib/constants/storage.ts`
      Tambah kunci penanda (`tania:sso:fallback` di `sessionStorage`; `tania:sso:unlinked` di `localStorage`) + helper baca/tulis/hapus, termasuk masa berlaku 7 hari untuk penanda "belum tertaut" dan pembersihan keduanya setelah login berhasil di jalur mana pun. Penanda **murni petunjuk tampilan** di browser — tidak pernah otoritatif; keputusan menerima/menolak tetap di server (D8/§9 butir 6).
      **Verifikasi**: `pnpm run typecheck`; unit (T026) — penanda kedaluwarsa tidak dihormati, penanda dibersihkan setelah login sukses.
      **Menutup**: FR-001/FR-002 · US2 · D8 (ii) · R5.

- [ ] T024 [US1] [US2] **`/login` — auto-redirect sekali + pintu fallback yang selalu terlihat (D8 opsi A)**
      → `src/app/(auth)/login/LoginForm.tsx` · `src/lib/constants/routes.ts`
      Panggil `entraSsoStart` saat mount; bila `enabled` **dan** mode normal **dan** tidak ada penanda fallback → `window.location.replace(authorizationUrl)`. Tautan **"Masuk dengan email & kata sandi" selalu terlihat** (bukan hanya setelah gagal) sehingga akun Tania tanpa akun korporat — yang pasti gagal di auto-redirect — punya jalan keluar jelas; menekannya menyalakan penanda fallback sehingga auto-redirect berhenti (mustahil ada lingkaran pengalihan). Kembali dengan `?sso=error|cancelled` juga menyalakan penanda + menampilkan pesan Bahasa Indonesia yang jelas. `enabled=false` (atau `AUTH_LOCAL_ONLY`) → form email langsung tampil, tanpa tombol SSO menggantung. Tombol "Masuk dengan Microsoft" memakai peran aksi primer halaman (brand-red, arah desain TAN-191) dan tautan fallback sebagai sekunder; state memuat/gagal ber-ARIA + teks (Design §VI/VIII).
      **Verifikasi**: `pnpm run lint && pnpm run typecheck` + `pnpm test` (T026); e2e T028 (tanpa SSO aktif, form tampil langsung).
      **Menutup**: FR-001/FR-002/FR-009 · US1/US2 · D8 (i) · contracts §4 · R5 · Design I/II/VI.

- [ ] T025 [US1] **Rute `/login/callback`**
      → `src/app/(auth)/login/callback/page.tsx` (baru)
      Baca `code`/`state` (dan `error`) dari query string. `state` tidak cocok/tidak ada → pesan `"Sesi masuk tidak valid atau sudah kedaluwarsa. Silakan coba lagi."` **tanpa** memanggil mutation. `error=access_denied`/pembatalan → kembali ke `/login` dengan penanda fallback + pesan jelas. Sukses → `loginWithEntra({ code, codeVerifier, nonce })` → `setSession(...)` → `router.replace(DASHBOARD)`. Galat mutation ditampilkan dari `err.message` apa adanya (sudah Bahasa Indonesia dari backend, D11); penolakan "belum tertaut" menyalakan penanda 7 hari. Rute sudah publik lewat `isPublicRoute` (`/login/*`) — **jangan** mengubah gate/proxy.
      **Verifikasi**: `pnpm run lint && pnpm run typecheck` + `pnpm test` (T027); manual quickstart §A butir 4.
      **Menutup**: US1 AC1–AC3 · FR-003/FR-009 · contracts §4/§8 · D8.

### Test frontend (task tersendiri)

- [ ] T026 [P] [US1] [US2] **Komponen — `/login` & PKCE**
      → `src/app/(auth)/login/LoginForm.test.tsx` (baru; pola `page.test.tsx` existing) · `src/features/auth/entra-pkce.test.ts` (baru)
      Vitest + RTL + `MockedProvider`: `enabled=true` tanpa penanda → `window.location.replace` dipanggil dengan URL otorisasi; penanda fallback aktif → form tampil & **tidak** redirect; `enabled=false` → form tampil tanpa redirect; kembali `?sso=error|cancelled` → form + pesan, tidak memutar ulang; tautan fallback **selalu** terlihat dan menyalakan penanda; PKCE — verifier 43–128 base64url, challenge S256 benar, state/nonce tersimpan; penanda kedaluwarsa (7 hari) tidak dihormati.
      **Verifikasi**: `pnpm test` hijau.
      **Menutup**: US1/US2 · FR-001/FR-002/FR-009 · D8 · Design §VI.

- [ ] T027 [P] [US1] **Komponen — `/login/callback`**
      → `src/app/(auth)/login/callback/callback.test.tsx` (baru)
      Vitest + RTL + `MockedProvider`: `state` tidak cocok → pesan tampil & mutation **tidak** dipanggil; galat mutation → pesan Bahasa Indonesia tampil; sukses → `setSession` dipanggil + `router.replace(DASHBOARD)`; pembatalan (`error=access_denied`) → kembali ke `/login` dengan penanda fallback.
      **Verifikasi**: `pnpm test` hijau.
      **Menutup**: US1 AC1–AC3 · FR-003/FR-009 · contracts §4/§8.

- [ ] T028 [P] [US1] [US2] **E2E Playwright — regresi jalur lokal & rute callback (tanpa kredensial)**
      → `e2e/critical-path.spec.ts`
      Skenario: tanpa SSO aktif, `/login` menampilkan form email **langsung** (tanpa pengalihan); jalur email + kata sandi tetap masuk sampai `/dashboard` (SC-003); `/login/callback` tanpa parameter menampilkan pesan jelas, bukan halaman kosong atau error mentah; `/login?sso=cancelled` menampilkan form tanpa pengalihan otomatis. Seluruh langkah berjalan tanpa kredensial Entra (mode `NEXT_PUBLIC_AUTH_LOCAL_ONLY=1`); skenario critical-path existing tidak diubah.
      **Verifikasi**: `pnpm run test:e2e` — skenario baru lulus, skenario existing tidak regresi. Alur yang benar-benar menyentuh tenant ada di T030/T031.
      **Menutup**: US2 · FR-001/FR-002/FR-009 · SC-003 · quickstart §A.

**Checkpoint U2**: `pnpm run lint` + `pnpm run typecheck` + `pnpm test` + `pnpm run generate:check` + `pnpm run schema:drift` hijau; `/login` mengarahkan sekali ke Microsoft bila aktif dan selalu menyediakan pintu email; `/login/callback` menukar kode → sesi tanpa pernah memanggil backend saat `state` tidak cocok.

---

## Phase U3 — UAT & pengukuran — plan.md §Roadmap U3 · quickstart.md §B/§C

**Purpose**: Membuktikan fitur terhadap tenant sungguhan dan mengukur seluruh SC pada data yang nyata; menutup Open Item 4 (DAMP) sebelum rilis.

- [ ] T029 **Gerbang mesin (quickstart §C)** — tanpa perubahan kode kecuali perbaikan.
      Jalankan: `tania-backend` → `make vet` + `make lint` + `make test` (+ `make test-integration` bila DB/Redis terisolasi tersedia); `tania-dashboard` → `pnpm run lint` + `pnpm run typecheck` + `pnpm test` + `pnpm run generate:check` + `pnpm run schema:drift`.
      **Verifikasi**: seluruh perintah hijau; kegagalan = blocker, bukan catatan.
      **Menutup**: Technical II/III · SC-003 (bagian otomatis).

- [ ] T030 **UAT tenant Telkom — U1–U10 (quickstart §B; butuh T001 + akun & kredensial sungguhan)**
      U1 akun korporat terhubung → masuk sampai `/dashboard`; U2 email korporat diubah di Entra → tetap masuk (keterkaitan ikut `oid`, bukan alamat); U3 akun korporat tanpa akun Tania → ditolak dengan pesan generik + arahan Admin, **tidak ada akun baru** di DB; U4 akun personal/tenant lain → ditolak; U5 akun Tania tidak aktif → ditolak; U6 alur dibatalkan di halaman Microsoft → kembali ke `/login` dengan form + pesan, tanpa lingkaran pengalihan; U7 jalur email + kata sandi saat SSO aktif → berhasil seperti sebelumnya; U8 masuk SSO sebagai Chapter lalu buka menu Admin → 403 backend, bukan karena klaim Microsoft; **U9** akun korporat hasil provisi **CREATE** (UPN turunan nama, email akun Tania berbeda) → **masuk** lewat keterkaitan provisi; **U10** akun korporat yang **sudah ada sebelum Tania** tanpa baris provisi dan email akun Tania = alamat masuknya → **masuk** lewat kesamaan email, keterkaitan terisi sekali.
      **Verifikasi**: tabel `quickstart.md` §B U1–U10 terisi apa adanya (temuan dilaporkan, bukan dirapikan); query pemeriksaan §A2 menunjukkan `users.entra_object_id`/`auth_provider`, baris `refresh_tokens.auth_method`, dan entri audit `LOGIN`. Butir 5–7 §A2 (pewarisan metode saat refresh, jalur lokal ber-`auth_method='local'`, opsi A "belum tertaut" + penanda 7 hari) ikut dijalankan.
      **Menutup**: US1 AC1–AC4 · US3 · FR-001/FR-002/FR-004/FR-005/FR-011 · D5/D5b/D6/D8 · U9/U10.
      **Catatan**: bila tenant/kredensial belum tersedia, task ini tetap terbuka dan dilaporkan sebagai menunggu — bukan dinyatakan lulus.

- [ ] T031 **Probe keamanan & ketahanan (quickstart §A/§A2; butuh T001)**
      Probe: akun personal/tenant lain; akun Tania tidak aktif; pembatalan di halaman Microsoft; `state` tidak cocok; `code` dipakai ulang/kedaluwarsa; ID token kedaluwarsa/tanda tangan invalid; `nonce` berbeda; rate limit `sso-login:` (pesan `RATE_LIMITED` setelah melewati batas yang sama dengan jalur email); periksa URL & browser (hanya `code`/`state`/`nonce` — tanpa klaim/token/rahasia); periksa log modul SSO (tanpa email/nama/token/klaim); periksa respons galat (tanpa `client_secret`); pastikan upaya berhasil/gagal/ditolak semuanya berjejak audit dengan `method`.
      **Verifikasi**: seluruh probe lulus — satu gagal = blocker rilis. Hasil dicatat per probe dengan bukti (respons/log/kode), bukan pernyataan.
      **Menutup**: US4 · FR-003/FR-005/FR-007/FR-009/FR-010/FR-011/FR-012 · D4/D10/D11/D12 · Security II/III · R6 · SC-002/SC-004.

- [ ] T032 **Pengukuran SC-001–SC-005 (quickstart §C)**
      **SC-001**: ukur manual di U1 — jumlah interaksi (≤3) dan durasi `/login` → `/dashboard` (<30 detik). **SC-002**: jalankan U1+U3+U4+U5 untuk seluruh akun uji; bandingkan `users.entra_object_id` dengan `oid` sebenarnya; tidak boleh ada akun terhubung ke identitas yang salah. **SC-003**: `pnpm run test:e2e` + U7. **SC-004**: hitung pada **jendela sejak rilis**, bukan seluruh riwayat — `SELECT count(*) FROM audit_logs WHERE action='LOGIN' AND occurred_at >= '<tanggal rilis>' AND (after->>'method' IS NULL);` → **0**. Baris sebelum rilis (tanpa payload sama sekali) tidak dihitung; tanggal jendela dicatat pada laporan pengukuran (temuan analyze **C2** — query lama atas seluruh riwayat tidak mungkin bernilai 0). **SC-005**: dari `audit_logs` (`action='LOGIN'`, `after->>'outcome'='success'`, 30 hari terakhir, kelompokkan `after->>'method'`) → `entra_sso ÷ total ≥ 0,8`, dengan **penyebut dibatasi** ke pengguna yang sudah memiliki akun korporat sesuai SC-005 hasil revisi 2026-10-20. Penyebut diambil dari sumber yang **tidak bergantung pada keberhasilan yang diukur**: seluruh baris `entra_provisions` (semua `action`/`status`, **termasuk** `INVITE` yang `object_id`-nya kosong — jalur undangan "sudah guest" tidak mencatat `object_id`) untuk karyawan dengan akun Tania aktif, **ditambah** akun Tania yang `entra_object_id IS NOT NULL`; `refreshSession` tidak dihitung sebagai masuk baru. `users.entra_object_id IS NOT NULL` **tidak boleh** menjadi satu-satunya sumber penyebut (temuan analyze **C3**): kolom itu diisi oleh keberhasilan SSO pertama → sirkular, dan pemegang akun korporat yang belum pernah/gagal SSO akan hilang dari penyebut sehingga rasio naik — justru menyembunyikan kegagalan yang ingin dideteksi. **Sumber otoritatif penyebut ini masih menunggu konfirmasi pemilik produk** (baris provisi = proksi terdekat yang tersedia di data Tania hari ini; bila kelak ada daftar resmi pemegang akun korporat, sumber itu yang dipakai).
      **Verifikasi**: setiap SC punya angka + tanggal + cara (query/langkah) yang tercatat di laporan; yang belum dapat diukur dinyatakan apa adanya beserta sebabnya.
      **Menutup**: SC-001/SC-002/SC-003/SC-004/SC-005 · FR-007/FR-008 · D6/D10 · contracts §6.

- [ ] T033 **DAMP / ceklis keamanan pra-rilis (plan Open Item 4)**
      Evaluasi risiko jalur autentikasi baru (dinilai **rendah–sedang**: single-tenant, tanpa penyimpanan klaim, tanpa PII baru) dan jalankan ceklis keamanan konkret terhadap implementasi: penyimpanan rahasia, minimisasi klaim, PII pada log/URL, jejak audit, penonaktifan akun, dan rate limit. **Dokumentasi + verifikasi; tanpa perubahan perilaku** selain temuan yang diperbaiki.
      **Verifikasi**: ceklis terisi dengan bukti per butir (bukan pernyataan); temuan punya pemilik & tindak lanjut; deviasi yang tersisa (mis. perilaku startup D7) dicatat eksplisit.
      **Menutup**: Security I–IV · plan Open Item 4 · R-10.

**Checkpoint U3**: SC-001–SC-005 terukur pada tenant sungguhan; seluruh probe keamanan lulus; DAMP pra-rilis dijalankan konkret sebelum rilis.

---

## Dependencies & Execution Order

### Antar gelombang

- **U0** — tidak memblokir penulisan kode (fake exchanger/verifier deterministik), tetapi **memblokir seluruh U3**. T001 adalah prasyarat milik pemilik produk.
- **U1** — T002 → T003 → (T004, T005, T006, T007, T008) → T009 → T010 → T011 → T012 → T013; test T014–T019 menyusul task yang diujinya.
- **U2** — bergantung pada **T011** (SDL sudah masuk backend) untuk T020; sisanya memakai kontrak final `contracts/sso-entra.md`. T020 → T021 → T022 → T023 → (T024, T025) → T026/T027, lalu T028.
- **U3** — butuh U0 + U1 + U2 selesai.

### Rantai kritis U1

```text
T002 (migrasi 0017) ─► T004 (repo user) ─────┐
T003 (domain) ───────► T005 (repo token) ────┤
T003 ─► T006 (oidc) ─┐                       │
T003 ─► T007 (jwks) ─┼─► T010 (EntraLoginService) ─► T011 (SDL) ─► T012 (resolver) ─► T013 (wiring)
T008 (config) ───────┘            ▲
T003 ─► T009 (issueSession+authMethod) ──────┘
T004 ─► T010
T004b (repo provisi oid) ─► T010
```

### Urutan dalam tiap bagian

- Migrasi (T002) sebelum repository (T004/T005) — kolom & indeks harus ada.
- Domain (T003) sebelum klien OIDC, usecase, dan repository.
- `issueSession(+authMethod)` (T009) sebelum `EntraLoginService` (T010) — service memanggilnya.
- SDL (T011) sebelum regenerasi/resolver (T012) dan sebelum U2 (T020).
- Wiring (T013) paling akhir di U1 — seluruh potongan harus ada.
- Test (T014–T019, T026–T028) setelah task yang diujinya; harus lulus sebelum checkpoint gelombang dinyatakan tertutup.

### Peluang paralelisasi

- **U1 paralel**: T004 ∥ T004b ∥ T005 ∥ T006 ∥ T007 ∥ T008 (berkas berbeda, dependensi hanya pada T002/T003).
- **U1 ∥ U2 sebagian**: T021–T023 (dokumen GraphQL, PKCE, penanda browser) dapat dikerjakan begitu T011 mendarat, bersamaan dengan T012/T013.
- **Test paralel**: T014 ∥ T015 ∥ T016 ∥ T017 ∥ T018 (berkas test berbeda); T026 ∥ T027 setelah implementasinya.
- **Tidak boleh paralel**: T004 ∥ T002; T010 ∥ T009; T012 ∥ T011; T020 ∥ T011; T024 ∥ T023.

---

## Pemetaan task → FR / US / SC / D

| Task | Menutup |
| --- | --- |
| T001 | plan Open Item 2 · US1 AC1 · prasyarat SC-001 |
| T002 | FR-008 · D5 (invarian `oid` unik) · data-model §Index/§Sesi · Security IV |
| T003 | D5/D6 · data-model §Relasi & antarmuka · Technical VII |
| T004 | FR-004 jalur (1)&(3) · D5 · R3 |
| T004b | FR-004 jalur (a) langkah (2) · D5/D5b · R1 · data-model §Urutan pemetaan |
| T005 | FR-008 · D6 · SC-005 (dasar) · R9 |
| T006 | FR-003/FR-010 · D1/D3 · contracts §2 · R-1/R-3 · Technical V |
| T007 | FR-003/FR-005 · D4 · contracts §4 · R2/R3 |
| T008 | FR-010 · D7 · Open Item 2 · Technical VIII/IX · R10 |
| T009 | FR-002/FR-007/FR-008 · D6/D10 · R7/R9 · SC-003/SC-004/SC-005 |
| T010 | FR-003/004/005/009/011/012 · US3/US4 · D1/D3/D4/D5/D5b/D9/D10/D11/D12 · R1/R3/R4/R6 · SC-002 |
| T011 | FR-001/FR-003 · D2/D3 · contracts §1 · kontrak API (konstitusi) · R-8 |
| T012 | FR-001/FR-003/FR-009 · D2 · contracts §1/§4 · Technical VII |
| T013 | FR-010 · D7 · Technical VII/VIII · R10 |
| T014 | US3 AC1–AC4 · FR-003/004/005/011/012 · D5/D5b/D11/D12 · R3/R6 · SC-002 |
| T015 | US4 · FR-002/007/008 · D6/D10 · R7/R9 · SC-003/004/005 |
| T016 | FR-003/005/009/010 · D4 · contracts §2/§4 · R2/R3 |
| T017 | FR-006 · US3 AC1 · D9 · R4 |
| T018 | US4 · FR-007/009/010/011 · D10/D11 · Security II/III · R6 · SC-002/SC-004 |
| T019 | US1/US4 · FR-003/004/007/008 · D5/D6/D10 · SC-004/SC-005 |
| T020 | R8 · konstitusi API 1.1.1 · US1 |
| T021 | US1 · D2/D3 · contracts §1 |
| T022 | FR-001/FR-003 · D1/D3 · contracts §2 · R-11 · Technical V |
| T023 | FR-001/FR-002 · US2 · D8 (ii) · R5 |
| T024 | FR-001/FR-002/FR-009 · US1/US2 · D8 (i) · contracts §4 · R5 · Design I/II/VI |
| T025 | US1 AC1–AC3 · FR-003/FR-009 · contracts §4/§8 · D8 |
| T026 | US1/US2 · FR-001/FR-002/FR-009 · D8 · Design §VI |
| T027 | US1 AC1–AC3 · FR-003/FR-009 · contracts §4/§8 |
| T028 | US2 · FR-001/FR-002/FR-009 · SC-003 · quickstart §A |
| T029 | Technical II/III · SC-003 (otomatis) |
| T030 | US1 AC1–AC4 · US3 · FR-001/002/004/005/011 · D5/D5b/D6/D8 · U9/U10 |
| T031 | US4 · FR-003/005/007/009/010/011/012 · D4/D10/D11/D12 · Security II/III · R6 · SC-002/SC-004 |
| T032 | SC-001–SC-005 · FR-007/FR-008 · D6/D10 · contracts §6 |
| T033 | Security I–IV · plan Open Item 4 · R-10 |

**Keputusan teknis → task (dapat dilacak)**: **D1/D2** T006 · T010 · T011 · T012 (Authorization Code + PKCE, mutation `loginWithEntra`, confidential client) · **D3** T006 · T010 · T011 (query `entraSsoStart`) · **D4** T007 · T010 · T016 (validasi ID token + JWKS) · **D5** T002 · T004 · T010 · T014 (langkah (1)(2)(3)) · **D5b** T010 · T014 · T030 (akun korporat yang sudah ada sebelum Tania) · **D6** T005 · T009 · T015 · T019 (pewarisan `authMethod` saat `Refresh`) · **D7** T008 · T013 (config & gerbang production) · **D8** T023 · T024 · T025 · T026 (opsi A: tautan email selalu terlihat + penanda "belum tertaut" 7 hari) · **D9** T010 · T017 (RBAC tak berubah) · **D10** T009 · T010 · T018 · T019 · T032 (audit `method`) · **D11** T010 · T018 (pesan generik anti-enumerasi) · **D12** T010 · T014 · T031 (rate limit).

**Cakupan FR/SC wajib — peta ringkas**: FR-001 (T011/T012/T024/T026/T028/T030) · FR-002 (T009/T024/T026/T028/T030) · FR-003 (T006/T007/T010/T014/T016/T019/T025/T027/T031) · FR-004 (T004/T004b/T010/T014/T019/T030) · FR-005 (T007/T010/T014/T016/T030/T031) · FR-006 (T017/T030) · FR-007 (T010/T015/T018/T019/T031/T032) · FR-008 (T002/T005/T009/T015/T019/T032) · FR-009 (T010/T012/T018/T024/T025/T027/T028/T031) · FR-010 (T006/T008/T016/T018/T031/T033) · FR-011 (T010/T014/T018/T030/T031) · FR-012 (T010/T014/T031) · SC-001 (T001/T024/T030/T032) · SC-002 (T014/T017/T018/T031/T032) · SC-003 (T009/T015/T019/T028/T029/T032) · SC-004 (T009/T015/T018/T019/T031/T032) · SC-005 (T002/T005/T009/T015/T032).

---

## Temuan lintas artefak (dilaporkan, tidak diputuskan sendiri)

Ditemukan saat menyusun task; **tidak ada** artefak plan/spec yang diubah. Dampaknya pada task sudah dijaga seperti dicatat di bawah.

1. **Istilah "jalur" dipakai dengan dua makna** — `quickstart.md` §B menamai U9 sebagai "FR-004 jalur (2)" dan U10 sebagai "jalur (3)" (penomoran **langkah** D5/`contracts` §3), sementara `spec.md` FR-004 (revisi) menamai dua **jalur** sebagai (a)/(b) dan plan D5 memetakan jalur (a) = langkah (1)+(2), jalur (b) = langkah (3). Substansinya selaras; hanya labelnya ambigu. **Dampak task**: T030 menamai U9/U10 sebagai "keterkaitan provisi" dan "kesamaan email" agar tidak bergantung pada nomor. Perbaikan redaksi `quickstart.md` §B ada di luar lingkup (artefak plan tidak disentuh) — **dilaporkan untuk TAN-269/267**, bukan diputuskan di sini.
2. **Langkah (1) D5 berada di dalam jalur (a) FR-004** — plan D5 menempatkan langkah (1) (`users.entra_object_id`) di dalam jalur (a) yang oleh `spec.md` digambarkan sebagai "keterkaitan hasil kemampuan provisi Entra", padahal keterkaitan itu terisi pada login sukses pertama dari **jalur mana pun**. Semua task mengikut **plan D5/§3** (urutan (1)→(2)→(3)) karena itulah yang dirinci plan. Bila maksud spec lebih sempit, urutan pemetaan tidak berubah — hanya pengelompokan labelnya. **Dilaporkan, tidak diputuskan.**
3. **Awalan `Enabled()` bersama dengan provisi** — `EntraConfig.Enabled()` (`internal/config/config.go:63`) hari ini bermakna "tiga kredensial Entra lengkap" dan dipakai wiring **provisi Entra** (`cmd/api/main.go:111`). Menambah `ENTRA_REDIRECT_URI` ke predikat itu akan mematikan provisi di lingkungan yang belum memasang redirect URI — regresi pada fitur di luar lingkup. **Dampak task**: T008 menambah predikat terpisah `SSOEnabled()` (empat nilai) dan T013 memakainya; `Enabled()` tidak diubah. Ini penyempurnaan yang taat plan D7 (yang hanya menyebut penambahan `RedirectURI` ke `EntraConfig`), bukan divergensi.
4. **Berkas test komponen `/login`** — plan §Project Structure menyebut `LoginForm.test.tsx`, sementara repo sudah punya `src/app/(auth)/login/page.test.tsx` yang menguji halaman/login form yang sama. **Dampak task**: T026 memakai nama plan; pelaksana **wajib** memperluas/menggabungkan dengan `page.test.tsx` yang ada alih-alih membuat berkas kedua yang menguji hal yang sama (Technical III — hindari abstraksi/berkas ganda).
5. **Temuan `/speckit.analyze` (2026-10-21) dan penutupannya** — analisis lintas artefak (`spec.md` · `plan.md` · `tasks.md` · `data-model.md` · `contracts/` · `quickstart.md` · konstitusi v1.2.0) menghasilkan **0 CRITICAL, 2 HIGH, 4 MEDIUM, 5 LOW**, cakupan requirement 17/17. Yang menyentuh `tasks.md` **sudah ditutup di berkas ini**: **C1** → task baru **T004b** + rujukan di T010, tabel pemetaan, rantai kritis, dan daftar paralel; **C2** → penanda `method=local` pada penolakan jalur lokal (T009) + query SC-004 terjendela (T032); **C4** → kasus replay di T014. Yang **bukan** milik berkas ini dan dilaporkan ke pemilik artefaknya: **I1** (redaksi FR-004 jalur (a) untuk baris undangan "sudah guest" tanpa `object_id`) dan **I2** (label "jalur"/"langkah" di `quickstart.md` §B) → TAN-267/TAN-269, bersama satu baris §Project Structure plan (`internal/repository/postgres/entra.go`). **C3** (sumber otoritatif penyebut SC-005) = keputusan pemilik produk; proksi tercatat di T032 dengan kaveatnya dan tercantum sebagai butir terbuka di bawah.

## MVP scope

Urutan minimum yang membuat US1 dapat dipakai pengguna nyata:

1. **T001** — tenant siap (redirect URI + `ENTRA_REDIRECT_URI`).
2. **T002 + T003 + T004 + T004b + T005 + T006 + T007 + T008 + T009 + T010 + T011 + T012 + T013** — backend dapat menukar kode menjadi sesi Tania lewat `loginWithEntra`.
3. **T020 + T021 + T022 + T023 + T024 + T025** — `/login` mengarahkan sekali, `/login/callback` menutup alur, pintu email selalu tersedia.
4. **T029** — gerbang mesin.

T014–T019 dan T026–T028 **wajib ikut MVP**: US2 (zero-regression) dan SC-002/SC-003 adalah syarat peluncuran, bukan penyempurnaan — dan tanpa test matriks pemetaan, R3 (kesalahan pemetaan membuka akun yang salah) tidak terjaga. T030–T033 adalah gerbang penerimaan & kepatuhan; T033 (DAMP) wajib sebelum rilis.

---

## Yang masih menunggu (bukan blocker penulisan kode)

1. **Prasyarat Entra (U0/T001)** — pendaftaran redirect URI & pemasangan `ENTRA_REDIRECT_URI` oleh pemilik produk. **Jangan** meminta atau menempelkan kredensial di komentar. Dampak: T030 (UAT tenant) dan T031 (probe keamanan terhadap tenant nyata) tidak dapat dijalankan; seluruh task lain tetap dapat dikerjakan dan diuji (fake exchanger/verifier deterministik).
2. **Izin menjalankan DB/Redis terisolasi** — T002 (uji terapan), T019 (`make test-integration`) dan T029 butuh PostgreSQL + Redis. **Jangan** menjalankan `make up`/migrasi/seed terhadap database bersama. Bila lingkungan terisolasi belum tersedia, task DB-backed ditandai belum diverifikasi secara jujur (suite ter-`Skip`), bukan diklaim lulus.
3. **Pekerjaan ranah Provisi Entra (bukan milik fitur ini — Open Item 6/D5b)** — pencatatan `object_id` saat **sinkronisasi** akun korporat yang sudah ada sebelum Tania (+ kemungkinan nilai ketiga pada CHECK `action` migrasi `0008`), langkah operasional akun hasil `create`, dan sifat opsional pemberian akses korporat. Sudah punya/kandidat issue: TAN-271 (kandidat), TAN-272, TAN-273. Tidak dikerjakan di sini.
4. **DAMP pra-rilis** — T033, dijalankan konkret pada gerbang rilis (plan Open Item 4), bukan di gelombang kode.
5. **Sub-issue implementasi — TIDAK dibuat.** `spec.md` masih menyatakan pembuatan issue implementasi menunggu **persetujuan eksplisit pemilik produk**, dan `/speckit.taskstoissues` belum diminta. Tracking implementasi dibuat pada tahap berikutnya atas instruksi pemilik.
6. **`/speckit.analyze` sudah dijalankan (2026-10-21)** — read-only, laporan lengkap dikirim ke issue; temuannya yang menyentuh `tasks.md` sudah ditutup (lihat §Temuan lintas artefak butir 5).
7. **Sumber otoritatif penyebut SC-005 (temuan analyze C3)** — konfirmasi pemilik produk atas daftar "pengguna yang sudah memiliki akun korporat". Sementara ini T032 memakai proksi non-sirkular (baris `entra_provisions` termasuk `INVITE` tanpa `object_id` + akun yang sudah terhubung). Tanpa keputusan ini pengukuran SC-005 tetap dapat dijalankan, tetapi angkanya harus dibaca bersama kaveat yang tercatat di T032.

## Notes

- **Tanpa dependensi baru**: backend memakai `golang-jwt/jwt/v5` yang sudah ada + `crypto/rsa`/`math/big` (JWKS) dan stdlib `net/http`; frontend **tanpa** `pnpm install` baru — PKCE memakai Web Crypto (`crypto.getRandomValues`/`crypto.subtle.digest`), bukan `@msal-browser` (Technical V, R-11).
- **Tanpa endpoint HTTP baru**: seluruh permukaan tetap GraphQL (`entraSsoStart`, `loginWithEntra`) dengan `AuthPayload` existing — tidak ada model sesi kedua (cookie), CORS/CSRF baru, maupun backend-hosted redirect (D2).
- **Tanpa permukaan GraphQL untuk keterkaitan**: tidak ada query/mutation baru yang membaca `users.entra_object_id`; Admin melihatnya lewat modul Accounts/audit existing. Kolom `users.auth_provider` adalah penanda asal autentikasi, **bukan** sumber keputusan otorisasi (D9).
- **Nol nilai rahasia di dokumen/commit/komentar**: `ENTRA_*` hanya hidup di env/secret store; `contracts/sso-entra.md` §7 hanya mendaftar **nama** variabel. Log modul SSO hanya memuat ID teknis, `tid`, `oid` terpotong/hash, kode error, dan durasi — tanpa email/nama/token/klaim (Security II).
- **`spec.md` tidak diubah** dan artefak plan (`plan.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/`) tidak disentuh di fase ini; `spec.md` juga **tidak** diubah di U1–U3 kecuali ada keputusan pemilik yang dicatat lewat proses biasa.
- **Drift SDL frontend** (T020) dicatat sebagai perubahan terpisah yang disengaja — bukan disembunyikan di diff fitur SSO.
- **Commit per task atau kelompok logis**; jalankan test sebelum commit. Branch kerja `agent/cobra/ef1a3eb3f6ce`; **jangan sentuh `master`**.
- **Uji terapan DB**: hanya pada DB/Redis terisolasi milik sendiri (`TEST_DATABASE_URL`/`TEST_REDIS_ADDR`); **jangan** `make up`/migrasi/seed ke database bersama.
