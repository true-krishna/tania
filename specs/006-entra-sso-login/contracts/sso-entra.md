# Contract — Masuk SSO Microsoft Entra ID (`sso-entra`)

**Feature**: `006-entra-sso-login` (TAN-267 · plan TAN-269) · **Date**: 2026-10-20

Satu sumber kebenaran untuk nama query/mutation/input, kode kesalahan, kunci rate limit, dan penanda audit fitur ini. Semua nilai di dokumen lain merujuk ke sini. Dimiliki oleh `tania-backend` (`graph/schema.graphqls` adalah SDL yang dilayani); `tania-dashboard` menyalin SDL itu lalu meregenerasi codegen.

## 1. Skema GraphQL (delta)

```graphql
"""Status permulaan alur SSO Microsoft Entra ID."""
type EntraSsoStart {
  """True bila backend siap menerima login SSO (kredensial Entra lengkap)."""
  enabled: Boolean!
  """
  URL otorisasi Microsoft yang siap dibuka browser. Null bila enabled=false.
  Berisi hanya nilai publik (authority, clientId, scope, redirectUri, PKCE challenge).
  """
  authorizationUrl: String
}

input EntraLoginInput {
  """Authorization code dari query string /login/callback (sekali pakai, umur pendek)."""
  code: String!
  """PKCE code verifier yang dipakai saat meminta otorisasi (base64url, 43–128 char)."""
  codeVerifier: String!
  """Nonce yang dikirim pada permintaan otorisasi; dicocokkan dengan klaim nonce ID token."""
  nonce: String!
}

type Query {
  """Publik. Dipakai halaman login untuk memutuskan redirect otomatis (FR-001)."""
  entraSsoStart(codeChallenge: String!, state: String!, nonce: String!): EntraSsoStart!
}

type Mutation {
  """Publik. Menukar authorization code dengan sesi Tania (FR-003/FR-004)."""
  loginWithEntra(input: EntraLoginInput!): AuthPayload!
}
```

`AuthPayload`, `LocalLoginInput`, `login`, `refreshSession`, `logout`, `User` **tidak berubah**.

**Yang sengaja TIDAK ada di kontrak**: `tenantId`, `clientId`, `clientSecret`, `redirectUri`, `scope` sebagai input/output. Semuanya milik backend (`EntraConfig`) — `authorizationUrl` sudah membawa yang perlu dibawa browser, dan permintaan token memakai konfigurasi server sehingga `redirect_uri` tidak dapat diarahkan ulang oleh klien (vektor pengalihan kode ke host lain tertutup). `state` hanya dipakai untuk membangun URL dan diverifikasi di browser; `nonce` dikirim ulang oleh klien dan **wajib** cocok dengan klaim ID token.

## 2. Parameter alur OIDC (dibangun backend)

| Tahap | Endpoint | Parameter |
| --- | --- | --- |
| Otorisasi | `GET {authority}/oauth2/v2.0/authorize` | `response_type=code`, `client_id`, `redirect_uri={ENTRA_REDIRECT_URI}`, `response_mode=query`, `scope=openid profile email`, `state`, `nonce`, `code_challenge`, `code_challenge_method=S256` |
| Token | `POST {authority}/oauth2/v2.0/token` | `grant_type=authorization_code`, `code`, `redirect_uri`, `client_id`, `client_secret`, `code_verifier`, `scope=openid profile email` |
| Kunci | `GET {authority}/discovery/v2.0/keys` | JWKS tenant (di-cache; refresh sekali saat `kid` tidak dikenal) |

`authority = https://login.microsoftonline.com/{ENTRA_TENANT_ID}`. `prompt` **tidak** dikirim: membiarkan cookie SSO Microsoft yang sudah ada membuat SC-001 (≤3 interaksi) tercapai; memaksa pemilih akun menambah satu layar tanpa manfaat keamanan di tenant tunggal.

## 3. Aturan pemetaan identitas → akun Tania (FR-004)

Berurutan; berhenti pada kecocokan pertama. Tanpa kecocokan → `UNAUTHENTICATED` dengan pesan generik, **tanpa membuat akun**. Langkah (1)+(2) bersama-sama memenuhi **FR-004 jalur (a)** (keterkaitan hasil Provisi Entra); langkah (3) memenuhi **jalur (b)** (kesamaan work email).

| # | Kunci | Menutup kasus | Efek samping |
| --- | --- | --- | --- |
| 1 | `users.entra_object_id = oid` | login berulang; stabil walau email/UPN korporat berubah | — |
| 2 | `entra_provisions.object_id = oid` → `employee_id` → `employees.user_id` → `users` | akun korporat hasil provisi **CREATE** (UPN turunan nama, tidak identik dengan email akun Tania) | bila (1) masih `NULL`: isi sekali (*first-login link*) + `auth_provider='entra'` |
| 3 | `lower(users.email) = lower(klaim email/UPN)` | akun korporat yang **sudah ada sebelum Tania** dan belum punya baris provisi | idem |

- **Penolakan**: bila (1) menemukan `oid` **berbeda** dari klaim → tolak (keterkaitan tidak berpindah otomatis; penyelesaian = tindakan Admin, di luar cakupan); bila akun hasil (2)/(3) **tidak aktif** → tolak (FR-011).
- **Tidak ada panggilan Microsoft Graph per login**: keanggotaan tenant dibuktikan `tid` pada ID token, keterkaitan dibaca dari data Tania sendiri.
- Langkah (2) memakai `UserRepository.FindByEmployeeID` yang **sudah ada** — tanpa query GraphQL baru dan tanpa perubahan skema `entra_provisions`.

## 4. Perilaku & kode kesalahan

Kesalahan dipetakan lewat `presentError` existing; kode masuk ke `extensions.code`. Pesan yang sampai ke pengguna adalah `message` (halaman login menampilkan `err.message` apa adanya), jadi **semua pesan berbahasa Indonesia dan layak tampil**.

| Kondisi | Kode | Pesan (`message`) | Catatan |
| --- | --- | --- | --- |
| Backend belum dikonfigurasi (SSO nonaktif) — `loginWithEntra` | `ENTRA_NOT_CONFIGURED` | `Masuk dengan Microsoft belum tersedia. Silakan masuk dengan email & kata sandi.` | Sejajar `CHAT_NOT_CONFIGURED`. `entraSsoStart` pada kondisi ini mengembalikan `enabled=false`, bukan error |
| Input tidak lengkap/kosong (`code`/`codeVerifier`/`nonce`) | `BAD_USER_INPUT` (+ `field`) | `invalid code: required` (bentuk `ValidationError` existing) | Tidak menyentuh jaringan |
| `state` tidak cocok / tidak ada | *(tidak mencapai backend)* | `Sesi masuk tidak valid atau sudah kedaluwarsa. Silakan coba lagi.` | Diverifikasi di halaman `/login/callback` dari `sessionStorage` |
| Pertukaran kode gagal (kode kedaluwarsa/dipakai ulang/PKCE tidak cocok) | `UNAUTHENTICATED` | `Akun korporat ini tidak terhubung ke akun Tania. Hubungi Admin.` | Pesan generik — **tidak** membedakan sebab (anti-enumerasi, FR-009) |
| ID token tidak valid (tanda tangan/`iss`/`aud`/`exp`) | `UNAUTHENTICATED` | idem | Alasan teknis hanya ke audit & log (ID teknis saja) |
| `tid` bukan tenant Telkom (akun personal/tenant lain) | `UNAUTHENTICATED` | idem | FR-005/NC-01 |
| `nonce` tidak cocok | `UNAUTHENTICATED` | idem | FR-003 |
| Tidak ada akun Tania yang cocok pada ketiga langkah pemetaan (§3) | `UNAUTHENTICATED` | idem | FR-004/NC-02 — **tanpa** pembuatan akun |
| Akun Tania tidak aktif | `UNAUTHENTICATED` | idem | FR-011 |
| `oid` sudah terhubung ke akun lain (langkah 1 ≠ klaim, atau baris provisi milik akun lain) | `UNAUTHENTICATED` | idem | Keterkaitan tidak berpindah (D5 §3) |
| Endpoint Microsoft tidak terjangkau / 5xx / timeout | `ENTRA_UNAVAILABLE` | `Layanan Microsoft sedang tidak tersedia. Coba lagi, atau masuk dengan email & kata sandi.` | Satu-satunya kegagalan dengan pesan pembeda — tindak lanjut pengguna memang berbeda (FR-009) |
| Rate limit terlampaui | `RATE_LIMITED` | (pesan existing `ErrRateLimited`) | FR-012 |

**Invarian pesan**: pesan untuk seluruh kegagalan pemetaan identitas **identik**. Klien tidak dapat membedakan "tidak punya akun", "akun nonaktif", "identitas milik akun lain", atau "token tidak valid" — perbedaan hanya di `audit_logs.reason`.

## 5. Rate limit

| Jalur | Kunci | Batas | Window |
| --- | --- | --- | --- |
| Email + kata sandi (existing) | `login:{clientKey}` | `AuthConfig.LoginLimit` | `AuthConfig.LoginWindow` |
| SSO (baru) | `sso-login:{clientKey}` | **`AuthConfig.LoginLimit`** (sama) | **`AuthConfig.LoginWindow`** (sama) |

`clientKey` = `ClientKeyFromContext(ctx)` (alamat klien, sama seperti `login`). Kunci dipisah supaya percobaan SSO tidak mengunci jalur email (FR-002) dan sebaliknya, sementara **nilai** batasnya identik sehingga "setara dengan jalur email" (FR-012) tetap berlaku otomatis.

Cakupan yang jujur: batas ini menghitung percobaan yang **mencapai backend** (permintaan token + pemetaan). Percobaan yang berhenti di halaman Microsoft (salah kata sandi korporat berulang) tidak melewati Tania dan tidak dihitung di sini — ditangani oleh kebijakan Entra (kunci akun/risiko masuk Microsoft).

## 6. Jejak audit (FR-007, SC-004, SC-005)

`action = LOGIN`, `entityType = "user"`, `entityID` = ID akun Tania (string kosong bila tidak ada akun yang cocok), payload JSON pada `After`:

```jsonc
// SSO berhasil
{"method":"entra_sso","outcome":"success"}
// SSO ditolak (satu-satunya tempat sebab sebenarnya dicatat)
{"method":"entra_sso","outcome":"rejected","reason":"no_account"}   // juga: inactive_account,
                                                                    // identity_mismatch, invalid_token,
                                                                    // code_exchange_failed, entra_unavailable
// Jalur email + kata sandi (perubahan satu field pada entry sukses; penolakan sudah punya outcome/reason)
{"method":"local","outcome":"success"}
```

- **SC-004** (100% upaya memuat metode): setiap upaya SSO dan setiap login sukses lokal menulis penanda `method`.
- **SC-005** (≥80% masuk via SSO dalam 1 bulan) diukur dari `audit_logs`: `action='LOGIN'` dan `outcome='success'`, kelompokkan `After->>'method'` → rasio `entra_sso / (entra_sso + local)`, **dibatasi pada keberhasilan masuk oleh pengguna yang ada di dalam tenant** — penyebut dibaca dari **daftar keanggotaan tenant** saat pengukuran (`GraphClient.ListEmails`, izin aplikasi yang sama dengan provisi), bukan dari tabel Tania (SC-005 hasil remediasi spec 2026-10-21, TAN-267). Jalur sesi (rotasi refresh) **tidak** dihitung sebagai masuk baru — `refreshSession` bukan login.
- **Payload tidak pernah memuat**: email, nama, token, klaim, `client_secret`, atau alasan yang dapat dibaca pengguna.

## 7. Konfigurasi (nama variabel saja — tidak ada nilai di dokumen ini)

| Variabel | Status | Dipakai untuk |
| --- | --- | --- |
| `ENTRA_TENANT_ID` | ada | `authority`, pengecekan `tid`/`iss` |
| `ENTRA_CLIENT_ID` | ada | `aud` ID token, `client_id` kedua permintaan |
| `ENTRA_CLIENT_SECRET` | ada | Permintaan token (server-only) |
| `ENTRA_REDIRECT_URI` | **baru** | `redirect_uri` kedua permintaan; wajib sama dengan URI terdaftar di aplikasi Entra, contoh bentuk `https://{host}/login/callback` |
| `APP_ENV` | ada | `production` + kredensial Entra tidak lengkap → **proses gagal start** (D7) |

## 8. Alur (ringkas)

```mermaid
sequenceDiagram
    autonumber
    participant B as Browser (/login)
    participant F as tania-dashboard
    participant G as tania-backend (GraphQL)
    participant M as Microsoft Entra (tenant Telkom)

    B->>F: buka /login
    F->>F: PKCE: verifier + challenge, state, nonce (Web Crypto) → sessionStorage
    F->>G: query entraSsoStart(codeChallenge, state, nonce)
    G-->>F: { enabled: true, authorizationUrl }
    F->>M: window.location.replace(authorizationUrl)
    M->>B: masuk (cookie SSO / kredensial korporat)
    M-->>F: 302 /login/callback?code=…&state=…
    F->>F: bandingkan state dengan sessionStorage (gagal → pesan, tanpa panggilan backend)
    F->>G: mutation loginWithEntra({ code, codeVerifier, nonce })
    G->>M: POST /oauth2/v2.0/token (code + verifier + client_secret)
    M-->>G: id_token (RS256)
    G->>G: verifikasi JWKS + iss/aud/tid/exp/nonce
    G->>G: petakan oid → akun (entra_object_id → provisi → email, §3); tanpa kecocokan → tolak (tanpa buat akun)
    G->>G: issueSession(user, "entra_sso") + audit LOGIN method=entra_sso
    G-->>F: AuthPayload (accessToken, refreshToken, user)
    F->>F: setSession(...) → router.replace(/dashboard)
```

## 9. Yang tidak boleh dilanggar oleh implementasi

1. `CLIENT_SECRET` tidak pernah keluar dari proses backend — tidak ke respons GraphQL, log, URL, browser, dokumen, atau issue.
2. Sesi tidak pernah terbentuk sebelum **seluruh** validasi (tanda tangan, `iss`, `aud`, `tid`, `exp`, `nonce`) lulus.
3. Tidak ada akun yang dibuat, diubah perannya, atau diaktifkan oleh jalur SSO (NC-02, FR-006).
4. Tidak ada klaim Microsoft selain `oid` yang dipersistensi; tidak ada PII pada log atau URL.
5. Jalur email + kata sandi tetap berfungsi penuh (FR-002) — perubahan pada jalur itu terbatas pada penanda `method` di audit.
6. Urutan pemetaan (§3) tidak boleh diubah menjadi "cari akun mana pun yang cocok": langkah 1 dan 2 mengikat identitas korporat ke **karyawan** yang sudah diberi akun itu, sedangkan langkah 3 hanya berlaku bila kedua kunci itu tidak ada. Penanda di sisi browser (opsi A: tautan email selalu terlihat + ingatan "belum tertaut" 7 hari) **tidak pernah** memengaruhi keputusan di sini.
